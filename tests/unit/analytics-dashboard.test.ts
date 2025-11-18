import { computeDashboardAnalytics, userHasDashboardAccess } from '@/lib/analytics/dashboard'

jest.mock('@/lib/db', () => {
  const roomFindMany = jest.fn()
  const roomFindUnique = jest.fn()
  const bookingFindMany = jest.fn()
  const invoiceFindMany = jest.fn()
  const foodOrderFindMany = jest.fn()
  const taskFindMany = jest.fn()
  const guestReviewAggregate = jest.fn()
  const userFindUnique = jest.fn()
  const userFindMany = jest.fn()
  const staffFindMany = jest.fn()

  const prismaMock = {
    room: { findMany: roomFindMany, findUnique: roomFindUnique },
    booking: { findMany: bookingFindMany },
    invoice: { findMany: invoiceFindMany },
    foodOrder: { findMany: foodOrderFindMany },
    task: { findMany: taskFindMany },
    guestReview: { aggregate: guestReviewAggregate },
    user: { findUnique: userFindUnique, findMany: userFindMany },
    staff: { findMany: staffFindMany },
  }

  return {
    __esModule: true,
    prisma: prismaMock,
    default: prismaMock,
  }
})

const { prisma } = jest.requireMock('@/lib/db') as {
  prisma: {
    room: { findMany: jest.Mock; findUnique: jest.Mock }
    booking: { findMany: jest.Mock }
    invoice: { findMany: jest.Mock }
    foodOrder: { findMany: jest.Mock }
    task: { findMany: jest.Mock }
    guestReview: { aggregate: jest.Mock }
    user: { findUnique: jest.Mock; findMany: jest.Mock }
    staff: { findMany: jest.Mock }
  }
}

const prismaMocks = {
  roomFindMany: prisma.room.findMany,
  roomFindUnique: prisma.room.findUnique,
  bookingFindMany: prisma.booking.findMany,
  invoiceFindMany: prisma.invoice.findMany,
  foodOrderFindMany: prisma.foodOrder.findMany,
  taskFindMany: prisma.task.findMany,
  guestReviewAggregate: prisma.guestReview.aggregate,
  userFindUnique: prisma.user.findUnique,
  userFindMany: prisma.user.findMany,
  staffFindMany: prisma.staff.findMany,
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

    // Note: Invoice model doesn't exist - implementation uses booking.findMany for invoices
    // Total of 8 booking.findMany calls: 5 for bookings + 3 for invoices
    prismaMocks.bookingFindMany!
      .mockResolvedValueOnce([
        {
          id: 'booking-today-1',
          createdAt: now,
          status: 'CONFIRMED',
          totalAmount: 300,
        },
      ]) // bookings today
      .mockResolvedValueOnce([
        { id: 'booking-month-1', createdAt: now, status: 'CONFIRMED', totalAmount: 400 },
        { id: 'booking-month-2', createdAt: now, status: 'CONFIRMED', totalAmount: 200 },
      ]) // bookings this month
      .mockResolvedValueOnce([{ id: 'booking-prev-1', totalAmount: 100 }]) // bookings previous month
      .mockResolvedValueOnce([
        {
          id: 'booking-range-1',
          checkIn: '2025-06-12T00:00:00.000Z',
          checkOut: '2025-06-14T00:00:00.000Z',
        },
      ]) // bookings last seven days
      .mockResolvedValueOnce([
        { id: 'invoice-today-1', createdAt: now, totalAmount: 300 },
      ]) // invoices today (uses booking.findMany)
      .mockResolvedValueOnce([
        { id: 'invoice-month-1', createdAt: now, totalAmount: 400 },
        { id: 'invoice-month-2', createdAt: now, totalAmount: 200 },
      ]) // invoices this month (uses booking.findMany)
      .mockResolvedValueOnce([
        { id: 'invoice-prev-1', createdAt: new Date('2025-05-15'), totalAmount: 200 },
      ]) // invoices previous month (uses booking.findMany)
      .mockResolvedValueOnce([
        {
          id: 'recent-booking-1',
          createdAt: now,
          status: 'CONFIRMED',
          totalAmount: 500,
          roomId: 'room-1',
          userId: 'user-1',
        },
      ]) // recent bookings
      .mockResolvedValueOnce([]) // all bookings for total revenue calculation
    prismaMocks.roomFindUnique.mockResolvedValue({ id: 'room-1', number: '701' })
    prismaMocks.userFindUnique.mockResolvedValue({ id: 'user-1', name: 'Alex' })
    prismaMocks.userFindMany.mockResolvedValue([])
    prismaMocks.staffFindMany.mockResolvedValue([])

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
    // Note: restaurantOrdersToday, restaurantRevenueToday, taskStats, and guestSatisfaction
    // are calculated but not included in the summary object (only in DashboardSummary interface)
    expect(analytics.recentActivity.bookings[0].id).toBe('recent-booking-1')
    // Note: recentActivity only contains bookings and topRooms, not orders or tasks
    expect(analytics.recentActivity.topRooms).toBeDefined()
  })

  test('computeDashboardAnalytics returns zeroed metrics for empty dataset', async () => {
    prismaMocks.roomFindMany.mockResolvedValue([])
    // Note: Invoice model doesn't exist - implementation uses booking.findMany for invoices
    // Need 8 mock calls: 5 for bookings + 3 for invoices
    prismaMocks.bookingFindMany
      .mockResolvedValueOnce([]) // bookings today
      .mockResolvedValueOnce([]) // bookings this month
      .mockResolvedValueOnce([]) // bookings previous month
      .mockResolvedValueOnce([]) // bookings last seven days
      .mockResolvedValueOnce([]) // invoices today
      .mockResolvedValueOnce([]) // invoices this month
      .mockResolvedValueOnce([]) // invoices previous month
      .mockResolvedValueOnce([]) // recent bookings
      .mockResolvedValueOnce([]) // all bookings for total revenue calculation
    prismaMocks.userFindMany.mockResolvedValue([])
    prismaMocks.staffFindMany.mockResolvedValue([])
    prismaMocks.foodOrderFindMany
      .mockResolvedValueOnce([]) // food orders today
      .mockResolvedValueOnce([]) // food orders this month
      .mockResolvedValueOnce([]) // recent orders
    prismaMocks.taskFindMany
      .mockResolvedValueOnce([]) // all tasks
      .mockResolvedValueOnce([]) // recent tasks
    prismaMocks.guestReviewAggregate.mockResolvedValue({
      _avg: { rating: null },
      _count: { id: 0 },
    })

    const analytics = await computeDashboardAnalytics(new Date('2025-01-01T08:00:00.000Z'))

    // Note: summary only includes fields from DashboardSummary interface
    expect(analytics.summary).toMatchObject({
      occupancyRate: 0,
      bookingGrowthRate: 0,
      todayRevenue: 0,
      monthlyRevenue: 0,
      todayBookings: 0,
      monthlyBookings: 0,
    })

    expect(analytics.recentActivity).toEqual({
      bookings: [],
      topRooms: [],
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

