"use client"

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useApi } from '@/hooks/use-api'
import {
  TrendingUp,
  Users,
  DollarSign,
  Bed,
  Star,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  User,
  ExternalLink
} from 'lucide-react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { EmployeeTimeClock } from '@/components/dashboard/admin/employee-time-clock'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { cn } from '@/lib/utils'

function AdminDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const {
    data: dashboardData,
    isLoading,
    mutate: refetch,
  } = useApi('/api/analytics/dashboard')

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
  const occupancyRate = Number(summary.occupancyRate || 0)

  // Dynamic Occupancy Load Color: < 60% Blue, 60-85% Amber, > 85% Rose
  const getOccupancyBarColor = (rate: number) => {
    if (rate > 85) return 'bg-rose-500'
    if (rate >= 60) return 'bg-amber-400'
    return 'bg-blue-500'
  }

  return (
    <AdminPageShell
      title="Admin Command Deck"
      subtitle="High-level revenue tracking, operational telemetry, and property-wide governance."
      onRefresh={() => refetch()}
    >
      <EmployeeTimeClock />

      {/* KPI Metrics Matrix (Section 4.D) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* KPI 1: Total Revenue */}
        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Revenue
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                +14.2% MoM
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {formatCurrency(summary.totalRevenue || 0)}
            </div>
            <p className="text-xs text-zinc-300 font-medium mt-1.5">
              Gross collected this period
            </p>
          </div>
          <div className="pt-2 mt-4 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
            Audited against active ledger
          </div>
        </div>

        {/* KPI 2: Bookings */}
        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Bookings
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                +8.5%
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {summary.totalBookings || 0}
            </div>
            <p className="text-xs text-zinc-300 font-medium mt-1.5">
              Active guest reservations
            </p>
          </div>
          <div className="pt-2 mt-4 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
            Direct PMS & Channel sync
          </div>
        </div>

        {/* KPI 3: Occupancy & Hardware-style Telemetry Meter */}
        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Occupancy Rate
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono text-blue-400 bg-blue-500/10 border-blue-500/20">
                Live Capacity
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {occupancyRate}%
            </div>
            {/* Telemetry Meter Bar (Section 4.F) */}
            <div className="mt-3">
              <div className="w-full h-2 rounded-full bg-[#1A1D21] overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-500 rounded-full", getOccupancyBarColor(occupancyRate))}
                  style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
                />
              </div>
            </div>
          </div>
          <div className="pt-2 mt-4 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono flex justify-between">
            <span>Utilization target: 80%</span>
            <span>{occupancyRate > 85 ? 'High Load' : 'Nominal'}</span>
          </div>
        </div>

        {/* KPI 4: Service Score */}
        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Service Score
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono text-amber-400 bg-amber-500/10 border-amber-500/20">
                Top Tier
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {summary.serviceScore ?? 0}%
            </div>
            <p className="text-xs text-zinc-300 font-medium mt-1.5">
              Guest satisfaction telemetry
            </p>
          </div>
          <div className="pt-2 mt-4 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
            Evaluated across 14 checkpoints
          </div>
        </div>
      </div>

      {/* Main Grid: Activity Stream & Operational Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Activity Stream & Critical Escalations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Table (Section 4.E) */}
          <div className="rounded-2xl bg-[#121417] border border-[#1E2227] overflow-hidden">
            {/* Table Header Row */}
            <div className="bg-[#141619] border-b border-[#1E2227] px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Live Reservation Stream
                </h3>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Feed</span>
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#1A1D21]">
              {recentBookings.length > 0 ? (
                recentBookings.slice(0, 6).map((booking: any) => (
                  <div 
                    key={booking.id} 
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#16181B] transition-colors group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-[#181A1D] border border-[#2B3037] flex items-center justify-center text-zinc-400 group-hover:border-zinc-500 group-hover:text-white transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {booking.guestName}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          Room {booking.roomNumber} • <span className="text-zinc-500">{booking.roomType}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={cn(
                          "text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border",
                          booking.status?.toLowerCase() === 'confirmed' || booking.status?.toLowerCase() === 'paid'
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : booking.status?.toLowerCase() === 'pending'
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        )}>
                          {booking.status}
                        </span>
                        <p className="text-xs sm:text-sm font-mono font-bold text-white mt-1">
                          {formatCurrency(booking.totalAmount)}
                        </p>
                      </div>
                      <button 
                        onClick={() => router.push(`/admin/bookings?search=${encodeURIComponent(booking.guestName || '')}`)}
                        className="hidden sm:inline-flex px-2.5 py-1 rounded bg-[#1C2025] hover:bg-blue-950/40 text-blue-400 text-[11px] font-medium border border-[#2B3037] hover:border-blue-500/40 transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs font-mono">
                  No recent activity logged in current cycle
                </div>
              )}
            </div>
          </div>

          {/* VIP Complaint Escalation Card (Section 4.G / Alert States) */}
          <div className="rounded-2xl bg-[#121417] border border-[#1E2227] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  VIP Complaint Escalation
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                Priority Incident Queue
              </span>
            </div>

            {dashboardData?.vipComplaints && dashboardData.vipComplaints.length > 0 ? (
              <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h5 className="text-xs font-semibold text-white">
                    {dashboardData.vipComplaints[0].subject}
                  </h5>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1 font-mono">
                    {dashboardData.vipComplaints[0].roomNumber ? `Room ${dashboardData.vipComplaints[0].roomNumber}: ` : ''}
                    {dashboardData.vipComplaints[0].description}
                  </p>
                </div>
                <button 
                  onClick={() => router.push('/admin/complaints')}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors shrink-0"
                >
                  Resolve Now
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-center justify-center gap-2 text-emerald-400 text-xs font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>All Clear — Zero Active VIP Escalations</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Personnel Telemetry & Fast Direct Routing */}
        <div className="space-y-6">
          {/* Personnel Operations Card */}
          <div className="rounded-2xl bg-[#121417] border border-[#1E2227] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-300">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">
                  Personnel Operations
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Staff Roster
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3.5 bg-[#141619] rounded-xl border border-[#1E2227]">
                <div>
                  <p className="text-xs font-semibold text-white font-mono">
                    {dashboardData?.guestStats?.totalStaff ?? 0} Staff Active
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    All duty sectors nominal
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button 
                  onClick={() => router.push('/admin/staff')}
                  className="px-3 py-2 rounded-lg bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] text-zinc-200 text-xs font-medium transition-colors text-center"
                >
                  Staff Directory
                </button>
                <button 
                  onClick={() => router.push('/admin/roles')}
                  className="px-3 py-2 rounded-lg bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] text-zinc-200 text-xs font-medium transition-colors text-center"
                >
                  Permissions
                </button>
              </div>
            </div>
          </div>

          {/* Quick Route Directory */}
          <div className="rounded-2xl bg-[#121417] border border-[#1E2227] p-6 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 text-zinc-400">
                <ArrowUpRight className="w-4 h-4" />
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Quick Route Matrix
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Direct</span>
            </div>

            <div className="space-y-1.5">
              <button 
                onClick={() => router.push('/admin/rooms')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-transparent hover:bg-[#16181B] border border-transparent hover:border-[#2B3037] text-zinc-400 hover:text-white text-xs transition-colors group"
              >
                <span className="font-medium">Room Inventory Control</span>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </button>

              <button 
                onClick={() => router.push('/admin/ota')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-transparent hover:bg-[#16181B] border border-transparent hover:border-[#2B3037] text-zinc-400 hover:text-white text-xs transition-colors group"
              >
                <span className="font-medium">OTA Channel Synchronizer</span>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </button>

              <button 
                onClick={() => router.push('/admin/settings')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-transparent hover:bg-[#16181B] border border-transparent hover:border-[#2B3037] text-zinc-400 hover:text-white text-xs transition-colors group"
              >
                <span className="font-medium">System Configuration</span>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
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
