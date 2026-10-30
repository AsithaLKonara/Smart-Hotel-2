import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getFxRates, updateFxRate } from '@/lib/finance/hq-consolidation'

export async function GET() {
  try {
    const rates = getFxRates()
    return NextResponse.json({
      success: true,
      baseCurrency: 'USD',
      fxRates: rates
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot update FX rates` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { currency, rateToUsd } = body

    if (!currency || rateToUsd == null) {
      return NextResponse.json(
        { error: 'currency and rateToUsd are required' },
        { status: 400 }
      )
    }

    const updated = updateFxRate(currency, rateToUsd)

    return NextResponse.json({
      success: true,
      updatedRate: updated,
      allRates: getFxRates()
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 400 })
  }
}
