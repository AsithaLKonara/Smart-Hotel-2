import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const prisma = new PrismaClient()

const CorporateSettleSchema = z.object({
  corporateAccountId: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = CorporateSettleSchema.parse(body)

    const startDate = new Date(validated.year, validated.month - 1, 1)
    const endDate = new Date(validated.year, validated.month, 0) // last day of the month
    endDate.setHours(23, 59, 59, 999)

    // Find all checked-out bookings for employees of this corporate account in the given month
    const bookings = await prisma.booking.findMany({
      where: {
        guest: {
          corporateAccountId: validated.corporateAccountId
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
      return NextResponse.json({ success: true, message: 'No billable bookings found for this period.', totalBilled: 0 })
    }

    const account = await prisma.corporateAccount.findUnique({
      where: { id: validated.corporateAccountId }
    })

    if (!account) {
      return NextResponse.json({ error: 'Corporate account not found' }, { status: 404 })
    }

    let totalRoomRevenue = 0
    let totalOtherRevenue = 0

    bookings.forEach(booking => {
      booking.folios.forEach(folio => {
        folio.lineItems.forEach(item => {
          if (item.category === 'ROOM_CHARGE') {
            totalRoomRevenue += Number(item.amount)
          } else {
            totalOtherRevenue += Number(item.amount)
          }
        })
      })
    })

    // If there is a negotiated rate, typically it's a discount on room revenue
    const discountRate = account.negotiatedRate ? account.negotiatedRate.toNumber() / 100 : 0
    const roomDiscount = totalRoomRevenue * discountRate
    const discountedRoomRevenue = totalRoomRevenue - roomDiscount
    const totalBilled = discountedRoomRevenue + totalOtherRevenue

    if (totalBilled > 0) {
      await prisma.auditLog.create({
        data: {
          action: 'CORPORATE_ACCOUNT_BILLED',
          resource: 'SYSTEM',
          actor: 'ACCOUNTING_CRON',
          details: {
            corporateAccountId: validated.corporateAccountId,
            period: `${validated.month}/${validated.year}`,
            bookingsCount: bookings.length,
            totalRoomRevenue,
            totalOtherRevenue,
            roomDiscount,
            totalBilled
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Corporate billing calculated.',
      data: {
        bookingsCount: bookings.length,
        totalRoomRevenue,
        totalOtherRevenue,
        roomDiscount,
        totalBilled
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Corporate settle error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
