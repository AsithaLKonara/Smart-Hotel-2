import { NextRequest, NextResponse } from 'next/server'
import { PayrollService } from '@/lib/services/payroll-service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const { id } = await params
    const run = await PayrollService.getPayrollRunById(id)
    
    return NextResponse.json({
      success: true,
      data: run,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 200 })
  } catch (error: any) {
    console.error(`[${traceId}] Get Payroll Run Error:`, error)
    const status = error.message?.includes('not found') ? 404 : 500
    return NextResponse.json({
      error: 'ERR_PAYROLL_FETCH',
      message: error.message || 'Failed to retrieve payroll run',
      statusCode: status,
      timestamp: new Date().toISOString(),
      traceId
    }, { status })
  }
}
