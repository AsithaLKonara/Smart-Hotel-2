import { eventBus } from './event-bus'
import crypto from 'crypto'

export type AccountType = 'DEBIT' | 'CREDIT' // DEBIT (Assets, Expenses), CREDIT (Liabilities, Equity, Revenue)

export interface LedgerAccount {
  id: string
  code: string // e.g. "1010"
  name: string
  type: AccountType
  balance: number
}

export interface JournalLine {
  id: string
  accountId: string
  debit: number // positive or 0
  credit: number // positive or 0
}

export interface JournalEntry {
  id: string
  reference: string // bookingId, folioId, orderId
  description: string
  businessDate: string // e.g. "2026-05-08"
  timestamp: string
  accountingPeriodId: string
  lines: JournalLine[]
}

export interface AccountingPeriod {
  id: string
  name: string // e.g. "May 2026"
  startDate: string // ISO date
  endDate: string // ISO date
  status: 'OPEN' | 'CLOSED'
}

export interface SettlementBatch {
  id: string
  businessDate: string
  totalDebit: number
  totalCredit: number
  balanced: boolean
  checksum: string
  createdAt: string
}

export class DoubleEntryLedger {
  private static accounts: Map<string, LedgerAccount> = new Map()
  private static entries: JournalEntry[] = []
  private static periods: Map<string, AccountingPeriod> = new Map()
  private static batches: Map<string, SettlementBatch> = new Map()

  // Initialize standard charts of accounts
  static initializeLedger(): void {
    this.accounts.clear()
    this.entries = []
    this.periods.clear()
    this.batches.clear()

    // Assets (Debit positive)
    this.addAccount({ id: 'acc-1010', code: '1010', name: 'Cash / Bank', type: 'DEBIT', balance: 0 })
    this.addAccount({ id: 'acc-1200', code: '1200', name: 'Guest AR (Accounts Receivable)', type: 'DEBIT', balance: 0 })

    // Liabilities (Credit positive)
    this.addAccount({ id: 'acc-2010', code: '2010', name: 'Tax Liability (VAT/Municipal)', type: 'CREDIT', balance: 0 })

    // Revenue (Credit positive)
    this.addAccount({ id: 'acc-4010', code: '4010', name: 'Room Revenue', type: 'CREDIT', balance: 0 })
    this.addAccount({ id: 'acc-4020', code: '4020', name: 'Food & Beverage Revenue', type: 'CREDIT', balance: 0 })
    this.addAccount({ id: 'acc-4030', code: '4030', name: 'SPA Revenue', type: 'CREDIT', balance: 0 })

    // Expenses (Debit positive)
    this.addAccount({ id: 'acc-5010', code: '5010', name: 'Refund Expense', type: 'DEBIT', balance: 0 })

    // Setup default open accounting period
    this.periods.set('period-2026-05', {
      id: 'period-2026-05',
      name: 'May 2026',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      status: 'OPEN'
    })
  }

  static addAccount(account: LedgerAccount): void {
    this.accounts.set(account.id, account)
  }

  static getAccount(accountIdOrCode: string): LedgerAccount {
    const acc = this.accounts.get(accountIdOrCode) || Array.from(this.accounts.values()).find(a => a.code === accountIdOrCode)
    if (!acc) throw new Error(`LedgerAccount [${accountIdOrCode}] not found in chart of accounts.`)
    return acc
  }

  static getAccounts(): LedgerAccount[] {
    return Array.from(this.accounts.values())
  }

  static getPeriod(periodId: string): AccountingPeriod {
    const period = this.periods.get(periodId)
    if (!period) throw new Error(`AccountingPeriod [${periodId}] not found.`)
    return period
  }

  static getActivePeriodForDate(dateStr: string): AccountingPeriod {
    const date = new Date(dateStr)
    const activePeriod = Array.from(this.periods.values()).find(p => {
      const start = new Date(p.startDate)
      const end = new Date(p.endDate)
      return date >= start && date <= end
    })
    if (!activePeriod) {
      throw new Error(`No active accounting period found for date: ${dateStr}`)
    }
    return activePeriod
  }

  static closePeriod(periodId: string): void {
    const period = this.getPeriod(periodId)
    period.status = 'CLOSED'
    eventBus.emit({
      id: `acc-period-close-${periodId}-${Date.now()}`,
      type: 'accounting.period_closed',
      severity: 'HIGH',
      title: 'Accounting Period Closed',
      message: `Accounting Period ${period.name} has been marked CLOSED. No new entries permitted.`,
      metadata: { periodId, name: period.name },
      timestamp: new Date().toISOString()
    })
  }

  // Post double entry journal line entries
  static postJournalEntry(
    reference: string,
    description: string,
    businessDate: string,
    lines: Omit<JournalLine, 'id'>[]
  ): JournalEntry {
    // 1. Verify accounting period is open
    const period = this.getActivePeriodForDate(businessDate)
    if (period.status === 'CLOSED') {
      throw new Error(`Cannot post transaction: Accounting Period [${period.name}] is CLOSED.`)
    }

    // 2. Double-Entry equation check: Sum(Debits) === Sum(Credits)
    let totalDebits = 0
    let totalCredits = 0
    const processedLines: JournalLine[] = []

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index]
      const acc = this.getAccount(line.accountId)
      if (line.debit < 0 || line.credit < 0) {
        throw new Error(`Debit or Credit cannot be negative values under standard accounting rules.`)
      }
      if (line.debit > 0 && line.credit > 0) {
        throw new Error(`Single transaction line cannot have both a debit and a credit value posted.`)
      }

      totalDebits += line.debit
      totalCredits += line.credit

      processedLines.push({
        id: `line-${reference}-${index}-${Date.now()}`,
        accountId: acc.id,
        debit: parseFloat(line.debit.toFixed(2)),
        credit: parseFloat(line.credit.toFixed(2))
      })
    }

    // Account for small precision differences
    const divergence = Math.abs(totalDebits - totalCredits)
    if (divergence > 0.0001) {
      throw new Error(`Double-Entry balancing error: Total debits ($${totalDebits.toFixed(2)}) must exactly equal credits ($${totalCredits.toFixed(2)}). Divergence: $${divergence.toFixed(4)}`)
    }

    // 3. Update Account Balances in-memory (Asset/Expense debit increases, Revenue/Liability credit increases)
    for (const line of processedLines) {
      const acc = this.getAccount(line.accountId)
      if (acc.type === 'DEBIT') {
        acc.balance += (line.debit - line.credit)
      } else {
        acc.balance += (line.credit - line.debit)
      }
      acc.balance = parseFloat(acc.balance.toFixed(2))
    }

    const entry: JournalEntry = {
      id: `je-${reference}-${Date.now()}`,
      reference,
      description,
      businessDate,
      timestamp: new Date().toISOString(),
      accountingPeriodId: period.id,
      lines: processedLines
    }

    this.entries.push(entry)

    // Emit accounting event to the Event Bus
    eventBus.emit({
      id: `je-posted-${entry.id}`,
      type: 'accounting.journal_entry_posted',
      severity: 'INFO',
      title: `Journal Entry Balanced: ${description}`,
      message: `Posted balanced entry with total value $${totalDebits.toFixed(2)} reference ${reference}`,
      metadata: { ...entry },
      timestamp: entry.timestamp
    })

    return entry
  }

  // Create a Settlement Batch verifying business dates
  static generateSettlementBatch(businessDate: string): SettlementBatch {
    const relevantEntries = this.entries.filter(e => e.businessDate === businessDate)
    
    let totalDebit = 0
    let totalCredit = 0

    for (const entry of relevantEntries) {
      for (const line of entry.lines) {
        totalDebit += line.debit
        totalCredit += line.credit
      }
    }

    const balanced = Math.abs(totalDebit - totalCredit) < 0.0001
    
    // Generate SRE audit validation checksum
    const payloadStr = JSON.stringify(relevantEntries.map(e => e.id).sort())
    let checksumValue = 0
    for (let i = 0; i < payloadStr.length; i++) {
      checksumValue = (checksumValue + payloadStr.charCodeAt(i)) % 1000000
    }
    const checksum = `SHA256-SIM-${checksumValue}`

    const batch: SettlementBatch = {
      id: `batch-${businessDate}-${Date.now()}`,
      businessDate,
      totalDebit: parseFloat(totalDebit.toFixed(2)),
      totalCredit: parseFloat(totalCredit.toFixed(2)),
      balanced,
      checksum,
      createdAt: new Date().toISOString()
    }

    this.batches.set(businessDate, batch)

    eventBus.emit({
      id: `batch-settled-${batch.id}`,
      type: 'accounting.settlement_batch_completed',
      severity: balanced ? 'INFO' : 'CRITICAL',
      title: `Settlement Batch Created: ${businessDate}`,
      message: `Closed date ${businessDate}. Total: $${totalDebit.toFixed(2)}. Balanced: ${balanced}. Checksum: ${checksum}`,
      metadata: { ...batch },
      timestamp: batch.createdAt
    })

    return batch
  }

  static getEntries(): JournalEntry[] {
    return [...this.entries]
  }

  static getBatch(businessDate: string): SettlementBatch | undefined {
    return this.batches.get(businessDate)
  }

  // Forensic Compliance Chain: Cryptographically binds critical administrative changes
  static notarizeAdminAction(actor: string, action: string, details: string): string {
    const timestamp = new Date().toISOString()
    const lastEntry = this.entries[this.entries.length - 1]
    const previousHash = lastEntry ? lastEntry.id : 'ROOT-LEDGER-CHAIN'
    
    const blockPayload = `${previousHash}|${actor}|${action}|${details}|${timestamp}`
    const signature = crypto
      .createHash('sha256')
      .update(blockPayload)
      .digest('hex')
      
    eventBus.emit({
      id: `notarize-${signature.slice(0, 8)}`,
      type: 'compliance.notarization_signed',
      severity: 'HIGH',
      title: 'Admin Action Notarized',
      message: `Action [${action}] by [${actor}] cryptographically bound: ${signature.slice(0, 16)}`,
      metadata: { actor, action, timestamp, signature, previousHash },
      timestamp
    })

    return signature
  }
}

// Automatically initialize chart of accounts
DoubleEntryLedger.initializeLedger()
export default DoubleEntryLedger;
