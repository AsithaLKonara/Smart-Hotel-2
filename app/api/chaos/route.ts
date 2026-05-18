import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getChaosScenarios, saveChaosScenarios } from '@/qa/chaos/chaos-engine'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const scenarios = getChaosScenarios()
  return NextResponse.json({ scenarios })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin context missing.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { scenarios } = body

    if (!Array.isArray(scenarios)) {
      return NextResponse.json({ error: 'Bad Request: Scenarios property must be an array.' }, { status: 400 })
    }

    saveChaosScenarios(scenarios)

    // Write audit log entry
    await fetch(`${request.nextUrl.origin}/api/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        action: 'CHAOS_SCENARIOS_UPDATE',
        details: { modifiedBy: session.user?.email, activeStates: scenarios.map(s => ({ id: s.id, active: s.active, intensity: s.intensity })) }
      })
    }).catch(() => {})

    return NextResponse.json({ success: true, scenarios })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 })
  }
}
