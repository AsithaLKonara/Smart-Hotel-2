"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Bed, 
  Utensils, 
  DollarSign, 
  Calendar,
  Clock,
  Star,
  Activity,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { KpiCard } from "../ui/kpi-card"
import { ChartCard } from "../ui/chart-card"
import { cn } from "@/lib/utils"

// Types
interface DashboardMetrics {
  occupancy: {
    current: number
    total: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
    change: number
  }
  revenue: {
    today: number
    thisMonth: number
    lastMonth: number
    trend: 'up' | 'down' | 'stable'
    change: number
  }
  bookings: {
    today: number
    thisWeek: number
    pending: number
    confirmed: number
    trend: 'up' | 'down' | 'stable'
    change: number
  }
  restaurant: {
    ordersToday: number
    revenueToday: number
    averageOrderValue: number
    popularItem: string
    trend: 'up' | 'down' | 'stable'
    change: number
  }
  tasks: {
    total: number
    completed: number
    pending: number
    overdue: number
    completionRate: number
  }
  guestSatisfaction: {
    rating: number
    reviews: number
    trend: 'up' | 'down' | 'stable'
    change: number
  }
}

interface RecentActivity {
  id: string
  type: 'booking' | 'order' | 'task' | 'checkin' | 'checkout'
  title: string
  description: string
  timestamp: Date
  status: 'success' | 'warning' | 'info' | 'error'
  amount?: number
}

interface DashboardOverviewProps {
  onNavigate?: (section: string) => void
}

// Trend indicator component
function TrendIndicator({ trend, change }: { trend: 'up' | 'down' | 'stable', change: number }) {
  const isPositive = trend === 'up'
  const isNegative = trend === 'down'
  
  return (
    <div className={cn(
      "flex items-center gap-1 text-sm font-medium",
      isPositive && "text-green-600",
      isNegative && "text-red-600",
      trend === 'stable' && "text-gray-600"
    )}>
      {isPositive && <ArrowUpRight className="w-4 h-4" />}
      {isNegative && <ArrowDownRight className="w-4 h-4" />}
      <span>{Math.abs(change)}%</span>
    </div>
  )
}

// Activity item component
function ActivityItem({ activity, index }: { activity: RecentActivity, index: number }) {
  const getStatusIcon = () => {
    switch (activity.status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />
      default: return <Activity className="w-4 h-4 text-blue-600" />
    }
  }

  const getTypeIcon = () => {
    switch (activity.type) {
      case 'booking': return <Calendar className="w-4 h-4" />
      case 'order': return <Utensils className="w-4 h-4" />
      case 'task': return <CheckCircle className="w-4 h-4" />
      case 'checkin': return <Users className="w-4 h-4" />
      case 'checkout': return <Users className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return timestamp.toLocaleDateString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
        {getTypeIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900 truncate">{activity.title}</h4>
          {getStatusIcon()}
        </div>
        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
          {activity.amount && (
            <span className="text-sm font-medium text-amber-600">
              ${activity.amount.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Main Dashboard Component
function DashboardOverviewContent({ onNavigate }: DashboardOverviewProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - in real app, fetch from API
  useEffect(() => {
    const mockMetrics: DashboardMetrics = {
      occupancy: {
        current: 45,
        total: 50,
        percentage: 90,
        trend: 'up',
        change: 12.5
      },
      revenue: {
        today: 2847.50,
        thisMonth: 45230.75,
        lastMonth: 38950.25,
        trend: 'up',
        change: 16.1
      },
      bookings: {
        today: 8,
        thisWeek: 32,
        pending: 3,
        confirmed: 29,
        trend: 'up',
        change: 8.3
      },
      restaurant: {
        ordersToday: 24,
        revenueToday: 486.75,
        averageOrderValue: 20.28,
        popularItem: 'Grilled Salmon',
        trend: 'up',
        change: 15.2
      },
      tasks: {
        total: 18,
        completed: 12,
        pending: 5,
        overdue: 1,
        completionRate: 66.7
      },
      guestSatisfaction: {
        rating: 4.8,
        reviews: 127,
        trend: 'up',
        change: 5.6
      }
    }

    const mockActivity: RecentActivity[] = [
      {
        id: '1',
        type: 'booking',
        title: 'New Booking',
        description: 'Room 205 - John Smith (2 guests)',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        status: 'success',
        amount: 245.50
      },
      {
        id: '2',
        type: 'order',
        title: 'Food Order',
        description: 'Room 101 - Continental Breakfast + Coffee',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        status: 'success',
        amount: 18.99
      },
      {
        id: '3',
        type: 'checkin',
        title: 'Guest Check-in',
        description: 'Room 312 - Sarah Johnson',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        status: 'success'
      },
      {
        id: '4',
        type: 'task',
        title: 'Task Completed',
        description: 'Room 205 - Housekeeping completed',
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
        status: 'success'
      },
      {
        id: '5',
        type: 'order',
        title: 'Food Order',
        description: 'Room 401 - Caesar Salad + Grilled Salmon',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        status: 'warning',
        amount: 37.98
      }
    ]

    setTimeout(() => {
      setMetrics(mockMetrics)
      setRecentActivity(mockActivity)
      setIsLoading(false)
    }, 1000)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Real-time insights for hotel and restaurant operations</p>
        </motion.div>

        {/* Main KPI Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Occupancy */}
          <KpiCard
            title="Occupancy Rate"
            value={`${metrics.occupancy.current}/${metrics.occupancy.total}`}
            subtitle={`${metrics.occupancy.percentage}%`}
            icon={<Bed className="w-5 h-5" />}
            color="primary"
            trend={<TrendIndicator trend={metrics.occupancy.trend} change={metrics.occupancy.change} />}
          />

          {/* Revenue */}
          <KpiCard
            title="Today's Revenue"
            value={`$${metrics.revenue.today.toLocaleString()}`}
            subtitle={`This month: $${metrics.revenue.thisMonth.toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="success"
            trend={<TrendIndicator trend={metrics.revenue.trend} change={metrics.revenue.change} />}
          />

          {/* Bookings */}
          <KpiCard
            title="Bookings Today"
            value={metrics.bookings.today}
            subtitle={`${metrics.bookings.confirmed} confirmed, ${metrics.bookings.pending} pending`}
            icon={<Calendar className="w-5 h-5" />}
            color="info"
            trend={<TrendIndicator trend={metrics.bookings.trend} change={metrics.bookings.change} />}
          />

          {/* Restaurant */}
          <KpiCard
            title="Restaurant Orders"
            value={metrics.restaurant.ordersToday}
            subtitle={`Avg: $${metrics.restaurant.averageOrderValue.toFixed(2)}`}
            icon={<Utensils className="w-5 h-5" />}
            color="warning"
            trend={<TrendIndicator trend={metrics.restaurant.trend} change={metrics.restaurant.change} />}
          />
        </motion.div>

        {/* Secondary Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Tasks */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Task Management</h3>
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Tasks</span>
                <span className="font-medium">{metrics.tasks.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed</span>
                <span className="font-medium text-green-600">{metrics.tasks.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">{metrics.tasks.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Overdue</span>
                <span className="font-medium text-red-600">{metrics.tasks.overdue}</span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Completion Rate</span>
                  <span>{metrics.tasks.completionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.tasks.completionRate}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Guest Satisfaction */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Guest Satisfaction</h3>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.guestSatisfaction.rating}</div>
              <div className="flex justify-center mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < Math.floor(metrics.guestSatisfaction.rating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600 mb-2">{metrics.guestSatisfaction.reviews} reviews</div>
              <TrendIndicator 
                trend={metrics.guestSatisfaction.trend} 
                change={metrics.guestSatisfaction.change} 
              />
            </div>
          </div>

          {/* Restaurant Popular Item */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Popular Item</h3>
              <Utensils className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 mb-2">{metrics.restaurant.popularItem}</div>
              <div className="text-sm text-gray-600 mb-2">Most ordered today</div>
              <div className="text-lg font-semibold text-amber-600">
                ${metrics.restaurant.revenueToday.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Restaurant revenue</div>
            </div>
          </div>
        </motion.div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ChartCard
              title="Revenue Trends"
              subtitle="Daily revenue for the last 7 days"
              data={[
                { label: 'Mon', value: 2100 },
                { label: 'Tue', value: 2450 },
                { label: 'Wed', value: 2800 },
                { label: 'Thu', value: 2650 },
                { label: 'Fri', value: 3200 },
                { label: 'Sat', value: 3850 },
                { label: 'Sun', value: metrics.revenue.today }
              ]}
              type="line"
              color="success"
            />
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {recentActivity.map((activity, index) => (
                  <ActivityItem key={activity.id} activity={activity} index={index} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Export with error boundary
export function DashboardOverview(props: DashboardOverviewProps) {
  return (
    <DashboardOverviewContent {...props} />
  )
}
