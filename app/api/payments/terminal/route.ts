import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TerminalPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  readerId: z.string().min(1, 'Stripe reader ID is required')
})

export async function POST(req: Request) {
  try {
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

    // 1. In a real PMS, this creates a Stripe Terminal PaymentIntent and hands it off to the reader
    // using stripe.terminal.readers.processPaymentIntent({ reader: readerId, payment_intent: pi.id })
    // We mock this integration here.
    
    // Simulate terminal interaction delay (waiting for guest to tap card)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const mockChargeId = `ch_terminal_${Math.random().toString(36).substring(2, 10)}`

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
            method: 'card',
            status: 'completed',
            provider: 'STRIPE_TERMINAL',
            transactionId: mockChargeId
          }
        })

        await tx.booking.update({
          where: { id: booking.id },
          data: { paymentStatus: 'completed' }
        })

        return p
      })
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
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Terminal payment error:', error)
    return NextResponse.json({ error: 'Internal server error processing terminal payment' }, { status: 500 })
  }
}
