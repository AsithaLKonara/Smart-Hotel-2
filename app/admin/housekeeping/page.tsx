"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Brush, 
  ShieldAlert, 
  RefreshCw, 
  ThumbsDown,
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { motion, AnimatePresence } from 'framer-motion'

export default function HousekeepingOperations() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("ALL")

  // Fetch Live Rooms for Housekeeping
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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-rooms'] })
      toast.success('Room state updated.')
    }
  })

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <PremiumSpinner size="lg" text="Loading Housekeeping Board..." />
      </div>
    )
  }

  const filteredRooms = rooms?.filter((r: any) => activeTab === 'ALL' || r.status === activeTab) || []

  return (
    <div className="p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Housekeeping Hub</h1>
          <p className="text-slate-400 text-sm mt-1">Manage cleaning assignments and room readiness.</p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['housekeeping-rooms'] })} className="bg-white/5 border-white/10">
          <RefreshCw className="w-4 h-4 mr-2" /> Sync Tasks
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cleaning Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center"><Brush className="w-5 h-5 mr-2 text-primary" /> Tasks</h2>
            <div className="flex gap-2">
              {["ALL", "DIRTY", "CLEANING"].map(tab => (
                <Button 
                  key={tab} 
                  variant={activeTab === tab ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  className="h-8 text-[10px] uppercase font-bold"
                >
                  {tab}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredRooms.map((room: any) => (
                <motion.div 
                  key={room.id} 
                  layout 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-white/10 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-2xl font-bold">Room {room.number}</h4>
                      <Badge variant="outline" className="text-[10px] uppercase mt-2">{room.status}</Badge>
                    </div>
                    <Badge className="bg-primary/20 text-primary">{room.type}</Badge>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    {room.status === 'DIRTY' && (
                      <Button onClick={() => updateStatus.mutate({ id: room.id, status: 'CLEANING' })} className="w-full bg-primary font-bold h-10">Start Cleaning</Button>
                    )}
                    {room.status === 'CLEANING' && (
                      <Button onClick={() => updateStatus.mutate({ id: room.id, status: 'INSPECTION_PENDING' })} className="w-full bg-amber-500 font-bold h-10">Request Inspection</Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Inspection Gate */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center"><ShieldAlert className="w-5 h-5 mr-2 text-rose-500" /> Inspection Gate</h2>
          <Card className="bg-white/[0.02] border-white/5">
            <CardContent className="p-4 space-y-4">
              {rooms?.filter((r: any) => r.status === 'INSPECTION_PENDING').length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-20" />
                  <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">All Verified</p>
                </div>
              ) : (
                rooms?.filter((r: any) => r.status === 'INSPECTION_PENDING').map((r: any) => (
                  <div key={r.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold">Room {r.number}</h4>
                      <Badge className="bg-amber-500/10 text-amber-500">Pending</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => updateStatus.mutate({ id: r.id, status: 'AVAILABLE' })} className="flex-1 bg-emerald-600 h-8 text-[10px] font-bold">Approve</Button>
                      <Button onClick={() => updateStatus.mutate({ id: r.id, status: 'DIRTY' })} variant="outline" className="w-10 h-8 border-rose-500/50 text-rose-500"><ThumbsDown className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
