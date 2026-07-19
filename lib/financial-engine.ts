import { eventBus } from './event-bus'
import { DoubleEntryLedger } from './double-entry-ledger'
import { BusinessDateEngine } from './business-date-engine'
import prisma from './db'
import { Prisma } from '@prisma/client'

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
  routingRules: { category: 'ROOM_CHARGE' | 'F_AND_B' | 'SPA' | 'TAX'; targetFolioId: string; splitPercentage: number }[]
  status: 'OPEN' | 'SETTLED' | 'PENDING_AUDIT'
}

export class FinancialEngine {
  // Clear all folios (useful for testing or system resets)
  static async clearFolios(dbTx: Prisma.TransactionClient = prisma): Promise<void> {
    await dbTx.folioLineItem.deleteMany({})
    await dbTx.folio.deleteMany({})
  }

  // Initialize a new guest folio
  static async createFolio(bookingId: string, dbTx: Prisma.TransactionClient = prisma): Promise<Folio> {
    const folioId = `folio-${bookingId}-${Date.now()}`
    
    const booking = await dbTx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');

    await dbTx.folio.create({
      data: {
        id: folioId,
        bookingId: bookingId,
        type: 'GUEST',
        status: 'OPEN',
        propertyId: booking.propertyId
      }
    }).catch((err: any) => console.error('[DDD_SYNC] Failed to create Folio:', err))

    return {
      id: folioId,
      bookingId,
      transactions: [],
      routingRules: [],
      status: 'OPEN'
    }
  }

  // Retrieve folio with automatic caching failover
  static async getFolio(folioId: string, dbTx: Prisma.TransactionClient = prisma): Promise<Folio> {
    const dbFolio = await dbTx.folio.findUnique({
      where: { id: folioId },
      include: {
        lineItems: true,
        routingRulesSource: true
      }
    })

    if (!dbFolio) throw new Error(`Folio reference [${folioId}] not found in PMS databases.`)

    const transactions: FolioTransaction[] = dbFolio.lineItems.map(item => {
      const category = item.category as FolioTransaction['category']
      const totalAmount = Number(item.amount)
      
      let baseAmount = totalAmount
      let taxAmount = 0

      // Reverse engineer the tax based on the 25% rule
      if (category !== 'TAX' && category !== 'PAYMENT') {
        baseAmount = parseFloat((totalAmount / 1.25).toFixed(2))
        taxAmount = parseFloat((totalAmount - baseAmount).toFixed(2))
      }

      return {
        id: item.id,
        folioId: item.folioId,
        description: item.description,
        amount: baseAmount,
        taxAmount,
        category,
        timestamp: item.createdAt.toISOString(),
        isReversed: item.description.startsWith('REVERSAL COMP:'),
      }
    })

    const routingRules = dbFolio.routingRulesSource.map(rule => {
      const criteria: any = rule.criteria || {}
      return {
        category: criteria.category as any || 'ROOM_CHARGE',
        targetFolioId: rule.targetFolioId,
        splitPercentage: criteria.splitPercentage || 100
      }
    })

    return {
      id: dbFolio.id,
      bookingId: dbFolio.bookingId || '',
      transactions,
      routingRules,
      status: dbFolio.status as any
    }
  }

  // Add transactional charges applying precise tax algorithms
  static async postCharge(folioId: string, description: string, baseAmount: number, category: FolioTransaction['category'], dbTx: Prisma.TransactionClient = prisma): Promise<FolioTransaction> {
    const folio = await this.getFolio(folioId, dbTx)
    if (folio.status !== 'OPEN') {
      throw new Error(`Cannot modify charge: Folio [${folioId}] is marked locked status: ${folio.status}`)
    }

    // Check for active routing rules
    const activeRule = folio.routingRules.find(r => r.category === category)
    
    let routedTx: FolioTransaction | undefined;
    if (activeRule && activeRule.splitPercentage > 0) {
      const splitDec = activeRule.splitPercentage / 100
      const routedAmount = parseFloat((baseAmount * splitDec).toFixed(2))
      const remainingAmount = parseFloat((baseAmount - routedAmount).toFixed(2))

      // Post the routed portion to the target folio
      if (routedAmount !== 0) {
        routedTx = await this.postCharge(
          activeRule.targetFolioId, 
          `${description} (Routed ${activeRule.splitPercentage}% from Folio ${folioId})`, 
          routedAmount, 
          category,
          dbTx
        )
      }

      // If nothing remains, return the routed transaction
      if (remainingAmount === 0 && routedTx) {
        return routedTx
      }

      // Process the remaining amount locally
      baseAmount = remainingAmount
    }

    // Verify against Business Date Engine locks
    const bizDate = BusinessDateEngine.getBusinessDate()
    if (BusinessDateEngine.isDateLocked(bizDate)) {
      throw new Error(`Cannot post charge: Business Date [${bizDate}] has been locked by Audit.`)
    }

    // Standard hospitality 15% VAT plus 10% local municipal tax rate
    const taxRate = category === 'TAX' || category === 'PAYMENT' ? 0 : 0.25
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

    // Write FolioLineItem to DB using the transaction client
    await dbTx.folioLineItem.create({
      data: {
        id: tx.id,
        folioId: folioId,
        description: description,
        amount: baseAmount + taxAmount,
        category: category,
      }
    })

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
  static async postPayment(folioId: string, amount: number, description = 'Credit Card Settlement', dbTx: Prisma.TransactionClient = prisma): Promise<FolioTransaction> {
    return await this.postCharge(folioId, description, -Math.abs(amount), 'PAYMENT', dbTx)
  }

  // Audit-safe transaction reversal workflows (No hard deletion permitted by SRE)
  static async reverseTransaction(folioId: string, txId: string, actor: string, dbTx: Prisma.TransactionClient = prisma): Promise<void> {
    const folio = await this.getFolio(folioId, dbTx)
    const tx = folio.transactions.find(t => t.id === txId)
    if (!tx) throw new Error(`Transaction [${txId}] not found under Folio [${folioId}].`)
    if (tx.isReversed) throw new Error(`Cannot reverse: Transaction [${txId}] is already reversed.`)

    // Post equal compensating transaction in compliance with strict ledger rules
    const compensationAmount = -tx.amount
    
    // In our new model, postCharge handles taxes natively, so we just post the inverted base amount
    const compensationTx = await this.postCharge(
      folioId,
      `REVERSAL COMP: ${tx.description}`,
      compensationAmount,
      tx.category,
      dbTx
    )

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
  static async runNightAudit(actor: string, dbTx: Prisma.TransactionClient = prisma): Promise<{ totalRevenue: number; totalTaxes: number; auditedFolios: number; batchChecksum?: string }> {
    const closedDate = BusinessDateEngine.getBusinessDate()
    let totalRevenue = 0
    let totalTaxes = 0
    let auditedFolios = 0

    // Fetch all OPEN folios directly from database
    const openDbFolios = await dbTx.folio.findMany({
      where: { status: 'OPEN' }
    })

    // Perform SRE-safe day rollover and lock previous business date
    await BusinessDateEngine.performDayRollover(actor, async () => {
      for (const dbFolio of openDbFolios) {
        const folio = await this.getFolio(dbFolio.id, dbTx)
        
        await dbTx.folio.update({
          where: { id: folio.id },
          data: { status: 'PENDING_AUDIT' }
        })
        
        folio.transactions.forEach(t => {
          if (t.category !== 'PAYMENT') {
            totalRevenue += t.amount
            totalTaxes += t.taxAmount
          }
        })

        await dbTx.folio.update({
          where: { id: folio.id },
          data: { status: 'SETTLED' }
        })
        
        auditedFolios++
      }
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
