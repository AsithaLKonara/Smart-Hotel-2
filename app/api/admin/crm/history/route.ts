import { NextResponse } from 'next/server'
import { z } from 'zod'
import { GuestExperienceService } from '@/lib/services/guest-experience-service'

const guestHistorySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  staysDelta: z.number().int().optional(),
  nightsDelta: z.number().int().optional(),
  spendDelta: z.number().optional(),
  lastRoomTypeId: z.string().optional()
}).strict()

export async function POST(request: Request) {
  const traceId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`
  try {
    const body = await request.json()
    const parsed = guestHistorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        error: 'ERR_VALIDATION_FAILED',
        message: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        statusCode: 400,
        timestamp: new Date().toISOString(),
        traceId
      }, { status: 400 })
    }

    const history = await GuestExperienceService.updateGuestHistory(parsed.data)

    return NextResponse.json({
      success: true,
      data: history,
      message: 'Guest historical stays, spend metrics, and loyalty totals updated.',
      timestamp: new Date().toISOString(),
      traceId
    }, { status: 200 })
  } catch (error: any) {
    console.error(`[${traceId}] Update Guest History Error:`, error)
    const status = error.message?.includes('not found') ? 404 : 500
    return NextResponse.json({
      error: 'ERR_CRM_HISTORY_UPDATE',
      message: error.message || 'Internal Server Error while updating guest history',
      statusCode: status,
      timestamp: new Date().toISOString(),
      traceId
    }, { status })
  }
}
