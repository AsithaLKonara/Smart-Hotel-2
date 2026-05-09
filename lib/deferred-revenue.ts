import { eventBus } from './event-bus'
import { DoubleEntryLedger } from './double-entry-ledger'

export interface DeferredDeposit {
  bookingId: string
  totalAmount: number
  remainingAmount: number
  totalNights: number
  nightlyRate: number
  recognizedNights: number
}

export class DeferredRevenueEngine {
  private static deposits: Map<string, DeferredDeposit> = new Map()

  // Register accounts inside chart dynamically on load
  static initializeAccounts(): void {
    try {
      // Check if accounts are already registered to prevent overwriting accumulative balances
      try {
        DoubleEntryLedger.getAccount('acc-2200')
        return // Already registered!
      } catch {
        // Not registered, register now
      }

      // Registered Deferred Liability (Credit balance increases liability)
      DoubleEntryLedger.addAccount({
        id: 'acc-2200',
        code: '2200',
        name: 'Deferred Revenue Liability',
        type: 'CREDIT',
        balance: 0
      })
      // Registered Cancellation Penalties Revenue (Credit balance increases revenue)
      DoubleEntryLedger.addAccount({
        id: 'acc-5020',
        code: '5020',
        name: 'Cancellation Penalty Revenue',
        type: 'CREDIT',
        balance: 0
      })
    } catch (err) {
      // Account may already be registered from a previous test run
      console.warn('SRE Ledger: Liability accounts already loaded.', err)
    }
  }

  // Clear data (for test suites)
  static clearAll(): void {
    this.deposits.clear()
  }

  // Register a prepaid advance deposit for a future booking
  static registerFutureDeposit(
    bookingId: string,
    amount: number,
    totalNights: number,
    businessDate: string
  ): DeferredDeposit {
    if (amount <= 0) {
      throw new Error('Deposit amount must be strictly positive.')
    }
    if (totalNights <= 0) {
      throw new Error('Total booking nights must be strictly positive.')
    }

    this.initializeAccounts()

    const nightlyRate = parseFloat((amount / totalNights).toFixed(2))
    const deposit: DeferredDeposit = {
      bookingId,
      totalAmount: amount,
      remainingAmount: amount,
      totalNights,
      nightlyRate,
      recognizedNights: 0
    }

    this.deposits.set(bookingId, deposit)

    // Settle Double-Entry journal: Debit Cash, Credit Deferred Revenue Liability
    DoubleEntryLedger.postJournalEntry(
      `dep-${bookingId}`,
      `Prepaid Future Booking Deposit: Booking Ref ${bookingId}`,
      businessDate,
      [
        { accountId: 'acc-1010', debit: amount, credit: 0 }, // Dr Cash
        { accountId: 'acc-2200', debit: 0, credit: amount }  // Cr Deferred Revenue Liability
      ]
    )

    eventBus.emit({
      id: `def-dep-${bookingId}-${Date.now()}`,
      type: 'revenue.deposit_registered',
      severity: 'INFO',
      title: `Prepaid Deposit Registered: $${amount.toFixed(2)}`,
      message: `Booking ${bookingId} prepaid deposit logged under Deferred Liabilities (Code: 2200).`,
      metadata: { ...deposit },
      timestamp: new Date().toISOString()
    })

    return deposit
  }

  // Release earned portions night-by-night from Deferred Liability to actual Room Revenue
  static recognizeNightlyRevenue(businessDate: string, activeCheckInBookingIds: string[]): number {
    this.initializeAccounts()
    let totalRecognizedToday = 0

    for (const bookingId of activeCheckInBookingIds) {
      const deposit = this.deposits.get(bookingId)
      if (!deposit || deposit.remainingAmount <= 0) continue
      if (deposit.recognizedNights >= deposit.totalNights) continue

      // Calculate tonight's earned portion
      const isLastNight = (deposit.recognizedNights === deposit.totalNights - 1)
      const earnedTonight = isLastNight ? deposit.remainingAmount : deposit.nightlyRate

      deposit.recognizedNights++
      deposit.remainingAmount = parseFloat((deposit.remainingAmount - earnedTonight).toFixed(2))

      totalRecognizedToday += earnedTonight

      // Settle Double-Entry release journal: Debit Deferred Liabilities, Credit Room Revenue
      DoubleEntryLedger.postJournalEntry(
        `release-${bookingId}-n${deposit.recognizedNights}`,
        `Nightly Revenue Recognition Release (Booking: ${bookingId}, Night: ${deposit.recognizedNights}/${deposit.totalNights})`,
        businessDate,
        [
          { accountId: 'acc-2200', debit: earnedTonight, credit: 0 }, // Dr Deferred Liabilities
          { accountId: 'acc-4010', debit: 0, credit: earnedTonight }  // Cr Room Revenue
        ]
      )

      eventBus.emit({
        id: `def-release-${bookingId}-n${deposit.recognizedNights}-${Date.now()}`,
        type: 'revenue.revenue_recognized',
        severity: 'INFO',
        title: `Nightly Revenue Earned: $${earnedTonight.toFixed(2)}`,
        message: `Recognized nightly room rent of $${earnedTonight.toFixed(2)} for Booking ${bookingId}.`,
        metadata: { ...deposit, earnedTonight },
        timestamp: new Date().toISOString()
      })
    }

    return parseFloat(totalRecognizedToday.toFixed(2))
  }

  // Handle cancellations by either refunding deposit or processing penalty fees
  static handleEarlyCancellation(
    bookingId: string,
    policy: 'REFUND' | 'PENALTY',
    businessDate: string
  ): number {
    this.initializeAccounts()
    const deposit = this.deposits.get(bookingId)
    if (!deposit) {
      throw new Error(`Deposit records for Booking [${bookingId}] not found.`)
    }
    if (deposit.remainingAmount <= 0) {
      throw new Error(`No remaining deferred deposits to settle for Booking [${bookingId}].`)
    }

    const cancelValue = deposit.remainingAmount
    deposit.remainingAmount = 0

    if (policy === 'REFUND') {
      // Refund cash deposit: Debit Deferred Liabilities, Credit Cash
      DoubleEntryLedger.postJournalEntry(
        `cancel-ref-${bookingId}`,
        `Deferred Deposit Cancellation Refund: Booking ${bookingId}`,
        businessDate,
        [
          { accountId: 'acc-2200', debit: cancelValue, credit: 0 }, // Dr Deferred Liabilities
          { accountId: 'acc-1010', debit: 0, credit: cancelValue }  // Cr Cash
        ]
      )

      eventBus.emit({
        id: `def-cancel-ref-${bookingId}-${Date.now()}`,
        type: 'revenue.deposit_refunded',
        severity: 'INFO',
        title: `Deferred Deposit Refunded: $${cancelValue.toFixed(2)}`,
        message: `Refunded guest deposit of $${cancelValue.toFixed(2)} for Booking ${bookingId}.`,
        metadata: { bookingId, refundedAmount: cancelValue },
        timestamp: new Date().toISOString()
      })
    } else {
      // Forfeit deposit as penalty: Debit Deferred Liabilities, Credit Cancellation Penalty Revenue
      DoubleEntryLedger.postJournalEntry(
        `cancel-pen-${bookingId}`,
        `Deferred Deposit Forfeit Penalty: Booking ${bookingId}`,
        businessDate,
        [
          { accountId: 'acc-2200', debit: cancelValue, credit: 0 }, // Dr Deferred Liabilities
          { accountId: 'acc-5020', debit: 0, credit: cancelValue }  // Cr Cancellation Revenue
        ]
      )

      eventBus.emit({
        id: `def-cancel-pen-${bookingId}-${Date.now()}`,
        type: 'revenue.deposit_forfeited',
        severity: 'HIGH',
        title: `Deposit Kept as Penalty: $${cancelValue.toFixed(2)}`,
        message: `Retained deposit of $${cancelValue.toFixed(2)} as cancellation penalty fee for Booking ${bookingId}.`,
        metadata: { bookingId, penaltyAmount: cancelValue },
        timestamp: new Date().toISOString()
      })
    }

    return cancelValue
  }

  static getDeposit(bookingId: string): DeferredDeposit | undefined {
    return this.deposits.get(bookingId)
  }
}

// Automatically load dynamic charts on module import
DeferredRevenueEngine.initializeAccounts()
export default DeferredRevenueEngine;
