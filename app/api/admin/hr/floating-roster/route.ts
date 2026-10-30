import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  assignFloatingShift,
  calculateCrossPropertyPayrollAllocation
} from '@/lib/hr/floating-roster'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access HR floating roster` },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    if (type === 'payroll-split') {
      const periodStart = searchParams.get('periodStart')
      const periodEnd = searchParams.get('periodEnd')
      const employeeId = searchParams.get('employeeId') || undefined

      if (!periodStart || !periodEnd) {
        return NextResponse.json(
          { error: 'periodStart and periodEnd are required for split-payroll calculation' },
          { status: 400 }
        )
      }

      const allocation = await calculateCrossPropertyPayrollAllocation({
        periodStart,
        periodEnd,
        employeeId
      })

      return NextResponse.json({
        success: true,
        period: { periodStart, periodEnd },
        allocation
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Floating roster operational'
    })
  } catch (error: any) {
    console.error('Error fetching floating roster data:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve roster data', details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot assign floating staff shifts` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      employeeId,
      targetPropertyId,
      startTime,
      endTime,
      role,
      hourlyRate,
      reliefReason
    } = body

    if (!employeeId || !targetPropertyId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'employeeId, targetPropertyId, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    const shift = await assignFloatingShift({
      employeeId,
      targetPropertyId,
      startTime,
      endTime,
      role,
      hourlyRate,
      reliefReason,
      actorUserId: session?.user?.id
    })

    return NextResponse.json({ success: true, shift })
  } catch (error: any) {
    console.error('Error assigning floating shift:', error)
    return NextResponse.json(
      { error: 'Failed to assign floating shift', details: error?.message },
      { status: 400 }
    )
  }
}
