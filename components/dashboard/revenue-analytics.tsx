"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Users,
  Bed,
  Utensils,
  PieChart,
  BarChart3,
  Download,
  Filter,
  RefreshCw
} from "lucide-react"
import { PremiumButton } from "../ui/premium-button"
import { ChartCard } from "../ui/chart-card"
import { cn } from "@/lib/utils"

// Types
interface RevenueData {
  date: string
  roomRevenue: number
  restaurantRevenue: number
  totalRevenue: number
  bookings: number
  orders: number
}

interface RevenueBreakdown {
  roomType: string
  revenue: number
  percentage: number
  bookings: number
}

interface RevenueAnalyticsProps {
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void
}

const timeRanges = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' }
]

function computeRangeBounds(range: string): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)

  switch (range) {
    case 'week': {
      const start = new Date(normalizedEnd)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      return { startDate: start, endDate: normalizedEnd }
    }
    case 'quarter': {
      const start = new Date(normalizedEnd)
      start.setMonth(start.getMonth() - 2, 1)
      start.setHours(0, 0, 0, 0)
      return { startDate: start, endDate: normalizedEnd }
    }
    case 'year': {
      const start = new Date(normalizedEnd.getFullYear(), 0, 1)
      start.setHours(0, 0, 0, 0)
      return { startDate: start, endDate: normalizedEnd }
    }
    case 'month':
    default: {
      const start = new Date(normalizedEnd.getFullYear(), normalizedEnd.getMonth(), 1)
      start.setHours(0, 0, 0, 0)
      return { startDate: start, endDate: normalizedEnd }
    }
  }
}

const roomTypes = [
  { name: 'Standard', color: 'bg-blue-500' },
  { name: 'Deluxe', color: 'bg-green-500' },
  { name: 'Suite', color: 'bg-purple-500' },
  { name: 'Presidential', color: 'bg-amber-500' }
]

// Revenue summary card
function RevenueSummaryCard({ 
  title, 
  value, 
  change, 
  trend, 
  subtitle, 
  icon: Icon 
}: {
  title: string
  value: string
  change: number
  trend: 'up' | 'down' | 'stable'
  subtitle?: string
  icon: any
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl">
          <Icon className="w-6 h-6 text-amber-600" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium",
          trend === 'up' && "text-green-600",
          trend === 'down' && "text-red-600",
          trend === 'stable' && "text-gray-600"
        )}>
          {trend === 'up' && <TrendingUp className="w-4 h-4" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-gray-600">{title}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </motion.div>
  )
}

// Room type breakdown component
function RoomTypeBreakdown({ data }: { data: RevenueBreakdown[] }) {
  const total = data.reduce((sum, item) => sum + item.revenue, 0)

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Revenue by Room Type</h3>
        <PieChart className="w-5 h-5 text-blue-600" />
      </div>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <motion.div
            key={item.roomType}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-4 h-4 rounded-full", roomTypes[index]?.color || 'bg-gray-500')} />
              <span className="font-medium text-gray-900">{item.roomType}</span>
            </div>
            
            <div className="text-right">
              <div className="font-semibold text-gray-900">${item.revenue.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</div>
            </div>
          </motion.div>
        ))}
        
        {/* Progress bars */}
        <div className="mt-6 space-y-2">
          {data.map((item, index) => (
            <div key={item.roomType} className="relative">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={cn("h-2 rounded-full", roomTypes[index]?.color || 'bg-gray-500')}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Time range selector
function TimeRangeSelector({ 
  selectedRange, 
  onRangeChange 
}: {
  selectedRange: string
  onRangeChange: (range: string) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {timeRanges.map((range) => (
        <motion.button
          key={range.value}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onRangeChange(range.value)}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all font-medium",
            selectedRange === range.value
              ? "border-amber-500 bg-amber-500 text-white shadow-lg"
              : "border-gray-200 bg-white text-gray-700 hover:border-amber-300"
          )}
        >
          {range.label}
        </motion.button>
      ))}
    </div>
  )
}

// Main Revenue Analytics Component
function RevenueAnalyticsContent({ onExport }: RevenueAnalyticsProps) {
  const [selectedRange, setSelectedRange] = useState<string>('month')
  const [isLoading, setIsLoading] = useState(true)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [roomBreakdown, setRoomBreakdown] = useState<RevenueBreakdown[]>([])
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    roomRevenue: 0,
    restaurantRevenue: 0,
    totalBookings: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    occupancyRate: 0,
    revenueChange: 0
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchAnalytics() {
      try {
    setIsLoading(true)
        setError(null)

        const analyticsResponse = await fetch(`/api/analytics?range=${selectedRange}`)

        if (analyticsResponse.status === 401) {
          // Unauthorized - redirect to sign in
          window.location.href = '/auth/signin?callbackUrl=' + encodeURIComponent('/dashboard/revenue')
          return
        }

        if (!analyticsResponse.ok) {
          throw new Error('Failed to load analytics data')
        }

        const analyticsData = await analyticsResponse.json()

        const { startDate, endDate } = computeRangeBounds(selectedRange)
        const dashboardResponse = await fetch(`/api/analytics/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        
        if (dashboardResponse.status === 401) {
          // Unauthorized - redirect to sign in
          window.location.href = '/auth/signin?callbackUrl=' + encodeURIComponent('/dashboard/revenue')
          return
        }
        const dashboardData = dashboardResponse.ok ? await dashboardResponse.json() : null

        if (!isMounted) return

        const revenueSeries: RevenueData[] = (analyticsData.dailyRevenue || []).map((entry: any) => ({
          date: entry.date,
          roomRevenue: entry.revenue,
          restaurantRevenue: 0,
          totalRevenue: entry.revenue,
          bookings: entry.bookings ?? 0,
          orders: 0
        }))

        const totalRevenue = analyticsData.revenue?.period?.current ?? analyticsData.revenue?.thisMonth ?? 0
        const previousRevenue = analyticsData.revenue?.period?.previous ?? analyticsData.revenue?.thisWeek ?? 0
        const revenueChange = previousRevenue === 0
          ? (totalRevenue > 0 ? 100 : 0)
          : ((totalRevenue - previousRevenue) / previousRevenue) * 100

        const topRooms = analyticsData.topRooms || []
        const roomsTotalRevenue = topRooms.reduce((sum: number, room: any) => sum + (room.revenue ?? 0), 0)
        const roomBreakdownData: RevenueBreakdown[] = topRooms.map((room: any) => {
          const percentage = roomsTotalRevenue > 0 ? (room.revenue / roomsTotalRevenue) * 100 : 0
          return {
            roomType: room.type,
            revenue: room.revenue,
            percentage,
            bookings: room.bookings
          }
        })

        const restaurantOrdersToday = dashboardData?.summary?.restaurantOrdersToday ?? 0
        const restaurantRevenueToday = dashboardData?.summary?.restaurantRevenueToday ?? 0
        const averageOrderValueToday = dashboardData?.summary?.averageOrderValueToday ?? 0

        setRevenueData(revenueSeries)
        setRoomBreakdown(roomBreakdownData)
      setSummary({
        totalRevenue,
          roomRevenue: roomsTotalRevenue,
          restaurantRevenue: restaurantRevenueToday,
          totalBookings: analyticsData.bookings?.total ?? 0,
          totalOrders: restaurantOrdersToday,
          averageOrderValue: averageOrderValueToday,
          occupancyRate: analyticsData.occupancy?.average ?? 0,
          revenueChange
        })
      } catch (err) {
        console.error(err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load analytics')
        }
      } finally {
        if (isMounted) {
      setIsLoading(false)
        }
      }
    }

    fetchAnalytics()

    return () => {
      isMounted = false
    }
  }, [selectedRange])
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Analytics Unavailable</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue Analytics</h1>
              <p className="text-gray-600">Comprehensive financial insights and performance metrics</p>
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

        {/* Time Range Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <TimeRangeSelector
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
          />
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <RevenueSummaryCard
            title="Total Revenue"
            value={`$${summary.totalRevenue.toLocaleString()}`}
            change={Math.abs(summary.revenueChange)}
            trend={summary.revenueChange >= 0 ? 'up' : 'down'}
            subtitle={`vs previous ${selectedRange}`}
            icon={DollarSign}
          />
          
          <RevenueSummaryCard
            title="Room Revenue"
            value={`$${summary.roomRevenue.toLocaleString()}`}
            change={summary.totalBookings}
            trend={summary.totalBookings >= 0 ? 'up' : 'stable'}
            subtitle={`${summary.totalBookings} bookings`}
            icon={Bed}
          />
          
          <RevenueSummaryCard
            title="Restaurant Revenue"
            value={`$${summary.restaurantRevenue.toLocaleString()}`}
            change={summary.totalOrders}
            trend={summary.totalOrders > 0 ? 'up' : 'stable'}
            subtitle={`${summary.totalOrders} orders`}
            icon={Utensils}
          />
          
          <RevenueSummaryCard
            title="Avg Order Value"
            value={`$${summary.averageOrderValue.toFixed(2)}`}
            change={0}
            trend="stable"
            subtitle="Restaurant orders"
            icon={BarChart3}
          />
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trends */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ChartCard
              title="Revenue Trends"
              subtitle={`Daily revenue breakdown over ${selectedRange}`}
              data={revenueData.map(d => ({
                label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: d.totalRevenue,
                roomRevenue: d.roomRevenue,
                restaurantRevenue: d.restaurantRevenue
              }))}
              type="line"
              color="success"
              showLegend={true}
            />
          </motion.div>

          {/* Room Type Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <RoomTypeBreakdown data={roomBreakdown} />
          </motion.div>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bookings vs Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ChartCard
              title="Bookings vs Orders"
              subtitle="Daily activity comparison"
              data={revenueData.map(d => ({
                label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                bookings: d.bookings,
                orders: d.orders
              }))}
              type="bar"
              color="primary"
              showLegend={true}
            />
          </motion.div>

          {/* Revenue Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <ChartCard
              title="Revenue Distribution"
              subtitle="Room vs Restaurant revenue split"
              data={[
                { label: 'Room Revenue', value: summary.roomRevenue, color: 'bg-blue-500' },
                { label: 'Restaurant Revenue', value: summary.restaurantRevenue, color: 'bg-green-500' }
              ]}
              type="pie"
              color="info"
            />
          </motion.div>
        </div>

        {/* Key Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-6"
        >
          <h3 className="text-xl font-semibold mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-bold">{summary.occupancyRate.toFixed(1)}%</div>
              <div className="text-amber-100">Average Occupancy Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                $
                {revenueData.length
                  ? (summary.totalRevenue / revenueData.length).toFixed(0)
                  : summary.totalRevenue.toFixed(0)}
              </div>
              <div className="text-amber-100">Daily Average Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {summary.totalBookings > 0
                  ? (summary.totalOrders / summary.totalBookings).toFixed(1)
                  : '0.0'}
              </div>
              <div className="text-amber-100">Orders per Booking</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Export with error boundary
export function RevenueAnalytics(props: RevenueAnalyticsProps) {
  return <RevenueAnalyticsContent {...props} />
}
