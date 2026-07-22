import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { computeDashboardAnalytics, userHasDashboardAccess } from '@/lib/analytics/dashboard'
import { enhancedRateLimit, createEnhancedRateLimitResponse } from '@/lib/rate-limit-enhanced'

export const dynamic = 'force-dynamic'

import { unstable_cache } from 'next/cache'

async function getCachedDashboardAnalytics(propertyId?: string | null) {
  const cacheKey = propertyId ? `admin-dashboard-analytics-${propertyId}` : 'admin-dashboard-analytics-global';
  const fetcher = unstable_cache(
    async () => await computeDashboardAnalytics(new Date(), propertyId),
    [cacheKey],
    { revalidate: 300, tags: ['dashboard'] }
  );
  return fetcher();
}

export async function GET(request: NextRequest) {
  try {
    const propertyId = request.nextUrl.searchParams.get('propertyId');
    const rateLimitResult = await enhancedRateLimit(request, 'api')
    if (!rateLimitResult.allowed) {
      return createEnhancedRateLimitResponse(rateLimitResult)
    }

    const session = await getServerSession(authOptions)

    if (!session || !userHasDashboardAccess(session.user?.roleName)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const analytics = await getCachedDashboardAnalytics(propertyId)
      return NextResponse.json(analytics)
    } catch (error: any) {
      console.error('Error computing dashboard analytics:', error)
      // Return a safe default structure instead of 500 error
      return NextResponse.json({
        summary: {
          totalBookings: 0,
          todayBookings: 0,
          monthlyBookings: 0,
          yearlyBookings: 0,
          totalRevenue: 0,
          todayRevenue: 0,
          monthlyRevenue: 0,
          yearlyRevenue: 0,
          occupancyRate: 0,
          avgBookingValue: 0,
          bookingGrowthRate: 0,
        },
        charts: {
          occupancy: [],
          roomStatus: [],
          revenue: {
            today: 0,
            month: 0,
            year: 0,
          },
        },
        recentActivity: {
          bookings: [],
          topRooms: [],
        },
        guestStats: {
          totalGuests: 0,
          totalStaff: 0,
          totalAdmins: 0,
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