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
  Activity,
  ArrowUpRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { canAccessAdminDashboard, getUserRole } from '@/lib/rbac-helpers'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { BookingCalendar } from '@/components/admin/booking-calendar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { KpiCard } from '@/components/ui/kpi-card'

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
  const [activeTab, setActiveTab] = useState('analytics')

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
      // Admin stats pages: 30s timeout (heavy queries, allow more time for initial load)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
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
      <div className="min-h-screen bg-transparent flex items-center justify-center">
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
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <PremiumSpinner size="lg" text="Loading Analytics..." />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white/60">Failed to load dashboard data</p>
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
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <DashboardHeader 
          title="Admin Cockpit"
          firstName={session?.user?.name?.split(' ')[0]}
          subtitle="Real-time business intelligence, revenue performance, and unified operational control for the entire hotel ecosystem."
          role="System Administrator"
          unreadNotifications={5}
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <KpiCard 
            title="Bookings Velocity" 
            value={summary?.totalBookings ?? 0} 
            delta={summary?.bookingGrowthRate ?? 0}
            deltaLabel="vs last month"
            icon={<Calendar className="w-5 h-5" />}
            color="primary"
            sparklineData={[{value: 12}, {value: 18}, {value: 15}, {value: 22}]}
            aiInsight="High conversion period detected"
          />
          <KpiCard 
            title="Yield Revenue" 
            value={formatCurrency(summary?.totalRevenue ?? 0)} 
            icon={<DollarSign className="w-5 h-5" />}
            color="success"
            comparativeValue={`Goal: ${formatCurrency((summary?.totalRevenue ?? 0) * 1.2)}`}
            sparklineData={[{value: 800}, {value: 950}, {value: 1100}, {value: 1050}]}
          />
          <KpiCard 
            title="Occupancy Pacing" 
            value={`${summary?.occupancyRate ?? 0}%`} 
            icon={<Bed className="w-5 h-5" />}
            color="info"
            delta={2.4}
            aiInsight="ADR pacing ahead by 5.2%"
            sparklineData={[{value: 65}, {value: 72}, {value: 78}, {value: 76}]}
          />
          <KpiCard 
            title="SLA Performance" 
            value="98.2%" 
            icon={<Star className="w-5 h-5" />}
            color="luxury"
            delta={0.5}
            deltaLabel="Quality Index"
            sparklineData={[{value: 95}, {value: 97}, {value: 98}, {value: 98}]}
          />
        </div>

        {/* PMS Interactive Tabs */}
        <div className="flex border-b border-white/10 mb-8 mt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-6 text-sm font-bold tracking-wider uppercase border-b-2 whitespace-nowrap transition-all duration-300 ${activeTab === 'analytics' ? 'border-primary text-primary font-serif' : 'border-transparent text-white/40 hover:text-white/80'}`}
          >
            Analytics & Cockpit
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-3 px-6 text-sm font-bold tracking-wider uppercase border-b-2 whitespace-nowrap transition-all duration-300 ${activeTab === 'calendar' ? 'border-primary text-primary font-serif' : 'border-transparent text-white/40 hover:text-white/80'}`}
          >
            PMS Booking Calendar
          </button>
        </div>

        {activeTab === 'calendar' ? (
          <div className="bg-transparent mb-8">
            <BookingCalendar onMutationSuccess={fetchDashboardData} />
          </div>
        ) : (
          <>
            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Occupancy Chart */}
              <Card className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
              <BarChart3 className="w-5 h-5 mr-2 text-primary" />
              Occupancy Forecast (30 Days)
            </h3>
            <div className="space-y-3">
              {charts?.occupancy && charts.occupancy.length > 0 ? (
                charts.occupancy.slice(0, 7).map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-white/60">
                        {formatDate(day.date)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-white/60">
                        {day.occupied}/{day.occupied + day.available}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {day.occupancyRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/40 text-center py-4">No occupancy data available</p>
              )}
            </div>
          </Card>

          {/* Room Status */}
          <Card className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
              <PieChart className="w-5 h-5 mr-2 text-primary" />
              Room Status
            </h3>
            <div className="space-y-3">
              {charts?.roomStatus && charts.roomStatus.length > 0 ? (
                charts.roomStatus.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${status.status === 'AVAILABLE' ? 'bg-emerald-400' :
                        status.status === 'OCCUPIED' ? 'bg-red-400' :
                          status.status === 'MAINTENANCE' ? 'bg-yellow-400' : 'bg-white/20'
                        }`}></div>
                      <span className="text-sm text-white/60 capitalize">
                        {status.status.toLowerCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white">{status.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/40 text-center py-4">No room status data available</p>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity and Top Rooms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
              <Activity className="w-5 h-5 mr-2 text-primary" />
              Recent Bookings
            </h3>
            <div className="space-y-4">
              {recentActivity?.bookings && recentActivity.bookings.length > 0 ? (
                recentActivity.bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <div>
                      <p className="font-medium text-white">{booking.guestName}</p>
                      <p className="text-sm text-white/60">
                        Room {booking.roomNumber} • {booking.roomType}
                      </p>
                      <p className="text-xs text-white/40 font-mono mt-1">
                        {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={`${getStatusColor(booking.status)} text-[10px] uppercase font-bold tracking-wider px-2 py-0.5`}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                      <p className="text-sm font-medium text-white font-mono mt-1.5">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/40 text-center py-4">No recent bookings</p>
              )}
            </div>
          </Card>

          {/* Top Performing Rooms */}
          <Card className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
              <Star className="w-5 h-5 mr-2 text-primary" />
              Top Performing Rooms
            </h3>
            <div className="space-y-4">
              {recentActivity?.topRooms && recentActivity.topRooms.length > 0 ? (
                recentActivity.topRooms.map((room) => (
                  <div key={room.rank} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center justify-center font-bold">
                        {room.rank}
                      </div>
                      <div>
                        <p className="font-medium text-white">Room {room.roomNumber}</p>
                        <p className="text-sm text-white/60">{room.roomType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white font-mono">
                        {room.bookingCount} bookings
                      </p>
                      <p className="text-xs text-white/40 font-mono mt-0.5">
                        {formatCurrency(room.revenue)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/40 text-center py-4">No top rooms data available</p>
              )}
            </div>
          </Card>
        </div>

        {/* SmartHotel OS Unified Operations Cockpit */}
        <div className="mt-8 border-t border-white/10 pt-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-amber-500/10 text-amber-400 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                Unified Hospitality OS
              </Badge>
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white font-serif">SmartHotel OS Command Deck</h2>
            <p className="text-sm text-white/50 mt-1">E2E Operational center controllers, real-time sync systems, and yield dashboards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">            <Card className="p-6 bg-gradient-to-br from-primary/20 to-luxury-500/10 border-luxury-500/30 hover:border-luxury-500 hover:-translate-y-1 transition-all flex flex-col justify-between h-[200px] cursor-pointer rounded-3xl group shadow-2xl relative overflow-hidden" onClick={() => router.push('/admin/executive')}>
              <div className="absolute -right-6 -top-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="w-32 h-32 text-luxury-500" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-luxury-400 font-black uppercase tracking-[0.2em]">Strategy Control</span>
                  <Badge className="bg-luxury-500 text-white border-none text-[8px] uppercase tracking-widest font-black px-2 py-0.5 shadow-lg shadow-luxury-500/20">PREDICTIVE</Badge>
                </div>
                <h3 className="text-xl font-serif font-bold text-white mt-4 group-hover:text-luxury-400 transition-colors">Executive Mission Control</h3>
                <p className="text-[11px] text-white/50 mt-2 line-clamp-2 leading-relaxed">Pacing gauges, yield intelligence, ADR governance, and AI-driven strategic reporting.</p>
              </div>
              <div className="text-right text-[10px] font-black uppercase tracking-widest text-luxury-400 flex items-center justify-end gap-2 mt-4">
                Launch Command Center <ArrowUpRight className="w-3 h-3" />
              </div>
            </Card>

            <Card className="p-5 bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/50 hover:bg-white/10 hover:-translate-y-0.5 transition-all flex flex-col justify-between h-[200px] cursor-pointer rounded-3xl group shadow-lg" onClick={() => router.push('/admin/receptionist')}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">Front Desk</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5">LIVE DESK</Badge>
                </div>
                <h3 className="text-lg font-bold text-white mt-3 group-hover:text-primary transition-colors">Receptionist Center</h3>
                <p className="text-[11px] text-white/50 mt-1 line-clamp-2 leading-relaxed">Arrivals/departures timeline, live occupancy room maps, and VIP check-in alerts.</p>
              </div>
              <div className="text-right text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-end gap-1 mt-4 group-hover:translate-x-1 transition-transform">
                Open Workspace &rarr;
              </div>
            </Card>

            <Card className="p-5 bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/50 hover:bg-white/10 hover:-translate-y-0.5 transition-all flex flex-col justify-between h-[200px] cursor-pointer rounded-3xl group shadow-lg" onClick={() => router.push('/kitchen/dashboard')}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">Culinary Queue</span>
                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5">KDS INTERACTIVE</Badge>
                </div>
                <h3 className="text-lg font-bold text-white mt-3 group-hover:text-primary transition-colors">Kitchen Display (KDS)</h3>
                <p className="text-[11px] text-white/50 mt-1 line-clamp-2 leading-relaxed">Real-time room order tickers, SLA timers, and allergy alerts.</p>
              </div>
              <div className="text-right text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-end gap-1 mt-4 group-hover:translate-x-1 transition-transform">
                Open KDS Screen &rarr;
              </div>
            </Card>

            <Card className="p-5 bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/50 hover:bg-white/10 hover:-translate-y-0.5 transition-all flex flex-col justify-between h-[200px] cursor-pointer rounded-3xl group shadow-lg" onClick={() => router.push('/admin/housekeeping')}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">Service Quality</span>
                  <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5">DISPATCH</Badge>
                </div>
                <h3 className="text-lg font-bold text-white mt-3 group-hover:text-primary transition-colors">Housekeeping Hub</h3>
                <p className="text-[11px] text-white/50 mt-1 line-clamp-2 leading-relaxed">Mobile task lists, clean sweep timers, and room release gates.</p>
              </div>
              <div className="text-right text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-end gap-1 mt-4 group-hover:translate-x-1 transition-transform">
                Open Workspace &rarr;
              </div>
            </Card>

            <Card className="p-5 bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/50 hover:bg-white/10 hover:-translate-y-0.5 transition-all flex flex-col justify-between h-[200px] cursor-pointer rounded-3xl group shadow-lg" onClick={() => router.push('/admin/ota')}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">Integrations</span>
                  <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5">SYNC ENGINE</Badge>
                </div>
                <h3 className="text-lg font-bold text-white mt-3 group-hover:text-primary transition-colors">OTA Channel Manager</h3>
                <p className="text-[11px] text-white/50 mt-1 line-clamp-2 leading-relaxed">Booking.com/Airbnb synchronization and webhook log terminals.</p>
              </div>
              <div className="text-right text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-end gap-1 mt-4 group-hover:translate-x-1 transition-transform">
                Open Channel Sync &rarr;
              </div>
            </Card>

            <Card className="p-5 bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/50 hover:bg-white/10 hover:-translate-y-0.5 transition-all flex flex-col justify-between h-[200px] cursor-pointer rounded-3xl group shadow-lg" onClick={() => router.push('/admin/staff')}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">Personnel</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5">HR GOVERNANCE</Badge>
                </div>
                <h3 className="text-lg font-bold text-white mt-3 group-hover:text-primary transition-colors">Staff & HR Center</h3>
                <p className="text-[11px] text-white/50 mt-1 line-clamp-2 leading-relaxed">Onboarding, role assignments, department structures, and payroll snapshots.</p>
              </div>
              <div className="text-right text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-end gap-1 mt-4 group-hover:translate-x-1 transition-transform">
                Open Workspace &rarr;
              </div>
            </Card>

            <Card className="p-5 bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/50 hover:bg-white/10 hover:-translate-y-0.5 transition-all flex flex-col justify-between h-[200px] cursor-pointer rounded-3xl group shadow-lg" onClick={() => router.push('/admin/settings')}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">Governance</span>
                  <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5">ROOT CONTROL</Badge>
                </div>
                <h3 className="text-lg font-bold text-white mt-3 group-hover:text-primary transition-colors">Global Configuration</h3>
                <p className="text-[11px] text-white/50 mt-1 line-clamp-2 leading-relaxed">Property branding, contact infrastructure, operational protocols, and heritage content.</p>
              </div>
              <div className="text-right text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-end gap-1 mt-4 group-hover:translate-x-1 transition-transform">
                Configure System &rarr;
              </div>
            </Card>
          </div>
        </div>
      </>
    )}
      </div>
    </div>
  )
}

function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <PremiumSpinner size="lg" text="Decompressing system matrices..." />
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
