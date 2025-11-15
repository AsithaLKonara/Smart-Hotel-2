import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { computeDashboardAnalytics, userHasDashboardAccess } from '@/lib/analytics/dashboard'
import { enhancedRateLimit, createEnhancedRateLimitResponse } from '@/lib/rate-limit-enhanced'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = enhancedRateLimit(request, 'api')
    if (!rateLimitResult.allowed) {
      return createEnhancedRateLimitResponse(rateLimitResult)
    }

    const session = await getServerSession(authOptions)

    if (!session || !userHasDashboardAccess(session.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const analytics = await computeDashboardAnalytics()
      return NextResponse.json(analytics)
    } catch (error: any) {
      console.error('Error computing dashboard analytics:', error)
      // Return a safe default structure instead of 500 error
      return NextResponse.json({
        summary: {
          occupancyRate: 0,
          averageOccupancyRate: 0,
          bookingGrowthRate: 0,
          todayRevenue: 0,
          monthlyRevenue: 0,
          revenueGrowthRate: 0,
          todayBookings: 0,
          monthlyBookings: 0,
          restaurantOrdersToday: 0,
          restaurantRevenueToday: 0,
          restaurantRevenueMonth: 0,
          averageOrderValueToday: 0,
          taskStats: {
            total: 0,
            completed: 0,
            pending: 0,
            overdue: 0,
            completionRate: 0,
          },
          guestSatisfaction: {
            rating: 0,
            reviews: 0,
          },
        },
        recentActivity: {
          bookings: [],
          orders: [],
          tasks: [],
        },
      })
    }
  } catch (error: any) {
    console.error('Error in dashboard API route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    )
  }
}