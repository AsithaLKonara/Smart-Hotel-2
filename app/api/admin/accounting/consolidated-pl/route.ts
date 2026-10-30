import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getConsolidatedGroupFinancials } from '@/lib/finance/hq-consolidation'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access consolidated group financials` },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('startDate') || '2026-01-01'
    const endDateParam = searchParams.get('endDate') || '2026-12-31'
    const hqCurrency = searchParams.get('hqCurrency') || 'USD'

    const startDate = new Date(startDateParam)
    const endDate = new Date(endDateParam)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
      return NextResponse.json(
        { error: 'Invalid startDate or endDate parameters' },
        { status: 400 }
      )
    }

    const report = await getConsolidatedGroupFinancials({
      startDate,
      endDate,
      hqCurrency
    })

    return NextResponse.json({
      success: true,
      report
    })
  } catch (error: any) {
    console.error('Error generating consolidated P&L:', error)
    return NextResponse.json(
      { error: 'Failed to generate consolidated financial report', details: error?.message },
      { status: 500 }
    )
  }
}
