import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  try {
    const property = await prisma.property.findFirst()
    if (!property) throw new Error("Property not found")
    
    const businessDate = property.businessDate || new Date()
    
    // We will look at all FolioItems posted MTD (Month to Date)
    const monthStart = startOfMonth(businessDate)
    const currentEnd = endOfDay(businessDate)

    const folioItems = await prisma.folioItem.findMany({
      where: {
        createdAt: { gte: monthStart, lte: currentEnd }
      },
      select: {
        amount: true,
        type: true
      }
    })

    // Aggregate by type
    const distribution = {
      ROOM_CHARGE: 0,
      FOOD_AND_BEVERAGE: 0,
      SPA: 0,
      MINIBAR: 0,
      OTHER: 0
    }

    folioItems.forEach((item: any) => {
      if (item.type in distribution) {
        distribution[item.type as keyof typeof distribution] += item.amount
      } else {
        distribution.OTHER += item.amount
      }
    })

    const totalRevenue = Object.values(distribution).reduce((a, b) => a + b, 0)

    // Format for charting/UI
    const breakdown = Object.entries(distribution).map(([key, value]) => ({
      department: key.replace(/_/g, ' '),
      amount: value,
      percentage: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0
    })).sort((a, b) => b.amount - a.amount)

    return NextResponse.json({
      period: 'MTD',
      totalRevenue,
      breakdown
    })

  } catch (error: any) {
    console.error('Revenue Analytics Error:', error)
    return NextResponse.json({ error: 'Failed to generate revenue distribution' }, { status: 500 })
  }
}
