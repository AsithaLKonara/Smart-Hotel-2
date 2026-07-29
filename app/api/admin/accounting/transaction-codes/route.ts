import { NextResponse } from 'next/server'
import { AccountingGovernanceService } from '@/lib/services/accounting-service'

export async function GET() {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const codes = await AccountingGovernanceService.listTransactionCodes()
    return NextResponse.json({
      success: true,
      data: codes,
      count: codes.length,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 200 })
  } catch (error: any) {
    console.error(`[${traceId}] List Transaction Codes Error:`, error)
    return NextResponse.json({
      error: 'ERR_ACCOUNTING_FETCH',
      message: error.message || 'Failed to retrieve USALI transaction codes',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 500 })
  }
}

export async function POST() {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const seeded = await AccountingGovernanceService.seedTransactionCodes()
    return NextResponse.json({
      success: true,
      data: seeded,
      count: seeded.length,
      message: 'Successfully seeded master USALI transaction billing codes into database.',
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 200 })
  } catch (error: any) {
    console.error(`[${traceId}] Seed Transaction Codes Error:`, error)
    return NextResponse.json({
      error: 'ERR_ACCOUNTING_SEED',
      message: error.message || 'Failed to seed USALI transaction codes',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 500 })
  }
}
