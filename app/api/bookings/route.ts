import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { apiLimiter } from '@/lib/rate-limit-enhanced'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import Stripe from 'stripe'
import { getRequestSession } from '@/lib/session'
import { getEffectivePropertyId } from '@/lib/server-rbac'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { RealtimeEvents } from '@/lib/realtime'
import { pushAvailabilityToOTA } from '@/lib/ota/ota-service'
import { checkIdempotency, saveIdempotency, clearIdempotency } from '@/lib/idempotency'
import { chaosState } from '@/lib/chaos'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' }) : null

const bookingSchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().min(1).max(10),
  specialRequests: z.string().optional(),
  paymentMethod: z.enum(['pay_now', 'pay_later']).default('pay_later'),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  // Extras selected by the guest on the frontend.
  // The backend recomputes the total authoritatively — never trusting the
  // client-submitted totalAmount — but must receive the extras selection
  // to correctly reflect charges in the DB and the folio.
  extras: z.object({
    breakfast: z.boolean().default(false),
    lateCheckout: z.boolean().default(false),
    airportShuttle: z.boolean().default(false),
    spaAccess: z.boolean().default(false),
  }).optional().default({}),
})

export async function POST(request: NextRequest) {
  const identifier = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimit = await apiLimiter.isAllowed(identifier)
  if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const session = await getRequestSession(request)
  const idempotencyKey = request.headers.get('idempotency-key')

  if (idempotencyKey) {
    const cached = await checkIdempotency(idempotencyKey)
    if (cached.state === 'cached') return NextResponse.json(cached.response?.body, { status: cached.response?.status })
  }

  try {
    const body = await request.json()
    const validated = bookingSchema.parse(body)
    const checkIn = new Date(validated.checkIn)
    const checkOut = new Date(validated.checkOut)

    try {
      // 1. ATOMIC DB TRANSACTION WITH PESSIMISTIC LOCKING
      const txResult = await prisma.$transaction(async (tx: any) => {
        // Acquire Row-Level Lock immediately
        await tx.$executeRaw`SELECT id FROM "Room" WHERE id = ${validated.roomId} FOR UPDATE`;
        
        const room = await tx.room.findUnique({ 
          where: { id: validated.roomId },
          include: { roomType: true }
        })
        if (!room || room.status === 'MAINTENANCE' || room.status === 'OUT_OF_ORDER') throw new Error('ROOM_UNAVAILABLE')

        // Double check conflicts
        const conflict = await tx.booking.findFirst({
          where: {
            roomAssignments: { some: { roomId: validated.roomId } },
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
            NOT: { status: 'CANCELLED' },
            OR: [
              { checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }
            ]
          }
        })
        if (conflict) throw new Error('DOUBLE_BOOKING')

        let guestId = session?.user?.id
        if (!guestId && validated.guestEmail) {
          const existing = await tx.user.findFirst({ where: { email: validated.guestEmail, deletedAt: null } })
          if (existing) { guestId = existing.id }
          else {
            const guestRole = await tx.role.findUnique({ where: { name: 'GUEST' } })
            const newUser = await tx.user.create({
              data: {
                email: validated.guestEmail,
                name: validated.guestName || 'Guest',
                password: '', // Passwordless guest
                roleId: guestRole?.id,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
            guestId = newUser.id
          }
        }
        if (!guestId) throw new Error('GUEST_DATA_REQUIRED')

        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

        // SERVER-AUTHORITATIVE PRICING (Fix: Ghost Revenue)
        // Mirrors calculateBookingTotal() in lib/booking-api.ts.
        // Never trusts the client-submitted totalAmount.
        const extras = validated.extras ?? {}
        let subtotal = room.roomType.baseRate * nights
        if (extras.breakfast)      subtotal += 25 * nights
        if (extras.lateCheckout)   subtotal += 50
        if (extras.airportShuttle) subtotal += 75
        if (extras.spaAccess)      subtotal += 100
        const totalAmount = Math.round(subtotal * 1.15 * 100) / 100  // +15% tax

        const confirmationCode = `SH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

        const booking = await tx.booking.create({
          data: {
            primaryGuestId: guestId,
            checkIn,
            checkOut,
            guests: validated.guests,
            totalAmount,
            status: 'CONFIRMED', 
            paymentStatus: validated.paymentMethod === 'pay_now' ? 'pending' : 'unpaid',
            paymentMethod: validated.paymentMethod === 'pay_now' ? 'card' : 'cash',
            paymentProvider: validated.paymentMethod === 'pay_now' ? 'STRIPE' : 'OFFLINE',
            confirmationCode,
            propertyId: room.propertyId, // Inherit from the assigned room
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'WEBSITE'
          },
          include: { roomAssignments: { include: { room: { include: { roomType: true } } } }, guest: true }
        })


        // ==========================================
        // PHASE 2 DUAL-WRITE: RESERVATION & FOLIO DDD
        // ==========================================
        
        await tx.roomAssignment.create({
          data: {
            bookingId: booking.id,
            roomId: room.id,
            startDate: checkIn,
            endDate: checkOut,
            status: 'ACTIVE'
          }
        });

        await tx.stayEvent.create({
          data: {
            bookingId: booking.id,
            type: 'BOOKED',
            notes: 'Booking created via web'
          }
        });

        const folio = await tx.folio.create({
          data: {
            bookingId: booking.id,
            type: 'GUEST',
            status: 'OPEN'
          }
        });

        await tx.folioLineItem.create({
          data: {
            folioId: folio.id,
            description: `Room Charge (${nights} nights)`,
            amount: room.roomType.baseRate * nights,
            category: 'ROOM',
          }
        });

        // Add a folio line item for each selected extra
        const extraLineItems = [
          extras.breakfast      && { description: `Breakfast (${nights} nights)`, amount: 25 * nights,  category: 'FOOD' },
          extras.lateCheckout   && { description: 'Late Checkout',                amount: 50,           category: 'SERVICE' },
          extras.airportShuttle && { description: 'Airport Shuttle',              amount: 75,           category: 'TRANSPORT' },
          extras.spaAccess      && { description: 'Spa Access',                   amount: 100,          category: 'SERVICE' },
        ].filter(Boolean) as { description: string; amount: number; category: string }[]

        if (extraLineItems.length > 0) {
          await tx.folioLineItem.createMany({
            data: extraLineItems.map(item => ({ folioId: folio.id, ...item }))
          })
        }

        // Tax line item for full transparency in the folio
        const taxAmount = Math.round((totalAmount - (room.roomType.baseRate * nights + extraLineItems.reduce((s, i) => s + i.amount, 0))) * 100) / 100
        await tx.folioLineItem.create({
          data: {
            folioId: folio.id,
            description: 'Tax (15%)',
            amount: taxAmount,
            category: 'TAX',
          }
        })

        // Lock will automatically be released by PostgreSQL upon transaction commit
        return { booking, folioId: folio.id }
      }, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 30000 })

      const result = txResult.booking
      const folioId = txResult.folioId
      // 4. REAL-TIME EVENTS (Pusher) - AFTER SUCCESSFUL TX
      try {
        if (chaosState.pusherFailure) throw new Error('CHAOS_TEST: Simulated Pusher Failure')
        await RealtimeEvents.emitBookingCreated(result)
      } catch (pusherErr) {
        console.error('[REALTIME] Pusher event emit failed:', pusherErr)
      }

      // 6. OTA SYNCHRONIZATION (Non-blocking but logged)
      try {
        if (chaosState.otaFailure) throw new Error('CHAOS_TEST: Simulated OTA Failure')
        const assignment = result.roomAssignments?.[0]
        if (assignment && assignment.room) {
          const roomTypeId = assignment.room.roomTypeId;
          // Fix 4: Calculate true availability using overlapping active reservations
          const totalRooms = await prisma.room.count({ 
            where: { roomTypeId, status: { notIn: ['MAINTENANCE', 'OUT_OF_ORDER'] } } 
          });
          const overlappingBookings = await prisma.roomAssignment.count({
            where: {
              room: { roomTypeId },
              status: 'ACTIVE',
              startDate: { lt: checkOut },
              endDate: { gt: checkIn }
            }
          });
          const availableCount = Math.max(0, totalRooms - overlappingBookings);

          await pushAvailabilityToOTA({
            roomTypeId,
            date: checkIn.toISOString().split('T')[0],
            availability: availableCount,
            rate: assignment.room.roomType.baseRate
          })
        }
      } catch (otaErr) {
        console.error('[OTA] Sync Failed during booking creation:', otaErr)
      }

      // 7. STRIPE PAYMENT INTENT
      let clientSecret: string | null = null
      let paymentFailed = false
      if (validated.paymentMethod === 'pay_now' && stripe) {
        try {
          if (chaosState.stripeFailure) throw new Error('CHAOS_TEST: Simulated Stripe Failure')
          // Pre-flight insert to prevent orphaned intents
          const payment = await prisma.payment.create({
            data: {
              bookingId: result.id,
              folioId: folioId, // DDD dual-write
              userId: result.primaryGuestId,
              amount: result.totalAmount,
              paymentMethod: 'card',
              paymentProvider: 'STRIPE',
              providerId: `PENDING_${result.id}`, // Temporary unique placeholder
              status: 'pending'
            }
          })

          const intent = await stripe.paymentIntents.create({
            amount: Math.round(result.totalAmount * 100),
            currency: 'lkr',
            metadata: { bookingId: result.id, paymentId: payment.id },
          }, { idempotencyKey: payment.id })
          
          clientSecret = intent.client_secret
          
          // Link to payment in DB
          await prisma.payment.update({
            where: { id: payment.id },
            data: { providerId: intent.id }
          })
        } catch (stripeErr) {
          console.error('[STRIPE] Payment Intent creation failed:', stripeErr)
          paymentFailed = true
        }
      }

      // 8. AUDIT & EMAIL
      let auditFailed = false
      let emailFailed = false

      try {
        await logAction(request, result.primaryGuestId, AUDIT_ACTIONS.BOOKING_CREATE, 'Booking', result.id, { total: result.totalAmount })
      } catch (auditErr) {
        console.error('[AUDIT] Failed to log booking creation:', auditErr)
        auditFailed = true
      }

      try {
        const emailData = {
          guestName: result.guest.name,
          guestEmail: result.guest.email,
          roomNumber: result.roomAssignments?.[0]?.room?.number || 'TBD',
          roomType: result.roomAssignments?.[0]?.room?.roomType?.name || 'Standard',
          checkIn,
          checkOut,
          guests: validated.guests,
          totalAmount: result.totalAmount,
          bookingId: result.id,
          confirmationCode: result.confirmationCode,
          specialRequests: validated.specialRequests
        }
        await prisma.outbox.createMany({
          data: [
            { topic: 'EMAIL_BOOKING_CONFIRMATION', payload: emailData },
            { topic: 'EMAIL_ADMIN_ALERT', payload: emailData }
          ]
        })
      } catch (emailErr) {
        console.error('[EMAIL] Failed to queue booking notifications:', emailErr)
        emailFailed = true
      }

      const responseBody = { booking: { ...result, clientSecret }, paymentFailed, auditFailed, emailFailed }
      if (idempotencyKey) await saveIdempotency(idempotencyKey, { status: 201, body: responseBody })
      
      return NextResponse.json(responseBody, { status: 201 })

    } catch (txErr: any) {
      // Catch PostgreSQL Exclusion Constraint / Unique Constraint Violations (P2002/P2004/P2010)
      if (['P2002', 'P2004', 'P2010'].includes(txErr.code)) {
        if (txErr.message?.includes('RoomAssignment_no_overlap_excl') || txErr.message?.includes('overlapping')) {
          throw new Error('DOUBLE_BOOKING')
        }
      }
      throw txErr
    }

  } catch (err: any) {
    console.error('[BOOKING_ENGINE_ERROR]', err)
    if (idempotencyKey) await clearIdempotency(idempotencyKey)
    return NextResponse.json({ error: err.message || 'Booking failed' }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as any
  const propertyId = await getEffectivePropertyId(request)
  
  const bookings = await prisma.booking.findMany({
    where: {
      ...((session.user as any).roleName === 'GUEST' ? { primaryGuestId: session.user.id } : {}),
      ...(status ? { status } : {}),
      ...(propertyId ? { propertyId } : {})
    },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      status: true,
      totalAmount: true,
      guests: true,
      confirmationCode: true,
      createdAt: true,
      paymentStatus: true,

      guest: {
        select: { id: true, name: true, email: true }
      },
      roomAssignments: {
        include: {
          room: {
            select: { number: true, roomType: { select: { name: true, baseRate: true } } }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Map roomType to type to match the frontend expectations
  const formattedBookings = bookings.map((booking: any) => ({
    ...booking,
    roomAssignments: booking.roomAssignments.map((assignment: any) => ({
      ...assignment,
      room: assignment.room ? {
        ...assignment.room,
        type: assignment.room.roomType?.name,
        price: assignment.room.roomType?.baseRate
      } : null
    }))
  }))

  return NextResponse.json({
    bookings: formattedBookings
  })
}