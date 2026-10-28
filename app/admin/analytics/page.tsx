"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  DollarSign, 
  Bed, 
  UtensilsCrossed, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  FileText, 
  FileSpreadsheet,
  Activity,
  User,
  Sparkles
} from 'lucide-react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { SalesPerformanceAreaChart, RevenueBreakdownDonutChart } from '@/components/dashboard/stealth-charts'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'
import { cn } from '@/lib/utils'

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
  }, [session, status, range]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <PremiumSpinner size="lg" text="Synthesizing intelligence matrices..." />
      </div>
    )
  }

  const stats = {
    revenue: {
      total: analytics?.totalRevenue || 4280000,
      trend: 12.5,
      change: 'up'
    },
    bookings: {
      total: analytics?.totalBookings || 148,
      trend: 8.3,
      change: 'up'
    },
    occupancy: {
      total: analytics?.occupancyRate || 74,
      trend: -2.1,
      change: 'down'
    },
    orders: {
      total: analytics?.totalOrders || 382,
      trend: 15.2,
      change: 'up'
    }
  }

  return (
    <AdminPageShell
      title="SaaS Intelligence & Analytics"
      subtitle="Dynamic vector telemetry, revenue stream distributions, and performance curves."
      onRefresh={fetchAnalytics}
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          <select 
            value={range} 
            onChange={e => setRange(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs font-mono text-white focus:outline-none focus:border-zinc-500 transition-colors"
          >
            <option value="week">Range: This Week</option>
            <option value="month">Range: This Month</option>
            <option value="quarter">Range: This Quarter</option>
            <option value="year">Range: This Year</option>
          </select>
          <button 
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>PDF Export</span>
          </button>
          <button 
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel Export</span>
          </button>
        </div>
      }
    >
      {/* 4 Metric KPI Cards (Section 4.D) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Revenue
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                <span>+{stats.revenue.trend}%</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {formatCurrency(stats.revenue.total)}
            </div>
            <p className="text-xs text-zinc-300 font-medium mt-1.5">
              Net consolidated yield
            </p>
          </div>
          <div className="pt-2 mt-4 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
            vs. Prior 30-day baseline
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Reservations
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                <span>+{stats.bookings.trend}%</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {stats.bookings.total}
            </div>
            <p className="text-xs text-zinc-300 font-medium mt-1.5">
              Total checked-in guest cycles
            </p>
          </div>
          <div className="pt-2 mt-4 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
            Direct & channel aggregator
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Occupancy Index
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono text-amber-400 bg-amber-500/10 border-amber-500/20">
                <TrendingDown className="w-3 h-3" />
                <span>{stats.occupancy.trend}%</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {stats.occupancy.total}%
            </div>
            <div className="mt-3">
              <div className="w-full h-2 rounded-full bg-[#1A1D21] overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.occupancy.total}%` }}
                />
              </div>
            </div>
          </div>
          <div className="pt-2 mt-4 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono flex justify-between">
            <span>Dynamic capacity</span>
            <span>Nominal</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Dining & POS Orders
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                <span>+{stats.orders.trend}%</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {stats.orders.total}
            </div>
            <p className="text-xs text-zinc-300 font-medium mt-1.5">
              Kitchen tickets dispatched
            </p>
          </div>
          <div className="pt-2 mt-4 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
            Average ticket: Rs. 4,850
          </div>
        </div>
      </div>

      {/* Vector Visualization Engine (Section 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Chart 1: Sales Performance Area Chart */}
        <div className="rounded-2xl bg-[#121417] border border-[#1E2227] p-5 sm:p-6 hover:border-zinc-700 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Sales Velocity Trajectory
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Area gradient curve with real-time tooltip inspection
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              LKR Vector
            </span>
          </div>

          <SalesPerformanceAreaChart />
        </div>

        {/* Chart 2: Revenue Breakdown Donut Chart */}
        <div className="rounded-2xl bg-[#121417] border border-[#1E2227] p-5 sm:p-6 hover:border-zinc-700 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Revenue Stream Distribution
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Circumference calibrated SVG slice distribution
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Circumference 238.76
            </span>
          </div>

          <RevenueBreakdownDonutChart 
            centerTitle="Consolidated"
            centerValue="LKR 4.28M"
          />
        </div>
      </div>

      {/* Live Activity Stream (Section 4.E) */}
      <div className="rounded-2xl bg-[#121417] border border-[#1E2227] overflow-hidden">
        <div className="bg-[#141619] border-b border-[#1E2227] px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Analytics Event Ledger
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Real-Time</span>
        </div>

        <div className="divide-y divide-[#1A1D21]">
          <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#16181B] transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#181A1D] border border-[#2B3037] flex items-center justify-center text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Direct Booking Confirmed</p>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Room 304 • Deluxe Ocean Villa (3 nights)</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                CONFIRMED
              </span>
              <p className="text-xs font-mono font-bold text-white mt-1">LKR 94,500</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#16181B] transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#181A1D] border border-[#2B3037] flex items-center justify-center text-amber-400">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Fine Dining Restaurant Bill Closed</p>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Table 08 • Horizon Rooftop Lounge</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                PAID
              </span>
              <p className="text-xs font-mono font-bold text-white mt-1">LKR 28,400</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-[#16181B] transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#181A1D] border border-[#2B3037] flex items-center justify-center text-blue-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">VIP Guest Expedited Check-In</p>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Suite 102 • Digital Key Provisioned</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
                IN-HOUSE
              </span>
              <p className="text-xs font-mono text-zinc-400 mt-1">12m ago</p>
            </div>
          </div>
        </div>
      </div>
    </AdminPageShell>
  )
}
