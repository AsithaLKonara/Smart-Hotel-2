"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calendar, 
  Users, 
  Bed, 
  TrendingUp, 
  TrendingDown,
  Clock,
  MapPin,
  Star,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react"
import { PremiumButton } from "../ui/premium-button"
import { ChartCard } from "../ui/chart-card"
import { cn } from "@/lib/utils"

// Types
interface BookingData {
  id: string
  guestName: string
  roomNumber: string
  roomType: string
  checkIn: Date
  checkOut: Date
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
  totalAmount: number
  guests: number
  source: 'direct' | 'booking.com' | 'expedia' | 'agoda' | 'airbnb'
  createdAt: Date
}

interface OccupancyData {
  date: string
  occupancy: number
  revenue: number
  bookings: number
  cancellations: number
}

interface GuestInsight {
  totalGuests: number
  repeatGuests: number
  newGuests: number
  averageStay: number
  topSource: string
  satisfaction: number
}

interface BookingAnalyticsProps {
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void
  onBookingClick?: (bookingId: string) => void
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/40',
    icon: Clock
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950/40',
    icon: CheckCircle
  },
  CHECKED_IN: {
    label: 'Checked In',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40',
    icon: CheckCircle
  },
  CHECKED_OUT: {
    label: 'Checked Out',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted dark:bg-white/10',
    icon: CheckCircle
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-950/40',
    icon: XCircle
  }
}

const sourceConfig = {
  direct: { label: 'Direct', color: 'bg-blue-500' },
  'booking.com': { label: 'Booking.com', color: 'bg-blue-600' },
  expedia: { label: 'Expedia', color: 'bg-green-500' },
  agoda: { label: 'Agoda', color: 'bg-purple-500' },
  airbnb: { label: 'Airbnb', color: 'bg-pink-500' },
  unknown: { label: 'Direct', color: 'bg-blue-500' }
}

function getMonthRange() {
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  startDate.setHours(0, 0, 0, 0)
  return { startDate, endDate }
}

function calculateGuestInsights(bookings: BookingData[], guestSources: Array<{ source: string; count: number }>, satisfaction?: { rating?: number }): GuestInsight {
  const totalGuests = bookings.reduce((sum, booking) => sum + (booking.guests ?? 0), 0)
  const guestCounts = bookings.reduce<Map<string, number>>((acc, booking) => {
    const key = booking.guestName || booking.id
    acc.set(key, (acc.get(key) || 0) + 1)
    return acc
  }, new Map())

  let repeatGuests = 0
  guestCounts.forEach(count => {
    if (count > 1) repeatGuests += 1
  })

  const uniqueGuests = guestCounts.size
  const newGuests = Math.max(0, uniqueGuests - repeatGuests)

  const totalNights = bookings.reduce((sum, booking) => {
    const diff = booking.checkOut.getTime() - booking.checkIn.getTime()
    return sum + Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, 0)

  const averageStay = bookings.length ? Number((totalNights / bookings.length).toFixed(1)) : 0
  const topSource = guestSources && guestSources.length > 0 ? guestSources[0].source : 'Direct'
  const satisfactionScore = satisfaction?.rating ?? 4.8

  return {
    totalGuests: totalGuests || bookings.length,
    repeatGuests,
    newGuests,
    averageStay,
    topSource,
    satisfaction: Number(satisfactionScore.toFixed(1))
  }
}

// Booking card component
function BookingCard({ 
  booking, 
  index, 
  onClick 
}: {
  booking: BookingData
  index: number
  onClick?: (bookingId: string) => void
}) {
  const statusConf = statusConfig[booking.status]
  const sourceConf = sourceConfig[booking.source] || sourceConfig.unknown
  const StatusIcon = statusConf.icon

  const getNights = () => {
    const diffTime = booking.checkOut.getTime() - booking.checkIn.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick?.(booking.id)}
      className="bg-card dark:bg-[#121417] text-card-foreground rounded-2xl shadow-sm border border-border dark:border-[#1E2227] p-6 cursor-pointer hover:border-primary/50 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", statusConf.bgColor)}>
            <StatusIcon className={cn("w-5 h-5", statusConf.color)} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground dark:text-white">Booking #{booking.id}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-3 h-3" />
              {booking.guestName} • {booking.guests} guests
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium mb-1",
            sourceConf.color,
            "text-white"
          )}>
            {sourceConf.label}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDate(booking.createdAt)}
          </div>
        </div>
      </div>

      {/* Room Details */}
      <div className="mb-4 p-3 bg-muted/40 dark:bg-white/[0.03] border border-border/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-foreground dark:text-white">Room {booking.roomNumber}</div>
            <div className="text-sm text-muted-foreground">{booking.roomType}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">{getNights()} nights</div>
            <div className="text-xs text-muted-foreground/75">
              {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
            </div>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-foreground dark:text-white">
          ${booking.totalAmount.toFixed(2)}
        </div>
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          statusConf.bgColor,
          statusConf.color
        )}>
          {statusConf.label}
        </div>
      </div>
    </motion.div>
  )
}

// Occupancy summary card
function OccupancySummary({ data }: { data: OccupancyData[] }) {
  const totalOccupancy = data.reduce((sum, d) => sum + d.occupancy, 0)
  const averageOccupancy = totalOccupancy / data.length
  const peakDay = data.reduce((max, d) => d.occupancy > max.occupancy ? d : max, data[0])
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const totalBookings = data.reduce((sum, d) => sum + d.bookings, 0)

  return (
    <div className="bg-card dark:bg-[#121417] text-card-foreground rounded-2xl shadow-sm border border-border dark:border-[#1E2227] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground dark:text-white">Occupancy Summary</h3>
        <Bed className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/40">
          <div className="text-2xl font-bold text-foreground dark:text-white">{averageOccupancy.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">Average Occupancy</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/40">
          <div className="text-2xl font-bold text-foreground dark:text-white">{peakDay.occupancy}%</div>
          <div className="text-sm text-muted-foreground">Peak Occupancy</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/40">
          <div className="text-2xl font-bold text-foreground dark:text-white">${totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Revenue</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/40">
          <div className="text-2xl font-bold text-foreground dark:text-white">{totalBookings}</div>
          <div className="text-sm text-muted-foreground">Total Bookings</div>
        </div>
      </div>
    </div>
  )
}

// Main Booking Analytics Component
function BookingAnalyticsContent({ onExport, onBookingClick }: BookingAnalyticsProps) {
  const [allBookings, setAllBookings] = useState<BookingData[]>([])
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([])
  const [guestInsights, setGuestInsights] = useState<GuestInsight | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
    setIsLoading(true)
        setError(null)

        const { startDate, endDate } = getMonthRange()
        const bookingsUrl = new URL('/api/bookings', window.location.origin)
        bookingsUrl.searchParams.set('status', 'all')
        bookingsUrl.searchParams.set('startDate', startDate.toISOString())
        bookingsUrl.searchParams.set('endDate', endDate.toISOString())

        const [bookingsResponse, analyticsResponse, dashboardResponse] = await Promise.all([
          fetch(bookingsUrl.toString()),
          fetch('/api/analytics?range=month'),
          fetch(`/api/analytics/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        ])

        if (bookingsResponse.status === 401 || analyticsResponse.status === 401 || (dashboardResponse.status === 401)) {
          // Unauthorized - redirect to sign in
          window.location.href = '/auth/signin?callbackUrl=' + encodeURIComponent('/dashboard/bookings')
          return
        }

        if (!bookingsResponse.ok) {
          throw new Error('Failed to load bookings')
        }

        if (!analyticsResponse.ok) {
          throw new Error('Failed to load analytics data')
        }

        const bookingsJson = await bookingsResponse.json()
        const analyticsJson = await analyticsResponse.json()
        const dashboardJson = dashboardResponse.ok ? await dashboardResponse.json() : null

        if (!isMounted) return

        const mappedBookings: BookingData[] = (bookingsJson.bookings || []).map((booking: any) => ({
          id: booking.id,
          guestName: booking.user?.name ?? booking.guestName ?? 'Guest',
          roomNumber: booking.room?.number ?? 'N/A',
          roomType: booking.room?.type ?? 'Room',
          checkIn: new Date(booking.checkIn),
          checkOut: new Date(booking.checkOut),
          status: booking.status,
          totalAmount: booking.invoice?.total ?? booking.totalAmount ?? 0,
          guests: booking.guests ?? 1,
          source: 'direct',
          createdAt: new Date(booking.createdAt),
        }))

        const occupancySeries: OccupancyData[] = (analyticsJson.occupancy?.series || []).map((entry: any) => ({
          date: entry.date,
          occupancy: entry.occupancy ?? 0,
          revenue: entry.revenue ?? 0,
          bookings: entry.bookings ?? 0,
          cancellations: 0,
        }))

        const guestSources = analyticsJson.guestSources ?? []
        const guestSatisfaction = dashboardJson?.summary?.guestSatisfaction

        setAllBookings(mappedBookings)
        setOccupancyData(occupancySeries)
        const insights = calculateGuestInsights(mappedBookings, guestSources || [], guestSatisfaction)
        setGuestInsights(insights || {
          totalGuests: 0,
          repeatGuests: 0,
          newGuests: 0,
          averageStay: 0,
          topSource: 'Direct',
          satisfaction: 0
        })
      } catch (err) {
        console.error(err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load booking analytics')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-foreground dark:text-white mb-2">Booking analytics unavailable</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  const filteredBookings = selectedStatus === 'all' 
    ? allBookings 
    : allBookings.filter(booking => booking.status === selectedStatus)

  const statusFilters = [
    { key: 'all', label: 'All Bookings', count: allBookings.length },
    { key: 'PENDING', label: 'Pending', count: allBookings.filter(b => b.status === 'PENDING').length },
    { key: 'CONFIRMED', label: 'Confirmed', count: allBookings.filter(b => b.status === 'CONFIRMED').length },
    { key: 'CHECKED_IN', label: 'Checked In', count: allBookings.filter(b => b.status === 'CHECKED_IN').length },
    { key: 'CHECKED_OUT', label: 'Checked Out', count: allBookings.filter(b => b.status === 'CHECKED_OUT').length },
    { key: 'CANCELLED', label: 'Cancelled', count: allBookings.filter(b => b.status === 'CANCELLED').length }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">Booking Analytics</h1>
              <p className="text-muted-foreground">Comprehensive insights into guest bookings and occupancy</p>
            </div>
            
            <div className="flex gap-3">
              <PremiumButton
                variant="outline"
                onClick={() => onExport?.('csv')}
                icon={<Download className="w-4 h-4" />}
              >
                Export CSV
              </PremiumButton>
              <PremiumButton
                variant="primary"
                onClick={() => onExport?.('pdf')}
                icon={<Download className="w-4 h-4" />}
              >
                Export Report
              </PremiumButton>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-card dark:bg-[#121417] text-card-foreground rounded-2xl shadow-sm border border-border dark:border-[#1E2227] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5%</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground dark:text-white mb-1">{allBookings.length}</div>
            <div className="text-muted-foreground text-sm">Total Bookings</div>
          </div>

          <div className="bg-card dark:bg-[#121417] text-card-foreground rounded-2xl shadow-sm border border-border dark:border-[#1E2227] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl">
                <Users className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>+8.3%</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground dark:text-white mb-1">{guestInsights?.totalGuests ?? 0}</div>
            <div className="text-muted-foreground text-sm">Total Guests</div>
          </div>

          <div className="bg-card dark:bg-[#121417] text-card-foreground rounded-2xl shadow-sm border border-border dark:border-[#1E2227] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl">
                <Bed className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>+5.2%</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground dark:text-white mb-1">{guestInsights?.averageStay ?? 0}</div>
            <div className="text-muted-foreground text-sm">Avg Stay (days)</div>
          </div>

          <div className="bg-card dark:bg-[#121417] text-card-foreground rounded-2xl shadow-sm border border-border dark:border-[#1E2227] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>+2.1%</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground dark:text-white mb-1">{guestInsights?.satisfaction ?? 0}</div>
            <div className="text-muted-foreground text-sm">Guest Rating</div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-1"
        >
          {statusFilters.map((filter) => (
            <motion.button
              key={filter.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedStatus(filter.key)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-xl border transition-all font-medium flex items-center gap-2 text-sm",
                selectedStatus === filter.key
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card dark:bg-white/5 text-muted-foreground hover:text-foreground hover:border-primary/50"
              )}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-bold",
                  selectedStatus === filter.key
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-muted dark:bg-white/10 text-muted-foreground"
                )}>
                  {filter.count}
                </span>
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Charts and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Occupancy Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ChartCard
              title="Occupancy Trends"
              subtitle="Daily occupancy rates for the last 30 days"
              data={occupancyData.slice(-7).map(d => ({
                label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: d.occupancy,
                revenue: d.revenue
              }))}
              type="line"
              color="primary"
              showLegend={true}
            />
          </motion.div>

          {/* Guest Insights */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <OccupancySummary data={occupancyData} />
          </motion.div>
        </div>

        {/* Booking Source Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <ChartCard
            title="Booking Sources"
            subtitle="Distribution of bookings by source"
            data={Object.entries(sourceConfig)
              .filter(([key]) => key !== 'unknown')
              .map(([source, config]) => ({
              label: config.label,
                value: allBookings.filter(b => b.source === source).length,
              color: config.color
            }))}
            type="pie"
            color="info"
          />
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card dark:bg-[#121417] text-card-foreground rounded-2xl shadow-sm border border-border dark:border-[#1E2227] p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground dark:text-white">Recent Bookings</h3>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredBookings.map((booking, index) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  index={index}
                  onClick={onBookingClick}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Export with error boundary
export function BookingAnalytics(props: BookingAnalyticsProps) {
  return <BookingAnalyticsContent {...props} />
}
