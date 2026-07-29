import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const maxDuration = 300; // Force Vercel to allow 5 minutes execution

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    // CFG-004: Fail-closed on missing secret.
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error('[ARCHIVE_DB] CRON_SECRET is not configured. Rejecting request.')
      return NextResponse.json({ error: 'Server Misconfiguration' }, { status: 500 })
    }

    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Enterprise Data Archiving Policy:
    // Archive (soft delete) bookings and folios for stays that were checked out more than 2 years ago
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    // Find bookings eligible for archiving
    const eligibleBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'] },
        checkOut: { lt: twoYearsAgo },
        deletedAt: null // Not already archived
      },
      select: { id: true }
    })

    const bookingIds = eligibleBookings.map(b => b.id)

    if (bookingIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No records eligible for archiving today.'
      })
    }

    // Execute bulk archiving transaction
    await prisma.$transaction([
      prisma.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { deletedAt: new Date() }
      }),
      prisma.folio.updateMany({
        where: { bookingId: { in: bookingIds } },
        data: { deletedAt: new Date() }
      }),
      prisma.task.updateMany({
        where: { bookingId: { in: bookingIds } },
        data: { deletedAt: new Date() }
      })
    ])

    await prisma.auditLog.create({
      data: {
        action: 'DB_ARCHIVE',
        resource: 'SYSTEM',
        actor: 'CRON_JOB',
        details: {
          archivedBookingsCount: bookingIds.length,
          cutoffDate: twoYearsAgo.toISOString()
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully archived ${bookingIds.length} historical bookings and associated data.`
    })

  } catch (error) {
    console.error('DB Archiving error:', error)
    return NextResponse.json({ error: 'Internal server error during archiving' }, { status: 500 })
  }
}
