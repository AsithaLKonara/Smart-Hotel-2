import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { auditRateParity, enforceRateParity } from '@/lib/revenue/rate-parity-audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access rate parity audit` },
        { status: 403 }
      )
    }

    const clusterCity = request.nextUrl.searchParams.get('clusterCity') || undefined
    const report = await auditRateParity({ clusterCity })

    return NextResponse.json({
      success: true,
      report
    })
  } catch (error: any) {
    console.error('Error in rate parity audit GET:', error)
    return NextResponse.json(
      { error: 'Failed to conduct rate parity audit', details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot enforce rate parity` },
        { status: 403 }
      )
    }

    const result = await enforceRateParity()
    const updatedReport = await auditRateParity()

    return NextResponse.json({
      success: true,
      enforcement: result,
      newParityReport: updatedReport
    })
  } catch (error: any) {
    console.error('Error in rate parity enforce POST:', error)
    return NextResponse.json(
      { error: 'Failed to enforce rate parity', message: error?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
