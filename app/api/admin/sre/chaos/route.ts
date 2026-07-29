import { NextResponse } from 'next/server'
import { chaosState, toggleMemoryPressure } from '@/lib/chaos'
import { z } from 'zod'

const chaosSchema = z.object({
  dbOutage: z.boolean().optional(),
  latency: z.number().optional(),
  stripeFailure: z.boolean().optional(),
  memoryPressure: z.boolean().optional(),
  emailFailure: z.boolean().optional(),
  pusherFailure: z.boolean().optional(),
  otaFailure: z.boolean().optional(),
})

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_CHAOS_IN_PROD !== 'true') {
    return NextResponse.json({ error: 'Chaos Engineering is strictly disabled in Production.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = chaosSchema.parse(body)

    if (parsed.dbOutage !== undefined) chaosState.dbOutage = parsed.dbOutage
    if (parsed.latency !== undefined) chaosState.latency = parsed.latency
    if (parsed.stripeFailure !== undefined) chaosState.stripeFailure = parsed.stripeFailure
    if (parsed.emailFailure !== undefined) chaosState.emailFailure = parsed.emailFailure
    if (parsed.pusherFailure !== undefined) chaosState.pusherFailure = parsed.pusherFailure
    if (parsed.otaFailure !== undefined) chaosState.otaFailure = parsed.otaFailure

    if (parsed.memoryPressure !== undefined) {
      chaosState.memoryPressure = parsed.memoryPressure
      toggleMemoryPressure(parsed.memoryPressure)
    }

    return NextResponse.json({ success: true, state: chaosState })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ state: chaosState })
}
