import { NextResponse } from 'next/server'
import { z } from 'zod'
import { AccountingGovernanceService } from '@/lib/services/accounting-service'

const adjustmentSchema = z.object({
  paymentId: z.string().min(1, 'paymentId is required'),
  type: z.string().min(2, 'type is required'),
  amount: z.number(),
  reason: z.string().min(4, 'Reason must contain at least 4 characters for audit justification'),
  authorizingUser: z.string().optional()
}).strict()

export async function POST(request: Request) {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const body = await request.json()
    const parsed = adjustmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: 'ERR_VALIDATION_FAILED',
        message: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        statusCode: 400,
        timestamp: new Date().toISOString(),
        traceId
      }, { status: 400 })
    }

    const adjustment = await AccountingGovernanceService.recordFinancialAdjustment(parsed.data)

    return NextResponse.json({
      success: true,
      data: adjustment,
      message: 'Financial adjustment logged and general ledger audit voucher recorded.',
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 201 })
  } catch (error: any) {
    console.error(`[${traceId}] Financial Adjustment Error:`, error)
    const status = error.message?.includes('not found') ? 404 : 500
    return NextResponse.json({
      error: 'ERR_ACCOUNTING_ADJUSTMENT',
      message: error.message || 'Internal Server Error during financial adjustment processing',
      statusCode: status,
      timestamp: new Date().toISOString(),
      traceId
    }, { status })
  }
}
