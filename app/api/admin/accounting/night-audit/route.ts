import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { postCharge } from '@/lib/accounting'
import { differenceInDays, addDays, startOfDay } from 'date-fns'
import { getRequestSession } from '@/lib/session'
import { realtime } from '@/lib/realtime'

export async function GET(req: NextRequest) {
  try {
    const session = await getRequestSession(req)
    if (!session || !['MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const logs = await prisma.nightAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const property = await prisma.property.findFirst()
    const businessDate = property?.businessDate || startOfDay(new Date())

    return NextResponse.json({
      success: true,
      businessDate: businessDate.toISOString().split('T')[0],
      logs
    })
  } catch (error: any) {
    console.error('Fetch Night Audit Logs Error:', error)
    return NextResponse.json({ error: 'Failed to fetch night audit logs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req)
    if (!session || !['MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auditResult = await prisma.$transaction(async (tx: any) => {
      let property = await tx.property.findFirst()
      
      if (!property) {
        property = await tx.property.create({
          data: {
            name: 'SmartHotel Grand',
            code: 'SH-GRAND',
            address: '123 Main St',
            city: 'Metropolis',
            country: 'USA',
            businessDate: startOfDay(new Date())
          }
        })
      }

      const businessDate = property.businessDate

      // 1. Process No-Shows (Bookings that were supposed to arrive today or earlier but are still CONFIRMED)
      const noShows = await tx.booking.findMany({
        where: {
          status: 'CONFIRMED',
          checkIn: { lte: businessDate }
        }
      })

      let noShowCount = 0
      for (const noShow of noShows) {
        await tx.booking.update({
          where: { id: noShow.id },
          data: { status: 'CANCELLED' }
        })
        noShowCount++
      }

      // 2. Post Room & Tax for all In-House Guests
      const inHouseBookings = await tx.booking.findMany({
        where: {
          status: 'CHECKED_IN'
        }
      })

      let roomsProcessed = 0
      let totalRevenuePosted = 0

      for (const booking of inHouseBookings) {
        const total = Number(booking.totalAmount || 0)
        const duration = Math.max(1, differenceInDays(new Date(booking.checkOut), new Date(booking.checkIn)))
        const nightlyRate = duration > 0 ? total / duration : total
        
        await postCharge({
          bookingId: booking.id,
          amount: nightlyRate,
          category: 'ROOM_RATE',
          description: `Room Charge - ${businessDate.toISOString().split('T')[0]}`
        }, tx)
        
        roomsProcessed++
        totalRevenuePosted += nightlyRate
      }

      // 3. Advance the Business Date
      const nextBusinessDate = addDays(businessDate, 1)
      await tx.property.update({
        where: { id: property.id },
        data: { businessDate: nextBusinessDate }
      })

      // 4. Log the Audit
      const auditLog = await tx.nightAuditLog.create({
        data: {
          businessDate: businessDate,
          totalRevenue: totalRevenuePosted,
          roomsProcessed: roomsProcessed,
          status: 'COMPLETED'
        }
      })

      return {
        success: true,
        auditLog,
        summary: {
          previousDate: businessDate.toISOString().split('T')[0],
          newDate: nextBusinessDate.toISOString().split('T')[0],
          roomsProcessed,
          totalRevenuePosted,
          noShowsProcessed: noShowCount
        }
      }
    })

    try {
      await realtime.trigger('admin', 'night_audit.completed', {
        businessDate: auditResult.summary?.previousDate,
        newDate: auditResult.summary?.newDate,
        revenue: auditResult.summary?.totalRevenuePosted
      })
    } catch (e) {
      console.error('Pusher error:', e)
    }

    return NextResponse.json(auditResult)

  } catch (error: any) {
    console.error('Night Audit Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to run Night Audit' }, { status: 500 })
  }
}
