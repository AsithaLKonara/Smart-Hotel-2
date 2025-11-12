import { NextRequest, NextResponse } from 'next/server'
import { getPerformanceStats, getAllMetrics, trackMetric } from '@/lib/performance'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric')
    const since = searchParams.get('since')
      ? parseInt(searchParams.get('since')!)
      : undefined

    if (metric) {
      const stats = getPerformanceStats(metric, since)
      return NextResponse.json({
        metric,
        stats,
        timestamp: new Date().toISOString(),
      })
    }

    const metrics = getAllMetrics(since ? { since } : undefined)
    return NextResponse.json({
      metrics,
      count: metrics.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, value, unit = 'ms', tags } = body

    if (!name || typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      )
    }

    trackMetric(name, value, unit, tags)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    )
  }
}
