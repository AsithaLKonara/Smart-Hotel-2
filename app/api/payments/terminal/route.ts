import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { getRequestSession } from '@/lib/session'
import { realtime } from '@/lib/realtime'
import { handleZodError } from '@/lib/api-utils'
import Stripe from 'stripe'

const prisma = new PrismaClient()

const TerminalPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  readerId: z.string().min(1, 'Stripe reader ID is required')
})

export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req)
    if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const validatedData = TerminalPaymentSchema.parse(body)

    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        folios: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', { apiVersion: '2023-10-16' })

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(validatedData.amount * 100),
      currency: validatedData.currency.toLowerCase(),
      payment_method_types: ['card_present'],
      capture_method: 'manual',
    })

    await stripe.terminal.readers.processPaymentIntent(validatedData.readerId, {
      payment_intent: intent.id,
    })

    const mockChargeId = intent.id

    // 2. Record the payment in the primary folio
    const primaryFolio = booking.folios[0]

    let paymentRecord = null
    
    if (primaryFolio) {
      paymentRecord = await prisma.$transaction(async (tx: any) => {
        const p = await tx.payment.create({
          data: {
            folioId: primaryFolio.id,
            bookingId: booking.id,
            amount: validatedData.amount,
            paymentMethod: 'card',
            status: 'completed',
            paymentProvider: 'STRIPE_TERMINAL',
            providerId: mockChargeId
          }
        })

        await tx.booking.update({
          where: { id: booking.id },
          data: { paymentStatus: 'completed' }
        })

        return p
      })
      
      try {
        await realtime.trigger('admin', 'payment.created', {
          paymentId: paymentRecord.id,
          amount: paymentRecord.amount,
          status: paymentRecord.status
        })
      } catch (e) {
        console.error('Pusher error:', e)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Terminal payment successful',
      paymentId: paymentRecord?.id,
      transactionId: mockChargeId,
      receiptUrl: `https://mock-receipt.smarthotel.local/${mockChargeId}`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Terminal payment error:', error)
    return NextResponse.json({ error: 'Internal server error processing terminal payment' }, { status: 500 })
  }
}
