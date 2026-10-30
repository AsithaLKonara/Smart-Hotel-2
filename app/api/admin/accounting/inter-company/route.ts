import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  recordInterCompanyCrossCharge,
  getInterCompanyStatement,
  settleInterCompanyBalance
} from '@/lib/finance/inter-company-clearing'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot access inter-company statements` },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    let propertyAId = searchParams.get('propertyAId')
    let propertyBId = searchParams.get('propertyBId')

    // If not supplied, pick first two active properties
    if (!propertyAId || !propertyBId) {
      const activeProps = await prisma.property.findMany({
        where: { status: 'ACTIVE' },
        take: 2,
        select: { id: true }
      })
      if (activeProps.length < 2) {
        return NextResponse.json(
          { error: 'At least two active properties are required for inter-company accounting' },
          { status: 400 }
        )
      }
      propertyAId = activeProps[0].id
      propertyBId = activeProps[1].id
    }

    const statement = await getInterCompanyStatement(propertyAId, propertyBId)

    return NextResponse.json({
      success: true,
      statement
    })
  } catch (error: any) {
    console.error('Error in inter-company statement GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inter-company statement', details: error?.message },
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
        { error: 'Forbidden', message: `Role [${userRole}] cannot post inter-company transactions` },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Handle settlement action
    if (body.action === 'SETTLE') {
      const { payingPropertyId, receivingPropertyId, settleAmount, settlementReference } = body
      if (!payingPropertyId || !receivingPropertyId || !settleAmount) {
        return NextResponse.json(
          { error: 'payingPropertyId, receivingPropertyId, and settleAmount are required' },
          { status: 400 }
        )
      }

      const settlement = await settleInterCompanyBalance({
        payingPropertyId,
        receivingPropertyId,
        settleAmount: Number(settleAmount),
        settlementReference
      })

      return NextResponse.json({
        success: true,
        settlement
      })
    }

    // Handle cross-charge posting
    const {
      debtorPropertyId,
      creditorPropertyId,
      amount,
      category,
      referenceId,
      description,
      postingDate
    } = body

    if (!debtorPropertyId || !creditorPropertyId || !amount || !category) {
      return NextResponse.json(
        { error: 'debtorPropertyId, creditorPropertyId, amount, and category are required' },
        { status: 400 }
      )
    }

    const result = await recordInterCompanyCrossCharge({
      debtorPropertyId,
      creditorPropertyId,
      amount: Number(amount),
      category,
      referenceId: referenceId || 'N/A',
      description: description || `Inter-company ${category} cross-charge`,
      postingDate: postingDate ? new Date(postingDate) : new Date()
    })

    return NextResponse.json({
      success: true,
      transaction: result
    })
  } catch (error: any) {
    console.error('Error in inter-company charge POST:', error)
    return NextResponse.json(
      { error: 'Failed to record inter-company transaction', message: error?.message || 'Internal error' },
      { status: 400 }
    )
  }
}
