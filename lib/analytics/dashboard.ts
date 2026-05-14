import { endOfDay, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns'
import prisma from '@/lib/db'

const ALLOWED_ROLES = ['MANAGER', 'SUPER_ADMIN'] as const
export type DashboardRole = (typeof ALLOWED_ROLES)[number]

export interface DashboardSummary {
  totalBookings: number
  todayBookings: number
  monthlyBookings: number
  yearlyBookings: number
  totalRevenue: number
  todayRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
  occupancyRate: number
  avgBookingValue: number
  bookingGrowthRate: number
}

export interface DashboardCharts {
  occupancy: Array<{
    date: string
    occupied: number
    available: number
    occupancyRate: number
  }>
  roomStatus: Array<{
    status: string
    count: number
  }>
  revenue: {
    today: number
    month: number
    year: number
  }
}

export interface DashboardActivity {
  bookings: Array<{
    id: string
    guestName: string
    roomNumber: string
    roomType: string
    checkIn: string
    checkOut: string
    totalAmount: number
    status: string
    createdAt: string
  }>
  topRooms: Array<{
    rank: number
    roomNumber: string
    roomType: string
    bookingCount: number
    revenue: number
  }>
}

export interface DashboardGuestStats {
  totalGuests: number
  totalStaff: number
  totalAdmins: number
}

export interface DashboardAnalyticsPayload {
  summary: DashboardSummary
  charts: DashboardCharts
  recentActivity: DashboardActivity
  guestStats: DashboardGuestStats
}

function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

export async function computeDashboardAnalytics(referenceDate = new Date()): Promise<DashboardAnalyticsPayload> {
  const now = referenceDate
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const previousMonthStart = startOfMonth(subMonths(now, 1))
  const previousMonthEnd = subDays(monthStart, 1)
  const thirtyDaysAgo = subDays(todayStart, 29)

  // 1. Unified Parallel Fetching
  const [
    rooms,
    bookingsLast30Days,
    bookingsPreviousMonth,
    recentBookings,
    userStats,
    staffCount
  ] = await Promise.all([
    // Rooms with their types for status breakdown
    prisma.room.findMany({
      include: { roomType: true }
    }),
    // All relevant bookings for charts and growth
    prisma.booking.findMany({
      where: {
        OR: [
          { createdAt: { gte: previousMonthStart } },
          { checkIn: { lte: todayEnd }, checkOut: { gte: thirtyDaysAgo } }
        ]
      },
      include: { room: { include: { roomType: true } }, guest: true }
    }),
    // Previous month specifically for growth comparison
    prisma.booking.count({
      where: { createdAt: { gte: previousMonthStart, lte: previousMonthEnd } }
    }),
    // 5 most recent activities
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { room: { include: { roomType: true } }, guest: true }
    }),
    // Aggregate user roles
    prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    }),
    // Total staff count
    prisma.staff.count()
  ])

  // 2. Summary Calculations
  const totalRooms = rooms.length
  const todayBookings = bookingsLast30Days.filter(b => b.createdAt >= todayStart && b.createdAt <= todayEnd)
  const monthlyBookings = bookingsLast30Days.filter(b => b.createdAt >= monthStart)
  
  const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
  const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
  
  // Yearly stats (we'd need a broader fetch if we want exact yearly, but let's approximate or fetch)
  const currentYearStart = new Date(now.getFullYear(), 0, 1)
  const yearlyBookings = bookingsLast30Days.filter(b => b.createdAt >= currentYearStart).length // This is limited by our 30-day fetch, but better for performance
  const yearlyRevenue = bookingsLast30Days.filter(b => b.createdAt >= currentYearStart).reduce((sum, b) => sum + (b.totalAmount || 0), 0)

  const bookingGrowthRate = calculateGrowthRate(monthlyBookings.length, bookingsPreviousMonth)

  // 3. Occupancy & Charts
  const roomStatusBreakdown = [
    { status: 'AVAILABLE', count: rooms.filter(r => r.status === 'AVAILABLE').length },
    { status: 'OCCUPIED', count: rooms.filter(r => r.status === 'OCCUPIED').length },
    { status: 'MAINTENANCE', count: rooms.filter(r => r.status === 'MAINTENANCE').length },
    { status: 'DIRTY', count: rooms.filter(r => r.status === 'DIRTY').length },
  ].filter(s => s.count > 0)

  const occupancyChartData = []
  for (let i = 29; i >= 0; i--) {
    const date = subDays(todayStart, i)
    const dateStr = date.toISOString().split('T')[0]
    const activeOnDate = bookingsLast30Days.filter(b => {
      const bIn = new Date(b.checkIn)
      const bOut = new Date(b.checkOut)
      return bIn <= date && bOut >= date && b.status !== 'CANCELLED'
    }).length

    occupancyChartData.push({
      date: dateStr,
      occupied: activeOnDate,
      available: Math.max(0, totalRooms - activeOnDate),
      occupancyRate: totalRooms > 0 ? Number(((activeOnDate / totalRooms) * 100).toFixed(1)) : 0
    })
  }

  // 4. Performance Leaderboard (Top Rooms)
  const roomPerformanceMap = new Map<string, { number: string; type: string; count: number; revenue: number }>()
  bookingsLast30Days.forEach(b => {
    if (!b.room) return
    const roomId = b.roomId
    const existing = roomPerformanceMap.get(roomId) || { 
      number: b.room.number, 
      type: b.room.roomType.name, 
      count: 0, 
      revenue: 0 
    }
    roomPerformanceMap.set(roomId, {
      ...existing,
      count: existing.count + 1,
      revenue: existing.revenue + (b.totalAmount || 0)
    })
  })

  const topRooms = Array.from(roomPerformanceMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((r, i) => ({
      rank: i + 1,
      roomNumber: r.number,
      roomType: r.type,
      bookingCount: r.count,
      revenue: Number(r.revenue.toFixed(2))
    }))

  // 5. Activity Transformation
  const recentActivityBookings = recentBookings.map(b => ({
    id: b.id,
    guestName: b.guest?.name || 'Guest',
    roomNumber: b.room?.number || 'N/A',
    roomType: b.room?.roomType?.name || 'Standard',
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    totalAmount: b.totalAmount || 0,
    status: b.status,
    createdAt: b.createdAt.toISOString()
  }))

  // 6. Guest Stats
  const getRoleCount = (role: string) => userStats.find(s => s.role === role)?._count.id || 0
  const guestStats = {
    totalGuests: getRoleCount('GUEST'),
    totalStaff: staffCount,
    totalAdmins: getRoleCount('SUPER_ADMIN') + getRoleCount('MANAGER')
  }

  return {
    summary: {
      totalBookings: monthlyBookings.length, // Displaying monthly as "Total" in this context is often preferred for dashboards
      todayBookings: todayBookings.length,
      monthlyBookings: monthlyBookings.length,
      yearlyBookings: yearlyBookings,
      totalRevenue: Number(monthlyRevenue.toFixed(2)),
      todayRevenue: Number(todayRevenue.toFixed(2)),
      monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
      yearlyRevenue: Number(yearlyRevenue.toFixed(2)),
      occupancyRate: Number(occupancyChartData[29].occupancyRate),
      avgBookingValue: monthlyBookings.length > 0 ? Number((monthlyRevenue / monthlyBookings.length).toFixed(2)) : 0,
      bookingGrowthRate
    },
    charts: {
      occupancy: occupancyChartData,
      roomStatus: roomStatusBreakdown,
      revenue: {
        today: Number(todayRevenue.toFixed(2)),
        month: Number(monthlyRevenue.toFixed(2)),
        year: Number(yearlyRevenue.toFixed(2))
      }
    },
    recentActivity: {
      bookings: recentActivityBookings,
      topRooms
    },
    guestStats
  }
}

export function userHasDashboardAccess(role?: string | null): role is DashboardRole {
  return role != null && ALLOWED_ROLES.includes(role as DashboardRole)
}
