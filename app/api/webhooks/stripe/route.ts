import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import { Redis } from '@upstash/redis'
import { RealtimeEvents } from '@/lib/realtime'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

function getRedisClient(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return Redis.fromEnv()
    } catch {
      return null
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // 1. DISTRIBUTED IDEMPOTENCY (Redis)
  const eventKey = `stripe:event:${event.id}`
  const redis = getRedisClient()
  
  if (redis) {
    const isProcessed = await redis.set(eventKey, 'processed', { nx: true, ex: 86400 })
    if (!isProcessed) return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent
        const bookingId = intent.metadata.bookingId
        
        await prisma.$transaction([
          prisma.booking.update({
            where: { id: bookingId },
            data: { paymentStatus: 'completed', updatedAt: new Date() }
          }),
          prisma.payment.update({
            where: { providerId: intent.id },
            data: { status: 'completed', capturedAt: new Date() }
          })
        ])
        
        await RealtimeEvents.emitBookingUpdated({ id: bookingId, paymentStatus: 'completed' })
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        const bookingId = intent.metadata.bookingId
        
        await prisma.payment.update({
          where: { providerId: intent.id },
          data: { status: 'failed' }
        })
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const intentId = charge.payment_intent as string
        
        const payment = await prisma.payment.findUnique({
          where: { providerId: intentId },
          include: { booking: true }
        })

        if (payment && payment.bookingId) {
          const updates: any[] = [
            prisma.booking.update({
              where: { id: payment.bookingId },
              data: { paymentStatus: 'refunded', status: 'CANCELLED' }
            }),
            prisma.payment.update({
              where: { providerId: intentId },
              data: { status: 'refunded', refundedAt: new Date() }
            })
          ]

          if (payment.booking) {
            updates.push(
              prisma.room.update({
                where: { id: payment.booking.roomId },
                data: { status: 'AVAILABLE' }
              })
            )
          }

          await prisma.$transaction(updates)
          
          await RealtimeEvents.emitBookingUpdated({ id: payment.bookingId, status: 'CANCELLED', paymentStatus: 'refunded' })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    if (redis) await redis.del(eventKey) // Allow retry
    console.error('[STRIPE_WEBHOOK_ERROR]', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}