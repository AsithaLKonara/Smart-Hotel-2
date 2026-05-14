import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Redis } from '@upstash/redis'
import { getRequestSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session || !['SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const redis = Redis.fromEnv()
    
    // 1. Measure Redis Latency
    const start = Date.now()
    await redis.ping()
    const redisLatency = Date.now() - start

    // 2. Outbox & Sync Health
    const pendingOutbox = await prisma.outbox.count({ where: { status: 'PENDING' } })
    const failedSyncs = await prisma.syncLog.count({ 
      where: { 
        status: 'FAILED',
        createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } 
      } 
    })

    // 3. Operational Lineage (Last 5 critical events)
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

    // 4. Parity Scoring (Mocked logic for demo dashboard)
    const otaParity = failedSyncs > 5 ? 88 : 99.8

    return NextResponse.json({
      redis: {
        latency: redisLatency,
        status: redisLatency < 50 ? 'HEALTHY' : 'DEGRADED'
      },
      ota: {
        parity: otaParity,
        status: otaParity > 95 ? 'HEALTHY' : 'DEGRADED'
      },
      outbox: {
        pending: pendingOutbox,
        status: pendingOutbox < 50 ? 'HEALTHY' : 'WARNING'
      },
      locks: {
        count: 0, // Would fetch from Redis SCAN in production
        status: 'HEALTHY'
      },
      lineage: lineage.map(l => ({
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
