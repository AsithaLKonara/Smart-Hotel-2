import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Redis } from '@upstash/redis'
import { getRequestSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session || !['SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const routeStart = Date.now()
    const redis = Redis.fromEnv()
    
    // 1. Measure Redis Latency
    const redisStart = Date.now()
    await redis.ping()
    const redisLatency = Date.now() - redisStart

    // 2. Measure DB Response Time
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart

    // 3. Queue Latency (Outbox age)
    const pendingOutbox = await prisma.outbox.count({ where: { status: 'PENDING' } })
    const oldestOutbox = await prisma.outbox.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' }
    })
    
    let queueLatencyMs = 0
    if (oldestOutbox) {
      queueLatencyMs = Date.now() - oldestOutbox.createdAt.getTime()
    }

    // 4. Error Rate (Last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const totalLogsHour = await prisma.auditLog.count({
      where: { createdAt: { gte: oneHourAgo } }
    })
    const errorLogsHour = await prisma.auditLog.count({
      where: { 
        createdAt: { gte: oneHourAgo },
        action: { contains: 'ERROR' }
      }
    })
    const errorRate = totalLogsHour > 0 ? (errorLogsHour / totalLogsHour) * 100 : 0

    // 5. Operational Lineage (Last 5 critical events)
    const lineage = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        action: true,
        resource: true,
        createdAt: true,
        details: true
      }
    })

    const apiLatency = Date.now() - routeStart

    return NextResponse.json({
      database: {
        latency: dbLatency,
        status: dbLatency < 100 ? 'HEALTHY' : 'DEGRADED'
      },
      redis: {
        latency: redisLatency,
        status: redisLatency < 50 ? 'HEALTHY' : 'DEGRADED'
      },
      api: {
        latency: apiLatency,
        status: apiLatency < 200 ? 'HEALTHY' : 'DEGRADED'
      },
      errors: {
        rate: Number(errorRate.toFixed(2)),
        status: errorRate < 5 ? 'HEALTHY' : 'WARNING'
      },
      queue: {
        pending: pendingOutbox,
        latencySeconds: Number((queueLatencyMs / 1000).toFixed(1)),
        status: queueLatencyMs < 60000 ? 'HEALTHY' : 'WARNING'
      },
      lineage: lineage.map((l: any) => ({
        type: l.action,
        message: `${l.action} on ${l.resource}`,
        time: l.createdAt.toLocaleTimeString(),
        severity: l.action.includes('ERROR') || l.action.includes('FAILED') ? 'ERROR' : 'INFO'
      }))
    })

  } catch (error) {
    console.error('[SRE_HEALTH_ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch health metrics' }, { status: 500 })
  }
}
