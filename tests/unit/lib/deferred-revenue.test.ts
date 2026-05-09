import { DeferredRevenueEngine } from '../../../lib/deferred-revenue'
import { DoubleEntryLedger } from '../../../lib/double-entry-ledger'

describe('Deferred Revenue Accounting & Accruals', () => {
  beforeEach(() => {
    DeferredRevenueEngine.clearAll()
    DoubleEntryLedger.initializeLedger()
    DeferredRevenueEngine.initializeAccounts()
  })

  test('should register a prepaid deposit for future bookings under Deferred Liabilities', () => {
    const deposit = DeferredRevenueEngine.registerFutureDeposit('booking-future-101', 300.00, 3, '2026-05-08')

    expect(deposit.totalAmount).toBe(300.00)
    expect(deposit.remainingAmount).toBe(300.00)
    expect(deposit.nightlyRate).toBe(100.00)
    expect(deposit.totalNights).toBe(3)
    expect(deposit.recognizedNights).toBe(0)

    // Verify ledger accounts: Cash "1010" debited by 300, Deferred Revenue "2200" credited by 300
    const cash = DoubleEntryLedger.getAccount('1010')
    const deferredRevenue = DoubleEntryLedger.getAccount('2200')

    expect(cash.balance).toBe(300.00)
    expect(deferredRevenue.balance).toBe(300.00)
  })

  test('should recognize earned revenue nightly, transferring balances to Room Revenue', () => {
    // Booking 1: $300 for 3 nights ($100/night)
    DeferredRevenueEngine.registerFutureDeposit('b-rec-01', 300.00, 3, '2026-05-08')
    // Booking 2: $150 for 1 night ($150/night)
    DeferredRevenueEngine.registerFutureDeposit('b-rec-02', 150.00, 1, '2026-05-08')

    // Confirm initial balances (total Cash: 450, total Deferred: 450, Room Revenue: 0)
    let deferredRevenue = DoubleEntryLedger.getAccount('2200')
    let roomRevenue = DoubleEntryLedger.getAccount('4010')
    expect(deferredRevenue.balance).toBe(450.00)
    expect(roomRevenue.balance).toBe(0)

    // Night 1 audit execution (active check-ins: b-rec-01, b-rec-02)
    const recognizedN1 = DeferredRevenueEngine.recognizeNightlyRevenue('2026-05-08', ['b-rec-01', 'b-rec-02'])
    
    expect(recognizedN1).toBe(250.00) // 100 for booking 1 + 150 for booking 2

    deferredRevenue = DoubleEntryLedger.getAccount('2200')
    roomRevenue = DoubleEntryLedger.getAccount('4010')
    expect(deferredRevenue.balance).toBe(200.00) // 450 - 250
    expect(roomRevenue.balance).toBe(250.00) // Recognized 250

    // Night 2 audit execution (active check-ins: b-rec-01, b-rec-02 checked out already)
    const recognizedN2 = DeferredRevenueEngine.recognizeNightlyRevenue('2026-05-09', ['b-rec-01'])
    expect(recognizedN2).toBe(100.00)

    deferredRevenue = DoubleEntryLedger.getAccount('2200')
    roomRevenue = DoubleEntryLedger.getAccount('4010')
    expect(deferredRevenue.balance).toBe(100.00) // 200 - 100
    expect(roomRevenue.balance).toBe(350.00) // 250 + 100
  })

  test('should support deposit refund cancellations, clearing the deferred liability', () => {
    DeferredRevenueEngine.registerFutureDeposit('b-refund', 200.00, 2, '2026-05-08')

    // Refunding remaining deposit of $200
    const valueRefunded = DeferredRevenueEngine.handleEarlyCancellation('b-refund', 'REFUND', '2026-05-08')

    expect(valueRefunded).toBe(200.00)
    expect(DeferredRevenueEngine.getDeposit('b-refund')?.remainingAmount).toBe(0)

    // Verify double entry: Cash is credited (drops to 0), Deferred liability is debited (drops to 0)
    const cash = DoubleEntryLedger.getAccount('1010')
    const deferredRevenue = DoubleEntryLedger.getAccount('2200')

    expect(cash.balance).toBe(0)
    expect(deferredRevenue.balance).toBe(0)
  })

  test('should support deposit penalty forfeits, booking revenue under cancellation accounts', () => {
    DeferredRevenueEngine.registerFutureDeposit('b-penalty', 150.00, 1, '2026-05-08')

    // Guest cancels late, forfeit deposit of $150
    const penaltyFee = DeferredRevenueEngine.handleEarlyCancellation('b-penalty', 'PENALTY', '2026-05-08')

    expect(penaltyFee).toBe(150.00)

    // Verify double-entry: Cash remains 150, Deferred liability becomes 0, Cancellation Revenue becomes 150
    const cash = DoubleEntryLedger.getAccount('1010')
    const deferredRevenue = DoubleEntryLedger.getAccount('2200')
    const cancellationRevenue = DoubleEntryLedger.getAccount('acc-5020')

    expect(cash.balance).toBe(150.00)
    expect(deferredRevenue.balance).toBe(0)
    expect(cancellationRevenue.balance).toBe(150.00)
  })
})
