import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ProcurementService } from '@/lib/services/procurement-service'

// Strict Zod validation schema conforming to API Bible contracts
const receiveGoodsSchema = z.object({
  purchaseOrderId: z.string().min(1, 'purchaseOrderId is required'),
  notes: z.string().optional(),
  targetLocation: z.string().min(2, 'targetLocation is required')
}).strict()

export async function POST(request: Request) {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const body = await request.json()
    const parsed = receiveGoodsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: 'ERR_VALIDATION_FAILED',
        message: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        statusCode: 400,
        timestamp: new Date().toISOString(),
        traceId
      }, { status: 400 })
    }

    const receipt = await ProcurementService.receiveGoods(parsed.data)

    return NextResponse.json({
      success: true,
      data: receipt,
      message: 'Goods received and multi-location inventory stock updated atomically.',
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 201 })
  } catch (error: any) {
    console.error(`[${traceId}] Receive Goods Error:`, error)
    const status = error.message?.includes('not found') ? 404 : 500
    return NextResponse.json({
      error: 'ERR_PROCUREMENT_RECEIPT',
      message: error.message || 'Internal Server Error during goods receipt processing',
      statusCode: status,
      timestamp: new Date().toISOString(),
      traceId
    }, { status })
  }
}
