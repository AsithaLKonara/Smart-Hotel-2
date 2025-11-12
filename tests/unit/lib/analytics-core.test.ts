import { jest } from '@jest/globals'

describe('lib/analytics/core', () => {
  let roomFindMany: jest.Mock
  let bookingFindMany: jest.Mock
  let invoiceFindMany: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    roomFindMany = jest.fn()
    bookingFindMany = jest.fn()
    invoiceFindMany = jest.fn()

    jest.doMock('@/lib/db', () => ({
      __esModule: true,
      default: {
        room: { findMany: roomFindMany },
        booking: { findMany: bookingFindMany },
        invoice: { findMany: invoiceFindMany },
      },
      prisma: {
        room: { findMany: roomFindMany },
        booking: { findMany: bookingFindMany },
        invoice: { findMany: invoiceFindMany },
      },
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('normalizes analytics range values', async () => {
    const { normalizeAnalyticsRange } = await import('@/lib/analytics/core')

    expect(normalizeAnalyticsRange(undefined)).toBe('month')
    expect(normalizeAnalyticsRange('week')).toBe('week')
    expect(normalizeAnalyticsRange('quarter')).toBe('quarter')
    expect(normalizeAnalyticsRange('year')).toBe('year')
    expect(normalizeAnalyticsRange('WEEK')).toBe('WEEK')
    expect(normalizeAnalyticsRange('unsupported')).toBe('month')
  })

  it('derives analytics window boundaries for a given range', async () => {
    const reference = new Date('2025-04-15T12:00:00.000Z')
    const { getAnalyticsWindow } = await import('@/lib/analytics/core')

    const { startDate, endDate, previousStart, previousEnd, rangeDays } = getAnalyticsWindow('month', reference)

    expect(startDate.getTime()).toBeLessThanOrEqual(reference.getTime())
    expect(endDate.getTime()).toBeGreaterThanOrEqual(reference.getTime())
    expect(rangeDays).toBeGreaterThan(0)
    expect(previousEnd.getTime()).toBeLessThan(startDate.getTime())
    expect(previousStart.getTime()).toBeLessThan(previousEnd.getTime())
  })

  it('aggregates analytics metrics across revenue, occupancy, bookings, and sources', async () => {
    const reference = new Date('2025-04-15T12:00:00.000Z')

    const rooms = [
      { id: 'room-1', number: '101', type: 'Deluxe', status: 'OCCUPIED' },
      { id: 'room-2', number: '102', type: 'Suite', status: 'AVAILABLE' },
      { id: 'room-3', number: '103', type: 'Suite', status: 'MAINTENANCE' },
    ]

    const bookingBase = {
      room: rooms[0],
      user: { id: 'user-1', name: 'Alex', email: 'alex@example.com' },
      invoice: null,
    }

    const bookingsCurrent = [
      {
        ...bookingBase,
        id: 'booking-1',
        roomId: 'room-1',
        status: 'CONFIRMED',
        checkIn: new Date('2025-04-10T15:00:00.000Z'),
        checkOut: new Date('2025-04-13T11:00:00.000Z'),
        createdAt: new Date('2025-04-05T09:00:00.000Z'),
        paymentMethod: 'card',
      },
      {
        ...bookingBase,
        id: 'booking-2',
        roomId: 'room-2',
        status: 'PENDING',
        checkIn: new Date('2025-04-20T15:00:00.000Z'),
        checkOut: new Date('2025-04-22T11:00:00.000Z'),
        createdAt: new Date('2025-04-01T10:00:00.000Z'),
        paymentMethod: 'pay_later',
        room: rooms[1],
      },
      {
        ...bookingBase,
        id: 'booking-3',
        roomId: 'room-1',
        status: 'CANCELLED',
        checkIn: new Date('2025-04-18T15:00:00.000Z'),
        checkOut: new Date('2025-04-19T11:00:00.000Z'),
        createdAt: new Date('2025-04-02T08:00:00.000Z'),
        paymentMethod: 'cash',
      },
    ]

    const bookingsPrevious = [
      {
        ...bookingBase,
        id: 'booking-prev',
        roomId: 'room-1',
        status: 'CONFIRMED',
        checkIn: new Date('2025-03-10T15:00:00.000Z'),
        checkOut: new Date('2025-03-12T11:00:00.000Z'),
        createdAt: new Date('2025-03-01T10:00:00.000Z'),
        paymentMethod: 'card',
      },
    ]

    const invoicesAll = [
      {
        id: 'inv-1',
        bookingId: 'booking-1',
        total: 300,
        createdAt: new Date('2025-04-11T12:00:00.000Z'),
        booking: { id: 'booking-1' },
      },
      {
        id: 'inv-2',
        bookingId: 'booking-2',
        total: 200,
        createdAt: new Date('2025-04-21T12:00:00.000Z'),
        booking: { id: 'booking-2' },
      },
      {
        id: 'inv-3',
        bookingId: 'booking-1',
        total: 400,
        createdAt: new Date('2025-04-15T09:30:00.000Z'),
        booking: { id: 'booking-1' },
      },
      {
        id: 'inv-prev',
        bookingId: 'booking-prev',
        total: 150,
        createdAt: new Date('2025-03-10T12:00:00.000Z'),
        booking: { id: 'booking-prev' },
      },
    ]

    const invoicesCurrent = invoicesAll.filter(invoice =>
      invoice.createdAt >= new Date('2025-04-01T00:00:00.000Z') &&
      invoice.createdAt <= new Date('2025-04-30T23:59:59.999Z'),
    )

    const invoicesPrevious = [
      {
        id: 'inv-prev',
        bookingId: 'booking-prev',
        total: 150,
        createdAt: new Date('2025-03-10T12:00:00.000Z'),
      },
    ]

    roomFindMany.mockResolvedValueOnce(rooms)
    bookingFindMany.mockResolvedValueOnce(bookingsCurrent).mockResolvedValueOnce(bookingsPrevious)
    invoiceFindMany
      .mockResolvedValueOnce(invoicesAll)
      .mockResolvedValueOnce(invoicesCurrent)
      .mockResolvedValueOnce(invoicesPrevious)

    const { computeAnalytics } = await import('@/lib/analytics/core')

    const analytics = await computeAnalytics('month', reference)

    expect(roomFindMany).toHaveBeenCalledTimes(1)
    expect(bookingFindMany).toHaveBeenCalledTimes(2)
    expect(invoiceFindMany).toHaveBeenCalledTimes(3)

    expect(analytics.revenue).toEqual({
      today: 400,
      thisWeek: 400,
      thisMonth: 900,
      total: 1050,
      period: {
        current: 900,
        previous: 150,
      },
    })

    expect(analytics.rooms).toEqual({
      total: 3,
      available: 1,
      occupied: 1,
      maintenance: 1,
    })

    expect(analytics.bookings).toEqual({
      total: 3,
      confirmed: 1,
      pending: 1,
      cancelled: 1,
    })

    expect(analytics.topRooms[0]).toMatchObject({
      roomNumber: '101',
      revenue: 400,
      bookings: 2,
    })

    expect(analytics.guestSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'Card', count: 1, percentage: 33.3 }),
        expect.objectContaining({ source: 'Pay Later', count: 1, percentage: 33.3 }),
        expect.objectContaining({ source: 'Cash', count: 1, percentage: 33.3 }),
      ]),
    )

    const midMonthEntry = analytics.dailyRevenue.find(entry => entry.date === '2025-04-15')
    expect(midMonthEntry).toEqual({ date: '2025-04-15', revenue: 400, bookings: expect.any(Number) })

    const aprilTrend = analytics.monthlyTrends.find(entry => entry.month === 'Apr 2025')
    expect(aprilTrend).toMatchObject({
      month: 'Apr 2025',
      revenue: 900,
      bookings: 3,
    })

    expect(analytics.occupancy.series.length).toBeGreaterThan(0)
    expect(typeof analytics.occupancy.trend).toBe('number')
  })
})

