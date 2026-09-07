"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { useProperty } from '@/contexts/property-context'
import { 
  TrendingUp, 
  Activity, 
  ShieldAlert,
  Users,
  RefreshCw,
  CheckCircle2,
  Clock,
  LayoutDashboard
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { formatDistanceToNow } from 'date-fns'

interface Complaint {
  id: string
  subject: string
  description: string
  priority: string
  status: string
  createdAt: string
  roomNumber?: string | null
}

interface ManagerData {
  revPar: number
  occupancy: number
  activeStaff: number
  complaints: Complaint[]
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  URGENT: { color: 'bg-rose-500',   label: 'Critical' },
  HIGH:   { color: 'bg-amber-500',  label: 'High' },
  MEDIUM: { color: 'bg-yellow-500', label: 'Medium' },
  LOW:    { color: 'bg-slate-400',  label: 'Low' },
}

export default function ManagerOperationsCenter() {
  const { data: session, status } = useSession()
  const { activePropertyId } = useProperty()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ManagerData>({
    revPar: 0,
    occupancy: 0,
    activeStaff: 0,
    complaints: []
  })

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const url = activePropertyId
        ? `/api/analytics/dashboard?propertyId=${activePropertyId}`
        : '/api/analytics/dashboard'
      const res = await fetch(url).then(r => r.json()).catch(() => null)
      if (res && res.summary) {
        setData({
          revPar: Math.round(Number(res.summary.todayRevenue) || 0),
          occupancy: Number(res.summary.occupancyRate) || 0,
          activeStaff: res.guestStats?.totalStaff || 0,
          complaints: Array.isArray(res.vipComplaints) ? res.vipComplaints : []
        })
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [activePropertyId])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') { router.push('/auth/signin'); return }
    if (status === 'authenticated' && !canAccessAdminDashboard(session)) { router.push('/unauthorized'); return }
    if (status === 'authenticated') loadAnalytics()
  }, [session, status, router, loadAnalytics])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <PremiumSpinner size="lg" text="Loading Management Metrics..." />
      </div>
    )
  }

  const pendingComplaints = data.complaints.filter(c => c.status !== 'RESOLVED')

  return (
    <div className="p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Manager Console</h1>
          <p className="text-slate-400 text-sm mt-1">Operational oversight and high-level performance tracking.</p>
        </div>
        <Button onClick={loadAnalytics} variant="outline" className="bg-white/5 border-white/10 mt-4 md:mt-0">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white/[0.02] border-white/5 p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Revenue Today</p>
              <h3 className="text-2xl font-bold mt-1">LKR {data.revPar.toLocaleString()}</h3>
            </div>
            <Activity className="text-primary w-8 h-8" />
          </div>
        </Card>

        <Card className="bg-white/[0.02] border-white/5 p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Occupancy</p>
              <h3 className="text-2xl font-bold mt-1">{data.occupancy}%</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="text-emerald-500 w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card
          className="bg-white/[0.02] border-white/5 p-6 cursor-pointer hover:bg-white/[0.04] transition-colors"
          onClick={() => router.push('/admin/staff')}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Active Staff</p>
              <h3 className="text-2xl font-bold mt-1">{data.activeStaff} Personnel</h3>
            </div>
            <Users className="text-blue-400 w-8 h-8" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="border-b border-white/5 p-4 flex flex-row justify-between items-center">
            <h3 className="font-bold flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 text-rose-500" /> Pending Complaints
            </h3>
            <Badge className="bg-rose-500/20 text-rose-500">
              {pendingComplaints.length} Active
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {pendingComplaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500/60" />
                <p className="text-sm">No pending complaints</p>
              </div>
            ) : (
              pendingComplaints.map(complaint => {
                const cfg = PRIORITY_CONFIG[complaint.priority] ?? PRIORITY_CONFIG.LOW
                const ago = formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })
                const roomLabel = complaint.roomNumber ? ` — Room ${complaint.roomNumber}` : ''
                return (
                  <div
                    key={complaint.id}
                    className="p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/[0.07] transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <h5 className="text-sm font-bold truncate">
                          {complaint.subject}
                          {roomLabel && <span className="text-slate-400 font-normal">{roomLabel}</span>}
                        </h5>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          Priority: {cfg.label}&nbsp;|&nbsp;Reported: {ago}
                        </p>
                        {complaint.description && (
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{complaint.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className={`h-7 text-[10px] shrink-0 ${cfg.color}`}
                        onClick={() => router.push('/admin/complaints')}
                      >
                        {complaint.priority === 'URGENT' ? 'Respond' : 'Resolve'}
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
            {pendingComplaints.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-400 hover:text-white mt-1"
                onClick={() => router.push('/admin/complaints')}
              >
                View All Complaints
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/5 p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" /> Quick Management Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-12 border-white/10 hover:bg-white/10" onClick={() => router.push('/admin/rooms')}>Room Management</Button>
            <Button variant="outline" className="h-12 border-white/10 hover:bg-white/10" onClick={() => router.push('/admin/inventory')}>Inventory Control</Button>
            <Button variant="outline" className="h-12 border-white/10 hover:bg-white/10" onClick={() => router.push('/admin/analytics')}>Full Analytics</Button>
            <Button variant="outline" className="h-12 border-white/10 hover:bg-white/10" onClick={() => router.push('/admin/settings')}>Resort Settings</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
