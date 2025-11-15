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
  const sevenDaysAgo = subDays(todayStart, 6)

  const [
    rooms,
    bookingsToday,
    bookingsThisMonth,
    bookingsPreviousMonth,
    bookingsLastSevenDays,
    invoicesToday,
    invoicesThisMonth,
    invoicesPreviousMonth,
    foodOrdersToday,
    foodOrdersThisMonth,
    tasks,
    guestReviews,
    recentBookings,
    recentOrders,
    recentTasks,
  ] = await Promise.all([
    prisma.room.findMany({
      select: { id: true, status: true },
    }),
    prisma.booking.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      // Note: Booking model doesn't have room, invoice, or user relations defined in schema
    }),
    prisma.booking.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lte: todayEnd,
        },
      },
      // Note: Booking model doesn't have invoice relation defined in schema
    }),
    prisma.booking.findMany({
      where: {
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        AND: [
          { checkIn: { lte: todayEnd } },
          { checkOut: { gte: sevenDaysAgo } },
        ],
      },
    }),
    // Note: Invoice model doesn't exist in schema - use bookings instead
    prisma.booking.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lte: todayEnd,
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    }),
    prisma.foodOrder.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      // Note: FoodOrder model doesn't have items relation defined in schema
    }),
    prisma.foodOrder.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lte: todayEnd,
        },
      },
      // Note: FoodOrder model doesn't have items relation defined in schema
    }),
    prisma.task.findMany(),
    // Note: GuestReview model doesn't exist in schema - return mock data
    Promise.resolve({ _avg: { rating: null }, _count: { id: 0 } }),
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      // Note: Booking model doesn't have room, invoice, or user relations defined in schema
    }),
    prisma.foodOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      // Note: FoodOrder model doesn't have items relation defined in schema
    }),
    prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      // Note: Task model doesn't have user or staff relations defined in schema
    }),
  ])

  const totalRooms = rooms.length
  const occupiedRooms = rooms.filter(room => room.status === 'OCCUPIED').length
  const occupancyRate = totalRooms > 0 ? Number(((occupiedRooms / totalRooms) * 100).toFixed(1)) : 0

  const averageOccupancyLastSevenDays = (() => {
    if (!totalRooms || !bookingsLastSevenDays.length) return 0

    const occupancyTotals = bookingsLastSevenDays.reduce((acc, booking) => {
      const start = startOfDay(new Date(booking.checkIn))
      const end = endOfDay(new Date(booking.checkOut))

      for (let day = start; day <= end; day = subDays(endOfDay(day), -1)) {
        const key = startOfDay(day).toISOString()
        acc.set(key, (acc.get(key) || 0) + 1)
      }

      return acc
    }, new Map<string, number>())

    if (!occupancyTotals.size) return 0

    const average = Array.from(occupancyTotals.values()).reduce((sum, value) => sum + value, 0) /
      (occupancyTotals.size * totalRooms)

    return Number((average * 100).toFixed(1))
  })()

  // Use booking.totalAmount since Invoice model doesn't exist
  const todayRevenue = invoicesToday.reduce((sum, booking) => sum + (booking.totalAmount ?? 0), 0)
  const monthlyRevenue = invoicesThisMonth.reduce((sum, booking) => sum + (booking.totalAmount ?? 0), 0)
  const previousMonthlyRevenue = invoicesPreviousMonth.reduce((sum, booking) => sum + (booking.totalAmount ?? 0), 0)

  const bookingGrowthRate = calculateGrowthRate(bookingsThisMonth.length, bookingsPreviousMonth.length)
  const revenueGrowthRate = calculateGrowthRate(monthlyRevenue, previousMonthlyRevenue)

  const restaurantOrdersToday = foodOrdersToday.length
  const restaurantRevenueToday = foodOrdersToday.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0)
  const restaurantRevenueThisMonth = foodOrdersThisMonth.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0)
  const averageOrderValueToday = restaurantOrdersToday > 0
    ? Number((restaurantRevenueToday / restaurantOrdersToday).toFixed(2))
    : 0

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(task => task.status === 'COMPLETED').length,
    pending: tasks.filter(task => task.status === 'PENDING').length,
    overdue: tasks.filter(task => task.status === 'IN_PROGRESS' && task.dueDate && task.dueDate < now).length,
  }

  const completionRate = taskStats.total > 0
    ? Number(((taskStats.completed / taskStats.total) * 100).toFixed(1))
    : 0

  const guestSatisfaction = {
    rating: Number((guestReviews._avg.rating ?? 0).toFixed(1)),
    reviews: guestReviews._count.id ?? 0,
  }

  // Safely fetch recent activity with error handling
  let recentBookingsData: Array<{
    id: string
    roomNumber: string
    guestName: string
    createdAt: Date
    totalAmount: number
    status: string
  }> = []
  try {
    recentBookingsData = await Promise.all(recentBookings.map(async (booking) => {
      try {
        // Fetch related data separately since relations don't exist in schema
        const [room, user] = await Promise.all([
          booking.roomId ? prisma.room.findUnique({ where: { id: booking.roomId } }).catch(() => null) : Promise.resolve(null),
          booking.userId ? prisma.user.findUnique({ where: { id: booking.userId } }).catch(() => null) : Promise.resolve(null)
        ])
        return {
          id: booking.id,
          roomNumber: room?.number ?? 'N/A',
          guestName: user?.name ?? 'Guest',
          createdAt: booking.createdAt,
          totalAmount: booking.totalAmount ?? 0,
          status: booking.status,
        }
      } catch (error) {
        console.error('Error fetching booking details:', error)
        return {
          id: booking.id,
          roomNumber: 'N/A',
          guestName: 'Guest',
          createdAt: booking.createdAt,
          totalAmount: booking.totalAmount ?? 0,
          status: booking.status,
        }
      }
    }))
  } catch (error) {
    console.error('Error processing recent bookings:', error)
  }

  let recentTasksData: Array<{
    id: string
    title: string
    status: string
    createdAt: Date
    dueDate: Date | null
    assignedTo: string | null
    createdBy: string | null
    priority: string
  }> = []
  try {
    recentTasksData = await Promise.all(recentTasks.map(async (task) => {
      try {
        // Fetch related data separately since relations don't exist in schema
        const [staff, user] = await Promise.all([
          task.assignedTo ? prisma.staff.findFirst({ where: { id: task.assignedTo } }).catch(() => null) : Promise.resolve(null),
          task.createdBy ? prisma.user.findUnique({ where: { id: task.createdBy } }).catch(() => null) : Promise.resolve(null)
        ])
        return {
          id: task.id,
          title: task.title,
          status: task.status,
          createdAt: task.createdAt,
          dueDate: task.dueDate,
          assignedTo: staff?.name ?? null,
          createdBy: user?.name ?? null,
          priority: task.priority,
        }
      } catch (error) {
        console.error('Error fetching task details:', error)
        return {
          id: task.id,
          title: task.title,
          status: task.status,
          createdAt: task.createdAt,
          dueDate: task.dueDate,
          assignedTo: null,
          createdBy: null,
          priority: task.priority,
        }
      }
    }))
  } catch (error) {
    console.error('Error processing recent tasks:', error)
  }

  // Calculate total revenue and bookings from all time
  const allBookings = await prisma.booking.findMany().catch(() => [])
  const totalBookings = allBookings.length
  const totalRevenue = allBookings.reduce((sum, booking) => sum + (Number(booking.totalAmount) || 0), 0)
  
  // Calculate yearly stats
  const currentYearStart = new Date(now.getFullYear(), 0, 1)
  const yearlyBookings = allBookings.filter(b => new Date(b.createdAt) >= currentYearStart).length
  const yearlyRevenue = allBookings
    .filter(b => new Date(b.createdAt) >= currentYearStart)
    .reduce((sum, booking) => sum + (Number(booking.totalAmount) || 0), 0)

  // Get room status breakdown
  const roomStatusBreakdown = [
    { status: 'AVAILABLE', count: rooms.filter(r => r.status === 'AVAILABLE').length },
    { status: 'OCCUPIED', count: rooms.filter(r => r.status === 'OCCUPIED').length },
    { status: 'MAINTENANCE', count: rooms.filter(r => r.status === 'MAINTENANCE').length },
    { status: 'OUT_OF_ORDER', count: rooms.filter(r => r.status === 'OUT_OF_ORDER').length },
  ].filter(status => status.count > 0)

  // Generate occupancy chart data (30 days)
  const occupancyChartData = []
  for (let i = 29; i >= 0; i--) {
    const date = subDays(todayStart, i)
    const dateStr = date.toISOString().split('T')[0]
    const bookingsOnDate = allBookings.filter(b => {
      const checkIn = new Date(b.checkIn)
      const checkOut = new Date(b.checkOut)
      return checkIn <= date && checkOut >= date
    })
    occupancyChartData.push({
      date: dateStr,
      occupied: bookingsOnDate.length,
      available: Math.max(0, totalRooms - bookingsOnDate.length),
      occupancyRate: totalRooms > 0 ? Number(((bookingsOnDate.length / totalRooms) * 100).toFixed(1)) : 0,
    })
  }

  // Get top performing rooms
  const roomPerformanceMap = new Map<string, { bookingCount: number; revenue: number }>()
  allBookings.forEach(booking => {
    const roomId = booking.roomId || 'unknown'
    const existing = roomPerformanceMap.get(roomId) || { bookingCount: 0, revenue: 0 }
    roomPerformanceMap.set(roomId, {
      bookingCount: existing.bookingCount + 1,
      revenue: existing.revenue + (Number(booking.totalAmount) || 0),
    })
  })

  // Get guest and staff stats
  const [allUsers, allStaff] = await Promise.all([
    prisma.user.findMany().catch(() => []),
    prisma.staff.findMany().catch(() => []),
  ])
  const totalGuests = allUsers.filter(u => u.role === 'GUEST').length
  const totalStaffCount = allStaff.length
  const totalAdmins = allUsers.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'MANAGER').length

  // Build top rooms array
  const topRooms: Array<{ rank: number; roomNumber: string; roomType: string; bookingCount: number; revenue: number }> = []
  try {
    const roomEntries = Array.from(roomPerformanceMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
    
    for (let i = 0; i < roomEntries.length; i++) {
      const [roomId, stats] = roomEntries[i]
      const room = await prisma.room.findUnique({ where: { id: roomId } }).catch(() => null)
      if (room) {
        topRooms.push({
          rank: i + 1,
          roomNumber: room.number || 'N/A',
          roomType: room.type || 'Standard',
          bookingCount: stats.bookingCount,
          revenue: Number(stats.revenue.toFixed(2)),
        })
      }
    }
  } catch (error) {
    console.error('Error building top rooms:', error)
  }

  // Transform recent bookings to match expected format
  const transformedRecentBookings = recentBookingsData.map((booking: any) => {
    const bookingRecord = recentBookings.find((b: any) => b.id === booking.id)
    return {
      id: booking.id,
      guestName: booking.guestName,
      roomNumber: booking.roomNumber,
      roomType: bookingRecord?.roomId ? 'Standard' : 'Standard', // Default, can be enhanced
      checkIn: bookingRecord?.checkIn?.toString() || booking.createdAt.toString(),
      checkOut: bookingRecord?.checkOut?.toString() || booking.createdAt.toString(),
      totalAmount: booking.totalAmount,
      status: booking.status,
      createdAt: booking.createdAt.toString(),
    }
  })

  return {
    summary: {
      totalBookings,
      todayBookings: bookingsToday.length,
      monthlyBookings: bookingsThisMonth.length,
      yearlyBookings,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      todayRevenue: Number(todayRevenue.toFixed(2)),
      monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
      yearlyRevenue: Number(yearlyRevenue.toFixed(2)),
      occupancyRate,
      avgBookingValue: monthlyRevenue > 0 && bookingsThisMonth.length > 0
        ? Number((monthlyRevenue / bookingsThisMonth.length).toFixed(2))
        : 0,
      bookingGrowthRate,
    },
    charts: {
      occupancy: occupancyChartData,
      roomStatus: roomStatusBreakdown,
      revenue: {
        today: Number(todayRevenue.toFixed(2)),
        month: Number(monthlyRevenue.toFixed(2)),
        year: Number(yearlyRevenue.toFixed(2)),
      },
    },
    recentActivity: {
      bookings: transformedRecentBookings,
      topRooms,
    },
    guestStats: {
      totalGuests,
      totalStaff: totalStaffCount,
      totalAdmins,
    },
  }
}

export function userHasDashboardAccess(role?: string | null): role is DashboardRole {
  return role != null && ALLOWED_ROLES.includes(role as DashboardRole)
}
