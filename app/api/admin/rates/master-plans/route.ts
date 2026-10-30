import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createAndCascadeMasterRatePlan,
  listMasterRatePlans
} from '@/lib/revenue/master-rate-plans'

export async function GET() {
  try {
    const plans = await listMasterRatePlans()
    return NextResponse.json({
      success: true,
      masterRatePlans: plans,
      count: plans.length
    })
  } catch (error: any) {
    console.error('Error fetching master rate plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch master rate plans', details: error?.message },
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
        { error: 'Forbidden', message: `Role [${userRole}] cannot configure master rate plans` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      code,
      description,
      baseMultiplier,
      cancelPolicy,
      nonRefundable,
      isDefault,
      targetPropertyIds
    } = body

    if (!name || !code || baseMultiplier == null) {
      return NextResponse.json(
        { error: 'name, code, and baseMultiplier are required' },
        { status: 400 }
      )
    }

    const result = await createAndCascadeMasterRatePlan({
      name,
      code,
      description,
      baseMultiplier: Number(baseMultiplier),
      cancelPolicy: cancelPolicy || 'FLEXIBLE',
      nonRefundable: Boolean(nonRefundable),
      isDefault: Boolean(isDefault),
      targetPropertyIds
    })

    return NextResponse.json({
      success: true,
      masterRatePlan: result
    })
  } catch (error: any) {
    console.error('Error creating master rate plan:', error)
    return NextResponse.json(
      { error: 'Failed to cascade master rate plan', message: error?.message || 'Internal error' },
      { status: 400 }
    )
  }
}
