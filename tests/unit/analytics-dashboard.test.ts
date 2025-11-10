import { computeDashboardAnalytics, userHasDashboardAccess } from '@/lib/analytics/dashboard'

jest.mock('@/lib/db', () => {
  const roomFindMany = jest.fn()
  const bookingFindMany = jest.fn()
  const invoiceFindMany = jest.fn()
  const foodOrderFindMany = jest.fn()
  const taskFindMany = jest.fn()
  const guestReviewAggregate = jest.fn()

  const prismaMock = {
    room: { findMany: roomFindMany },
    booking: { findMany: bookingFindMany },
    invoice: { findMany: invoiceFindMany },
    foodOrder: { findMany: foodOrderFindMany },
    task: { findMany: taskFindMany },
    guestReview: { aggregate: guestReviewAggregate },
  }

  return {
    __esModule: true,
    prisma: prismaMock,
    default: prismaMock,
  }
})

const { prisma } = jest.requireMock('@/lib/db') as {
  prisma: {
    room: { findMany: jest.Mock }
    booking: { findMany: jest.Mock }
    invoice: { findMany: jest.Mock }
    foodOrder: { findMany: jest.Mock }
    task: { findMany: jest.Mock }
    guestReview: { aggregate: jest.Mock }
  }
}

const prismaMocks = {
  roomFindMany: prisma.room.findMany,
  bookingFindMany: prisma.booking.findMany,
  invoiceFindMany: prisma.invoice.findMany,
  foodOrderFindMany: prisma.foodOrder.findMany,
  taskFindMany: prisma.task.findMany,
  guestReviewAggregate: prisma.guestReview.aggregate,
}

describe('analytics/dashboard helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.values(prismaMocks).forEach(mock => mock.mockReset())
  })

  test('computeDashboardAnalytics aggregates metrics correctly', async () => {
    const now = new Date('2025-06-15T12:00:00.000Z')

    prismaMocks.roomFindMany!.mockResolvedValue([
      { id: 'room-1', status: 'OCCUPIED' },
      { id: 'room-2', status: 'AVAILABLE' },
    ])

    prismaMocks.bookingFindMany!
      .mockResolvedValueOnce([
        {
          id: 'booking-today-1',
          createdAt: now,
          status: 'CONFIRMED',
          invoice: { total: 300 },
          room: { number: '101' },
          user: { name: 'Jordan' },
        },
      ]) // today
      .mockResolvedValueOnce([
        { id: 'booking-month-1', createdAt: now, status: 'CONFIRMED', invoice: { total: 400 } },
        { id: 'booking-month-2', createdAt: now, status: 'CONFIRMED', invoice: { total: 200 } },
      ]) // this month
      .mockResolvedValueOnce([{ id: 'booking-prev-1' }]) // previous month
      .mockResolvedValueOnce([
        {
          id: 'booking-range-1',
          checkIn: '2025-06-12T00:00:00.000Z',
          checkOut: '2025-06-14T00:00:00.000Z',
        },
      ]) // last seven days
      .mockResolvedValueOnce([
        {
          id: 'recent-booking-1',
          createdAt: now,
          status: 'CONFIRMED',
          room: { number: '701' },
          invoice: { total: 500 },
          user: { name: 'Alex' },
        },
      ]) // recent bookings

    prismaMocks.invoiceFindMany!
      .mockResolvedValueOnce([{ total: 300 }]) // invoices today
      .mockResolvedValueOnce([{ total: 600 }]) // invoices this month
      .mockResolvedValueOnce([{ total: 200 }]) // invoices previous month

    prismaMocks.foodOrderFindMany!
      .mockResolvedValueOnce([
        { totalAmount: 120, items: [{ menu: { name: 'Salmon' }, quantity: 1 }] },
      ]) // orders today
      .mockResolvedValueOnce([
        { totalAmount: 360, items: [{ menu: { name: 'Pasta' }, quantity: 2 }] },
      ]) // orders this month
      .mockResolvedValueOnce([
        {
          id: 'recent-order-1',
          roomNumber: '305',
          status: 'DELIVERED',
          totalAmount: 120,
          createdAt: now,
          items: [{ menu: { name: 'Salmon' }, quantity: 1 }],
        },
      ]) // recent orders

    prismaMocks.taskFindMany!
      .mockResolvedValueOnce([
        {
          id: 'task-1',
          status: 'COMPLETED',
          dueDate: new Date('2025-06-16T00:00:00.000Z'),
          priority: 'HIGH',
        },
        {
          id: 'task-2',
          status: 'IN_PROGRESS',
          dueDate: new Date('2025-06-10T00:00:00.000Z'),
          priority: 'MEDIUM',
        },
      ]) // all tasks
      .mockResolvedValueOnce([
        {
          id: 'recent-task-1',
          title: 'Turnover',
          status: 'IN_PROGRESS',
          createdAt: now,
          dueDate: new Date('2025-06-16T00:00:00.000Z'),
          staff: { name: 'Taylor' },
          user: { name: 'Jordan' },
          priority: 'HIGH',
        },
      ]) // recent tasks

    prismaMocks.guestReviewAggregate!.mockResolvedValue({
      _avg: { rating: 4.6 },
      _count: { id: 42 },
    })

    const analytics = await computeDashboardAnalytics(now)

    expect(analytics.summary.occupancyRate).toBe(50)
    expect(analytics.summary.todayRevenue).toBe(300)
    expect(analytics.summary.monthlyRevenue).toBe(600)
    expect(analytics.summary.todayBookings).toBe(1)
    expect(analytics.summary.monthlyBookings).toBe(2)
    expect(analytics.summary.restaurantOrdersToday).toBe(1)
    expect(analytics.summary.restaurantRevenueToday).toBe(120)
    expect(analytics.summary.taskStats.total).toBe(2)
    expect(analytics.summary.taskStats.completed).toBe(1)
    expect(analytics.summary.taskStats.overdue).toBe(1)
    expect(analytics.summary.guestSatisfaction.rating).toBe(4.6)
    expect(analytics.recentActivity.bookings[0].id).toBe('recent-booking-1')
    expect(analytics.recentActivity.orders[0].id).toBe('recent-order-1')
    expect(analytics.recentActivity.tasks[0].id).toBe('recent-task-1')
  })

  test('computeDashboardAnalytics returns zeroed metrics for empty dataset', async () => {
    prismaMocks.roomFindMany.mockResolvedValue([])
    prismaMocks.bookingFindMany.mockResolvedValue([])
    prismaMocks.invoiceFindMany.mockResolvedValue([])
    prismaMocks.foodOrderFindMany.mockResolvedValue([])
    prismaMocks.taskFindMany.mockResolvedValue([])
    prismaMocks.guestReviewAggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: { id: 0 },
    })

    const analytics = await computeDashboardAnalytics(new Date('2025-01-01T08:00:00.000Z'))

    expect(analytics.summary).toMatchObject({
      occupancyRate: 0,
      averageOccupancyRate: 0,
      bookingGrowthRate: 0,
      todayRevenue: 0,
      monthlyRevenue: 0,
      revenueGrowthRate: 0,
      todayBookings: 0,
      monthlyBookings: 0,
      restaurantOrdersToday: 0,
      restaurantRevenueToday: 0,
      restaurantRevenueMonth: 0,
      averageOrderValueToday: 0,
      taskStats: {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        completionRate: 0,
      },
      guestSatisfaction: {
        rating: 0,
        reviews: 0,
      },
    })

    expect(analytics.recentActivity).toEqual({
      bookings: [],
      orders: [],
      tasks: [],
    })
  })

  test('computeDashboardAnalytics propagates datasource errors', async () => {
    prismaMocks.roomFindMany.mockRejectedValue(new Error('Database unavailable'))

    await expect(computeDashboardAnalytics()).rejects.toThrow('Database unavailable')
  })

  test('userHasDashboardAccess guards roles', () => {
    expect(userHasDashboardAccess('SUPER_ADMIN')).toBe(true)
    expect(userHasDashboardAccess('MANAGER')).toBe(true)
    expect(userHasDashboardAccess('RECEPTIONIST')).toBe(false)
    expect(userHasDashboardAccess(null)).toBe(false)
  })
})

