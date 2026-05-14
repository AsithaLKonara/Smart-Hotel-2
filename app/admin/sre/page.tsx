"use client"

import { useQuery } from '@tanstack/react-query'
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  BarChart3, 
  Database, 
  CloudRain, 
  Cpu,
  RefreshCw,
  Search,
  Terminal,
  Unplug
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function SRECommandCenter() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['sre-health'],
    queryFn: async () => {
      const res = await fetch('/api/admin/sre/health')
      return res.json()
    },
    refetchInterval: 5000 // Real-time 5s polling
  })

  if (isLoading) return <div className="min-h-screen bg-[#060606] flex items-center justify-center"><PremiumSpinner size="lg" text="Booting Operational Intelligence..." /></div>

  return (
    <div className="min-h-screen bg-[#060606] text-white p-6 lg:p-10 space-y-10">
      <DashboardHeader 
        title="SRE Command Center"
        subtitle="Operational Intelligence & Resilience Cockpit. Real-time infrastructure health and transactional parity."
        role="Systems Reliability"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Redis Latency", value: `${health?.redis?.latency || 0}ms`, status: health?.redis?.status, icon: Zap },
          { label: "OTA Parity", value: `${health?.ota?.parity || 0}%`, status: health?.ota?.status, icon: CloudRain },
          { label: "Outbox Depth", value: health?.outbox?.pending || 0, status: health?.outbox?.status, icon: Terminal },
          { label: "Active Locks", value: health?.locks?.count || 0, status: health?.locks?.status, icon: Database },
        ].map((kpi, i) => (
          <Card key={i} className="p-6 bg-[#0c0c0c] border-white/[0.05] rounded-[32px] flex items-center gap-5">
            <div className={cn(
              "p-4 rounded-2xl border transition-colors",
              kpi.status === 'HEALTHY' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            )}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{kpi.label}</p>
              <h3 className="text-3xl font-serif font-bold text-white">{kpi.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Infrastructure Nodes */}
        <div className="xl:col-span-8 space-y-8">
           <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
               <Cpu className="w-4 h-4 text-white/40" />
               <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Infrastructure Topology</h3>
             </div>
             <Badge className="bg-white/5 text-white/40 border-none px-3 py-1 text-[9px]">5 NODES ACTIVE</Badge>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#0c0c0c] border-white/[0.05] p-8 rounded-[40px] space-y-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                     <h4 className="text-sm font-bold">Persistence Layer (MongoDB)</h4>
                   </div>
                   <Badge className="bg-emerald-500/10 text-emerald-500 border-none">UP</Badge>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] text-white/40 font-black uppercase">
                       <span>Connection Pool</span>
                       <span>84 / 100</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[84%]" />
                    </div>
                 </div>
              </Card>

              <Card className="bg-[#0c0c0c] border-white/[0.05] p-8 rounded-[40px] space-y-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                     <h4 className="text-sm font-bold">In-Memory Store (Redis)</h4>
                   </div>
                   <Badge className="bg-emerald-500/10 text-emerald-500 border-none">HEALTHY</Badge>
                 </div>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] text-white/40 font-black uppercase">
                       <span>Eviction Rate</span>
                       <span>0.02%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[2%]" />
                    </div>
                 </div>
              </Card>
           </div>

           {/* Event Lineage Tracing */}
           <div className="space-y-6">
             <div className="flex items-center gap-3 px-2">
               <Activity className="w-4 h-4 text-white/40" />
               <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Operational Lineage</h3>
             </div>
             <Card className="bg-[#0c0c0c] border-white/[0.05] p-0 rounded-[40px] overflow-hidden">
                <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                   <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold">Real-time Transaction Stream</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white/40 uppercase">Streaming</span>
                      </div>
                   </div>
                </div>
                <div className="p-8 space-y-4">
                   {health?.lineage?.map((entry: any, i: number) => (
                     <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <Badge className={cn(
                          "text-[9px] border-none px-2 py-0.5",
                          entry.severity === 'ERROR' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-400"
                        )}>{entry.type}</Badge>
                        <p className="text-xs text-white/60 font-medium flex-1">{entry.message}</p>
                        <span className="text-[10px] text-white/20 font-black">{entry.time}</span>
                     </div>
                   ))}
                </div>
             </Card>
           </div>
        </div>

        {/* Global Parity Map */}
        <div className="xl:col-span-4 space-y-8">
           <Card className="bg-[#0c0c0c] border-white/[0.05] p-8 rounded-[40px] space-y-8">
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary"><RefreshCw className="w-5 h-5" /></div>
                <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Global Parity Map</h3>
             </div>

             <div className="space-y-8">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white/80">HMS Core</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                   </div>
                   <div className="flex items-center justify-between text-[10px] text-white/20 font-black uppercase">
                      <span>Inventory Accuracy</span>
                      <span>100%</span>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white/80">Booking.com Sync</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                   </div>
                   <div className="flex items-center justify-between text-[10px] text-white/20 font-black uppercase">
                      <span>Parity Drift</span>
                      <span>0.00%</span>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white/80">Agoda Sync</span>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                   </div>
                   <div className="flex items-center justify-between text-[10px] text-white/20 font-black uppercase">
                      <span>Rate Parity</span>
                      <span className="text-amber-500">92%</span>
                   </div>
                </div>
             </div>

             <div className="pt-8 border-t border-white/5 space-y-6">
                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Critical Alerts</h4>
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                   <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-black text-amber-500 uppercase">Rate Drift Detected</span>
                   </div>
                   <p className="text-[10px] text-white/40 leading-relaxed italic">
                     Agoda rate for "Deluxe Suite" is 8% below local HMS. Sync triggered.
                   </p>
                </div>
             </div>
           </Card>
        </div>
      </div>
    </div>
  )
}
