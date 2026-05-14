"use client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  Users,
  DollarSign,
  Bed,
  Star,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

function AdminDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session && !canAccessAdminDashboard(session)) {
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
      const response = await fetch('/api/analytics/dashboard', {
        cache: 'no-store'
      })
      const data = await response.json()
      if (response.ok) {
        setDashboardData(data)
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <PremiumSpinner size="lg" text="Loading Command Deck..." />
      </div>
    )
  }

  const summary = dashboardData?.summary || {}
  const recentBookings = dashboardData?.recentActivity?.bookings || []

  return (
    <div className="p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Admin Command Deck</h1>
          <p className="text-slate-400 text-sm mt-1">High-level revenue tracking and system-wide governance.</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" className="bg-white/5 border-white/10">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="bg-white/[0.02] border-white/5 p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Revenue</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(summary.totalRevenue || 0)}</h3>
            </div>
            <DollarSign className="text-emerald-500 w-8 h-8" />
          </div>
        </Card>
        <Card className="bg-white/[0.02] border-white/5 p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Bookings</p>
              <h3 className="text-2xl font-bold mt-1">{summary.totalBookings || 0}</h3>
            </div>
            <TrendingUp className="text-primary w-8 h-8" />
          </div>
        </Card>
        <Card className="bg-white/[0.02] border-white/5 p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Occupancy</p>
              <h3 className="text-2xl font-bold mt-1">{summary.occupancyRate || 0}%</h3>
            </div>
            <Bed className="text-blue-400 w-8 h-8" />
          </div>
        </Card>
        <Card className="bg-white/[0.02] border-white/5 p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Service Score</p>
              <h3 className="text-2xl font-bold mt-1">98.2%</h3>
            </div>
            <Star className="text-amber-400 w-8 h-8" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-white/[0.02] border-white/5">
            <CardHeader className="border-b border-white/5 p-4 flex flex-row justify-between items-center">
              <h3 className="font-bold flex items-center"><Activity className="w-5 h-5 mr-2 text-primary" /> Recent Activity</h3>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {recentBookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div>
                      <p className="font-bold text-sm">{booking.guestName}</p>
                      <p className="text-xs text-slate-400">Room {booking.roomNumber} • {booking.roomType}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[9px] uppercase border-white/10">{booking.status}</Badge>
                      <p className="text-xs font-bold mt-1">{formatCurrency(booking.totalAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/5">
            <CardHeader className="border-b border-white/5 p-4">
              <h3 className="font-bold flex items-center"><ShieldAlert className="w-5 h-5 mr-2 text-rose-500" /> System Complaints</h3>
            </CardHeader>
            <CardContent className="p-4">
              <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-sm font-bold">VIP Complaint Escalation</h5>
                    <p className="text-xs text-slate-400 mt-1">Room 401: AC issues not resolved in 30 mins.</p>
                  </div>
                  <Button size="sm" className="bg-rose-500 h-7 text-[10px]">Take Action</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-white/[0.02] border-white/5 p-6">
            <h3 className="font-bold mb-4">Employee Management</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">A</div>
                  <div>
                    <p className="text-xs font-bold">Active Staff</p>
                    <p className="text-[10px] text-slate-400">18 Personnel Online</p>
                  </div>
                </div>
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <Button variant="outline" className="w-full border-white/10 text-xs h-10" onClick={() => router.push('/admin/staff')}>
                Staff Directory
              </Button>
              <Button variant="outline" className="w-full border-white/10 text-xs h-10" onClick={() => router.push('/admin/roles')}>
                Permissions & Roles
              </Button>
            </div>
          </Card>

          <Card className="bg-white/[0.02] border-white/5 p-6">
            <h3 className="font-bold mb-4">Operational Links</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="ghost" className="justify-between text-xs h-10 px-3 hover:bg-white/5" onClick={() => router.push('/admin/rooms')}>
                Room Management <ArrowUpRight className="w-3 h-3" />
              </Button>
              <Button variant="ghost" className="justify-between text-xs h-10 px-3 hover:bg-white/5" onClick={() => router.push('/admin/ota')}>
                OTA Sync Center <ArrowUpRight className="w-3 h-3" />
              </Button>
              <Button variant="ghost" className="justify-between text-xs h-10 px-3 hover:bg-white/5" onClick={() => router.push('/admin/settings')}>
                System Settings <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        </div>
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
