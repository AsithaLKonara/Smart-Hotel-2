import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Secure the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-key'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Find VIP bookings arriving today
    const vipBookings = await prisma.booking.findMany({
      where: {
        checkIn: {
          gte: today,
          lt: tomorrow
        },
        guest: {
          vipStatus: { not: 'STANDARD' }
        }
      },
      include: {
        guest: true,
        roomAssignments: {
          include: { room: true }
        }
      }
    })

    if (vipBookings.length > 0) {
      // In production, send a push notification/WebSocket event to the Front Desk dashboard
      // and an email to the General Manager.
      
      await prisma.auditLog.create({
        data: {
          action: 'VIP_ARRIVAL_ALERTS_GENERATED',
          resource: 'SYSTEM',
          actor: 'CRON_JOB',
          details: {
            vipCount: vipBookings.length,
            guests: vipBookings.map(b => b.guest.name)
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Checked for VIP arrivals. Found ${vipBookings.length}.`
    })

  } catch (error) {
    console.error('VIP Arrival alerts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
