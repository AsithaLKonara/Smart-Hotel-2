import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { apiLimiter } from '@/lib/rate-limit-enhanced'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import Stripe from 'stripe'
import { sendBookingConfirmation, sendAdminBookingAlert } from '@/lib/email'
import { getRequestSession } from '@/lib/session'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { InventoryLockEngine } from '@/lib/inventory-lock'
import { RealtimeEvents } from '@/lib/realtime'
import { pushAvailabilityToOTA } from '@/lib/ota/ota-service'
import { checkIdempotency, saveIdempotency, clearIdempotency } from '@/lib/idempotency'

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

    // 1. DISTRIBUTED INVENTORY LOCK (Redis)
    const currentVersion = await InventoryLockEngine.getVersion(validated.roomId)
    const hold = await InventoryLockEngine.acquireHold(
      validated.roomId, 
      'TBD', // Number will be fetched in TX
      currentVersion, 
      session?.user?.id || 'guest-checkout'
    )

    try {
      // 2. ATOMIC DB TRANSACTION
      const result = await prisma.$transaction(async (tx: any) => {
        const room = await tx.room.findUnique({ 
          where: { id: validated.roomId },
          include: { roomType: true }
        })
        if (!room || room.status !== 'AVAILABLE') throw new Error('ROOM_UNAVAILABLE')

        // Double check conflicts
        const conflict = await tx.booking.findFirst({
          where: {
            roomId: validated.roomId,
            status: { in: ['CONFIRMED', 'CHECKED_IN'] },
            NOT: { status: 'CANCELLED' },
            OR: [
              { checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }
            ]
          }
        })
        if (conflict) throw new Error('DOUBLE_BOOKING')

        // Resolve Guest
        let guestId = session?.user?.id
        if (!guestId && validated.guestEmail) {
          const existing = await tx.user.findUnique({ where: { email: validated.guestEmail } })
          if (existing) { guestId = existing.id }
          else {
            const newUser = await tx.user.create({
              data: {
                email: validated.guestEmail,
                name: validated.guestName || 'Guest',
                password: '', // Passwordless guest
                role: 'GUEST',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
            guestId = newUser.id
          }
        }
        if (!guestId) throw new Error('GUEST_DATA_REQUIRED')

        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        const totalAmount = room.roomType.baseRate * nights
        const confirmationCode = `SH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

        const booking = await tx.booking.create({
          data: {
            roomId: room.id,
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
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'WEBSITE'
          },
          include: { room: { include: { roomType: true } }, guest: true }
        })

        // Create Invoice and Line Item
        const invoice = await tx.invoice.create({
          data: {
            invoiceNo: `INV-${confirmationCode}`,
            bookingId: booking.id,
            subtotal: totalAmount,
            taxAmount: 0, // No tax
            grandTotal: totalAmount,
            status: 'DRAFT',
            folioType: 'MASTER'
          }
        });

        await tx.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            description: `Room Charge (${nights} nights)`,
            quantity: 1,
            unitPrice: totalAmount,
            totalPrice: totalAmount,
            category: 'ROOM',
            sourceModule: 'BOOKING_ENGINE'
          }
        });

        // 3. ATOMIC COMMIT: Advance room version and clear lock INSIDE TX
        await InventoryLockEngine.commitHold(hold, tx)

        return booking
      })

      // 4. REAL-TIME EVENTS (Pusher) - AFTER SUCCESSFUL TX
      try {
        await RealtimeEvents.emitBookingCreated(result)
      } catch (pusherErr) {
        console.error('[REALTIME] Pusher event emit failed:', pusherErr)
      }

      // 6. OTA SYNCHRONIZATION (Non-blocking but logged)
      try {
        const availableCount = await prisma.room.count({ where: { roomTypeId: result.room.roomTypeId, status: 'AVAILABLE' } })
        await pushAvailabilityToOTA({
          roomTypeId: result.room.roomTypeId,
          date: checkIn.toISOString().split('T')[0],
          availability: availableCount,
          rate: result.room.roomType.baseRate
        })
      } catch (otaErr) {
        console.error('[OTA] Sync Failed during booking creation:', otaErr)
      }

      // 7. STRIPE PAYMENT INTENT
      let clientSecret: string | null = null
      if (validated.paymentMethod === 'pay_now' && stripe) {
        const intent = await stripe.paymentIntents.create({
          amount: Math.round(result.totalAmount * 100),
          currency: 'lkr',
          metadata: { bookingId: result.id },
        })
        clientSecret = intent.client_secret
        // Link to payment in DB
        await prisma.payment.create({
          data: {
            bookingId: result.id,
            userId: result.primaryGuestId,
            amount: result.totalAmount,
            paymentMethod: 'card',
            paymentProvider: 'STRIPE',
            providerId: intent.id,
            status: 'pending'
          }
        })
      }

      // 8. AUDIT & EMAIL
      await logAction(request, result.primaryGuestId, AUDIT_ACTIONS.BOOKING_CREATE, 'Booking', result.id, { total: result.totalAmount })
      await sendBookingConfirmation({
        guestName: result.guest.name,
        guestEmail: result.guest.email,
        roomNumber: result.room.number,
        roomType: result.room.roomType.name,
        checkIn,
        checkOut,
        guests: validated.guests,
        totalAmount: result.totalAmount,
        bookingId: result.id,
        confirmationCode: result.confirmationCode
      })

      const responseBody = { booking: { ...result, clientSecret } }
      if (idempotencyKey) await saveIdempotency(idempotencyKey, { status: 201, body: responseBody })
      
      return NextResponse.json(responseBody, { status: 201 })

    } catch (txErr) {
      await InventoryLockEngine.rollbackHold(hold)
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
  
  const bookings = await prisma.booking.findMany({
    where: {
      ...((session.user as any).roleName === 'GUEST' ? { primaryGuestId: session.user.id } : {}),
      ...(status ? { status } : {})
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
      room: {
        select: {
          id: true,
          number: true,
          roomType: {
            select: { name: true, baseRate: true }
          }
        }
      },
      guest: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({
    bookings
  })
}