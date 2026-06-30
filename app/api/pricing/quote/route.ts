import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import { addDays, isBefore, isEqual, format, isFriday, isSaturday } from 'date-fns'

const quoteSchema = z.object({
  roomTypeId: z.string().uuid(),
  ratePlanId: z.string().uuid().optional(),
  checkIn: z.string(), // YYYY-MM-DD
  checkOut: z.string(), // YYYY-MM-DD
  guests: z.number().int().min(1).default(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = quoteSchema.parse(body)

    const checkInDate = new Date(data.checkIn)
    const checkOutDate = new Date(data.checkOut)

    if (!isBefore(checkInDate, checkOutDate)) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 })
    }

    const roomType = await prisma.roomType.findUnique({
      where: { id: data.roomTypeId },
      include: {
        ratePlans: {
          include: {
            seasonalRates: {
              where: {
                endDate: { gte: checkInDate },
                startDate: { lte: checkOutDate }
              }
            }
          }
        }
      }
    })

    if (!roomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }

    // Determine the RatePlan
    let selectedRatePlan = null
    if (data.ratePlanId) {
      selectedRatePlan = roomType.ratePlans.find((rp: any) => rp.id === data.ratePlanId)
    }
    // Fallback to default rate plan if exists, else we create a mock default logic
    if (!selectedRatePlan) {
      selectedRatePlan = roomType.ratePlans.find((rp: any) => rp.isDefault)
    }

    // If no rate plan exists in DB, we'll use base room type pricing
    const baseMultiplier = selectedRatePlan?.baseMultiplier || 1.0
    const seasonalRates = selectedRatePlan?.seasonalRates || []

    let totalAmount = 0
    const dailyBreakdown = []

    let currentDate = checkInDate
    while (isBefore(currentDate, checkOutDate)) {
      let dailyRate = roomType.baseRate * baseMultiplier
      let appliedSeason = null

      // Check seasonal overrides
      for (const season of seasonalRates) {
        if (
          (isBefore(season.startDate, currentDate) || isEqual(season.startDate, currentDate)) &&
          (isBefore(currentDate, season.endDate) || isEqual(currentDate, season.endDate))
        ) {
          if (season.baseRateOverride !== null) {
            dailyRate = season.baseRateOverride
          } else {
            dailyRate = dailyRate * season.multiplier
          }
          appliedSeason = season.name
          break // Apply first matching season
        }
      }

      // Weekend Yield Management (Friday, Saturday nights are typically more expensive)
      let weekendMultiplier = 1.0
      if (isFriday(currentDate) || isSaturday(currentDate)) {
        weekendMultiplier = 1.15 // 15% weekend premium
        dailyRate *= weekendMultiplier
      }

      totalAmount += dailyRate
      dailyBreakdown.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        rate: Number(dailyRate.toFixed(2)),
        baseRate: roomType.baseRate,
        seasonApplied: appliedSeason,
        weekendPremium: weekendMultiplier > 1.0
      })

      currentDate = addDays(currentDate, 1)
    }

    return NextResponse.json({
      quote: {
        roomTypeId: roomType.id,
        ratePlanId: selectedRatePlan?.id,
        ratePlanName: selectedRatePlan?.name || 'Standard Rate',
        checkIn: format(checkInDate, 'yyyy-MM-dd'),
        checkOut: format(checkOutDate, 'yyyy-MM-dd'),
        nights: dailyBreakdown.length,
        guests: data.guests,
        totalAmount: Number(totalAmount.toFixed(2)),
        currency: 'USD',
        breakdown: dailyBreakdown
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Pricing Quote Error:', error)
    return NextResponse.json({ error: 'Failed to generate quote' }, { status: 500 })
  }
}
