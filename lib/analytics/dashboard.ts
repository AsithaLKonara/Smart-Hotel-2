import { endOfDay, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns'
import { Booking, Room, FoodOrder } from '@prisma/client'
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
    foodOrdersLast30Days,
    bookingsPreviousMonth,
    recentBookings,
    userStats,
    staffCount
  ] = await Promise.all([
    prisma.room.findMany({ include: { roomType: true } }),
    prisma.booking.findMany({
      where: {
        OR: [
          { createdAt: { gte: previousMonthStart } },
          { checkIn: { lte: todayEnd }, checkOut: { gte: thirtyDaysAgo } }
        ]
      },
      include: { room: { include: { roomType: true } }, guest: true }
    }),
    prisma.foodOrder.findMany({
      where: { createdAt: { gte: previousMonthStart }, status: 'DELIVERED' }
    }),
    prisma.booking.count({
      where: { createdAt: { gte: previousMonthStart, lte: previousMonthEnd }, paymentStatus: 'completed' }
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { room: { include: { roomType: true } }, guest: true }
    }),
    prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
    prisma.staff.count()
  ])

  // 2. Summary Calculations (Room + Dining)
  const todayBookings = bookingsLast30Days.filter((b: Booking) => b.createdAt >= todayStart && b.createdAt <= todayEnd)
  const monthlyBookings = bookingsLast30Days.filter((b: Booking) => b.createdAt >= monthStart)
  
  // Strictly aggregate completed revenue
  const getRevenue = (list: Booking[], orders: FoodOrder[], start: Date, end: Date) => {
    const roomRev = list.filter((b: Booking) => b.createdAt >= start && b.createdAt <= end && b.paymentStatus === 'completed')
                       .reduce((sum: number, b: Booking) => sum + (b.totalAmount || 0), 0)
    const foodRev = orders.filter((o: FoodOrder) => o.createdAt >= start && o.createdAt <= end)
                         .reduce((sum: number, o: FoodOrder) => sum + (o.totalAmount || 0), 0)
    return roomRev + foodRev
  }

  const todayRevenue = getRevenue(bookingsLast30Days, foodOrdersLast30Days, todayStart, todayEnd)
  const monthlyRevenue = getRevenue(bookingsLast30Days, foodOrdersLast30Days, monthStart, todayEnd)
  
  const currentYearStart = new Date(now.getFullYear(), 0, 1)
  const yearlyBookings = bookingsLast30Days.filter((b: Booking) => b.createdAt >= currentYearStart).length
  const yearlyRevenue = getRevenue(bookingsLast30Days, foodOrdersLast30Days, currentYearStart, todayEnd)

  const bookingGrowthRate = calculateGrowthRate(monthlyBookings.length, bookingsPreviousMonth)

  // 3. Occupancy & Charts
  const totalRooms = rooms.length
  const roomStatusBreakdown = [
    { status: 'AVAILABLE', count: rooms.filter((r: Room) => r.status === 'AVAILABLE').length },
    { status: 'OCCUPIED', count: rooms.filter((r: Room) => r.status === 'OCCUPIED').length },
    { status: 'MAINTENANCE', count: rooms.filter((r: Room) => r.status === 'MAINTENANCE').length },
    { status: 'DIRTY', count: rooms.filter((r: Room) => r.status === 'DIRTY').length },
  ].filter((s: { status: string, count: number }) => s.count > 0)

  const occupancyChartData: any[] = []
  for (let i = 29; i >= 0; i--) {
    const date = subDays(todayStart, i)
    const dateStr = date.toISOString().split('T')[0]
    const activeOnDate = bookingsLast30Days.filter((b: Booking) => {
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
  bookingsLast30Days.forEach((b: any) => {
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
    .map((r: any, i: number) => ({
      rank: i + 1,
      roomNumber: r.number,
      roomType: r.type,
      bookingCount: r.count,
      revenue: Number(r.revenue.toFixed(2))
    }))

  // 5. Activity Transformation
  const recentActivityBookings = recentBookings.map((b: any) => ({
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
  const getRoleCount = (role: string) => userStats.find((s: any) => s.role === role)?._count.id || 0
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
