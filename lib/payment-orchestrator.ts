import { eventBus } from './event-bus'
import { DoubleEntryLedger } from './double-entry-ledger'

export interface CardDetails {
  cardNumber: string
  holderName: string
  expiry: string // "MM/YY"
  cvv: string
}

export interface CardToken {
  token: string
  holderName: string
  last4: string
  brand: string
  expiry: string
}

export interface AuthorizationHold {
  id: string
  token: string
  amount: number
  currency: string
  folioId: string
  status: 'OPEN' | 'CAPTURED' | 'VOIDED'
  timestamp: string
}

export interface PaymentCapture {
  id: string
  authId: string
  amount: number
  currency: string
  status: 'SETTLED' | 'REFUNDED'
  timestamp: string
  refundedAmount: number
}

export class PaymentOrchestrator {
  private static cardTokens: Map<string, CardToken> = new Map()
  private static authHolds: Map<string, AuthorizationHold> = new Map()
  private static captures: Map<string, PaymentCapture> = new Map()

  // Exchange rates with USD as the baseline (1.0)
  private static exchangeRates: Record<string, number> = {
    USD: 1.0,
    EUR: 0.92,
    LKR: 300.0,
    GBP: 0.80
  }

  // Clear data (for test suites)
  static clearAll(): void {
    this.cardTokens.clear()
    this.authHolds.clear()
    this.captures.clear()
  }

  // Convert an amount from foreign currency to baseline USD
  static convertToUSD(amount: number, currency: string): number {
    const rate = this.exchangeRates[currency.toUpperCase()]
    if (!rate) {
      throw new Error(`Currency [${currency}] is not supported by payment gateway.`)
    }
    return parseFloat((amount / rate).toFixed(2))
  }

  // PCI Compliant Card vault tokenization simulator
  static vaultCard(details: CardDetails): CardToken {
    if (!/^\d{16}$/.test(details.cardNumber.replace(/\s+/g, ''))) {
      throw new Error('Invalid card structure: Card number must contain exactly 16 digits.')
    }
    if (!/^\d{2}\/\d{2}$/.test(details.expiry)) {
      throw new Error('Invalid card structure: Expiry must follow MM/YY format.')
    }
    if (!/^\d{3}$/.test(details.cvv)) {
      throw new Error('Invalid card structure: CVV must contain exactly 3 digits.')
    }

    const cleanCard = details.cardNumber.replace(/\s+/g, '')
    const last4 = cleanCard.slice(-4)
    const token = `card-tok-${Math.random().toString(36).substr(2, 9)}`
    
    let brand = 'Visa'
    if (cleanCard.startsWith('5')) brand = 'MasterCard'
    else if (cleanCard.startsWith('3')) brand = 'Amex'

    const cardToken: CardToken = {
      token,
      holderName: details.holderName,
      last4,
      brand,
      expiry: details.expiry
    }

    this.cardTokens.set(token, cardToken)

    eventBus.emit({
      id: `vault-tok-${token}`,
      type: 'payment.card_vaulted',
      severity: 'INFO',
      title: 'Card Safely Tokenized',
      message: `Card ending in *${last4} tokenized successfully under token ${token}.`,
      metadata: { last4, brand, token },
      timestamp: new Date().toISOString()
    })

    return cardToken
  }

  static getToken(token: string): CardToken | undefined {
    return this.cardTokens.get(token)
  }

  // Authorize card (incidental holds, room deposits)
  static authorizeCard(token: string, amount: number, currency = 'USD', folioId: string): AuthorizationHold {
    if (!this.cardTokens.has(token)) {
      throw new Error(`Security Exception: Card token [${token}] is invalid or has expired.`)
    }
    if (amount <= 0) {
      throw new Error('Authorization hold must be strictly positive.')
    }

    const id = `auth-hold-${Math.random().toString(36).substr(2, 9)}`
    const hold: AuthorizationHold = {
      id,
      token,
      amount,
      currency: currency.toUpperCase(),
      folioId,
      status: 'OPEN',
      timestamp: new Date().toISOString()
    }

    this.authHolds.set(id, hold)

    eventBus.emit({
      id: `pay-auth-${id}`,
      type: 'payment.authorization_created',
      severity: 'INFO',
      title: `Authorization Hold Placed: ${currency} ${amount}`,
      message: `Placed holding pre-auth on card token ${token} for folio ${folioId}.`,
      metadata: { ...hold },
      timestamp: hold.timestamp
    })

    return hold
  }

  // Capture existing authorization hold
  static captureAuthorization(authId: string, amountToCapture?: number): PaymentCapture {
    const hold = this.authHolds.get(authId)
    if (!hold) {
      throw new Error(`Authorization hold reference [${authId}] not found in records.`)
    }
    if (hold.status !== 'OPEN') {
      throw new Error(`Cannot capture authorization: Hold is in state ${hold.status}.`)
    }

    const captureAmount = amountToCapture !== undefined ? amountToCapture : hold.amount
    if (captureAmount <= 0 || captureAmount > hold.amount) {
      throw new Error(`Capture value $${captureAmount} exceeds authorized limit of $${hold.amount}.`)
    }

    hold.status = 'CAPTURED'
    
    const capId = `capture-${Math.random().toString(36).substr(2, 9)}`
    const capture: PaymentCapture = {
      id: capId,
      authId,
      amount: captureAmount,
      currency: hold.currency,
      status: 'SETTLED',
      timestamp: new Date().toISOString(),
      refundedAmount: 0
    }

    this.captures.set(capId, capture)

    // Translate to USD for local ledger accounts
    const amountUSD = this.convertToUSD(captureAmount, hold.currency)

    // Settle double-entry journal entry: Debit Cash, Credit Guest AR
    DoubleEntryLedger.postJournalEntry(
      capId,
      `Credit Card Capture (Auth: ${authId}, Currency: ${hold.currency})`,
      new Date().toISOString().split('T')[0],
      [
        { accountId: 'acc-1010', debit: amountUSD, credit: 0 }, // Dr Cash
        { accountId: 'acc-1200', debit: 0, credit: amountUSD }  // Cr Guest AR
      ]
    )

    eventBus.emit({
      id: `pay-cap-${capId}`,
      type: 'payment.authorization_captured',
      severity: 'HIGH',
      title: `Hold Captured: ${hold.currency} ${captureAmount}`,
      message: `Captured authorization hold ${authId} for USD $${amountUSD} to folio ${hold.folioId}.`,
      metadata: { ...capture, amountUSD, folioId: hold.folioId },
      timestamp: capture.timestamp
    })

    return capture
  }

  // Void authorization (Releasing held funds without settlement)
  static voidAuthorization(authId: string): void {
    const hold = this.authHolds.get(authId)
    if (!hold) {
      throw new Error(`Authorization hold reference [${authId}] not found in records.`)
    }
    if (hold.status !== 'OPEN') {
      throw new Error(`Cannot void authorization: Hold is in state ${hold.status}.`)
    }

    hold.status = 'VOIDED'

    eventBus.emit({
      id: `pay-void-${authId}`,
      type: 'payment.authorization_voided',
      severity: 'INFO',
      title: 'Hold Reopened / Voided',
      message: `Released holding pre-auth on card token ${hold.token} for folio ${hold.folioId}.`,
      metadata: { authId, folioId: hold.folioId },
      timestamp: new Date().toISOString()
    })
  }

  // Refund captured transaction
  static refundCapture(captureId: string, amountToRefund?: number): PaymentCapture {
    const capture = this.captures.get(captureId)
    if (!capture) {
      throw new Error(`Captured payment transaction [${captureId}] not found.`)
    }
    if (capture.status === 'REFUNDED' && capture.refundedAmount >= capture.amount) {
      throw new Error('Transaction has already been fully refunded.')
    }

    const refundAmount = amountToRefund !== undefined ? amountToRefund : (capture.amount - capture.refundedAmount)
    const remainingLimit = parseFloat((capture.amount - capture.refundedAmount).toFixed(2))

    if (refundAmount <= 0 || refundAmount > remainingLimit) {
      throw new Error(`Refund value ${refundAmount} exceeds remaining limit of ${remainingLimit}.`)
    }

    capture.refundedAmount = parseFloat((capture.refundedAmount + refundAmount).toFixed(2))
    if (capture.refundedAmount >= capture.amount) {
      capture.status = 'REFUNDED'
    }

    // Convert refund foreign value to baseline USD for property accounting
    const refundUSD = this.convertToUSD(refundAmount, capture.currency)

    // Write balanced double-entry: Debit Refund Expenses "5010", Credit Cash "1010"
    DoubleEntryLedger.postJournalEntry(
      `refund-${captureId}-${Date.now()}`,
      `Credit Card Refund (Capture: ${captureId}, Currency: ${capture.currency})`,
      new Date().toISOString().split('T')[0],
      [
        { accountId: 'acc-5010', debit: refundUSD, credit: 0 }, // Dr Refund Expense
        { accountId: 'acc-1010', debit: 0, credit: refundUSD }  // Cr Cash
      ]
    )

    eventBus.emit({
      id: `pay-refund-${captureId}-${Date.now()}`,
      type: 'payment.capture_refunded',
      severity: 'HIGH',
      title: `Refund Settled: ${capture.currency} ${refundAmount}`,
      message: `Processed refund on transaction capture ${captureId} for USD $${refundUSD}.`,
      metadata: { ...capture, refundAmountUSD: refundUSD },
      timestamp: new Date().toISOString()
    })

    return capture
  }

  static getHold(authId: string): AuthorizationHold | undefined {
    return this.authHolds.get(authId)
  }

  static getCapture(capId: string): PaymentCapture | undefined {
    return this.captures.get(capId)
  }
}

export default PaymentOrchestrator;
