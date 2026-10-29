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
import { generateConfirmationCode } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { chaosState } from '@/lib/chaos'
import { BookingService } from '@/lib/services/BookingService'

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
  // Extras can be legacy boolean flags or an array of service codes/objects
  extras: z.union([
    z.record(z.any()),
    z.array(z.any())
  ]).optional().default({}),
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
      // 1. ATOMIC DB TRANSACTION & DOMAIN LOGIC DELEGATED TO BOOKING SERVICE
      const txResult = await BookingService.createReservation({
        roomId: validated.roomId,
        checkIn,
        checkOut,
        guests: validated.guests,
        specialRequests: validated.specialRequests,
        paymentMethod: validated.paymentMethod,
        extras: validated.extras as any,
        guestEmail: validated.guestEmail,
        guestName: validated.guestName,
        guestPhone: validated.guestPhone,
        userId: session?.user?.id,
        source: 'WEBSITE'
      })

      const result = txResult.booking
      const folioId = txResult.folioId
      // 4. REAL-TIME EVENTS (Pusher) - AFTER SUCCESSFUL TX
      try {
        if (chaosState.pusherFailure) throw new Error('CHAOS_TEST: Simulated Pusher Failure')
        await RealtimeEvents.emitBookingCreated(result)
      } catch (pusherErr) {
        logger.warn('Pusher event emit failed', { error: pusherErr })
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
        logger.warn('OTA sync failed during booking creation', { error: otaErr })
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
          logger.error('Payment Intent creation failed', stripeErr)
          paymentFailed = true
        }
      }

      // 8. AUDIT & EMAIL
      let auditFailed = false
      let emailFailed = false

      try {
        await logAction(request, result.primaryGuestId, AUDIT_ACTIONS.BOOKING_CREATE, 'Booking', result.id, { total: result.totalAmount })
      } catch (auditErr) {
        logger.error('[AUDIT] Failed to log booking creation:', auditErr)
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
        logger.error('[EMAIL] Failed to queue booking notifications:', emailErr)
        emailFailed = true
      }

      const responseBody = { booking: { ...result, clientSecret }, paymentFailed, auditFailed, emailFailed }
      if (idempotencyKey) await saveIdempotency(idempotencyKey, { status: 201, body: responseBody })
      
      logger.info('Booking completed', { bookingId: result.id, source: result.source })
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
    logger.error('Booking engine error', err)
    if (idempotencyKey) await clearIdempotency(idempotencyKey)
    
    if (err.message === 'DOUBLE_BOOKING') {
      return NextResponse.json({ error: 'LOCK_ACQUISITION_FAILED - Double booking detected.' }, { status: 409 })
    }
    if (err.message === 'ROOM_UNAVAILABLE') return NextResponse.json({ error: 'Room is no longer available' }, { status: 409 })
    if (err.message === 'GUEST_DATA_REQUIRED') return NextResponse.json({ error: 'Guest details required' }, { status: 400 })
    if (err.message === 'ACCOUNT_EXISTS') return NextResponse.json({ error: 'An account with this email exists. Please log in to continue.' }, { status: 401 })
    
    return NextResponse.json({ error: err.message || 'Booking failed' }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any
    const propertyId = await getEffectivePropertyId(request)
    
    const bookings = await prisma.booking.findMany({
      where: {
        deletedAt: null,
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
          select: { id: true, name: true, email: true, phone: true, vipStatus: true }
        },
        folios: {
          include: {
            lineItems: true,
            payments: true
          }
        },
        roomAssignments: {
          include: {
            room: {
              select: { id: true, number: true, roomType: { select: { name: true, baseRate: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Map roomType to type to match the frontend expectations
    // Also pre-calculate folio balances on the server to avoid expensive
    // reduce() calls inside the React render loop on the client.
    const formattedBookings = bookings.map((booking: any) => {
      const folio = booking.folios?.[0]
      const totalCharges = (folio?.lineItems || [])
        .filter((i: any) => i.category !== 'PAYMENT')
        .reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0)
      const totalPayments = (folio?.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
      const folioBalance = Math.max(0, totalCharges - totalPayments)

      const calculatedTotal = totalCharges > 0 ? totalCharges : Number(booking.totalAmount || 0)

      return {
        ...booking,
        guest: booking.guest,
        user: booking.guest,
        totalAmount: calculatedTotal,
        // Pre-calculated folio summary (avoids client-side reduce on every render)
        folioBalance,
        folioTotalCharges: totalCharges,
        folioTotalPayments: totalPayments,
        roomAssignments: booking.roomAssignments.map((assignment: any) => ({
          ...assignment,
          room: assignment.room ? {
            id: assignment.room.id,
            number: assignment.room.number,
            type: assignment.room.roomType?.name,
            price: Number(assignment.room.roomType?.baseRate || 0)
          } : null
        }))
      }
    })

    return NextResponse.json({
      bookings: formattedBookings
    })
  } catch (error: any) {
    logger.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings', details: error.message }, { status: 500 })
  }
}