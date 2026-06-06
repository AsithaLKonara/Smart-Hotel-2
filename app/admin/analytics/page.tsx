"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DollarSign, Users, Bed, UtensilsCrossed, TrendingUp, TrendingDown, Calendar, Loader2, Download, FileText, FileSpreadsheet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)
  const [range, setRange] = useState('month')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessManagerFeatures(session)) {
      router.push('/auth/signin')
      return
    }

    fetchAnalytics()
  }, [session, status, router, range])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/dashboard?range=${range}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    window.open(`/api/analytics/export?range=${range}&format=${format}`, '_blank')
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const stats = {
    revenue: {
      total: analytics?.totalRevenue || 0,
      trend: 12.5,
      change: 'up'
    },
    bookings: {
      total: analytics?.totalBookings || 0,
      trend: 8.3,
      change: 'up'
    },
    occupancy: {
      total: analytics?.occupancyRate || 0,
      trend: -2.1,
      change: 'down'
    },
    orders: {
      total: analytics?.totalOrders || 0,
      trend: 15.2,
      change: 'up'
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">Analytics Dashboard</h1>
          <p className="text-white/60">
            Track your hotel's performance, revenue, and key metrics.
          </p>
        </div>
        <div className="flex items-center gap-4">
            <select 
                value={range} 
                onChange={e => setRange(e.target.value)}
                className="bg-[#1a1a1a] border border-white/10 text-white p-2 rounded-lg"
            >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
            </select>
            <Button onClick={() => handleExport('pdf')} variant="outline" className="bg-[#1a1a1a] border-white/10 text-white hover:bg-white/5">
                <FileText className="w-4 h-4 mr-2 text-red-400" /> Export PDF
            </Button>
            <Button onClick={() => handleExport('excel')} variant="outline" className="bg-[#1a1a1a] border-white/10 text-white hover:bg-white/5">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-400" /> Export Excel
            </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
          <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              {stats.revenue.change === 'up' ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold">${stats.revenue.total.toLocaleString()}</p>
              <p className={`text-sm ${stats.revenue.change === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenue.change === 'up' ? '+' : ''}{stats.revenue.trend}% from last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              {stats.bookings.change === 'up' ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</p>
              <p className="text-2xl font-bold">{stats.bookings.total}</p>
              <p className={`text-sm ${stats.bookings.change === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stats.bookings.change === 'up' ? '+' : ''}{stats.bookings.trend}% from last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Bed className="w-6 h-6 text-purple-600" />
              </div>
              {stats.occupancy.change === 'up' ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Occupancy Rate</p>
              <p className="text-2xl font-bold">{stats.occupancy.total}%</p>
              <p className={`text-sm ${stats.occupancy.change === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stats.occupancy.change === 'up' ? '+' : ''}{stats.occupancy.trend}% from last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-orange-600" />
              </div>
              {stats.orders.change === 'up' ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Food Orders</p>
              <p className="text-2xl font-bold">{stats.orders.total}</p>
              <p className={`text-sm ${stats.orders.change === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stats.orders.change === 'up' ? '+' : ''}{stats.orders.trend}% from last month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Room Bookings</span>
                <span className="font-semibold">${(stats.revenue.total * 0.75).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Food & Beverage</span>
                <span className="font-semibold">${(stats.revenue.total * 0.20).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '20%' }}></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Other Services</span>
                <span className="font-semibold">${(stats.revenue.total * 0.05).toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New booking received</p>
                  <p className="text-xs text-gray-500">Room 301 - 2 nights</p>
                </div>
                <span className="text-xs text-gray-500">5m ago</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Food order placed</p>
                  <p className="text-xs text-gray-500">Room 205 - $45.00</p>
                </div>
                <span className="text-xs text-gray-500">12m ago</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Guest check-in</p>
                  <p className="text-xs text-gray-500">Room 410</p>
                </div>
                <span className="text-xs text-gray-500">1h ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </div>
  )
}










