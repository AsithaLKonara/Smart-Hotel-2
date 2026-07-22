"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { useProperty } from '@/contexts/property-context'
import { 
  TrendingUp, 
  Activity, 
  ShieldAlert,
  Users,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function ManagerOperationsCenter() {
  const { data: session, status } = useSession()
  const { activePropertyId } = useProperty()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [financials, setFinancials] = useState({
    revPar: 0,
    adr: 0,
    occupancy: 0,
    activeStaff: 0
  })

  useEffect(() => {
    if (status === 'loading') return;
    
    // If explicitly unauthenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    // If authenticated but unauthorized, redirect to unauthorized page
    if (status === 'authenticated' && !canAccessAdminDashboard(session)) {
      router.push('/unauthorized');
      return;
    }

    if (status === 'authenticated') {
      loadAnalytics();
    }
  }, [session, status, router, activePropertyId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const url = activePropertyId ? `/api/analytics/dashboard?propertyId=${activePropertyId}` : '/api/analytics/dashboard'
      const res = await fetch(url).then(r => r.json()).catch(() => null)
      if (res && res.summary) {
        setFinancials({
          revPar: Math.round(Number(res.summary.todayRevenue) || 0),
          adr: res.summary.avgBookingValue || 0,
          occupancy: Number(res.summary.occupancyRate) || 0,
          activeStaff: res.guestStats?.totalStaff || 0
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <PremiumSpinner size="lg" text="Loading Management Metrics..." />
      </div>
    )
  }

  return (
    <div className="p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Manager Console</h1>
          <p className="text-slate-400 text-sm mt-1">Operational oversight and high-level performance tracking.</p>
        </div>
        <Button onClick={loadAnalytics} variant="outline" className="bg-white/5 border-white/10">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white/[0.02] border-white/5 p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Revenue Today</p>
              <h3 className="text-2xl font-bold mt-1">LKR {financials.revPar.toLocaleString()}</h3>
            </div>
            <Activity className="text-primary w-8 h-8" />
          </div>
        </Card>
        <Card className="bg-white/[0.02] border-white/5 p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Occupancy</p>
              <h3 className="text-2xl font-bold mt-1">{financials.occupancy}%</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="text-emerald-500 w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="bg-white/[0.02] border-white/5 p-6 cursor-pointer hover:bg-white/[0.04]" onClick={() => router.push('/admin/staff')}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Active Staff</p>
              <h3 className="text-2xl font-bold mt-1">{financials.activeStaff} Personnel</h3>
            </div>
            <Users className="text-blue-400 w-8 h-8" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="border-b border-white/5 p-4 flex flex-row justify-between items-center">
            <h3 className="font-bold flex items-center"><ShieldAlert className="w-5 h-5 mr-2 text-rose-500" /> Pending Complaints</h3>
            <Badge className="bg-rose-500/20 text-rose-500">4 Active</Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="text-sm font-bold">AC Failure - Room 401</h5>
                  <p className="text-xs text-slate-400 mt-1">Priority: Critical | Reported: 15m ago</p>
                </div>
                <Button size="sm" className="h-7 text-[10px] bg-rose-500">Respond</Button>
              </div>
            </div>
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="text-sm font-bold">Late Room Service - Room 202</h5>
                  <p className="text-xs text-slate-400 mt-1">Priority: High | Reported: 45m ago</p>
                </div>
                <Button size="sm" className="h-7 text-[10px] bg-amber-500">Resolve</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/5 p-6">
          <h3 className="font-bold mb-4">Quick Management Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-12 border-white/10" onClick={() => router.push('/admin/rooms')}>Room Management</Button>
            <Button variant="outline" className="h-12 border-white/10" onClick={() => router.push('/admin/inventory')}>Inventory Control</Button>
            <Button variant="outline" className="h-12 border-white/10" onClick={() => router.push('/admin/analytics')}>Full Analytics</Button>
            <Button variant="outline" className="h-12 border-white/10" onClick={() => router.push('/admin/settings')}>Resort Settings</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
