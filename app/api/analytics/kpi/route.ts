import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  try {
    const property = await prisma.property.findFirst()
    if (!property) throw new Error("Property not found")
    
    const businessDate = property.businessDate || new Date()
    const start = startOfDay(businessDate)
    const end = endOfDay(businessDate)

    // 1. Total Inventory
    const totalRooms = await prisma.room.count({ where: { status: { not: 'OUT_OF_ORDER' } } })
    
    // 2. Active Occupancy (CheckIn <= BusinessDate < CheckOut AND Status != CANCELLED)
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        checkIn: { lte: end },
        checkOut: { gt: start }
      },
      select: {
        id: true,
        totalAmount: true,
        checkIn: true,
        checkOut: true,
        status: true
      }
    })

    const roomsOccupied = activeBookings.length
    const occupancyRate = totalRooms > 0 ? (roomsOccupied / totalRooms) * 100 : 0

    // 3. Revenue & ADR
    // For real-time ADR, we take the average nightly rate of active bookings
    let projectedRoomRevenue = 0
    activeBookings.forEach((b: any) => {
      const nights = Math.max(1, Math.ceil((b.checkOut.getTime() - b.checkIn.getTime()) / (1000 * 60 * 60 * 24)))
      projectedRoomRevenue += (b.totalAmount / nights)
    })

    const adr = roomsOccupied > 0 ? (projectedRoomRevenue / roomsOccupied) : 0
    const revpar = totalRooms > 0 ? (projectedRoomRevenue / totalRooms) : 0

    // 4. Operations (Arrivals / Departures for the Business Date)
    const arrivals = await prisma.booking.count({
      where: {
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        checkIn: { gte: start, lte: end }
      }
    })

    const departures = await prisma.booking.count({
      where: {
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        checkOut: { gte: start, lte: end }
      }
    })

    return NextResponse.json({
      businessDate,
      totalRooms,
      roomsOccupied,
      occupancyRate,
      projectedRoomRevenue,
      adr,
      revpar,
      operations: {
        arrivals,
        departures,
        inHouse: roomsOccupied
      }
    })

  } catch (error: any) {
    console.error('KPI Analytics Error:', error)
    return NextResponse.json({ error: 'Failed to generate KPIs' }, { status: 500 })
  }
}
