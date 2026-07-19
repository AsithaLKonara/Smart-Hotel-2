import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import FinancialEngine from '@/lib/financial-engine'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    // CFG-004: Fail-closed on missing secret — never use a fallback in production.
    // If CRON_SECRET is absent the server is misconfigured and should not proceed.
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error('[NIGHT_AUDIT] CRON_SECRET is not configured. Rejecting request.')
      return NextResponse.json({ error: 'Server Misconfiguration' }, { status: 500 })
    }

    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // A Night Audit Roll-forward typically involves:
    // 1. Posting room and tax charges for all IN-HOUSE guests
    // 2. Rolling the business date forward
    // 3. Changing "No Show" statuses for guests who didn't check in

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find all checked in stays
      const inHouseStays = await tx.stay.findMany({
        where: { status: 'CHECKED_IN' },
        include: { 
          booking: { include: { folios: true } },
          room: { include: { roomType: true } }
        }
      })

      let chargesPosted = 0
      for (const stay of inHouseStays) {
        const folioId = stay.booking.folios[0]?.id
        if (folioId) {
          // Post Room Charge (FinancialEngine automatically calculates and posts taxes and GL entries)
          await FinancialEngine.postCharge(
            folioId,
            `Room Charge - ${stay.room.number}`,
            stay.room.roomType.baseRate,
            'ROOM_CHARGE',
            tx
          )
          chargesPosted += 2
        }
      }

      // 2. Mark expected arrivals as NO_SHOW if past business date
      const noShows = await tx.booking.updateMany({
        where: {
          status: 'CONFIRMED',
          checkIn: { lt: today }
        },
        data: {
          status: 'NO_SHOW'
        }
      })

      const defaultProperty = await tx.property.findFirst();
      if (!defaultProperty) throw new Error('No property found');

      // 3. Ensure SYSTEM user exists for audit attribution
      let systemUser = await tx.user.findFirst({ where: { email: 'system@smarthotel.local' } });
      if (!systemUser) {
        systemUser = await tx.user.create({
          data: {
            email: 'system@smarthotel.local',
            name: 'SYSTEM',
            password: 'cron-automated-user',
            propertyId: defaultProperty.id
          }
        });
      }

      // 4. Log Night Audit
      const auditLog = await tx.nightAuditLog.create({
        data: {
          businessDate: today,
          status: 'COMPLETED',
          totalRevenue: inHouseStays.reduce((sum, stay) => sum + stay.room.roomType.baseRate, 0),
          roomsProcessed: inHouseStays.length,
          runByUserId: systemUser.id
        }
      })

      return auditLog
    })

    return NextResponse.json({
      success: true,
      message: 'Night Audit Roll-forward completed successfully.',
      auditId: result.id
    })

  } catch (error) {
    console.error('Night Audit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
