import { PaymentOrchestrator } from '../../../lib/payment-orchestrator'
import { DoubleEntryLedger } from '../../../lib/double-entry-ledger'

describe('Payment Gateway Orchestrator & Tokenization', () => {
  beforeEach(() => {
    PaymentOrchestrator.clearAll()
    DoubleEntryLedger.initializeLedger()
  })

  test('should safely vault and tokenize credit card details', () => {
    const card = {
      cardNumber: '4111 1111 1111 1111',
      holderName: 'Alice Smith',
      expiry: '12/28',
      cvv: '123'
    }

    const token = PaymentOrchestrator.vaultCard(card)

    expect(token.token).toBeDefined()
    expect(token.last4).toBe('1111')
    expect(token.brand).toBe('Visa')
    expect(token.holderName).toBe('Alice Smith')
  })

  test('should throw validation exceptions on illegal card structures', () => {
    const illegalLength = { cardNumber: '1234', holderName: 'A', expiry: '12/28', cvv: '123' }
    expect(() => PaymentOrchestrator.vaultCard(illegalLength)).toThrow('Invalid card structure')

    const illegalExpiry = { cardNumber: '4111111111111111', holderName: 'A', expiry: '2028', cvv: '123' }
    expect(() => PaymentOrchestrator.vaultCard(illegalExpiry)).toThrow('Invalid card structure')
  })

  test('should create hold authorization, capture holds, and log balanced ledger entries', () => {
    const tokenObj = PaymentOrchestrator.vaultCard({
      cardNumber: '4111111111111111',
      holderName: 'Bob Jenkins',
      expiry: '10/27',
      cvv: '999'
    })

    // Step 1: Pre-Auth hold of $300
    const hold = PaymentOrchestrator.authorizeCard(tokenObj.token, 300, 'USD', 'folio-bob-001')
    expect(hold.status).toBe('OPEN')
    expect(hold.amount).toBe(300)

    // Step 2: Partial capture of $250
    const capture = PaymentOrchestrator.captureAuthorization(hold.id, 250)
    expect(capture.status).toBe('SETTLED')
    expect(capture.amount).toBe(250)
    
    // Hold status must transition to CAPTURED
    const updatedHold = PaymentOrchestrator.getHold(hold.id)
    expect(updatedHold?.status).toBe('CAPTURED')

    // Confirm balanced journal entry was posted: Dr Cash (1010) + Cr Guest AR (1200) for $250
    const guestAR = DoubleEntryLedger.getAccount('1200')
    const cash = DoubleEntryLedger.getAccount('1010')

    expect(cash.balance).toBe(250)
    expect(guestAR.balance).toBe(-250) // Payment credited guest AR
  })

  test('should reject capturing holds with amounts exceeding the authorized limit', () => {
    const tokenObj = PaymentOrchestrator.vaultCard({
      cardNumber: '4111111111111111',
      holderName: 'Bob Jenkins',
      expiry: '10/27',
      cvv: '999'
    })

    const hold = PaymentOrchestrator.authorizeCard(tokenObj.token, 100, 'USD', 'folio-bob-002')

    expect(() => {
      PaymentOrchestrator.captureAuthorization(hold.id, 150)
    }).toThrow('Capture value $150 exceeds authorized limit')
  })

  test('should void open authorizations releasing the held limit', () => {
    const tokenObj = PaymentOrchestrator.vaultCard({
      cardNumber: '4111111111111111',
      holderName: 'Charlie Brown',
      expiry: '05/26',
      cvv: '777'
    })

    const hold = PaymentOrchestrator.authorizeCard(tokenObj.token, 150, 'USD', 'folio-charlie')
    expect(hold.status).toBe('OPEN')

    PaymentOrchestrator.voidAuthorization(hold.id)
    expect(hold.status).toBe('VOIDED')
  })

  test('should convert foreign currency captures accurately to ledger USD baseline balances', () => {
    const tokenObj = PaymentOrchestrator.vaultCard({
      cardNumber: '4111111111111111',
      holderName: 'International Guest',
      expiry: '09/29',
      cvv: '555'
    })

    // Settle 92 Euros (EUR is 0.92, so USD equivalent is 92 / 0.92 = 100)
    const hold = PaymentOrchestrator.authorizeCard(tokenObj.token, 92, 'EUR', 'folio-intl')
    PaymentOrchestrator.captureAuthorization(hold.id, 92)

    const cash = DoubleEntryLedger.getAccount('1010')
    expect(cash.balance).toBe(100.00) // 100.00 USD
  })

  test('should support partial and full refunds posting balanced ledger reversals', () => {
    const tokenObj = PaymentOrchestrator.vaultCard({
      cardNumber: '4111111111111111',
      holderName: 'Dianne Ross',
      expiry: '11/27',
      cvv: '111'
    })

    const hold = PaymentOrchestrator.authorizeCard(tokenObj.token, 100, 'USD', 'folio-refund')
    const capture = PaymentOrchestrator.captureAuthorization(hold.id, 100)

    // Partial refund of $40 (expected cash balance becomes 60, refund expense becomes 40)
    PaymentOrchestrator.refundCapture(capture.id, 40)
    
    let cash = DoubleEntryLedger.getAccount('1010')
    let refundExpense = DoubleEntryLedger.getAccount('acc-5010')

    expect(cash.balance).toBe(60) // 100 - 40
    expect(refundExpense.balance).toBe(40) // 40

    // Full refund of remaining $60
    PaymentOrchestrator.refundCapture(capture.id, 60)
    
    cash = DoubleEntryLedger.getAccount('1010')
    refundExpense = DoubleEntryLedger.getAccount('acc-5010')

    expect(cash.balance).toBe(0) // completely refunded
    expect(refundExpense.balance).toBe(100)
    expect(capture.status).toBe('REFUNDED')
  })
})
