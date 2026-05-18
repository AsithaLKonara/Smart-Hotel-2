import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { computeAnalytics, normalizeAnalyticsRange } from '@/lib/analytics/core'
import { enhancedRateLimit, createEnhancedRateLimitResponse } from '@/lib/rate-limit-enhanced'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await enhancedRateLimit(request, 'api')
    if (!rateLimitResult.allowed) {
      return createEnhancedRateLimitResponse(rateLimitResult)
    }

    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = normalizeAnalyticsRange(searchParams.get('range'))

    const analyticsData = await computeAnalytics(range)
    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
} 

// buildAnalytics moved to lib/analytics/core.ts to avoid Next.js route export restrictions 