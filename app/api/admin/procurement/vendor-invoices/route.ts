import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ProcurementService } from '@/lib/services/procurement-service'

const vendorInvoiceSchema = z.object({
  purchaseOrderId: z.string().min(1, 'purchaseOrderId is required'),
  invoiceNumber: z.string().min(2, 'invoiceNumber is required'),
  amount: z.number().positive('amount must be positive'),
  receivedDate: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined)
}).strict()

export async function POST(request: Request) {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const body = await request.json()
    const parsed = vendorInvoiceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: 'ERR_VALIDATION_FAILED',
        message: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        statusCode: 400,
        timestamp: new Date().toISOString(),
        traceId
      }, { status: 400 })
    }

    const result = await ProcurementService.registerVendorInvoice(parsed.data)

    return NextResponse.json({
      success: true,
      data: result.invoice,
      audit: result.audit,
      message: `Vendor invoice registered. Three-way match status: ${result.audit.threeWayMatchStatus}`,
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 201 })
  } catch (error: any) {
    console.error(`[${traceId}] Vendor Invoice Error:`, error)
    const status = error.message?.includes('not found') ? 404 : 500
    return NextResponse.json({
      error: 'ERR_PROCUREMENT_INVOICE',
      message: error.message || 'Internal Server Error during vendor invoice processing',
      statusCode: status,
      timestamp: new Date().toISOString(),
      traceId
    }, { status })
  }
}
