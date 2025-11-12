import { NextRequest, NextResponse } from 'next/server'
import { captureException } from '@/lib/monitoring'
import Stripe from 'stripe'
import prisma from '@/lib/db'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Idempotency tracking for webhook processing (in production, use Redis)
const processedEvents = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Stripe webhook: No signature provided')
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Check for duplicate events (idempotency)
    if (processedEvents.has(event.id)) {
      console.log(`Stripe webhook: Duplicate event ${event.id} ignored`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Add to processed events
    processedEvents.add(event.id)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent, event.id)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent, event.id)
        break
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent, event.id)
        break
      
      case 'charge.refunded':
        await handlePaymentRefunded(event.data.object as Stripe.Charge, event.id)
        break
      
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute, event.id)
        break
      
      default:
        console.log(`Stripe webhook: Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true, eventId: event.id })
  } catch (error) {
    // Capture error with Sentry
    captureException(error, {
      requestId: request.headers.get('x-request-id') || undefined,
      eventType: 'stripe_webhook',
    })
    
    console.error('Stripe webhook error:', error)
    
    // Log the error for monitoring
    await logAction(
      request,
      undefined,
      'STRIPE_WEBHOOK_ERROR',
      'Webhook',
      'unknown',
      { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    )

    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, eventId: string) {
  const bookingId = paymentIntent.metadata.bookingId
  
  if (!bookingId) {
    console.error('No booking ID in payment intent metadata')
    return
  }

  try {
    // Update booking status
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
      include: {
        room: true,
        user: true,
        invoice: true,
      }
    })

    // Update invoice status
    if (booking.invoice) {
      await prisma.invoice.update({
        where: { id: booking.invoice.id },
        data: { status: 'PAID' }
      })
    }

    // Update room status
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: 'OCCUPIED' }
    })

    // Log the payment success
    await logAction(
      {} as NextRequest, // We don't have the original request in webhooks
      booking.userId,
      AUDIT_ACTIONS.PAYMENT_SUCCESS,
      'Payment',
      bookingId,
      {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        roomId: booking.roomId,
        roomNumber: booking.room.number,
      }
    )

    console.log(`Payment succeeded for booking ${bookingId}`)
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent, eventId: string) {
  const bookingId = paymentIntent.metadata.bookingId
  
  if (!bookingId) {
    console.error('No booking ID in payment intent metadata')
    return
  }

  try {
    // Update booking status
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'FAILED',
        status: 'PENDING',
      },
      include: {
        room: true,
        user: true,
      }
    })

    // Log the payment failure
    await logAction(
      {} as NextRequest,
      booking.userId,
      AUDIT_ACTIONS.PAYMENT_FAILED,
      'Payment',
      bookingId,
      {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        roomId: booking.roomId,
        roomNumber: booking.room.number,
        failureReason: paymentIntent.last_payment_error?.message,
      }
    )

    console.log(`Payment failed for booking ${bookingId}`)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent, eventId: string) {
  const bookingId = paymentIntent.metadata.bookingId
  
  if (!bookingId) {
    console.error('No booking ID in payment intent metadata')
    return
  }

  try {
    // Update booking status
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED',
      },
      include: {
        room: true,
        user: true,
      }
    })

    // Log the payment cancellation
    await logAction(
      {} as NextRequest,
      booking.userId,
      AUDIT_ACTIONS.PAYMENT_FAILED,
      'Payment',
      bookingId,
      {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        roomId: booking.roomId,
        roomNumber: booking.room.number,
        reason: 'Payment canceled by user',
      }
    )

    console.log(`Payment canceled for booking ${bookingId}`)
  } catch (error) {
    console.error('Error handling payment cancellation:', error)
  }
}

async function handlePaymentRefunded(charge: Stripe.Charge, eventId: string) {
  const paymentIntentId = charge.payment_intent as string
  
  if (!paymentIntentId) {
    console.error('No payment intent ID in charge')
    return
  }

  try {
    // Find booking by payment intent ID
    const booking = await prisma.booking.findFirst({
      where: { paymentIntentId },
      include: {
        room: true,
        user: true,
        invoice: true,
      }
    })

    if (!booking) {
      console.error(`No booking found for payment intent ${paymentIntentId}`)
      return
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
      }
    })

    // Update invoice status
    if (booking.invoice) {
      await prisma.invoice.update({
        where: { id: booking.invoice.id },
        data: { status: 'REFUNDED' }
      })
    }

    // Log the refund
    await logAction(
      {} as NextRequest,
      booking.userId,
      AUDIT_ACTIONS.PAYMENT_REFUND,
      'Payment',
      booking.id,
      {
        paymentIntentId,
        chargeId: charge.id,
        amount: charge.amount / 100,
        currency: charge.currency,
        roomId: booking.roomId,
        roomNumber: booking.room.number,
      }
    )

    console.log(`Payment refunded for booking ${booking.id}`)
  } catch (error) {
    console.error('Error handling payment refund:', error)
  }
}

async function handleChargeDispute(dispute: Stripe.Dispute, eventId: string) {
  try {
    // Log dispute for manual review
    await logAction(
      {} as NextRequest,
      undefined,
      'PAYMENT_DISPUTE',
      'Payment',
      dispute.id,
      {
        chargeId: dispute.charge,
        amount: dispute.amount / 100,
        currency: dispute.currency,
        reason: dispute.reason,
        stripeEventId: eventId
      }
    )

    console.log(`Stripe webhook ${eventId}: Charge dispute created: ${dispute.id}`)
  } catch (error) {
    console.error(`Stripe webhook ${eventId}: Error processing dispute:`, error)
    throw error
  }
} 