import { NextRequest, NextResponse } from 'next/server'
import { chaosState, toggleMemoryPressure } from '@/lib/chaos'

/**
 * GET /api/sre/chaos
 * Returns the current active chaos state configuration
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'success',
    chaosState,
  })
}

/**
 * POST /api/sre/chaos
 * Configures and toggles chaos and outage parameters dynamically
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (typeof body.dbOutage === 'boolean') {
      chaosState.dbOutage = body.dbOutage
      console.warn(`SRE Chaos: Database outage simulation set to: ${body.dbOutage}`)
    }

    if (typeof body.latency === 'number') {
      chaosState.latency = Math.max(0, body.latency)
      console.warn(`SRE Chaos: Latency delay injection set to: ${body.latency}ms`)
    }

    if (typeof body.stripeFailure === 'boolean') {
      chaosState.stripeFailure = body.stripeFailure
      console.warn(`SRE Chaos: Stripe API crash simulation set to: ${body.stripeFailure}`)
    }

    if (typeof body.memoryPressure === 'boolean') {
      chaosState.memoryPressure = body.memoryPressure
      toggleMemoryPressure(body.memoryPressure)
    }

    return NextResponse.json({
      status: 'success',
      message: 'Chaos SRE state updated successfully',
      chaosState,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Invalid payload', details: err.message },
      { status: 400 }
    )
  }
}
