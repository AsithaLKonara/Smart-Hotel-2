import { prisma } from './db'
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from 'date-fns'

export interface DashboardStats {
  occupancy: number
  occupancyTrend: number
  adr: number
  adrTrend: number
  revpar: number
  revparTrend: number
  totalRevenue: number
  revenueTrend: number
  revenueByMonth: Array<{ name: string; total: number }>
  occupancyByType: Array<{ name: string; value: number }>
}

/**
 * Enterprise Analytics Engine
 * High-performance aggregations for Normalized Hospitality Schema.
 */
export class AnalyticsEngine {
  
  static async getExecutiveStats(): Promise<DashboardStats> {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    // 1. Parallel Core Metric Collection
    const [
      currentRevenue,
      lastRevenue,
      totalRooms,
      activeBookings,
      adrData,
      lastAdrData,
      lastActiveBookings,
      roomTypes
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'completed', createdAt: { gte: currentMonthStart, lte: currentMonthEnd } },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { status: 'completed', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { amount: true }
      }),
      prisma.room.count(),
      prisma.booking.count({
        where: {
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkIn: { lte: now },
          checkOut: { gte: now }
        }
      }),
      prisma.booking.aggregate({
        where: {
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          checkIn: { gte: currentMonthStart, lte: currentMonthEnd }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      prisma.booking.aggregate({
        where: {
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          checkIn: { gte: lastMonthStart, lte: lastMonthEnd }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      prisma.booking.count({
        where: {
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkIn: { lte: lastMonthEnd },
          checkOut: { gte: lastMonthStart }
        }
      }),
      prisma.roomType.findMany({
        include: { _count: { select: { rooms: true } } }
      })
    ])

    // 2. Derive Trends
    const revSum = currentRevenue?._sum?.amount || 0
    const lastRevSum = lastRevenue?._sum?.amount || 0
    const revenueTrend = lastRevSum === 0 ? 0 : ((revSum - lastRevSum) / lastRevSum) * 100

    const occupancy = totalRooms === 0 ? 0 : (activeBookings / totalRooms) * 100
    const lastOccupancy = totalRooms === 0 ? 0 : (lastActiveBookings / totalRooms) * 100
    const occupancyTrend = lastOccupancy === 0 ? 0 : ((occupancy - lastOccupancy) / lastOccupancy) * 100

    const adr = adrData._count.id === 0 ? 0 : (adrData._sum.totalAmount || 0) / adrData._count.id
    const lastAdr = lastAdrData._count.id === 0 ? 0 : (lastAdrData._sum.totalAmount || 0) / lastAdrData._count.id
    const adrTrend = lastAdr === 0 ? 0 : ((adr - lastAdr) / lastAdr) * 100

    const revpar = totalRooms === 0 ? 0 : (adrData._sum.totalAmount || 0) / (totalRooms * 30)
    const lastRevpar = totalRooms === 0 ? 0 : (lastAdrData._sum.totalAmount || 0) / (totalRooms * 30)
    const revparTrend = lastRevpar === 0 ? 0 : ((revpar - lastRevpar) / lastRevpar) * 100

    // 3. Parallel Time-Series Aggregation (Replaces sequential loop)
    const historicalMonths = [5, 4, 3, 2, 1, 0]
    const revenueByMonth = await Promise.all(historicalMonths.map(async (i) => {
      const targetMonth = subMonths(now, i)
      const res = await prisma.payment.aggregate({
        where: { 
          status: 'completed',
          createdAt: { gte: startOfMonth(targetMonth), lte: endOfMonth(targetMonth) }
        },
        _sum: { amount: true }
      })
      return {
        name: format(targetMonth, 'MMM'),
        total: res?._sum?.amount || 0
      }
    }))

    // 4. Parallel Occupancy by Type
    const occupancyByType = await Promise.all(roomTypes.map(async (rt) => {
      const activeInType = await prisma.booking.count({
        where: {
          room: { roomTypeId: rt.id },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkIn: { lte: now },
          checkOut: { gte: now }
        }
      })
      return {
        name: rt.name,
        value: rt._count.rooms === 0 ? 0 : Math.round((activeInType / rt._count.rooms) * 100)
      }
    }))

    return {
      occupancy,
      occupancyTrend,
      adr,
      adrTrend,
      revpar,
      revparTrend,
      totalRevenue: revSum,
      revenueTrend,
      revenueByMonth,
      occupancyByType
    }
  }

  /**
   * Room Health Analytics
   */
  static async getRoomHealth() {
    const stats = await prisma.room.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    return stats.map(s => ({
      status: s.status,
      count: s._count.id
    }))
  }

  // ==========================================
  // Granular Operational Metrics
  // ==========================================

  static async getADR(startDate: Date, endDate: Date): Promise<number> {
    const data = await prisma.booking.aggregate({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkIn: { gte: startDate, lte: endDate }
      },
      _sum: { totalAmount: true },
      _count: { id: true }
    })
    return data._count.id === 0 ? 0 : (data._sum.totalAmount || 0) / data._count.id
  }

  static async getRevPAR(startDate: Date, endDate: Date): Promise<number> {
    const totalRooms = await prisma.room.count()
    if (totalRooms === 0) return 0
    
    const revenue = await prisma.payment.aggregate({
      where: {
        status: 'completed',
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    })

    const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    return (revenue?._sum?.amount || 0) / (totalRooms * days)
  }

  static async getOccupancyRate(startDate: Date, endDate: Date): Promise<number> {
    const totalRooms = await prisma.room.count()
    if (totalRooms === 0) return 0

    const occupiedDays = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        OR: [
          { checkIn: { gte: startDate, lte: endDate } },
          { checkOut: { gte: startDate, lte: endDate } }
        ]
      },
      select: { checkIn: true, checkOut: true }
    })

    // Simple heuristic: count bookings as "occupied" if they overlap the range
    // For a precise rate, we'd need a day-by-day map
    return Math.min(100, (occupiedDays.length / totalRooms) * 100)
  }

  static async getHousekeepingSLA(): Promise<number> {
    // Percentage of rooms that are CLEAN or AVAILABLE vs total
    const total = await prisma.room.count()
    if (total === 0) return 100
    
    const ready = await prisma.room.count({
      where: { status: { in: ['AVAILABLE', 'CLEANING'] } } // 'CLEANING' is in-progress but part of SLA flow
    })

    return (ready / total) * 100
  }

  static async getRevenuePacing(days: number): Promise<number> {
    // Revenue growth vs previous period
    const now = new Date()
    const currentStart = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
    const prevStart = new Date(currentStart.getTime() - (days * 24 * 60 * 60 * 1000))

    const [current, prev] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'completed', createdAt: { gte: currentStart } },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { status: 'completed', createdAt: { gte: prevStart, lte: currentStart } },
        _sum: { amount: true }
      })
    ])

    const currSum = current?._sum?.amount || 0
    const prevSum = prev?._sum?.amount || 0

    if (prevSum === 0) return currSum > 0 ? 100 : 0
    return ((currSum - prevSum) / prevSum) * 100
  }
}
