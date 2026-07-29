import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'

export interface FinancialAdjustmentDTO {
  paymentId: string
  type: string // e.g. 'REFUND', 'DISCOUNT_OVERRIDE', 'WRITE_OFF', 'DISPUTE_CREDIT'
  amount: number
  reason: string
  authorizingUser?: string
}

export const STANDARD_USALI_TRANSACTION_CODES = [
  { id: '100-RM-REV', description: 'Room Revenue - Guest Accommodation (USALI Dept 10)', type: 'REVENUE' },
  { id: '200-FB-REV', description: 'Food & Beverage Dining Revenue - POS Outlets (USALI Dept 20)', type: 'REVENUE' },
  { id: '300-SPA-REV', description: 'Resort & Spa Recreation Revenue (USALI Dept 30)', type: 'REVENUE' },
  { id: '800-TAX', description: 'Statutory Occupancy & Sales Taxes Collected (Liability)', type: 'TAX' },
  { id: '900-PAY', description: 'Settlement Receipts - Card, Cash & Terminal Disbursements', type: 'PAYMENT' },
  { id: '950-ADJ', description: 'Financial Folio & Payment Adjustments / Rebates', type: 'ADJUSTMENT' },
]

/**
 * Service: Accounting Governance & USALI Ledger Engine
 * Purpose: Activating dead schema models TransactionCode and FinancialAdjustment
 */
export class AccountingGovernanceService {
  /**
   * Seeds master USALI transaction billing codes into PostgreSQL if missing.
   * Activating Dead Schema: TransactionCode
   */
  static async seedTransactionCodes() {
    const results = []
    for (const code of STANDARD_USALI_TRANSACTION_CODES) {
      const upserted = await prisma.transactionCode.upsert({
        where: { id: code.id },
        update: { description: code.description, type: code.type },
        create: { id: code.id, description: code.description, type: code.type }
      })
      results.push(upserted)
    }
    return results
  }

  /**
   * Retrieves all master USALI billing transaction codes for dropdowns and charge validation.
   */
  static async listTransactionCodes() {
    return await prisma.transactionCode.findMany({
      orderBy: { id: 'asc' }
    })
  }

  /**
   * Logs a formal forensic FinancialAdjustment whenever a payment or folio charge is altered, discounted, or refunded.
   * Activating Dead Schema: FinancialAdjustment
   */
  static async recordFinancialAdjustment(dto: FinancialAdjustmentDTO) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Validate payment existence
      const payment = await tx.payment.findUnique({
        where: { id: dto.paymentId }
      })

      if (!payment) {
        throw new Error(`Payment with ID ${dto.paymentId} not found`)
      }

      // Record adjustment (Activating Dead Schema: FinancialAdjustment)
      const adjustment = await tx.financialAdjustment.create({
        data: {
          paymentId: payment.id,
          type: dto.type,
          amount: dto.amount,
          reason: dto.reason
        }
      })

      // Also generate paired general ledger voucher if accounting module is accessible
      if (payment.folioId) {
        await tx.folioLineItem.create({
          data: {
            folioId: payment.folioId,
            transactionCodeId: '950-ADJ',
            description: `[Adjustment: ${dto.type}] ${dto.reason}`,
            amount: -Math.abs(dto.amount), // Rebate / discount credit against folio
            category: 'ADJUSTMENT'
          }
        })
      }

      return adjustment
    })
  }
}
