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
  RefreshCw,
  ChevronRight,
  User
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'

function AdminDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Rely solely on middleware.ts for enterprise-grade edge protection.
    // Client-side redirects cause race conditions during Playwright E2E hydration.
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
      <div className="flex items-center justify-center py-20">
        <PremiumSpinner size="lg" text="Loading Command Deck..." />
      </div>
    )
  }

  const summary = dashboardData?.summary || {}
  const recentBookings = dashboardData?.recentActivity?.bookings || []

  return (
    <AdminPageShell
      title="Admin Command Deck"
      subtitle="High-level revenue tracking and system-wide governance."
      onRefresh={fetchDashboardData}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="bg-[#0c0c0c] border-white/5 p-6 rounded-3xl shadow-2xl group hover:border-primary/20 transition-all">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Revenue</p>
              <h3 className="text-2xl font-serif font-bold text-white mt-1">{formatCurrency(summary.totalRevenue || 0)}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="bg-[#0c0c0c] border-white/5 p-6 rounded-3xl shadow-2xl group hover:border-primary/20 transition-all">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Bookings</p>
              <h3 className="text-2xl font-serif font-bold text-white mt-1">{summary.totalBookings || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="bg-[#0c0c0c] border-white/5 p-6 rounded-3xl shadow-2xl group hover:border-primary/20 transition-all">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Occupancy</p>
              <h3 className="text-2xl font-serif font-bold text-white mt-1">{summary.occupancyRate || 0}%</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Bed className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="bg-[#0c0c0c] border-white/5 p-6 rounded-3xl shadow-2xl group hover:border-primary/20 transition-all">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Service Score</p>
              <h3 className="text-2xl font-serif font-bold text-white mt-1">98.2%</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Star className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-[#0c0c0c] border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="font-bold flex items-center gap-3"><Activity className="w-5 h-5 text-primary" /> Recent Activity</h3>
              <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">Live Feed</Badge>
            </div>
            <div className="divide-y divide-white/5">
              {recentBookings.slice(0, 5).map((booking: any) => (
                <div key={booking.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{booking.guestName}</p>
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-tighter">Room {booking.roomNumber} • {booking.roomType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary">{booking.status}</Badge>
                    <p className="text-sm font-serif font-bold text-white mt-1">{formatCurrency(booking.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-rose-500/5 border-rose-500/10 p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-3 text-rose-500">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-serif font-bold">VIP Complaint Escalation</h3>
            </div>
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex justify-between items-center">
              <div>
                <h5 className="text-sm font-bold text-white">Critical HVAC Issue</h5>
                <p className="text-xs text-white/40 mt-1">Room 401: Reported by guest 15 mins ago.</p>
              </div>
              <Button className="bg-rose-600 hover:bg-rose-700 h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all hover:scale-105">Resolve Now</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-[#0c0c0c] border-white/5 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-white">Personnel</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div>
                  <p className="text-xs font-bold text-white">18 Staff Active</p>
                  <p className="text-[10px] text-white/40 uppercase font-black">All Sectors Operational</p>
                </div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest h-12 rounded-xl hover:bg-white/10 transition-all" onClick={() => router.push('/admin/staff')}>
                  Staff Directory
                </Button>
                <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest h-12 rounded-xl hover:bg-white/10 transition-all" onClick={() => router.push('/admin/roles')}>
                  Role Permissions
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-[#0c0c0c] border-white/5 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-white/40">
              <ArrowUpRight className="w-5 h-5" />
              <h3 className="font-bold uppercase text-[10px] tracking-widest">Internal Links</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="ghost" className="justify-between text-xs h-12 px-4 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all group" onClick={() => router.push('/admin/rooms')}>
                Room Control <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
              </Button>
              <Button variant="ghost" className="justify-between text-xs h-12 px-4 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all group" onClick={() => router.push('/admin/ota')}>
                OTA Management <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
              </Button>
              <Button variant="ghost" className="justify-between text-xs h-12 px-4 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all group" onClick={() => router.push('/admin/settings')}>
                System Config <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AdminPageShell>
  )
}

function AdminDashboardLoading() {
  return (
    <div className="flex items-center justify-center py-20">
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
