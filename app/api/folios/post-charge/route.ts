import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { postCharge, ChargePayload } from '@/lib/accounting'
import { z } from 'zod'
import { getRequestSession } from '@/lib/session'
import { realtime } from '@/lib/realtime'

const chargeSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number(),
  category: z.string(),
  description: z.string(),
  transactionCodeId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getRequestSession(request)
    if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const data = chargeSchema.parse(body)

    const result = await prisma.$transaction(async (tx: any) => {
      return await postCharge(data, tx)
    }, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 30000 })

    try {
      await realtime.trigger('admin', 'folio.charge_posted', {
        bookingId: data.bookingId,
        amount: data.amount,
        category: data.category
      })
    } catch (e) {
      console.error('Pusher error:', e)
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error posting charge:', error)
    return NextResponse.json({ error: error.message || 'Failed to post charge' }, { status: 500 })
  }
}
