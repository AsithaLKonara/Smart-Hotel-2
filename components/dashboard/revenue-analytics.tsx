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

interface TimeRange {
  label: string
  value: string
  days: number
}

interface RevenueAnalyticsProps {
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void
}

const timeRanges: TimeRange[] = [
  { label: 'Last 7 Days', value: '7d', days: 7 },
  { label: 'Last 30 Days', value: '30d', days: 30 },
  { label: 'Last 90 Days', value: '90d', days: 90 },
  { label: 'This Year', value: '1y', days: 365 }
]

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
  const [selectedRange, setSelectedRange] = useState('30d')
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
    occupancyRate: 0
  })

  // Mock data generation
  useEffect(() => {
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      const days = timeRanges.find(r => r.value === selectedRange)?.days || 30
      const mockData: RevenueData[] = []
      const mockRoomBreakdown: RevenueBreakdown[] = [
        { roomType: 'Standard', revenue: 45230, percentage: 45.2, bookings: 89 },
        { roomType: 'Deluxe', revenue: 32150, percentage: 32.1, bookings: 56 },
        { roomType: 'Suite', revenue: 15680, percentage: 15.7, bookings: 23 },
        { roomType: 'Presidential', revenue: 6940, percentage: 6.9, bookings: 8 }
      ]

      // Generate time series data
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        
        const roomRevenue = Math.random() * 2000 + 1500
        const restaurantRevenue = Math.random() * 800 + 400
        const bookings = Math.floor(Math.random() * 8 + 2)
        const orders = Math.floor(Math.random() * 25 + 10)

        mockData.push({
          date: date.toISOString().split('T')[0],
          roomRevenue,
          restaurantRevenue,
          totalRevenue: roomRevenue + restaurantRevenue,
          bookings,
          orders
        })
      }

      const totalRevenue = mockData.reduce((sum, d) => sum + d.totalRevenue, 0)
      const roomRevenue = mockData.reduce((sum, d) => sum + d.roomRevenue, 0)
      const restaurantRevenue = mockData.reduce((sum, d) => sum + d.restaurantRevenue, 0)
      const totalBookings = mockData.reduce((sum, d) => sum + d.bookings, 0)
      const totalOrders = mockData.reduce((sum, d) => sum + d.orders, 0)

      setRevenueData(mockData)
      setRoomBreakdown(mockRoomBreakdown)
      setSummary({
        totalRevenue,
        roomRevenue,
        restaurantRevenue,
        totalBookings,
        totalOrders,
        averageOrderValue: restaurantRevenue / totalOrders,
        occupancyRate: (totalBookings / (days * 50)) * 100
      })
      
      setIsLoading(false)
    }, 1000)
  }, [selectedRange])

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
            change={12.5}
            trend="up"
            subtitle={`${selectedRange} period`}
            icon={DollarSign}
          />
          
          <RevenueSummaryCard
            title="Room Revenue"
            value={`$${summary.roomRevenue.toLocaleString()}`}
            change={8.3}
            trend="up"
            subtitle={`${summary.totalBookings} bookings`}
            icon={Bed}
          />
          
          <RevenueSummaryCard
            title="Restaurant Revenue"
            value={`$${summary.restaurantRevenue.toLocaleString()}`}
            change={18.7}
            trend="up"
            subtitle={`${summary.totalOrders} orders`}
            icon={Utensils}
          />
          
          <RevenueSummaryCard
            title="Avg Order Value"
            value={`$${summary.averageOrderValue.toFixed(2)}`}
            change={-2.1}
            trend="down"
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
              <div className="text-2xl font-bold">${(summary.totalRevenue / (timeRanges.find(r => r.value === selectedRange)?.days || 30)).toFixed(0)}</div>
              <div className="text-amber-100">Daily Average Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{(summary.totalOrders / summary.totalBookings).toFixed(1)}</div>
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
