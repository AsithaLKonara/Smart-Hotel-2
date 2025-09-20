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
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: Clock
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: CheckCircle
  },
  CHECKED_IN: {
    label: 'Checked In',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle
  },
  CHECKED_OUT: {
    label: 'Checked Out',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: CheckCircle
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: XCircle
  }
}

const sourceConfig = {
  direct: { label: 'Direct', color: 'bg-blue-500' },
  'booking.com': { label: 'Booking.com', color: 'bg-blue-600' },
  expedia: { label: 'Expedia', color: 'bg-green-500' },
  agoda: { label: 'Agoda', color: 'bg-purple-500' },
  airbnb: { label: 'Airbnb', color: 'bg-pink-500' }
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
  const sourceConf = sourceConfig[booking.source]
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
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", statusConf.bgColor)}>
            <StatusIcon className={cn("w-5 h-5", statusConf.color)} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Booking #{booking.id}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
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
          <div className="text-sm text-gray-500">
            {formatDate(booking.createdAt)}
          </div>
        </div>
      </div>

      {/* Room Details */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Room {booking.roomNumber}</div>
            <div className="text-sm text-gray-600">{booking.roomType}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">{getNights()} nights</div>
            <div className="text-xs text-gray-400">
              {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
            </div>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-900">
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Occupancy Summary</h3>
        <Bed className="w-5 h-5 text-blue-600" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{averageOccupancy.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Average Occupancy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{peakDay.occupancy}%</div>
          <div className="text-sm text-gray-600">Peak Occupancy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalBookings}</div>
          <div className="text-sm text-gray-600">Total Bookings</div>
        </div>
      </div>
    </div>
  )
}

// Main Booking Analytics Component
function BookingAnalyticsContent({ onExport, onBookingClick }: BookingAnalyticsProps) {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([])
  const [guestInsights, setGuestInsights] = useState<GuestInsight | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Mock data generation
  useEffect(() => {
    setIsLoading(true)
    
    setTimeout(() => {
      // Generate mock bookings
      const mockBookings: BookingData[] = [
        {
          id: 'BK001',
          guestName: 'John Smith',
          roomNumber: '101',
          roomType: 'Deluxe Suite',
          checkIn: new Date('2024-01-15'),
          checkOut: new Date('2024-01-18'),
          status: 'CHECKED_IN',
          totalAmount: 450.00,
          guests: 2,
          source: 'direct',
          createdAt: new Date('2024-01-10')
        },
        {
          id: 'BK002',
          guestName: 'Sarah Johnson',
          roomNumber: '205',
          roomType: 'Standard Room',
          checkIn: new Date('2024-01-16'),
          checkOut: new Date('2024-01-20'),
          status: 'CONFIRMED',
          totalAmount: 320.00,
          guests: 1,
          source: 'booking.com',
          createdAt: new Date('2024-01-12')
        },
        {
          id: 'BK003',
          guestName: 'Mike Davis',
          roomNumber: '312',
          roomType: 'Presidential Suite',
          checkIn: new Date('2024-01-17'),
          checkOut: new Date('2024-01-19'),
          status: 'PENDING',
          totalAmount: 680.00,
          guests: 4,
          source: 'expedia',
          createdAt: new Date('2024-01-14')
        }
      ]

      // Generate occupancy data for last 30 days
      const mockOccupancy: OccupancyData[] = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        
        mockOccupancy.push({
          date: date.toISOString().split('T')[0],
          occupancy: Math.floor(Math.random() * 40 + 60), // 60-100%
          revenue: Math.random() * 2000 + 1000,
          bookings: Math.floor(Math.random() * 8 + 2),
          cancellations: Math.floor(Math.random() * 3)
        })
      }

      const mockInsights: GuestInsight = {
        totalGuests: 156,
        repeatGuests: 42,
        newGuests: 114,
        averageStay: 2.3,
        topSource: 'booking.com',
        satisfaction: 4.8
      }

      setBookings(mockBookings)
      setOccupancyData(mockOccupancy)
      setGuestInsights(mockInsights)
      setIsLoading(false)
    }, 1000)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const filteredBookings = selectedStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === selectedStatus)

  const statusFilters = [
    { key: 'all', label: 'All Bookings', count: bookings.length },
    { key: 'PENDING', label: 'Pending', count: bookings.filter(b => b.status === 'PENDING').length },
    { key: 'CONFIRMED', label: 'Confirmed', count: bookings.filter(b => b.status === 'CONFIRMED').length },
    { key: 'CHECKED_IN', label: 'Checked In', count: bookings.filter(b => b.status === 'CHECKED_IN').length },
    { key: 'CHECKED_OUT', label: 'Checked Out', count: bookings.filter(b => b.status === 'CHECKED_OUT').length }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Analytics</h1>
              <p className="text-gray-600">Comprehensive insights into guest bookings and occupancy</p>
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+12.5%</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{bookings.length}</div>
            <div className="text-gray-600">Total Bookings</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+8.3%</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{guestInsights?.totalGuests}</div>
            <div className="text-gray-600">Total Guests</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                <Bed className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+5.2%</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{guestInsights?.averageStay}</div>
            <div className="text-gray-600">Avg Stay (days)</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+2.1%</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{guestInsights?.satisfaction}</div>
            <div className="text-gray-600">Guest Rating</div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6 overflow-x-auto"
        >
          {statusFilters.map((filter) => (
            <motion.button
              key={filter.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedStatus(filter.key)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all font-medium flex items-center gap-2",
                selectedStatus === filter.key
                  ? "border-blue-500 bg-blue-500 text-white shadow-lg"
                  : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
              )}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-bold",
                  selectedStatus === filter.key
                    ? "bg-white/20 text-white"
                    : "bg-blue-100 text-blue-600"
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
            {guestInsights && <OccupancySummary data={occupancyData} />}
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
            data={Object.entries(sourceConfig).map(([source, config]) => ({
              label: config.label,
              value: bookings.filter(b => b.source === source).length,
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
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
            <Calendar className="w-5 h-5 text-blue-600" />
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
