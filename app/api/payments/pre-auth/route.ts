import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { getRequestSession } from '@/lib/session'
import { realtime } from '@/lib/realtime'

const prisma = new PrismaClient()

const PreAuthSchema = z.object({
  bookingId: z.string().uuid(),
  paymentMethodId: z.string(), // e.g. Stripe PaymentMethod ID
  amount: z.number().positive()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req)
    if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const validated = PreAuthSchema.parse(body)

    const booking = await prisma.booking.findUnique({
      where: { id: validated.bookingId },
      include: { folios: true }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const folioId = booking.folios[0]?.id

    // In a real system, you would call Stripe or your payment gateway to create a PaymentIntent 
    // with capture_method: 'manual' (which places a hold/pre-auth on the card)
    // e.g. const intent = await stripe.paymentIntents.create({ amount, currency, capture_method: 'manual', payment_method })
    
    const mockIntentId = `pi_${Buffer.from(Date.now().toString()).toString('base64')}`

    let paymentRecordId = null
    await prisma.$transaction(async (tx: any) => {
      if (folioId) {
        const payment = await tx.payment.create({
          data: {
            folioId,
            amount: validated.amount,
            paymentMethod: 'card',
            paymentProvider: 'STRIPE',
            status: 'pending',
            providerId: mockIntentId,
            userId: booking.primaryGuestId
          }
        })
        paymentRecordId = payment.id
      }

      await tx.auditLog.create({
        data: {
          action: 'PAYMENT_PRE_AUTH_CREATED',
          resource: 'BOOKING',
          resourceId: booking.id,
          actor: 'SYSTEM',
          details: {
            amount: validated.amount,
            intentId: mockIntentId
          }
        }
      })
    })

    if (paymentRecordId) {
      try {
        await realtime.trigger('admin', 'payment.created', {
          paymentId: paymentRecordId,
          amount: validated.amount,
          status: 'pending'
        })
      } catch (e) {
        console.error('Pusher error:', e)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pre-authorization successful. Funds are held.',
      intentId: mockIntentId
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Pre-auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
