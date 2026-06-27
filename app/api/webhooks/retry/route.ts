import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-key'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In a real system, there would be a WebhookDelivery table representing the DLQ
    // Mocking finding failed deliveries from the AuditLog for this demo
    
    const failedWebhooks = await prisma.auditLog.findMany({
      where: {
        action: 'WEBHOOK_DELIVERY_FAILED',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // last 24h
      },
      take: 100
    })

    let retried = 0
    for (const log of failedWebhooks) {
      // Mock retry logic
      const details = log.details as any
      if (details && details.endpoint) {
        // e.g. await fetch(details.endpoint, { method: 'POST', body: JSON.stringify(details.payload) })
        retried++
      }
    }

    if (retried > 0) {
      await prisma.auditLog.create({
        data: {
          action: 'WEBHOOK_DLQ_PROCESSED',
          resource: 'SYSTEM',
          actor: 'CRON_JOB',
          details: { retriedCount: retried }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${retried} failed webhooks from the dead letter queue.`
    })
  } catch (error) {
    console.error('Webhook retry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
