import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRevenueMetrics } from '@/lib/analytics/metrics/revenue'
import { getOperationsMetrics } from '@/lib/analytics/metrics/operations'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['MANAGER', 'SUPER_ADMIN'].includes(session.user?.roleName || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId') || undefined
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    const params = { propertyId, startDate, endDate }

    // Fetch unified canonical metrics
    const [revenueData, operationsData, loyaltyTotal, loyaltyPlatinum] = await Promise.all([
      getRevenueMetrics(params),
      getOperationsMetrics(params),
      prisma.loyaltyPoint.count(),
      prisma.loyaltyPoint.count({ where: { tier: 'PLATINUM' } })
    ])

    // Construct response
    const payload = {
      revenue: {
        totalRevenue: revenueData.totalRevenue,
        mix: revenueData.breakdown
      },
      operations: {
        occupancy: operationsData.occupancyRate,
        adr: operationsData.adr,
        revpar: operationsData.revpar,
        goppar: operationsData.goppar,
        activeStaff: operationsData.activeStaff,
        openTickets: operationsData.openTickets,
      },
      loyalty: {
        totalMembers: loyaltyTotal,
        platinumCount: loyaltyPlatinum,
        pointsLiabilityValue: loyaltyTotal * 15, // Approximation
      }
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Failed to aggregate BI data:', error)
    return NextResponse.json({ error: 'Failed to aggregate BI data' }, { status: 500 })
  }
}
