import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const prisma = new PrismaClient()

const CommissionSettleSchema = z.object({
  travelAgentId: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = CommissionSettleSchema.parse(body)

    const startDate = new Date(validated.year, validated.month - 1, 1)
    const endDate = new Date(validated.year, validated.month, 0) // last day of the month

    // Find all checked-out bookings for this travel agent in the given month
    const bookings = await prisma.booking.findMany({
      where: {
        guest: {
          travelAgentId: validated.travelAgentId
        },
        status: 'CHECKED_OUT',
        checkOut: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        folios: {
          include: { lineItems: true }
        }
      }
    })

    if (bookings.length === 0) {
      return NextResponse.json({ success: true, message: 'No commissionable bookings found for this period.', totalCommission: 0 })
    }

    const agent = await prisma.travelAgent.findUnique({
      where: { id: validated.travelAgentId }
    })

    if (!agent) {
      return NextResponse.json({ error: 'Travel agent not found' }, { status: 404 })
    }

    const commissionRate = agent.commissionRate / 100
    let totalRoomRevenue = 0

    bookings.forEach(booking => {
      booking.folios.forEach(folio => {
        folio.lineItems.forEach(item => {
          if (item.category === 'ROOM_CHARGE') {
            totalRoomRevenue += Number(item.amount)
          }
        })
      })
    })

    const totalCommission = totalRoomRevenue * commissionRate

    if (totalCommission > 0) {
      await prisma.auditLog.create({
        data: {
          action: 'TRAVEL_AGENT_COMMISSION_SETTLED',
          resource: 'SYSTEM',
          actor: 'ACCOUNTING_CRON',
          details: {
            travelAgentId: validated.travelAgentId,
            period: `${validated.month}/${validated.year}`,
            bookingsCount: bookings.length,
            totalRoomRevenue,
            commissionRate,
            totalCommission
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Commission settlement calculated.',
      data: {
        bookingsCount: bookings.length,
        totalRoomRevenue,
        commissionRate,
        totalCommission
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Commission settle error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
