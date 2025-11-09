import { NextRequest, NextResponse } from 'next/server'
import { getRequestSession } from '@/lib/session'
import { computeDashboardAnalytics, userHasDashboardAccess } from '@/lib/analytics/dashboard'
import { enhancedRateLimit, createEnhancedRateLimitResponse } from '@/lib/rate-limit-enhanced'

export async function GET(request: NextRequest) {
  const rateLimitResult = enhancedRateLimit(request, 'api')
  if (!rateLimitResult.allowed) {
    return createEnhancedRateLimitResponse(rateLimitResult)
  }

  const session = await getRequestSession(request)

  if (!session || !userHasDashboardAccess(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const analytics = await computeDashboardAnalytics()
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}