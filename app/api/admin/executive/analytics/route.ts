import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsEngine } from '@/lib/analytics'
import { getRequestSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '30'
  const days = parseInt(range)
  
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)

  try {
    const [adr, revpar, occupancy, sla, pacing] = await Promise.all([
      AnalyticsEngine.getADR(startDate, endDate),
      AnalyticsEngine.getRevPAR(startDate, endDate),
      AnalyticsEngine.getOccupancyRate(startDate, endDate),
      AnalyticsEngine.getHousekeepingSLA(),
      AnalyticsEngine.getRevenuePacing(days)
    ])

    return NextResponse.json({
      adr,
      revpar,
      occupancy,
      sla,
      pacing,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('[ANALYTICS_API_ERROR]', err)
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 })
  }
}
