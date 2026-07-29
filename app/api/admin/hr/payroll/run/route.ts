import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PayrollService } from '@/lib/services/payroll-service'

const payrollRunSchema = z.object({
  periodStart: z.string().min(1, 'periodStart date is required'),
  periodEnd: z.string().min(1, 'periodEnd date is required'),
  defaultTaxRate: z.number().min(0).max(1).optional()
}).strict()

export async function GET() {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const runs = await PayrollService.getPayrollRuns()
    return NextResponse.json({
      success: true,
      data: runs,
      count: runs.length,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 200 })
  } catch (error: any) {
    console.error(`[${traceId}] Get Payroll Runs Error:`, error)
    return NextResponse.json({
      error: 'ERR_PAYROLL_FETCH',
      message: error.message || 'Failed to retrieve payroll runs',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const body = await request.json()
    const parsed = payrollRunSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: 'ERR_VALIDATION_FAILED',
        message: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        statusCode: 400,
        timestamp: new Date().toISOString(),
        traceId
      }, { status: 400 })
    }

    const result = await PayrollService.executePayrollRun(parsed.data)

    return NextResponse.json({
      success: true,
      data: result,
      message: `Payroll run finalized. Itemized line items generated for ${result.lineItemsCount} staff members.`,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 201 })
  } catch (error: any) {
    console.error(`[${traceId}] Execute Payroll Run Error:`, error)
    const status = error.message?.includes('No active employees') ? 404 : 500
    return NextResponse.json({
      error: 'ERR_PAYROLL_EXECUTION',
      message: error.message || 'Internal Server Error during payroll calculation run',
      statusCode: status,
      timestamp: new Date().toISOString(),
      traceId
    }, { status })
  }
}
