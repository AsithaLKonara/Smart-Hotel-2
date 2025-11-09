import { endOfDay, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns'
import prisma from '@/lib/db'

const ALLOWED_ROLES = ['MANAGER', 'SUPER_ADMIN'] as const
export type DashboardRole = (typeof ALLOWED_ROLES)[number]

export interface DashboardSummary {
  occupancyRate: number
  averageOccupancyRate: number
  bookingGrowthRate: number
  todayRevenue: number
  monthlyRevenue: number
  revenueGrowthRate: number
  todayBookings: number
  monthlyBookings: number
  restaurantOrdersToday: number
  restaurantRevenueToday: number
  restaurantRevenueMonth: number
  averageOrderValueToday: number
  taskStats: {
    total: number
    completed: number
    pending: number
    overdue: number
    completionRate: number
  }
  guestSatisfaction: {
    rating: number
    reviews: number
  }
}

export interface DashboardActivity {
  bookings: Array<{
    id: string
    roomNumber: string
    guestName: string
    createdAt: Date
    totalAmount: number
    status: string
  }>
  orders: Array<{
    id: string
    roomNumber: string
    createdAt: Date
    status: string
    totalAmount: number
    items: Array<{
      id: string
      name: string
      quantity: number
    }>
  }>
  tasks: Array<{
    id: string
    title: string
    status: string
    createdAt: Date
    dueDate: Date | null
    assignedTo: string | null
    createdBy: string | null
    priority: string
  }>
}

export interface DashboardAnalyticsPayload {
  summary: DashboardSummary
  recentActivity: DashboardActivity
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
      include: {
        room: true,
        invoice: true,
        user: {
          select: { id: true, name: true, email: true },
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
      include: {
        invoice: true,
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
    prisma.booking.findMany({
      where: {
        AND: [
          { checkIn: { lte: todayEnd } },
          { checkOut: { gte: sevenDaysAgo } },
        ],
      },
    }),
    prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lte: todayEnd,
        },
      },
    }),
    prisma.invoice.findMany({
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
      include: {
        items: {
          include: { menu: true },
        },
      },
    }),
    prisma.foodOrder.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lte: todayEnd,
        },
      },
      include: {
        items: {
          include: { menu: true },
        },
      },
    }),
    prisma.task.findMany(),
    prisma.guestReview.aggregate({
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        room: true,
        invoice: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.foodOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        items: {
          include: { menu: true },
        },
      },
    }),
    prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { id: true, name: true },
        },
        staff: {
          select: { id: true, name: true },
        },
      },
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

  const todayRevenue = invoicesToday.reduce((sum, invoice) => sum + (invoice.total ?? 0), 0)
  const monthlyRevenue = invoicesThisMonth.reduce((sum, invoice) => sum + (invoice.total ?? 0), 0)
  const previousMonthlyRevenue = invoicesPreviousMonth.reduce((sum, invoice) => sum + (invoice.total ?? 0), 0)

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

  return {
    summary: {
      occupancyRate,
      averageOccupancyRate: averageOccupancyLastSevenDays,
      bookingGrowthRate,
      todayRevenue: Number(todayRevenue.toFixed(2)),
      monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
      revenueGrowthRate,
      todayBookings: bookingsToday.length,
      monthlyBookings: bookingsThisMonth.length,
      restaurantOrdersToday,
      restaurantRevenueToday: Number(restaurantRevenueToday.toFixed(2)),
      restaurantRevenueMonth: Number(restaurantRevenueThisMonth.toFixed(2)),
      averageOrderValueToday,
      taskStats: {
        ...taskStats,
        completionRate,
      },
      guestSatisfaction,
    },
    recentActivity: {
      bookings: recentBookings.map(booking => ({
        id: booking.id,
        roomNumber: booking.room?.number ?? 'N/A',
        guestName: booking.user?.name ?? booking.guestName ?? 'Guest',
        createdAt: booking.createdAt,
        totalAmount: booking.invoice?.total ?? 0,
        status: booking.status,
      })),
      orders: recentOrders.map(order => ({
        id: order.id,
        roomNumber: order.roomNumber,
        createdAt: order.createdAt,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items.map(item => ({
          id: item.id,
          name: item.menu?.name ?? 'Item',
          quantity: item.quantity,
        })),
      })),
      tasks: recentTasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt,
        dueDate: task.dueDate,
        assignedTo: task.staff?.name ?? null,
        createdBy: task.user?.name ?? null,
        priority: task.priority,
      })),
    },
  }
}

export function userHasDashboardAccess(role?: string | null): role is DashboardRole {
  return role != null && ALLOWED_ROLES.includes(role as DashboardRole)
}
