import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

export interface ChargeRequest {
  id: string
  amount: number
  currency: string
  sourceToken?: string
  idempotencyKey?: string
  propertyId?: string
  bookingId?: string
  invoiceId?: string
}

export interface PaymentTx {
  transactionId: string
  status: 'AUTHORIZED' | 'CAPTURED' | 'REFUNDED' | 'FAILED'
  amount: number
  currency: string
  stripeChargeId: string
}

export class StripeGateway {
  static async authorizeHold(req: ChargeRequest): Promise<PaymentTx> {
    if (!stripe) throw new Error('STRIPE_NOT_CONFIGURED');
    if (!req.idempotencyKey) {
      throw new Error('STRIPE_IDEMPOTENCY_REQUIRED: All charge authorizations require transaction keys.')
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(req.amount * 100),
      currency: req.currency.toLowerCase(),
      payment_method: req.sourceToken,
      capture_method: 'manual',
      confirm: req.sourceToken ? true : false,
      metadata: {
        bookingId: req.bookingId || '',
        invoiceId: req.invoiceId || '',
        transactionId: req.id
      }
    }, { idempotencyKey: req.idempotencyKey });

    await prisma.payment.create({
      data: {
        id: req.id,
        amount: req.amount,
        currency: req.currency,
        providerId: intent.id,
        paymentProvider: 'STRIPE',
        paymentMethod: 'card',
        status: 'pending',
        bookingId: req.bookingId,
        invoiceId: req.invoiceId,
      }
    });

    return {
      transactionId: req.id,
      status: intent.status === 'requires_capture' || intent.status === 'succeeded' ? 'AUTHORIZED' : 'FAILED',
      amount: req.amount,
      currency: req.currency,
      stripeChargeId: intent.id
    }
  }

  static async capturePayment(chargeId: string, amountToCapture: number): Promise<PaymentTx> {
    if (!stripe) throw new Error('STRIPE_NOT_CONFIGURED');
    
    const payment = await prisma.payment.findUnique({ where: { providerId: chargeId } })
    if (!payment) throw new Error('STRIPE_CHARGE_NOT_FOUND')

    const intent = await stripe.paymentIntents.capture(chargeId, {
      amount_to_capture: Math.round(amountToCapture * 100)
    });

    await prisma.payment.update({
      where: { providerId: chargeId },
      data: { status: 'completed', capturedAt: new Date() }
    });

    return {
      transactionId: payment.id,
      status: 'CAPTURED',
      amount: amountToCapture,
      currency: payment.currency,
      stripeChargeId: intent.id
    }
  }

  static async refundPayment(chargeId: string, amountToRefund: number): Promise<PaymentTx> {
    if (!stripe) throw new Error('STRIPE_NOT_CONFIGURED');
    
    const payment = await prisma.payment.findUnique({ where: { providerId: chargeId } })
    if (!payment) throw new Error('STRIPE_CHARGE_NOT_FOUND')

    await stripe.refunds.create({
      payment_intent: chargeId,
      amount: Math.round(amountToRefund * 100)
    });

    await prisma.payment.update({
      where: { providerId: chargeId },
      data: { status: 'refunded', refundedAt: new Date() }
    });

    return {
      transactionId: payment.id,
      status: 'REFUNDED',
      amount: amountToRefund,
      currency: payment.currency,
      stripeChargeId: chargeId
    }
  }

  static async createCheckoutSession(params: {
    amount: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    bookingId?: string;
    invoiceId?: string;
  }) {
    if (!stripe) throw new Error('STRIPE_NOT_CONFIGURED');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: 'Hotel Reservation',
          },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        bookingId: params.bookingId || '',
        invoiceId: params.invoiceId || ''
      }
    });

    return session;
  }

  static verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string,
    webhookSecret: string
  ): boolean {
    if (!signatureHeader || !webhookSecret) return false

    try {
      const parts = signatureHeader.split(',')
      const timestampPart = parts.find(p => p.startsWith('t='))?.split('=')[1]
      const signaturePart = parts.find(p => p.startsWith('v1='))?.split('=')[1]

      if (!timestampPart || !signaturePart) return false

      const signedPayload = `${timestampPart}.${rawBody}`
      const hmac = crypto.createHmac('sha256', webhookSecret)
      const computedSignature = hmac.update(signedPayload).digest('hex')

      return crypto.timingSafeEqual(
        Buffer.from(computedSignature, 'hex'),
        Buffer.from(signaturePart, 'hex')
      )
    } catch {
      return false
    }
  }

  static async getCharge(chargeId: string): Promise<PaymentTx | undefined> {
    const payment = await prisma.payment.findUnique({ where: { providerId: chargeId } })
    if (!payment) return undefined;
    
    return {
      transactionId: payment.id,
      status: payment.status === 'completed' ? 'CAPTURED' : (payment.status === 'refunded' ? 'REFUNDED' : 'AUTHORIZED'),
      amount: payment.amount,
      currency: payment.currency,
      stripeChargeId: payment.providerId!
    }
  }
}

export default StripeGateway
