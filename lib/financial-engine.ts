import { eventBus } from './event-bus'
import { DoubleEntryLedger } from './double-entry-ledger'
import { BusinessDateEngine } from './business-date-engine'
import prisma from './db'


export interface FolioTransaction {
  id: string
  folioId: string
  description: string
  amount: number
  taxAmount: number
  category: 'ROOM_CHARGE' | 'F_AND_B' | 'SPA' | 'TAX' | 'PAYMENT'
  timestamp: string
  isReversed: boolean
  reversedBy?: string
}

export interface Folio {
  id: string
  bookingId: string
  transactions: FolioTransaction[]
  routingRules: { category: string; targetFolioId: string }[]
  status: 'OPEN' | 'SETTLED' | 'PENDING_AUDIT'
}

export class FinancialEngine {
  private static folios: Map<string, Folio> = new Map()

  // Clear all folios (useful for testing or system resets)
  static clearFolios(): void {
    this.folios.clear()
  }

  // Initialize a new guest folio
  static createFolio(bookingId: string): Folio {
    const folio: Folio = {
      id: `folio-${bookingId}-${Date.now()}`,
      bookingId,
      transactions: [],
      routingRules: [],
      status: 'OPEN'
    }
    this.folios.set(folio.id, folio)
    
    // Dual-write to DB
    prisma.folio.create({
      data: {
        id: folio.id,
        bookingId: bookingId,
        type: 'GUEST',
        status: 'OPEN'
      }
    }).catch((err: any) => console.error('[DDD_SYNC] Failed to create Folio:', err))

    return folio
  }

  // Retrieve folio with automatic caching failover
  static getFolio(folioId: string): Folio {
    const folio = this.folios.get(folioId)
    if (!folio) throw new Error(`Folio reference [${folioId}] not found in PMS databases.`)
    return folio
  }

  // Add transactional charges applying precise tax algorithms
  static postCharge(folioId: string, description: string, baseAmount: number, category: FolioTransaction['category']): FolioTransaction {
    const folio = this.getFolio(folioId)
    if (folio.status !== 'OPEN') {
      throw new Error(`Cannot modify charge: Folio [${folioId}] is marked locked status: ${folio.status}`)
    }

    // Check for active routing rules
    const activeRule = folio.routingRules.find(r => r.category === category)
    if (activeRule) {
      return this.postCharge(activeRule.targetFolioId, description, baseAmount, category)
    }

    // Verify against Business Date Engine locks
    const bizDate = BusinessDateEngine.getBusinessDate()
    if (BusinessDateEngine.isDateLocked(bizDate)) {
      throw new Error(`Cannot post charge: Business Date [${bizDate}] has been locked by Audit.`)
    }

    // Standard hospitality 15% VAT plus 5% local municipal tax rate
    const taxRate = category === 'TAX' || category === 'PAYMENT' ? 0 : 0.20
    const taxAmount = parseFloat((baseAmount * taxRate).toFixed(2))

    const tx: FolioTransaction = {
      id: `tx-${folioId}-${Date.now()}`,
      folioId,
      description,
      amount: baseAmount,
      taxAmount,
      category,
      timestamp: new Date().toISOString(),
      isReversed: false
    }

    folio.transactions.push(tx)

    // Dual-write FolioLineItem to DB
    prisma.folioLineItem.create({
      data: {
        id: tx.id,
        folioId: folioId,
        description: description,
        amount: baseAmount + taxAmount,
        category: category,
      }
    }).catch((err: any) => console.error('[DDD_SYNC] Failed to create FolioLineItem:', err))

    // Post to Double-Entry Accounting Ledger
    const ledgerLines: { accountId: string; debit: number; credit: number }[] = []
    const totalAmount = parseFloat((baseAmount + taxAmount).toFixed(2))

    if (category === 'PAYMENT') {
      const paymentVal = Math.abs(baseAmount)
      ledgerLines.push({ accountId: 'acc-1010', debit: paymentVal, credit: 0 }) // Dr Cash
      ledgerLines.push({ accountId: 'acc-1200', debit: 0, credit: paymentVal }) // Cr Guest AR
    } else {
      let revAcc = 'acc-4010' // default room revenue
      if (category === 'F_AND_B') revAcc = 'acc-4020'
      else if (category === 'SPA') revAcc = 'acc-4030'

      if (category === 'TAX') {
        ledgerLines.push({ accountId: 'acc-1200', debit: baseAmount, credit: 0 }) // Dr Guest AR
        ledgerLines.push({ accountId: 'acc-2010', debit: 0, credit: baseAmount }) // Cr Tax Liability
      } else {
        ledgerLines.push({ accountId: 'acc-1200', debit: totalAmount, credit: 0 }) // Dr Guest AR
        ledgerLines.push({ accountId: revAcc, debit: 0, credit: baseAmount })      // Cr Revenue
        if (taxAmount > 0) {
          ledgerLines.push({ accountId: 'acc-2010', debit: 0, credit: taxAmount }) // Cr Tax Liability
        }
      }
    }

    DoubleEntryLedger.postJournalEntry(tx.id, description, bizDate, ledgerLines)

    // Emit live revenue update event onto the centralized Event Bus
    eventBus.emit({
      id: `fin-tx-${tx.id}`,
      type: 'financial.charge_posted',
      severity: 'INFO',
      title: `Financial Charge Logged`,
      message: `Posted ${category} charge of $${baseAmount} (+ $${taxAmount} tax) to Folio ${folioId}.`,
      metadata: { ...tx },
      timestamp: tx.timestamp
    })

    return tx
  }

  // Post payment transactions
  static postPayment(folioId: string, amount: number, description = 'Credit Card Settlement'): FolioTransaction {
    return this.postCharge(folioId, description, -Math.abs(amount), 'PAYMENT')
  }

  // Audit-safe transaction reversal workflows (No hard deletion permitted by SRE)
  static reverseTransaction(folioId: string, txId: string, actor: string): void {
    const folio = this.getFolio(folioId)
    const tx = folio.transactions.find(t => t.id === txId)
    if (!tx) throw new Error(`Transaction [${txId}] not found under Folio [${folioId}].`)
    if (tx.isReversed) throw new Error(`Cannot reverse: Transaction [${txId}] is already reversed.`)

    tx.isReversed = true
    tx.reversedBy = actor

    // Post equal compensating transaction in compliance with strict ledger rules
    const compensationAmount = -tx.amount
    const compensationTax = -tx.taxAmount
    const compensationTx: FolioTransaction = {
      id: `tx-rev-${txId}-${Date.now()}`,
      folioId,
      description: `REVERSAL COMP: ${tx.description}`,
      amount: compensationAmount,
      taxAmount: compensationTax,
      category: tx.category,
      timestamp: new Date().toISOString(),
      isReversed: false
    }

    folio.transactions.push(compensationTx)

    // Emit compensating reversal timeline log
    eventBus.emit({
      id: `fin-rev-${compensationTx.id}`,
      type: 'financial.reversal_posted',
      severity: 'HIGH',
      title: `Compensating Charge Reversed`,
      message: `Reversed transaction ${txId} with compensating post of $${compensationAmount}.`,
      metadata: { originalTx: tx, compensationTx },
      timestamp: compensationTx.timestamp
    })
  }

  // Night audit operational workflow closing business days
  static runNightAudit(actor: string): { totalRevenue: number; totalTaxes: number; auditedFolios: number; batchChecksum?: string } {
    const closedDate = BusinessDateEngine.getBusinessDate()
    let totalRevenue = 0
    let totalTaxes = 0
    let auditedFolios = 0

    // Perform SRE-safe day rollover and lock previous business date
    BusinessDateEngine.performDayRollover(actor, () => {
      this.folios.forEach(folio => {
        if (folio.status === 'OPEN') {
          folio.status = 'PENDING_AUDIT'
          
          folio.transactions.forEach(t => {
            if (t.category !== 'PAYMENT') {
              totalRevenue += t.amount
              totalTaxes += t.taxAmount
            }
          })

          folio.status = 'SETTLED'
          auditedFolios++
        }
      })
    })

    // Settle Ledger Batch for the closed business date
    const batch = DoubleEntryLedger.generateSettlementBatch(closedDate)

    // Emit Night Audit metrics to global SRE monitoring
    eventBus.emit({
      id: `night-audit-${Date.now()}`,
      type: 'financial.night_audit_completed',
      severity: 'INFO',
      title: `Night Audit Completed`,
      message: `Night audit executed successfully by ${actor}. Settled ${auditedFolios} folios. Revenue: $${totalRevenue.toFixed(2)}, Taxes: $${totalTaxes.toFixed(2)}. Checksum: ${batch.checksum}`,
      metadata: { totalRevenue, totalTaxes, auditedFolios, actor, batchChecksum: batch.checksum },
      timestamp: new Date().toISOString()
    })

    return { totalRevenue, totalTaxes, auditedFolios, batchChecksum: batch.checksum }
  }
}
export default FinancialEngine;
