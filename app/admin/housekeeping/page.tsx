"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Clock, 
  Brush, 
  ShieldAlert, 
  ClipboardCheck, 
  RefreshCw, 
  Users,
  ListTodo,
  ThumbsDown,
  CheckCircle2
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function HousekeepingOperations() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("ALL")

  // 1. Fetch Live Rooms for Housekeeping
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['housekeeping-rooms'],
    queryFn: async () => {
      const res = await fetch('/api/rooms')
      const data = await res.json()
      return data.rooms.filter((r: any) => 
        ['DIRTY', 'CLEANING', 'INSPECTION_PENDING', 'MAINTENANCE'].includes(r.status)
      )
    }
  })

  // 2. Fetch Staff for Workload Heatmap (REAL DATA)
  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['housekeeping-staff'],
    queryFn: async () => {
      const res = await fetch('/api/staff?department=HOUSEKEEPING&isActive=true')
      return res.json()
    }
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Update failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-rooms'] })
      toast.success('Operational state synchronized.')
    }
  })

  if (roomsLoading || staffLoading) return <div className="min-h-screen bg-[#060606] flex items-center justify-center"><PremiumSpinner size="lg" text="Syncing Housekeeping Matrix..." /></div>

  const filteredRooms = rooms?.filter((r: any) => activeTab === 'ALL' || r.status === activeTab) || []

  return (
    <div className="min-h-screen bg-[#060606] text-white p-6 lg:p-10 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 bg-[#0c0c0c] p-8 lg:p-12 rounded-[40px] border border-white/[0.05] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20">Operational Node</Badge>
          <h1 className="text-4xl lg:text-6xl font-serif font-bold tracking-tight">Housekeeping Hub</h1>
          <p className="text-white/40 text-sm">Unified dispatch board and real-time cleaning telemetry.</p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()} className="bg-white/5 border-white/10 text-white/60 h-14 rounded-2xl px-6">
          <RefreshCw className="w-4 h-4 mr-2" /> Sync Ops
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Dirty Queue", value: rooms?.filter((r: any) => r.status === 'DIRTY').length, icon: Brush, color: "rose" },
          { label: "Active Sweeps", value: rooms?.filter((r: any) => r.status === 'CLEANING').length, icon: Clock, color: "amber" },
          { label: "Pending Inspection", value: rooms?.filter((r: any) => r.status === 'INSPECTION_PENDING').length, icon: ClipboardCheck, color: "primary" },
          { label: "Staff Available", value: staff?.length || 0, icon: Users, color: "emerald" },
        ].map((kpi, i) => (
          <Card key={i} className="p-6 bg-[#0c0c0c] border-white/[0.05] rounded-[32px] flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10"><kpi.icon className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{kpi.label}</p>
              <h3 className="text-3xl font-serif font-bold text-white">{kpi.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Real-time Workload Heatmap */}
        <div className="xl:col-span-3 space-y-6">
           <div className="flex items-center gap-3 px-2">
             <Users className="w-4 h-4 text-white/40" />
             <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Staff Workload Heatmap</h3>
           </div>
           <Card className="bg-[#0c0c0c] border-white/[0.05] rounded-[40px] p-8 space-y-8">
             {staff?.length > 0 ? staff.slice(0, 5).map((s: any, i: number) => (
               <div key={s.id} className="space-y-3">
                 <div className="flex items-center justify-between">
                   <h4 className="text-xs font-bold text-white/80">{s.name}</h4>
                   <Badge className={cn("text-[8px] border-none", s.workloadPercentage > 80 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500")}>
                     {s.workloadPercentage > 80 ? 'OVERLOAD' : 'OPTIMAL'}
                   </Badge>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${s.workloadPercentage}%` }}
                      className={cn("h-full transition-colors duration-500", s.workloadPercentage > 80 ? "bg-rose-500" : "bg-emerald-500")} 
                    />
                 </div>
                 <p className="text-[9px] text-white/20 font-black uppercase">{s.taskCount} Pending Tasks</p>
               </div>
             )) : (
               <p className="text-white/20 text-xs italic text-center py-10">No active staff found.</p>
             )}
           </Card>
        </div>

        {/* Dispatch Board */}
        <div className="xl:col-span-6 space-y-6">
           <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
               <ListTodo className="w-4 h-4 text-white/40" />
               <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Live Dispatch Matrix</h3>
             </div>
             <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {["ALL", "DIRTY", "CLEANING"].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", activeTab === tab ? "bg-primary text-white" : "text-white/20 hover:text-white/40")}>{tab}</button>
                ))}
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredRooms.map((room: any) => (
                  <motion.div key={room.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="p-6 bg-[#0c0c0c] border border-white/[0.05] rounded-[32px] flex flex-col justify-between min-h-[180px] hover:border-white/10 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-2xl font-serif font-bold text-white">Room {room.number}</h4>
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-2">{room.type}</p>
                      </div>
                      <Badge className={cn("text-[9px] border-none", room.status === 'CLEANING' ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500")}>{room.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        {room.status === 'DIRTY' && <Button onClick={() => updateStatus.mutate({ id: room.id, status: 'CLEANING' })} className="w-full bg-primary h-10 rounded-xl font-bold shadow-lg shadow-primary/20">Start Cleaning</Button>}
                        {room.status === 'CLEANING' && <Button onClick={() => updateStatus.mutate({ id: room.id, status: 'INSPECTION_PENDING' })} className="w-full bg-amber-600 h-10 rounded-xl font-bold shadow-lg shadow-amber-600/20">Request Inspection</Button>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredRooms.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
                  <p className="text-white/20 text-sm">No rooms requiring attention in this queue.</p>
                </div>
              )}
           </div>
        </div>

        {/* Inspector Gate */}
        <div className="xl:col-span-3 space-y-6">
           <div className="flex items-center gap-3 px-2">
             <ShieldAlert className="w-4 h-4 text-white/40" />
             <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Inspector Gate</h3>
           </div>
           <Card className="bg-[#0c0c0c] border-white/[0.05] rounded-[40px] p-8 space-y-8">
              {rooms?.filter((r: any) => r.status === 'INSPECTION_PENDING').length === 0 ? (
                <div className="py-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20"><CheckCircle2 className="w-8 h-8" /></div>
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Global Parity Achieved</p>
                   <p className="text-white/20 text-[9px]">All cleaning tasks verified.</p>
                </div>
              ) : (
                rooms?.filter((r: any) => r.status === 'INSPECTION_PENDING').map((r: any) => (
                  <motion.div key={r.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <div className="flex items-center justify-between"><h4 className="font-bold text-white">Room {r.number}</h4></div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => updateStatus.mutate({ id: r.id, status: 'AVAILABLE' })} className="flex-1 bg-emerald-600 text-[10px] h-9 rounded-xl font-black">Release Room</Button>
                      <Button onClick={() => updateStatus.mutate({ id: r.id, status: 'DIRTY' })} className="w-12 h-9 bg-rose-600/10 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-colors"><ThumbsDown className="w-3.5 h-3.5" /></Button>
                    </div>
                  </motion.div>
                ))
              )}
           </Card>
        </div>
      </div>
    </div>
  )
}
