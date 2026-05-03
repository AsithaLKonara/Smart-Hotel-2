import { NextRequest, NextResponse } from 'next/server'
import { getPerformanceStats, getAllMetrics, trackMetric } from '@/lib/performance'

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

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
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics', metrics: [], count: 0 },
      { status: 200 } // Return 200 with empty data instead of 500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    if (!rawBody) {
      return NextResponse.json({ success: false, error: 'Empty body' }, { status: 200 })
    }
    
    const body = JSON.parse(rawBody)
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
    console.error('Error recording performance metric:', error)
    // Return success even on error to prevent frontend failures
    // Metrics are non-critical, so we don't want to break the app
    return NextResponse.json(
      { success: false, error: 'Failed to record metric' },
      { status: 200 } // Return 200 to prevent error page
    )
  }
}
