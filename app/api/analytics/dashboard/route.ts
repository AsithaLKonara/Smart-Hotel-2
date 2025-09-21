import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !['MANAGER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfYear = new Date(today.getFullYear(), 0, 1)

    // Get all analytics data in parallel
    const [
      totalBookings,
      todayBookings,
      monthlyBookings,
      yearlyBookings,
      totalRevenue,
      todayRevenue,
      monthlyRevenue,
      yearlyRevenue,
      occupancyData,
      roomStatusData,
      recentBookings,
      topRooms,
      guestStats
    ] = await Promise.all([
      // Booking counts
      prisma.booking.count(),
      prisma.booking.count({
        where: { createdAt: { gte: startOfDay } }
      }),
      prisma.booking.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      prisma.booking.count({
        where: { createdAt: { gte: startOfYear } }
      }),

      // Revenue calculations
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'COMPLETED' as any }
      }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { 
          paymentStatus: 'COMPLETED' as any,
          createdAt: { gte: startOfDay }
        }
      }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { 
          paymentStatus: 'COMPLETED' as any,
          createdAt: { gte: startOfMonth }
        }
      }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { 
          paymentStatus: 'COMPLETED' as any,
          createdAt: { gte: startOfYear }
        }
      }),

      // Occupancy data for the next 30 days
      prisma.booking.findMany({
        where: {
          checkIn: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
          checkOut: { gte: today },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] }
        },
        select: {
          checkIn: true,
          checkOut: true,
          roomId: true
        }
      }),

      // Room status data
      prisma.room.groupBy({
        by: ['status'],
        _count: true
      }),

      // Recent bookings
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          },
          room: {
            select: { number: true, type: true }
          }
        }
      }),

      // Top performing rooms
      prisma.booking.groupBy({
        by: ['roomId'],
        _count: { roomId: true },
        _sum: { totalAmount: true },
        orderBy: { _count: { roomId: 'desc' } },
        take: 5
      }),

      // Guest statistics
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      })
    ])

    // Get room details for top rooms
    const topRoomIds = topRooms.map(r => r.roomId)
    const topRoomDetails = await prisma.room.findMany({
      where: { id: { in: topRoomIds } },
      select: { id: true, number: true, type: true, price: true }
    })

    // Calculate occupancy rate
    const totalRooms = await prisma.room.count()
    const occupiedRooms = occupancyData.length
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

    // Calculate average booking value
    const avgBookingValue = totalBookings > 0 ? 
      (totalRevenue._sum.totalAmount || 0) / totalBookings : 0

    // Format occupancy data for charts
    const occupancyChartData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
      const occupiedOnDate = occupancyData.filter(booking => {
        return booking.checkIn <= date && booking.checkOut > date
      }).length
      
      return {
        date: date.toISOString().split('T')[0],
        occupied: occupiedOnDate,
        available: totalRooms - occupiedOnDate,
        occupancyRate: totalRooms > 0 ? (occupiedOnDate / totalRooms) * 100 : 0
      }
    })

    // Calculate growth rates
    const previousMonthStart = new Date(startOfMonth.getTime() - 30 * 24 * 60 * 60 * 1000)
    const previousMonthBookings = await prisma.booking.count({
      where: { 
        createdAt: { 
          gte: previousMonthStart, 
          lt: startOfMonth 
        } 
      }
    })

    const bookingGrowthRate = previousMonthBookings > 0 ? 
      ((monthlyBookings - previousMonthBookings) / previousMonthBookings) * 100 : 0

    return NextResponse.json({
      summary: {
        totalBookings,
        todayBookings,
        monthlyBookings,
        yearlyBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        todayRevenue: todayRevenue._sum.totalAmount || 0,
        monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
        yearlyRevenue: yearlyRevenue._sum.totalAmount || 0,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        avgBookingValue: Math.round(avgBookingValue * 100) / 100,
        bookingGrowthRate: Math.round(bookingGrowthRate * 100) / 100
      },
      charts: {
        occupancy: occupancyChartData,
        roomStatus: roomStatusData.map(status => ({
          status: status.status,
          count: status._count
        })),
        revenue: {
          today: todayRevenue._sum.totalAmount || 0,
          month: monthlyRevenue._sum.totalAmount || 0,
          year: yearlyRevenue._sum.totalAmount || 0
        }
      },
      recentActivity: {
        bookings: recentBookings.map(booking => ({
          id: booking.id,
          guestName: booking.user.name || booking.guestName || 'Guest',
          roomNumber: booking.room.number,
          roomType: booking.room.type,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          totalAmount: booking.totalAmount,
          status: booking.status,
          createdAt: booking.createdAt
        })),
        topRooms: topRooms.map((room, index) => {
          const roomDetails = topRoomDetails.find(r => r.id === room.roomId)
          return {
            rank: index + 1,
            roomNumber: roomDetails?.number || 'Unknown',
            roomType: roomDetails?.type || 'Unknown',
            bookingCount: room._count.roomId,
            revenue: room._sum.totalAmount || 0
          }
        })
      },
      guestStats: {
        totalGuests: guestStats.find(g => g.role === 'GUEST')?._count || 0,
        totalStaff: guestStats.find(g => g.role === 'RECEPTIONIST')?._count || 0,
        totalAdmins: guestStats.find(g => g.role === 'MANAGER')?._count || 0
      }
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
