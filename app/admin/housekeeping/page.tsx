"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Brush, 
  ShieldAlert, 
  RefreshCw, 
  ThumbsDown,
  CheckCircle2,
  User,
  Clock,
  CheckCheck
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

  // Fetch Tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['housekeeping-tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks?type=HOUSEKEEPING')
      const data = await res.json()
      return data.tasks || []
    }
  })

  // Fetch Staff for assignment
  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await fetch('/api/staff')
      const data = await res.json()
      return data.staff || []
    }
  })

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status, assignedTo }: { id: string, status?: string, assignedTo?: string }) => {
      const body: any = {}
      if (status) body.status = status
      if (assignedTo !== undefined) body.assignedTo = assignedTo

      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Task updated successfully.')
    },
    onError: () => {
      toast.error('Failed to update task')
    }
  })

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <PremiumSpinner size="lg" text="Loading Housekeeping Board..." />
      </div>
    )
  }

  // Filter tasks that are not verified/cancelled
  const activeTasks = tasksData?.filter((t: any) => !['VERIFIED', 'CANCELLED'].includes(t.status)) || []
  
  // Filter for tabs
  const filteredTasks = activeTasks.filter((t: any) => {
    if (activeTab === 'ALL') return t.status !== 'COMPLETED' // hide completed from main board
    return t.status === activeTab
  })

  // Tasks awaiting inspection
  const inspectionTasks = tasksData?.filter((t: any) => t.status === 'COMPLETED') || []

  return (
    <div className="p-6 text-white min-h-screen bg-[#050309]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Housekeeping Command Center</h1>
          <p className="text-slate-400 text-sm mt-1">Dispatch cleaning tasks and inspect rooms.</p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] })} className="bg-white/5 border-white/10 mt-4 md:mt-0 text-white">
          <RefreshCw className="w-4 h-4 mr-2" /> Sync Tasks
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Cleaning Queue */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center"><Brush className="w-5 h-5 mr-2 text-primary" /> Task Dispatch Board</h2>
            <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
              {["ALL", "PENDING", "IN_PROGRESS"].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
             <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl">
               <CheckCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
               <p className="text-slate-400 font-medium">No active tasks in this view.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredTasks.map((task: any) => (
                  <motion.div 
                    key={task.id} 
                    layout 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-white/20 transition-all shadow-xl"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xl font-bold text-white">Room {task.room?.number || 'Unknown'}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{task.title}</p>
                      </div>
                      <Badge className={task.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="mb-4">
                       <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 block">Assigned Attendant</label>
                       <select 
                         className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                         value={task.assignedTo || ''}
                         onChange={(e) => updateTaskStatus.mutate({ id: task.id, assignedTo: e.target.value })}
                       >
                         <option value="">-- Unassigned --</option>
                         {staffData?.map((staff: any) => (
                           <option key={staff.id} value={staff.id}>{staff.name} ({staff.position})</option>
                         ))}
                       </select>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex gap-2">
                      {task.status === 'PENDING' && (
                        <Button 
                          onClick={() => updateTaskStatus.mutate({ id: task.id, status: 'IN_PROGRESS' })} 
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                        >
                          Mark In Progress
                        </Button>
                      )}
                      {task.status === 'IN_PROGRESS' && (
                        <Button 
                          onClick={() => updateTaskStatus.mutate({ id: task.id, status: 'COMPLETED' })} 
                          className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                        >
                          Mark Cleaned (Ready for Inspection)
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Inspection Gate */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center"><ShieldAlert className="w-5 h-5 mr-2 text-amber-500" /> Inspection Gate</h2>
          <Card className="bg-[#0a0a0f] border-white/10 shadow-2xl">
            <CardContent className="p-0">
              {inspectionTasks.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500/20 mx-auto mb-3" />
                  <p className="text-emerald-500/50 text-xs uppercase font-bold tracking-widest">All Rooms Inspected</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {inspectionTasks.map((task: any) => (
                    <div key={task.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-white">Room {task.room?.number}</h4>
                          <p className="text-xs text-slate-400 flex items-center mt-1">
                            <User className="w-3 h-3 mr-1" /> {task.staff?.name || 'Unassigned'}
                          </p>
                        </div>
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          onClick={() => updateTaskStatus.mutate({ id: task.id, status: 'VERIFIED' })} 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        >
                          Verify & Release
                        </Button>
                        <Button 
                          onClick={() => updateTaskStatus.mutate({ id: task.id, status: 'IN_PROGRESS' })} 
                          variant="outline" 
                          className="w-12 border-rose-500/30 hover:bg-rose-500/10 text-rose-500"
                          title="Reject (Send back to cleaning)"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
