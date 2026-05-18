import { prisma } from './db'
import { RealtimeEvents } from './realtime'

export interface ReconciliationReport {
  totalBookings: number
  totalPayments: number
  variance: number
  discrepancies: Array<{
    bookingId: string
    confirmationCode: string
    bookingTotal: number
    paymentTotal: number
    diff: number
  }>
  timestamp: string
}

/**
 * Enterprise Financial Reconciliation System
 * Guarantees parity between Bookings and Payments.
 */
export class FinancialReconciler {
  
  /**
   * Run a full audit of all historical bookings
   */
  static async runGlobalAudit(): Promise<ReconciliationReport> {
    const bookings = await prisma.booking.findMany({
      where: { 
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] }
      },
      include: {
        payments: {
          where: { status: 'completed' }
        }
      }
    })

    const discrepancies: ReconciliationReport['discrepancies'] = []
    let totalBookingValue = 0
    let totalPaymentValue = 0

    for (const booking of bookings) {
      const bookingTotal = booking.totalAmount
      const paymentTotal = booking.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
      
      totalBookingValue += bookingTotal
      totalPaymentValue += paymentTotal

      if (Math.abs(bookingTotal - paymentTotal) > 0.01) {
        discrepancies.push({
          bookingId: booking.id,
          confirmationCode: booking.confirmationCode,
          bookingTotal,
          paymentTotal,
          diff: bookingTotal - paymentTotal
        })
      }
    }

    const report: ReconciliationReport = {
      totalBookings: totalBookingValue,
      totalPayments: totalPaymentValue,
      variance: totalBookingValue - totalPaymentValue,
      discrepancies: discrepancies.slice(0, 50), // Limit for report preview
      timestamp: new Date().toISOString()
    }

    if (report.variance !== 0) {
      console.warn(`[FINANCIAL_AUDIT] Detected variance of ${report.variance} across ${discrepancies.length} records.`)
      
      await RealtimeEvents.emitOpsMessage({
        type: 'FINANCIAL_VARIANCE_DETECTED',
        severity: 'ERROR',
        message: `Financial audit detected ${discrepancies.length} discrepancies totaling ${report.variance} LKR.`,
        metadata: { variance: report.variance, count: discrepancies.length }
      })
    }

    return report
  }

  /**
   * Reconciliation Worker for Cron
   */
  static async startReconciliationWorker() {
    console.log('[RECONCILER] Starting nightly financial reconciliation worker...')
    try {
      const report = await this.runGlobalAudit()
      
      // Log audit results to AuditLog
      await prisma.auditLog.create({
        data: {
          userId: 'SYSTEM',
          actor: 'SYSTEM_RECONCILER',
          action: 'FINANCIAL_RECONCILIATION_RUN',
          resource: 'FINANCIALS',
          resourceId: report.timestamp,
          details: { 
            variance: report.variance, 
            bookingValue: report.totalBookings,
            discrepancyCount: report.discrepancies.length 
          },
          createdAt: new Date()
        }
      })
    } catch (err) {
      console.error('[RECONCILER_ERROR] Failed to run reconciliation:', err)
    }
  }
}
