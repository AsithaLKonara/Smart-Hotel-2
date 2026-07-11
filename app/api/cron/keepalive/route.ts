import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Keepalive endpoint to prevent MongoDB Atlas free tier from sleeping
 * Call this endpoint every 15 minutes via Vercel Cron
 */
export async function GET(request: Request) {
  // Verify it's from Vercel Cron (optional but recommended)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow direct access if CRON_SECRET is not set (for testing)
    const isFromVercelCron = request.headers.get('user-agent')?.includes('vercel-cron')
    if (!isFromVercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // Simple query to keep MongoDB Atlas connection alive
    // This prevents the free tier from sleeping after 30 minutes of inactivity
    const userCount = await prisma.user.count()
    
    // Periodically drain background queues
    const { ReconciliationWorker } = await import('@/lib/reconciliation-worker')
    await ReconciliationWorker.drainOutbox()
    await ReconciliationWorker.drainChatQueue()

    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      userCount,
      message: 'Database connection is active, queues drained'
    })
  } catch (error: any) {
    console.error('Keepalive error:', error)
    return NextResponse.json({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
