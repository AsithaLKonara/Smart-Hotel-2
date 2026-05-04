"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  Bed,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { canAccessAdminDashboard, getUserRole } from '@/lib/rbac-helpers'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

interface DashboardData {
  summary: {
    totalBookings: number
    todayBookings: number
    monthlyBookings: number
    yearlyBookings: number
    totalRevenue: number
    todayRevenue: number
    monthlyRevenue: number
    yearlyRevenue: number
    occupancyRate: number
    avgBookingValue: number
    bookingGrowthRate: number
  }
  charts: {
    occupancy: Array<{
      date: string
      occupied: number
      available: number
      occupancyRate: number
    }>
    roomStatus: Array<{
      status: string
      count: number
    }>
    revenue: {
      today: number
      month: number
      year: number
    }
  }
  recentActivity: {
    bookings: Array<{
      id: string
      guestName: string
      roomNumber: string
      roomType: string
      checkIn: string
      checkOut: string
      totalAmount: number
      status: string
      createdAt: string
    }>
    topRooms: Array<{
      rank: number
      roomNumber: string
      roomType: string
      bookingCount: number
      revenue: number
    }>
  }
  guestStats: {
    totalGuests: number
    totalStaff: number
    totalAdmins: number
  }
}

function AdminDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('today')

  useEffect(() => {
    // Only redirect if we're sure the user is unauthenticated or has wrong role
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session && !canAccessAdminDashboard(session)) {
      toast.error('You do not have permission to access the admin dashboard')
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session) {
      fetchDashboardData()
    }
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      // Admin stats pages: 10s timeout (heavy queries, allow more time for initial load)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const response = await fetch('/api/analytics/dashboard', {
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'include',
      })
      clearTimeout(timeoutId)
      
      if (controller.signal.aborted) {
        throw new Error('Request timeout - analytics computation took too long')
      }
      
      const data = await response.json()

      if (response.ok) {
        // Transform the API response to match DashboardData interface
        const transformedData: DashboardData = {
          summary: {
            totalBookings: data.summary?.monthlyBookings ?? data.summary?.totalBookings ?? 0,
            todayBookings: data.summary?.todayBookings ?? 0,
            monthlyBookings: data.summary?.monthlyBookings ?? 0,
            yearlyBookings: data.summary?.yearlyBookings ?? 0,
            totalRevenue: data.summary?.totalRevenue ?? data.summary?.monthlyRevenue ?? 0,
            todayRevenue: data.summary?.todayRevenue ?? 0,
            monthlyRevenue: data.summary?.monthlyRevenue ?? 0,
            yearlyRevenue: data.summary?.yearlyRevenue ?? 0,
            occupancyRate: data.summary?.occupancyRate ?? 0,
            avgBookingValue: data.summary?.avgBookingValue ?? (data.summary?.monthlyRevenue && data.summary?.monthlyBookings 
              ? Number((data.summary.monthlyRevenue / data.summary.monthlyBookings).toFixed(2)) 
              : 0),
            bookingGrowthRate: data.summary?.bookingGrowthRate ?? 0,
          },
          charts: data.charts || {
            occupancy: [],
            roomStatus: [],
            revenue: {
              today: data.summary?.todayRevenue ?? 0,
              month: data.summary?.monthlyRevenue ?? 0,
              year: data.summary?.yearlyRevenue ?? 0,
            },
          },
          recentActivity: {
            bookings: (data.recentActivity?.bookings || []).map((booking: any) => ({
              id: booking.id || '',
              guestName: booking.guestName || 'Guest',
              roomNumber: booking.roomNumber || 'N/A',
              roomType: booking.roomType || 'Standard',
              checkIn: booking.checkIn || booking.createdAt || new Date().toISOString(),
              checkOut: booking.checkOut || new Date().toISOString(),
              totalAmount: booking.totalAmount || 0,
              status: booking.status || 'PENDING',
              createdAt: booking.createdAt || new Date().toISOString(),
            })),
            topRooms: data.recentActivity?.topRooms || [],
          },
          guestStats: data.guestStats || {
            totalGuests: 0,
            totalStaff: 0,
            totalAdmins: 0,
          },
        }
        setDashboardData(transformedData)
      } else {
        toast.error('Failed to load dashboard data')
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      // Handle AbortError gracefully
      if (error.name === 'AbortError' || error.message?.includes('timeout') || error.message?.includes('aborted')) {
        toast.error('Dashboard data is taking longer than expected. Please refresh the page.')
      } else {
        toast.error('Failed to load dashboard data')
      }
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'checked_in': return 'bg-blue-100 text-blue-800'
      case 'checked_out': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    )
  }

  // Early return if not authenticated or wrong role
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PremiumSpinner size="lg" text="Authenticating..." />
      </div>
    )
  }

  // Check authentication and role before rendering using RBAC helper
  if (!canAccessAdminDashboard(session)) {
    return null // Will redirect via useEffect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PremiumSpinner size="lg" text="Loading Analytics..." />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard data</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const { summary, charts, recentActivity, guestStats } = dashboardData || {
    summary: {
      totalBookings: 0,
      todayBookings: 0,
      monthlyBookings: 0,
      yearlyBookings: 0,
      totalRevenue: 0,
      todayRevenue: 0,
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      occupancyRate: 0,
      avgBookingValue: 0,
      bookingGrowthRate: 0,
    },
    charts: {
      occupancy: [],
      roomStatus: [],
      revenue: {
        today: 0,
        month: 0,
        year: 0,
      },
    },
    recentActivity: {
      bookings: [],
      topRooms: [],
    },
    guestStats: { totalGuests: 0, totalStaff: 0, totalAdmins: 0 }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time insights and analytics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.totalBookings ?? 0}</p>
                <div className="flex items-center mt-2">
                  {getGrowthIcon(summary?.bookingGrowthRate ?? 0)}
                  <span className={`text-sm ml-1 ${(summary?.bookingGrowthRate ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(summary?.bookingGrowthRate ?? 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-amber-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.totalRevenue ?? 0)}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Monthly: {formatCurrency(summary?.monthlyRevenue ?? 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                <p className="text-2xl font-bold text-gray-900">{summary?.occupancyRate ?? 0}%</p>
                <p className="text-sm text-gray-500 mt-2">
                  Avg Booking: {formatCurrency(summary?.avgBookingValue ?? 0)}
                </p>
              </div>
              <Bed className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Guests</p>
                <p className="text-2xl font-bold text-gray-900">{guestStats?.totalGuests || 0}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Staff: {guestStats?.totalStaff || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Occupancy Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Occupancy Forecast (30 Days)
            </h3>
            <div className="space-y-3">
              {charts?.occupancy && charts.occupancy.length > 0 ? (
                charts.occupancy.slice(0, 7).map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        {formatDate(day.date)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {day.occupied}/{day.occupied + day.available}
                      </span>
                      <span className="text-sm font-medium">
                        {day.occupancyRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No occupancy data available</p>
              )}
            </div>
          </Card>

          {/* Room Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Room Status
            </h3>
            <div className="space-y-3">
              {charts?.roomStatus && charts.roomStatus.length > 0 ? (
                charts.roomStatus.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status.status === 'AVAILABLE' ? 'bg-green-500' :
                        status.status === 'OCCUPIED' ? 'bg-red-500' :
                        status.status === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-sm text-gray-600 capitalize">
                        {status.status.toLowerCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{status.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No room status data available</p>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity and Top Rooms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Bookings
            </h3>
            <div className="space-y-4">
              {recentActivity?.bookings && recentActivity.bookings.length > 0 ? (
                recentActivity.bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{booking.guestName}</p>
                      <p className="text-sm text-gray-600">
                        Room {booking.roomNumber} • {booking.roomType}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No recent bookings</p>
              )}
            </div>
          </Card>

          {/* Top Performing Rooms */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Top Performing Rooms
            </h3>
            <div className="space-y-4">
              {recentActivity?.topRooms && recentActivity.topRooms.length > 0 ? (
                recentActivity.topRooms.map((room) => (
                  <div key={room.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold">
                        {room.rank}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Room {room.roomNumber}</p>
                        <p className="text-sm text-gray-600">{room.roomType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {room.bookingCount} bookings
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(room.revenue)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No top rooms data available</p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => router.push('/admin/bookings')}
              className="h-16 flex flex-col items-center justify-center space-y-2"
            >
              <Calendar className="w-6 h-6" />
              <span>Manage Bookings</span>
            </Button>
            <Button 
              onClick={() => router.push('/admin/rooms')}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2"
            >
              <Bed className="w-6 h-6" />
              <span>Room Management</span>
            </Button>
            <Button 
              onClick={() => router.push('/admin/staff')}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center space-y-2"
            >
              <Users className="w-6 h-6" />
              <span>Staff Management</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<AdminDashboardLoading />}>
      <AdminDashboardContent />
    </Suspense>
  )
}
