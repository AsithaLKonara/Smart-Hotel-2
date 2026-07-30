import { NextResponse } from 'next/server'
import { AccountingGovernanceService } from '@/lib/services/accounting-service'
import { z } from 'zod'

const adjustmentSchema = z.object({
  paymentId: z.string(),
  amount: z.number(),
  type: z.enum(['DISCOUNT', 'WRITE_OFF', 'LATE_FEE', 'REBATE']),
  reason: z.string().min(5),
  authorizedBy: z.string().optional()
}).strict()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ folioId: string }> }
) {
  try {
    const { folioId } = await params
    const body = await request.json()
    const parsed = adjustmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation Failed', details: parsed.error.format() }, { status: 400 })
    }

    const adjustment = await AccountingGovernanceService.recordFinancialAdjustment({
      paymentId: parsed.data.paymentId,
      amount: parsed.data.amount,
      type: parsed.data.type,
      reason: parsed.data.reason,
      authorizingUser: parsed.data.authorizedBy || 'SYSTEM_ADMIN' // Fallback if RBAC not injected via UI
    })

    return NextResponse.json({ success: true, adjustment }, { status: 201 })
  } catch (error: any) {
    console.error('Folio Adjustment Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
