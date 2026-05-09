"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Flame, 
  BedDouble, 
  Users, 
  Package, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  Info,
  Layers,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

// High-Fidelity Manager Operational and Analytics Data
const MOCK_FINANCIAL_KPI = {
  revPar: 18450, // LKR
  adr: 24600, // LKR
  occupancy: 75, // %
  cancellationRate: 4.2, // %
  growthTrend: 12.4 // %
}

const MOCK_BOTTLENECK_ALERTS = [
  { id: "b1", area: "KITCHEN", type: "CRITICAL", title: "Order SLA Breached (Order #K104)", subtitle: "Preparation time exceeded 28 mins (SLA: 20 mins) for Room 202.", time: "12m ago" },
  { id: "b2", area: "HOUSEKEEPING", type: "WARNING", title: "Housekeeping Delay Alert", subtitle: "Room 301 checkout pending for over 50 mins. Cleaning staff not assigned.", time: "24m ago" },
  { id: "b3", area: "INVENTORY", type: "WARNING", title: "Toiletries Inventory Alert", subtitle: "Lux Soap bars in central closet fallen to 15 items (Min threshold: 50).", time: "1h ago" },
  { id: "b4", area: "GUEST_INCIDENTS", type: "CRITICAL", title: "Unresolved Guest Complaint", subtitle: "Room 401 (VIP) reported air-conditioning unit noise. Operational SLA: 15 mins.", time: "8m ago" }
]

const MOCK_FORECASTING_WEEK = [
  { day: "Today", date: "May 8", expectedOccupancy: 75, overbookingProb: "0%", recommendedStaff: 12, status: "STABLE" },
  { day: "Tomorrow", date: "May 9", expectedOccupancy: 88, overbookingProb: "15%", recommendedStaff: 16, status: "OPTIMIZING" },
  { day: "Sunday", date: "May 10", expectedOccupancy: 95, overbookingProb: "62%", recommendedStaff: 18, status: "CRITICAL_DEMAND" },
  { day: "Monday", date: "May 11", expectedOccupancy: 62, overbookingProb: "0%", recommendedStaff: 10, status: "STABLE" },
  { day: "Tuesday", date: "May 12", expectedOccupancy: 55, overbookingProb: "0%", recommendedStaff: 8, status: "LOW_DEMAND" },
  { day: "Wednesday", date: "May 13", expectedOccupancy: 68, overbookingProb: "5%", recommendedStaff: 11, status: "STABLE" },
  { day: "Thursday", date: "May 14", expectedOccupancy: 82, overbookingProb: "20%", recommendedStaff: 14, status: "OPTIMIZING" }
]

const MOCK_HEATMAP_FLOORS = [
  { floor: 4, label: "Floor 4 (Presidential & Penthouses)", total: 3, occupied: 3, cleaning: 0, maintenance: 0, pct: 100 },
  { floor: 3, label: "Floor 3 (Executive Suites)", total: 6, occupied: 5, cleaning: 1, maintenance: 0, pct: 83 },
  { floor: 2, label: "Floor 2 (Deluxe Rooms)", total: 10, occupied: 7, cleaning: 2, maintenance: 1, pct: 70 },
  { floor: 1, label: "Floor 1 (Standard Singles)", total: 12, occupied: 6, cleaning: 4, maintenance: 2, pct: 50 }
]

export default function ManagerOperationsCenter() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<any[]>(MOCK_BOTTLENECK_ALERTS)
  const [financials, setFinancials] = useState(MOCK_FINANCIAL_KPI)
  const [activeTab, setActiveTab] = useState("ALL")

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessAdminDashboard(session)) {
      toast.error('Access Denied: Administrative manager authorization required')
      router.push('/auth/signin')
      return
    }

    loadAnalytics()
  }, [session, status, router])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/analytics/dashboard').then(r => r.json()).catch(() => null)
      if (res && res.summary) {
        // Map database counts into RevPAR and ADR approximations
        const dbOccupancy = Number(res.summary.occupancyRate) || 75
        const dbRev = Number(res.summary.totalRevenue) || 0
        const dbBookings = Number(res.summary.totalBookings) || 1
        const calculatedAdr = dbBookings > 0 ? Math.round(dbRev / dbBookings) : 24600

        setFinancials({
          revPar: Math.round((calculatedAdr * dbOccupancy) / 100),
          adr: calculatedAdr > 0 ? calculatedAdr : 24600,
          occupancy: dbOccupancy,
          cancellationRate: 4.2,
          growthTrend: Number(res.summary.bookingGrowthRate) || 12.4
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
    toast.success("Bottleneck alert acknowledged and dispatched.")
  }

  const formatLkr = (val: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(val)
  }

  const filteredAlerts = alerts.filter(a => activeTab === "ALL" || a.area === activeTab)

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <PremiumSpinner size="lg" text="Analyzing Operations & Revenue Analytics..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090514] text-slate-100 p-6 font-sans">
      
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-purple-900/40 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs tracking-wider uppercase font-bold py-1 px-3">
              EXECUTIVE CONSOLE
            </Badge>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mt-2">Operational Analytics & SLA Engine</h1>
          <p className="text-slate-400 text-sm mt-1">Hospitality yield optimization, RevPAR monitoring, real-time alerts & weekly predictive demand forecasting.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadAnalytics} variant="outline" size="sm" className="bg-white/5 border-purple-900/50 text-purple-300 hover:bg-purple-900/30">
            <RefreshCw className="w-4 h-4 mr-2" /> Recompute Yields
          </Button>
          <Button onClick={() => router.push('/admin/dashboard')} className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white border-0 font-semibold shadow-lg shadow-purple-950">
            Master Console
          </Button>
        </div>
      </div>

      {/* Financial KPIs Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <Card className="bg-white/[0.02] border border-purple-900/20 rounded-none p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest font-extrabold text-slate-400">RevPAR (Yield Index)</p>
              <h3 className="text-3xl font-bold font-serif text-white mt-1.5">{formatLkr(financials.revPar)}</h3>
              <p className="text-emerald-400 text-xs flex items-center gap-1 mt-1.5 font-bold">
                <TrendingUp className="w-3.5 h-3.5" /> +{financials.growthTrend}% vs prev month
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 flex items-center justify-center rounded-sm">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-white/[0.02] border border-purple-900/20 rounded-none p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest font-extrabold text-slate-400">Average Daily Rate (ADR)</p>
              <h3 className="text-3xl font-bold font-serif text-white mt-1.5">{formatLkr(financials.adr)}</h3>
              <p className="text-slate-400 text-xs mt-2">
                Standard Room Yield Base
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center rounded-sm">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-white/[0.02] border border-purple-900/20 rounded-none p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest font-extrabold text-slate-400">Occupancy Ratio</p>
              <h3 className="text-3xl font-bold font-serif text-white mt-1.5">{financials.occupancy}%</h3>
              <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-800">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${financials.occupancy}%` }} />
              </div>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center rounded-sm">
              <Percent className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-white/[0.02] border border-purple-900/20 rounded-none p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest font-extrabold text-slate-400">Cancellation Rate</p>
              <h3 className="text-3xl font-bold font-serif text-white mt-1.5">{financials.cancellationRate}%</h3>
              <p className="text-emerald-400 text-xs flex items-center gap-1 mt-1.5 font-bold">
                <TrendingDown className="w-3.5 h-3.5" /> -1.2% reduction trend
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center rounded-sm">
              <TrendingDown className="w-6 h-6 text-rose-400" />
            </div>
          </div>
        </Card>

      </div>

      {/* Grid: Bottlenecks & Forecasting */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: SLA Bottleneck Alerts (Operational Breaches) */}
        <div className="lg:col-span-5 space-y-6">
          
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-serif text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> SLA Incident Monitor
                </CardTitle>
                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20">{alerts.length} Breaches</Badge>
              </div>
              <CardDescription className="text-slate-400 text-xs">Active hospitality department bottlenecks violating service levels.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 border border-purple-950/60 rounded-xs">
                {["ALL", "KITCHEN", "HOUSEKEEPING", "INVENTORY"].map(tb => (
                  <button 
                    key={tb}
                    onClick={() => setActiveTab(tb)}
                    className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 flex-1 transition-colors ${activeTab === tb ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {tb}
                  </button>
                ))}
              </div>

              {/* Alerts Loop */}
              <div className="space-y-3.5 max-h-[420px] overflow-y-auto">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <span>All hotel workflows meeting target SLA metrics perfectly!</span>
                  </div>
                ) : (
                  filteredAlerts.map(alt => (
                    <div key={alt.id} className="p-4 bg-white/[0.01] border border-slate-800/80 hover:border-purple-900/30 flex items-start gap-3 transition-all relative">
                      <div className="mt-1">
                        {alt.type === "CRITICAL" ? (
                          <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-widest font-extrabold text-purple-400">{alt.area}</span>
                          <span className="text-[10px] text-slate-500">{alt.time}</span>
                        </div>
                        <h4 className="font-bold text-slate-200 text-sm mt-1">{alt.title}</h4>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{alt.subtitle}</p>
                        
                        <div className="flex justify-end mt-3 border-t border-slate-800/40 pt-2">
                          <Button onClick={() => dismissAlert(alt.id)} size="sm" className="bg-purple-900/40 hover:bg-purple-900/80 text-purple-300 h-6 text-[10px] rounded-none border-0">
                            Dispatch Staff / Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Right Col: Weekly Yield and Forecasting Graph */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Weekly Forecasting */}
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/50 pb-4">
              <CardTitle className="text-lg font-serif text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" /> 7-Day Occupancy Forecast & Labor Demand
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">Predictive yield algorithm forecasting occupancy trends, double-booking probabilities, and staffing metrics.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              
              <div className="space-y-4">
                {MOCK_FORECASTING_WEEK.map(fc => {
                  const isHigh = fc.expectedOccupancy >= 90
                  const isModerate = fc.expectedOccupancy >= 70 && fc.expectedOccupancy < 90
                  const barColor = isHigh ? 'bg-rose-500' : isModerate ? 'bg-purple-500' : 'bg-emerald-500'
                  const statusBadge = fc.status === "CRITICAL_DEMAND" ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' :
                                      fc.status === "OPTIMIZING" ? 'text-purple-400 border-purple-500/20 bg-purple-500/10' :
                                      fc.status === "LOW_DEMAND" ? 'text-slate-400 border-slate-700/20 bg-slate-700/10' :
                                      'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'

                  return (
                    <div key={fc.day} className="p-3 bg-white/[0.01] border border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Day Label */}
                      <div className="w-[120px]">
                        <h4 className="font-bold text-slate-200 text-sm">{fc.day}</h4>
                        <p className="text-slate-500 text-xs">{fc.date}</p>
                      </div>

                      {/* Expected Occupancy Progress Bar */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
                          <span>Occupancy Target: <strong className="text-slate-200">{fc.expectedOccupancy}%</strong></span>
                          <span>Overbook Risk: <strong className={Number(fc.overbookingProb.replace('%','')) > 30 ? 'text-rose-400' : 'text-slate-300'}>{fc.overbookingProb}</strong></span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/60">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${fc.expectedOccupancy}%` }} />
                        </div>
                      </div>

                      {/* Recommended Staffing and Alert Indicators */}
                      <div className="sm:text-right flex items-center justify-between sm:flex-col gap-2 min-w-[120px]">
                        <Badge className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 ${statusBadge}`}>
                          {fc.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-slate-400">Req. Labor: <strong className="text-slate-200">{fc.recommendedStaff} Staff</strong></p>
                      </div>

                    </div>
                  )
                })}
              </div>

            </CardContent>
          </Card>

          {/* Interactive Occupancy Heatmap Card */}
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/50 pb-4">
              <CardTitle className="text-lg font-serif text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" /> Operational Heatmap by Floor
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">Structural occupancy metrics to optimize housekeeping clean sweeps and floor utilities.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_HEATMAP_FLOORS.map(fl => (
                  <div key={fl.floor} className="p-4 bg-white/[0.01] border border-slate-800 flex flex-col justify-between h-[120px]">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{fl.label}</h4>
                      <p className="text-slate-400 text-xs mt-1">Live Occupancy: {fl.occupied} of {fl.total} Rooms</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-950 h-2 border border-slate-800 overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${fl.pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-emerald-400">{fl.pct}% Density</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}
