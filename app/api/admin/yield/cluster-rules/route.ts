import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createClusterYieldRule,
  listClusterYieldRules,
  evaluateClusterYield
} from '@/lib/revenue/cluster-yield'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const evaluationDate = searchParams.get('evaluationDate')
    const clusterCity = searchParams.get('clusterCity') || undefined

    if (evaluationDate) {
      const date = new Date(evaluationDate)
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid evaluationDate format' }, { status: 400 })
      }
      const evaluation = await evaluateClusterYield({
        clusterCity,
        evaluationDate: date
      })
      return NextResponse.json({ success: true, evaluation })
    }

    const rules = await listClusterYieldRules()
    return NextResponse.json({ success: true, clusterYieldRules: rules, count: rules.length })
  } catch (error: any) {
    console.error('Error in cluster yield rules GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cluster yield rules', details: error?.message },
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
        { error: 'Forbidden', message: `Role [${userRole}] cannot configure cluster yield rules` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      clusterCity,
      propertyIds,
      startDate,
      endDate,
      minOccupancy,
      maxOccupancy,
      adjustmentType,
      adjustmentValue,
      description
    } = body

    if (!name || adjustmentValue == null || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'name, adjustmentValue, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { error: 'Invalid startDate or endDate' },
        { status: 400 }
      )
    }

    const result = await createClusterYieldRule({
      name,
      clusterCity,
      propertyIds,
      startDate: start,
      endDate: end,
      minOccupancy: minOccupancy != null ? Number(minOccupancy) : undefined,
      maxOccupancy: maxOccupancy != null ? Number(maxOccupancy) : undefined,
      adjustmentType: adjustmentType || 'PERCENTAGE',
      adjustmentValue: Number(adjustmentValue),
      description
    })

    return NextResponse.json({
      success: true,
      clusterYieldRule: result
    })
  } catch (error: any) {
    console.error('Error creating cluster yield rule:', error)
    return NextResponse.json(
      { error: 'Failed to create cluster yield rule', message: error?.message || 'Internal error' },
      { status: 400 }
    )
  }
}
