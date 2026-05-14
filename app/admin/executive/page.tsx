"use client"

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  Sparkles,
  DollarSign,
  History,
  BrainCircuit,
  Zap,
  Target
} from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { OccupancyPacingGauge } from '@/components/dashboard/executive/occupancy-pacing-gauge'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function ExecutiveDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['executive-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/executive/analytics?range=30')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
    refetchInterval: 60000 // Refresh every minute
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center">
        <PremiumSpinner size="lg" text="Synthesizing Global Matrices..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060606] text-white p-6 lg:p-10 space-y-10">
      <DashboardHeader 
        title="Mission Control"
        subtitle="Operational Intelligence & Strategic Yield Cockpit. Real-time parity, pacing, and ADR governance."
        role="Executive Management"
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Strategic KPIs */}
        <div className="xl:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard 
              title="Global ADR"
              value={`LKR ${Math.round(metrics?.adr || 0).toLocaleString()}`}
              delta={4.2}
              deltaLabel="vs Last Month"
              color="luxury"
              icon={<DollarSign className="w-5 h-5" />}
              sparklineData={metrics?.pacing?.slice(-7).map((p: any) => ({ value: p.amount })) || []}
              aiInsight={`Yield optimization stable at LKR ${Math.round((metrics?.adr || 0) * 0.08).toLocaleString()} delta`}
              actionLabel="Analyze Segments"
            />
            <KpiCard 
              title="RevPAR"
              value={`LKR ${Math.round(metrics?.revpar || 0).toLocaleString()}`}
              delta={2.1}
              deltaLabel="vs CompSet"
              color="info"
              icon={<Activity className="w-5 h-5" />}
              comparativeValue="Goal: LKR 42,000"
              actionLabel="View CompSet"
            />
            <KpiCard 
              title="Housekeeping SLA"
              value={`${Math.round(metrics?.sla || 0)}m`}
              delta={-5}
              deltaLabel="Efficiency Gain"
              color="success"
              icon={<ShieldCheck className="w-5 h-5" />}
              aiInsight={metrics?.sla > 30 ? "Staff turnover time is above target" : "Operations within optimal range"}
              actionLabel="Staff Reports"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-0 overflow-hidden bg-[#0c0c0c] border-white/[0.05]">
              <OccupancyPacingGauge 
                current={metrics?.occupancy || 0}
                target={85.0}
                forecast={metrics?.occupancy * 1.05}
              />
            </Card>

            <Card className="p-8 bg-[#0c0c0c] border-white/[0.05] space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Operational Insights</h3>
                    <p className="text-[10px] text-white/20 font-medium">AI Intelligence Report</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-3 py-1">LIVE</Badge>
              </div>

              <div className="space-y-4">
                {metrics?.occupancy > 80 ? (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[10px] font-black text-primary uppercase">Revenue Opportunity</span>
                    <p className="text-xs text-white/70 italic">
                      "Occupancy exceeding 80%. Recommend dynamic pricing surge of 15% for next 48 hours."
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[10px] font-black text-amber-500 uppercase">Demand Alert</span>
                    <p className="text-xs text-white/70 italic">
                      "Low occupancy detected for next weekend. Consider flash sale for loyal members."
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Real-time Vitals */}
        <div className="xl:col-span-4 space-y-8">
          <Card className="bg-[#0c0c0c] border-white/[0.05] p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Real-time Vitals</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Global Occupancy</p>
                  <p className="text-2xl font-serif font-bold text-white">{Math.round(metrics?.occupancy || 0)}%</p>
                </div>
                <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${metrics?.occupancy}%` }} />
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/5">
              <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4">Strategic Alerts</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <Zap className="w-3 h-3 text-primary" />
                  <p className="text-[10px] text-white/60">OTA Parity Score: 99.8% (Stable)</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
