import { Booking, Room } from '@prisma/client'
// No local mock needed anymore.
import { endOfDay, endOfMonth, endOfWeek, eachDayOfInterval, eachMonthOfInterval, format, startOfDay, startOfMonth, startOfWeek, subDays, subMonths } from 'date-fns'
import prisma from '@/lib/db'

export type AnalyticsRange = 'week' | 'month' | 'quarter' | 'year'

export interface RevenueMetrics {
  today: number
  thisWeek: number
  thisMonth: number
  total: number
  period: {
    current: number
    previous: number
  }
}

export interface OccupancySeriesEntry {
  date: string
  occupancy: number
  bookings: number
  revenue: number
}

export interface RevenueSeriesEntry {
  date: string
  revenue: number
  bookings: number
}

export interface MonthlyTrendEntry {
  month: string
  revenue: number
  bookings: number
  occupancy: number
}

export interface GuestSourceEntry {
  source: string
  count: number
  percentage: number
}

export interface RoomPerformanceEntry {
  roomNumber: string
  type: string
  bookings: number
  revenue: number
  occupancyRate: number
}

export interface AnalyticsPayload {
  revenue: RevenueMetrics
  occupancy: {
    current: number
    average: number
    trend: number
    series: OccupancySeriesEntry[]
  }
  bookings: {
    total: number
    confirmed: number
    pending: number
    cancelled: number
  }
  rooms: {
    total: number
    available: number
    occupied: number
    maintenance: number
  }
  topRooms: RoomPerformanceEntry[]
  guestSources: GuestSourceEntry[]
  dailyRevenue: RevenueSeriesEntry[]
  monthlyTrends: MonthlyTrendEntry[]
}

export function normalizeAnalyticsRange(range?: string | null): AnalyticsRange {
  switch ((range ?? '').toLowerCase()) {
    case 'week':
    case 'quarter':
    case 'year':
      return range as AnalyticsRange
    default:
      return 'month'
  }
}

export function getAnalyticsWindow(range: AnalyticsRange, referenceDate = new Date()): {
  startDate: Date
  endDate: Date
  previousStart: Date
  previousEnd: Date
  rangeDays: number
} {
  let startDate: Date
  let endDate: Date

  switch (range) {
    case 'week':
      startDate = startOfWeek(referenceDate)
      endDate = endOfWeek(referenceDate)
      break
    case 'quarter': {
      const quarterStart = subMonths(startOfMonth(referenceDate), 2)
      startDate = quarterStart
      endDate = endOfMonth(referenceDate)
      break
    }
    case 'year':
      startDate = new Date(referenceDate.getFullYear(), 0, 1)
      endDate = new Date(referenceDate.getFullYear(), 11, 31)
      break
    case 'month':
    default:
      startDate = startOfMonth(referenceDate)
      endDate = endOfMonth(referenceDate)
  }

  const rangeDays = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  )
  const previousStart = subDays(startDate, rangeDays)
  const previousEnd = subDays(endDate, rangeDays)

  return { startDate, endDate, previousStart, previousEnd, rangeDays }
}

export async function buildAnalytics(rangeParam: string) {
  const normalizedRange = normalizeAnalyticsRange(rangeParam)
  return computeAnalytics(normalizedRange)
}

export async function computeAnalytics(range: AnalyticsRange, referenceDate = new Date()): Promise<AnalyticsPayload> {
  const { startDate, endDate, previousStart, previousEnd, rangeDays } = getAnalyticsWindow(range, referenceDate)

  // Queries: Get Rooms, Bookings, and real Invoices for the date range
  const [rooms, bookingsCurrent, bookingsPrevious, invoicesAll] =
    await Promise.all([
      prisma.room.findMany(),
      prisma.booking.findMany({
        where: {
          AND: [
            { checkIn: { lte: endDate } },
            { checkOut: { gte: startDate } },
          ],
        },
        // Note: Booking model doesn't have room, user, or invoice relations defined in schema
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.findMany({
        where: {
          AND: [
            { checkIn: { lte: previousEnd } },
            { checkOut: { gte: previousStart } },
          ],
        },
        // Note: Booking model doesn't have room or invoice relations defined in schema
      }),
      prisma.invoice.findMany({
          where: {
              status: { in: ['PAID', 'PENDING'] }
          }
      })
    ])
  
  const invoicesCurrent = invoicesAll.filter((invoice: any) => {
    const date = new Date(invoice.createdAt)
    return date >= startDate && date <= endDate
  })
  
  const invoicesPrevious = invoicesAll.filter((invoice: any) => {
    const date = new Date(invoice.createdAt)
    return date >= previousStart && date <= previousEnd
  })

  const totalRooms = rooms.length
  const occupiedRooms = rooms.filter((room: Room) => room.status === 'OCCUPIED').length
  const availableRooms = rooms.filter((room: Room) => room.status === 'AVAILABLE').length
  const maintenanceRooms = rooms.filter((room: Room) => room.status === 'MAINTENANCE').length

  const invoicesById = new Map<string, any>(invoicesAll.map((invoice: any) => [invoice.bookingId, invoice] as [string, any]))
  const now = referenceDate

  const sumInvoiceTotals = <T extends { total: number | null | undefined }>(items: T[]) =>
    items.reduce((sum, invoice) => sum + (invoice.total ?? 0), 0)

  const filterInvoicesInRange = (items: any[], start: Date, end: Date) =>
    items.filter((invoice: any) => {
      const invoiceDate = new Date(invoice.createdAt)
      return invoiceDate >= start && invoiceDate <= end
    })

  const todayRevenue = sumInvoiceTotals(filterInvoicesInRange(invoicesCurrent, startOfDay(now), endOfDay(now)))
  const thisWeekRevenue = sumInvoiceTotals(filterInvoicesInRange(invoicesCurrent, startOfWeek(now), endOfWeek(now)))
  const thisMonthRevenue = sumInvoiceTotals(filterInvoicesInRange(invoicesCurrent, startOfMonth(now), endOfMonth(now)))
  const totalRevenue = sumInvoiceTotals(invoicesAll)

  const totalBookings = bookingsCurrent.length
  const confirmedBookings = bookingsCurrent.filter((booking: Booking) => booking.status === 'CONFIRMED').length
  const pendingBookings = bookingsCurrent.filter((booking: Booking) => booking.status === 'PENDING').length
  const cancelledBookings = bookingsCurrent.filter((booking: Booking) => booking.status === 'CANCELLED').length

  const roomPerformance: RoomPerformanceEntry[] = rooms
    .map((room: Room) => {
      const roomBookings = bookingsCurrent.filter((booking: Booking) => booking.roomId === room.id)
      const roomRevenue = roomBookings.reduce((sum: number, booking: Booking) => {
        const invoice = invoicesById.get(booking.id)
        return sum + (invoice?.total ?? 0)
      }, 0)

      const occupancyRate = totalBookings > 0 && roomBookings.length > 0
        ? Math.min(100, Math.round((roomBookings.length / rangeDays) * 100))
        : 0

      return {
        roomNumber: room.number,
        type: ('type' in room ? (room as Record<string, unknown>).type as string : room.roomTypeId),
        bookings: roomBookings.length,
        revenue: Number(roomRevenue.toFixed(2)),
        occupancyRate,
      }
    })
    .sort((a: RoomPerformanceEntry, b: RoomPerformanceEntry) => b.revenue - a.revenue)
    .slice(0, 10)

  const dailyRevenue: RevenueSeriesEntry[] = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
    const revenue = sumInvoiceTotals(filterInvoicesInRange(invoicesCurrent, startOfDay(date), endOfDay(date)))
    const bookingsCount = bookingsCurrent.filter((booking: Booking) => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      return checkIn <= endOfDay(date) && checkOut >= startOfDay(date)
    }).length

    return {
      date: format(date, 'yyyy-MM-dd'),
      revenue: Number(revenue.toFixed(2)),
      bookings: bookingsCount,
    }
  })

  const occupancySeries: OccupancySeriesEntry[] = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
    const activeBookings = bookingsCurrent.filter((booking: Booking) => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      return checkIn <= endOfDay(date) && checkOut >= startOfDay(date) && booking.status !== 'CANCELLED'
    })

    const occupied = totalRooms > 0 ? Math.min(totalRooms, activeBookings.length) : 0
    const rate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0
    const revenue = sumInvoiceTotals(filterInvoicesInRange(invoicesCurrent, startOfDay(date), endOfDay(date)))

    return {
      date: format(date, 'yyyy-MM-dd'),
      occupancy: rate,
      bookings: activeBookings.length,
      revenue: Number(revenue.toFixed(2)),
    }
  })

  const monthlyTrends: MonthlyTrendEntry[] = eachMonthOfInterval({
    start: subMonths(now, 11),
    end: now,
  }).map(date => {
    const monthInvoices = invoicesAll.filter((invoice: any) => {
      const createdAt = new Date(invoice.createdAt)
      return createdAt >= startOfMonth(date) && createdAt <= endOfMonth(date)
    })

    const monthBookings = bookingsCurrent.filter((booking: Booking) => {
      const createdAt = new Date(booking.createdAt)
      return createdAt >= startOfMonth(date) && createdAt <= endOfMonth(date)
    })

    const roomNights = monthBookings.reduce((sum: number, booking: Booking) => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      const nights = Math.max(
        0,
        Math.ceil((endOfDay(checkOut).getTime() - startOfDay(checkIn).getTime()) / (1000 * 60 * 60 * 24))
      )
      return sum + nights
    }, 0)

    const daysInMonth = Math.max(1, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate())
    const occupancy = totalRooms > 0 ? Math.round((roomNights / (totalRooms * daysInMonth)) * 100) : 0

    return {
      month: format(date, 'MMM yyyy'),
      revenue: Number(sumInvoiceTotals(monthInvoices).toFixed(2)),
      bookings: monthBookings.length,
      occupancy,
    }
  })

  const currentAverageOccupancy = occupancySeries.length
    ? Math.round(occupancySeries.reduce((sum, entry) => sum + entry.occupancy, 0) / occupancySeries.length)
    : 0

  const previousAverageOccupancy = (() => {
    if (!rangeDays) return 0
    const previousBookings = bookingsPrevious.filter((booking: Booking) => booking.status !== 'CANCELLED')
    if (!previousBookings.length || !totalRooms) return 0

    const occupancyTotals = eachDayOfInterval({ start: previousStart, end: previousEnd }).map(date => {
      const active = previousBookings.filter((booking: Booking) => {
        const checkIn = new Date(booking.checkIn)
        const checkOut = new Date(booking.checkOut)
        return checkIn <= endOfDay(date) && checkOut >= startOfDay(date)
      }).length

      return totalRooms > 0 ? Math.round((Math.min(active, totalRooms) / totalRooms) * 100) : 0
    })

    return occupancyTotals.length
      ? Math.round(occupancyTotals.reduce((sum, value) => sum + value, 0) / occupancyTotals.length)
      : 0
  })()

  const guestSourceMap = bookingsCurrent.reduce((acc: Record<string, number>, booking: Booking) => {
    const source = (booking.paymentMethod || 'PAY_LATER').toUpperCase()
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const guestSources: GuestSourceEntry[] = Object.entries(guestSourceMap)
    .map(([source, count]: [string, unknown]) => {
      const percentage = totalBookings > 0 ? ((count as number) / totalBookings) * 100 : 0
      const label = source
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase())

      return {
        source: label,
        count: Number(count as number),
        percentage: Number(percentage.toFixed(1)),
      }
    })
    .sort((a, b) => b.count - a.count)

  return {
    revenue: {
      today: Number(todayRevenue.toFixed(2)),
      thisWeek: Number(thisWeekRevenue.toFixed(2)),
      thisMonth: Number(thisMonthRevenue.toFixed(2)),
      total: Number(totalRevenue.toFixed(2)),
      period: {
        current: Number(sumInvoiceTotals(invoicesCurrent).toFixed(2)),
        previous: Number(sumInvoiceTotals(invoicesPrevious).toFixed(2)),
      },
    },
    occupancy: {
      current: currentAverageOccupancy,
      average: currentAverageOccupancy,
      trend: currentAverageOccupancy - previousAverageOccupancy,
      series: occupancySeries,
    },
    bookings: {
      total: totalBookings,
      confirmed: confirmedBookings,
      pending: pendingBookings,
      cancelled: cancelledBookings,
    },
    rooms: {
      total: totalRooms,
      available: availableRooms,
      occupied: occupiedRooms,
      maintenance: maintenanceRooms,
    },
    topRooms: roomPerformance,
    guestSources,
    dailyRevenue,
    monthlyTrends,
  }
}
