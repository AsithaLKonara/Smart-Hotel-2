import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { isDatabaseConfigured } from '@/lib/db-helpers'

export async function GET(request: Request) {
  // Simple check for database configuration
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  // To secure this endpoint, you would normally check for a Vercel cron secret or a hardcoded token.
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 15 minutes ago
    const cutoff = new Date(Date.now() - 15 * 60 * 1000)

    // Find pending bookings older than cutoff
    const staleBookings = await prisma.booking.findMany({
      where: {
        paymentStatus: 'pending',
        createdAt: {
          lt: cutoff
        }
      },
      select: { id: true, folio: { select: { id: true } } }
    })

    if (staleBookings.length === 0) {
      return NextResponse.json({ message: 'No stale bookings found', count: 0 })
    }

    const bookingIds = staleBookings.map((b: any) => b.id)

    // Run release in a transaction
    await prisma.$transaction(async (tx: any) => {
      // 1. Cancel the bookings
      await tx.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { status: 'CANCELLED', paymentStatus: 'failed' }
      })

      // 2. Cancel Room Assignments (freeing inventory)
      await tx.roomAssignment.updateMany({
        where: { bookingId: { in: bookingIds } },
        data: { status: 'CANCELLED' }
      })

      // 3. Mark Folios as VOID
      const folioIds = staleBookings.filter((b: any) => b.folio).map((b: any) => b.folio?.id).filter(Boolean)
      if (folioIds.length > 0) {
        await tx.folio.updateMany({
          where: { id: { in: folioIds as string[] } },
          data: { status: 'VOID' }
        })
      }
      
      // 4. Update any associated pending payments
      await tx.payment.updateMany({
        where: { bookingId: { in: bookingIds }, status: 'pending' },
        data: { status: 'failed' }
      })
    })

    logger.info(`Released ${bookingIds.length} stale pending bookings`)
    return NextResponse.json({ message: 'Success', releasedCount: bookingIds.length })
  } catch (err: any) {
    logger.error('Error in release-pending cron job', err)
    return NextResponse.json({ error: err.message || 'Failed to release stale bookings' }, { status: 500 })
  }
}
