import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subDays, 
  subMonths,
  format,
  eachDayOfInterval,
  eachMonthOfInterval
} from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'month'

    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (range) {
      case 'week':
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      default:
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
    }

    // Get all bookings and rooms for calculations
    const [bookings, rooms, invoices] = await Promise.all([
      prisma.booking.findMany({
        include: {
          room: true,
          user: true,
          invoice: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.room.findMany(),
      prisma.invoice.findMany({
        include: {
          booking: true
        }
      })
    ])

    // Calculate revenue metrics
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
    const thisMonthRevenue = invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt)
        return invoiceDate >= startOfMonth(now) && invoiceDate <= endOfMonth(now)
      })
      .reduce((sum, invoice) => sum + invoice.total, 0)

    const thisWeekRevenue = invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt)
        return invoiceDate >= startOfWeek(now) && invoiceDate <= endOfWeek(now)
      })
      .reduce((sum, invoice) => sum + invoice.total, 0)

    const todayRevenue = invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt)
        return invoiceDate >= startOfDay(now) && invoiceDate <= endOfDay(now)
      })
      .reduce((sum, invoice) => sum + invoice.total, 0)

    // Calculate occupancy metrics
    const totalRooms = rooms.length
    const occupiedRooms = rooms.filter(room => room.status === 'OCCUPIED').length
    const currentOccupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    // Calculate booking metrics
    const totalBookings = bookings.length
    const confirmedBookings = bookings.filter(booking => booking.status === 'CONFIRMED').length
    const pendingBookings = bookings.filter(booking => booking.status === 'PENDING').length
    const cancelledBookings = bookings.filter(booking => booking.status === 'CANCELLED').length

    // Calculate room status
    const availableRooms = rooms.filter(room => room.status === 'AVAILABLE').length
    const maintenanceRooms = rooms.filter(room => room.status === 'MAINTENANCE').length

    // Calculate top performing rooms
    const roomPerformance = rooms.map(room => {
      const roomBookings = bookings.filter(booking => booking.roomId === room.id)
      const roomRevenue = roomBookings.reduce((sum, booking) => {
        const invoice = invoices.find(inv => inv.bookingId === booking.id)
        return sum + (invoice?.total || 0)
      }, 0)
      const occupancyRate = totalRooms > 0 ? Math.round((roomBookings.length / totalBookings) * 100) : 0

      return {
        roomNumber: room.number,
        type: room.type,
        bookings: roomBookings.length,
        revenue: roomRevenue,
        occupancyRate
      }
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

    // Calculate guest sources (mock data for now)
    const guestSources = [
      { source: 'Direct Website', count: Math.floor(totalBookings * 0.4), percentage: 40 },
      { source: 'Online Travel Agencies', count: Math.floor(totalBookings * 0.3), percentage: 30 },
      { source: 'Phone Reservations', count: Math.floor(totalBookings * 0.15), percentage: 15 },
      { source: 'Walk-in', count: Math.floor(totalBookings * 0.1), percentage: 10 },
      { source: 'Corporate', count: Math.floor(totalBookings * 0.05), percentage: 5 },
    ]

    // Calculate daily revenue for the selected range
    const dailyRevenue = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
      const dayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt)
        return bookingDate >= startOfDay(date) && bookingDate <= endOfDay(date)
      })
      
      const dayRevenue = dayBookings.reduce((sum, booking) => {
        const invoice = invoices.find(inv => inv.bookingId === booking.id)
        return sum + (invoice?.total || 0)
      }, 0)

      return {
        date: format(date, 'yyyy-MM-dd'),
        revenue: dayRevenue,
        bookings: dayBookings.length
      }
    })

    // Calculate monthly trends for the last 12 months
    const monthlyTrends = eachMonthOfInterval({
      start: subMonths(now, 11),
      end: now
    }).map(date => {
      const monthBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt)
        return bookingDate >= startOfMonth(date) && bookingDate <= endOfMonth(date)
      })
      
      const monthRevenue = monthBookings.reduce((sum, booking) => {
        const invoice = invoices.find(inv => inv.bookingId === booking.id)
        return sum + (invoice?.total || 0)
      }, 0)

      const monthOccupancy = monthBookings.length > 0 ? 
        Math.round((monthBookings.length / (totalRooms * 30)) * 100) : 0

      return {
        month: format(date, 'MMM yyyy'),
        revenue: monthRevenue,
        bookings: monthBookings.length,
        occupancy: monthOccupancy
      }
    })

    // Calculate occupancy trend (mock calculation)
    const previousPeriodOccupancy = Math.max(0, currentOccupancy - Math.floor(Math.random() * 20))
    const occupancyTrend = currentOccupancy - previousPeriodOccupancy

    const analyticsData = {
      revenue: {
        today: todayRevenue,
        thisWeek: thisWeekRevenue,
        thisMonth: thisMonthRevenue,
        total: totalRevenue
      },
      occupancy: {
        current: currentOccupancy,
        average: Math.round((currentOccupancy + previousPeriodOccupancy) / 2),
        trend: occupancyTrend
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
        cancelled: cancelledBookings
      },
      rooms: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
        maintenance: maintenanceRooms
      },
      topRooms: roomPerformance,
      guestSources,
      dailyRevenue,
      monthlyTrends
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
} 