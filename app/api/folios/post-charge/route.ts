import { NextRequest, NextResponse } from 'next/server'
import { postCharge, ChargePayload } from '@/lib/accounting'
import { z } from 'zod'

const chargeSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number(),
  category: z.string(),
  description: z.string(),
  transactionCodeId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = chargeSchema.parse(body)

    const result = await postCharge(data)

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error posting charge:', error)
    return NextResponse.json({ error: error.message || 'Failed to post charge' }, { status: 500 })
  }
}
