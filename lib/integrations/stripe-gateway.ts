import crypto from 'crypto'

export interface ChargeRequest {
  id: string
  amount: number
  currency: string
  sourceToken: string
  idempotencyKey: string
  propertyId: string
}

export interface PaymentTx {
  transactionId: string
  status: 'AUTHORIZED' | 'CAPTURED' | 'REFUNDED' | 'FAILED'
  amount: number
  currency: string
  stripeChargeId: string
}

export class StripeGateway {
  private static mockChargeRegistry = new Map<string, PaymentTx>()

  // Authorizes card, placing standard holds for hotel room check-ins
  static async authorizeHold(req: ChargeRequest): Promise<PaymentTx> {
    if (!req.idempotencyKey) {
      throw new Error('STRIPE_IDEMPOTENCY_REQUIRED: All charge authorizations require transaction keys.')
    }

    const stripeChargeId = `ch_${Math.random().toString(36).substr(2, 9)}`
    const tx: PaymentTx = {
      transactionId: req.id,
      status: 'AUTHORIZED',
      amount: req.amount,
      currency: req.currency,
      stripeChargeId
    }

    this.mockChargeRegistry.set(stripeChargeId, tx)
    return tx
  }

  // Captures partial or full amount from an active hold authorization
  static async capturePayment(chargeId: string, amountToCapture: number): Promise<PaymentTx> {
    const tx = this.mockChargeRegistry.get(chargeId)
    if (!tx) throw new Error('STRIPE_CHARGE_NOT_FOUND')
    if (tx.status !== 'AUTHORIZED') throw new Error('STRIPE_INVALID_STATUS: Can only capture active holds.')

    if (amountToCapture > tx.amount) {
      throw new Error('STRIPE_OVER_CAPTURE_FORBIDDEN: Cannot capture more than authorized hold.')
    }

    tx.status = 'CAPTURED'
    tx.amount = amountToCapture
    return tx
  }

  // Processes refunds for cancellation credits
  static async refundPayment(chargeId: string, amountToRefund: number): Promise<PaymentTx> {
    const tx = this.mockChargeRegistry.get(chargeId)
    if (!tx) throw new Error('STRIPE_CHARGE_NOT_FOUND')

    tx.status = 'REFUNDED'
    tx.amount = Math.max(0, tx.amount - amountToRefund)
    return tx
  }

  // Cryptographically verifies Stripe webhook payloads using SHA-256 HMAC signature headers
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

  static getCharge(chargeId: string): PaymentTx | undefined {
    return this.mockChargeRegistry.get(chargeId)
  }

  static clearRegistry(): void {
    this.mockChargeRegistry.clear()
  }
}

export default StripeGateway
