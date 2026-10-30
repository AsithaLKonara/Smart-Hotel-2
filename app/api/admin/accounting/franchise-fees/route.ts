import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  calculateChainFranchiseFees,
  assessAndPostFranchiseFees
} from '@/lib/finance/franchise-fees'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access franchise fee assessments` },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const billingMonth = searchParams.get('billingMonth') || new Date().toISOString().slice(0, 7)
    const royaltyPercentage = searchParams.get('royaltyPercentage')
      ? parseFloat(searchParams.get('royaltyPercentage')!)
      : undefined
    const marketingPercentage = searchParams.get('marketingPercentage')
      ? parseFloat(searchParams.get('marketingPercentage')!)
      : undefined
    const techFee = searchParams.get('techFee')
      ? parseFloat(searchParams.get('techFee')!)
      : undefined

    const report = await calculateChainFranchiseFees(billingMonth, {
      royaltyPercentage,
      marketingPercentage,
      techFeePerOccupiedNight: techFee
    })

    return NextResponse.json({
      success: true,
      report
    })
  } catch (error: any) {
    console.error('Error calculating franchise fees:', error)
    return NextResponse.json(
      { error: 'Failed to calculate franchise fees', details: error?.message },
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
        { error: 'Forbidden', message: `Role [${userRole}] cannot assess franchise fees` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { billingMonth, propertyId, customSchedule } = body

    if (!billingMonth || !propertyId) {
      return NextResponse.json(
        { error: 'billingMonth and propertyId are required' },
        { status: 400 }
      )
    }

    const result = await assessAndPostFranchiseFees({
      billingMonth,
      propertyId,
      customSchedule,
      actorUserId: session?.user?.id
    })

    return NextResponse.json({
      success: true,
      assessment: result
    })
  } catch (error: any) {
    console.error('Error in franchise fees assessment POST:', error)
    return NextResponse.json(
      { error: 'Failed to commit franchise fee assessment', message: error?.message || 'Internal error' },
      { status: 400 }
    )
  }
}
