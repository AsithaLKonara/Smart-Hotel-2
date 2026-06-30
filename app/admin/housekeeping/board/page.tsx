'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brush, CheckCircle, AlertTriangle, RefreshCw, User, Wrench, Play } from 'lucide-react'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function MobileHousekeepingBoard() {
  const queryClient = useQueryClient()

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['attendant-tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks?type=HOUSEKEEPING')
      const data = await res.json()
      // Filter out Verified and Cancelled tasks to focus on work to be done
      return data.tasks?.filter((t: any) => !['VERIFIED', 'CANCELLED'].includes(t.status)) || []
    }
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendant-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Task status updated')
    },
    onError: () => toast.error('Failed to update task')
  })

  const reportIssueMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'MAINTENANCE' }) // This automatically spawns a maintenance task due to our backend trigger
      })
      if (!res.ok) throw new Error('Failed to report issue')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendant-tasks'] })
      toast.success('Maintenance issue reported')
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050309]">
        <PremiumSpinner size="lg" text="Loading Tasks..." />
      </div>
    )
  }

  const pendingTasks = tasksData?.filter((t: any) => t.status === 'PENDING') || []
  const inProgressTasks = tasksData?.filter((t: any) => t.status === 'IN_PROGRESS') || []
  const completedTasks = tasksData?.filter((t: any) => t.status === 'COMPLETED') || []

  return (
    <div className="p-4 bg-[#050309] min-h-screen flex flex-col font-sans">
      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Tasks</h1>
          <p className="text-white/60 text-xs mt-1">Mobile Housekeeping View</p>
        </div>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ['attendant-tasks'] })} className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 active:scale-95 transition-all">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 space-y-8 pb-10">
        
        {/* IN PROGRESS */}
        {inProgressTasks.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-2">
              <Play className="w-4 h-4" /> Currently Cleaning ({inProgressTasks.length})
            </h2>
            <div className="space-y-4">
              {inProgressTasks.map((task: any) => (
                <Card key={task.id} className="bg-blue-900/10 border-blue-500/30 shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-3xl font-black text-white">Room {task.room?.number || '??'}</h3>
                      <Badge className="bg-blue-500/20 text-blue-400">In Progress</Badge>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => updateTaskMutation.mutate({ id: task.id, status: 'COMPLETED' })}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" /> Finish Cleaning
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Report a maintenance issue for this room?')) {
                            reportIssueMutation.mutate(task.roomId)
                          }
                        }}
                        className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 active:scale-95 transition-all flex items-center justify-center"
                      >
                        <Wrench className="w-5 h-5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* PENDING TASKS */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <Brush className="w-4 h-4" /> To Do ({pendingTasks.length})
          </h2>
          {pendingTasks.length === 0 ? (
            <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-white/40 text-sm">No pending tasks.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTasks.map((task: any) => (
                <Card key={task.id} className="bg-[#111] border-white/10 shadow-sm">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">Room {task.room?.number || '??'}</h3>
                      <p className="text-xs text-white/50">{task.title}</p>
                    </div>
                    <button 
                      onClick={() => updateTaskMutation.mutate({ id: task.id, status: 'IN_PROGRESS' })}
                      className="bg-white hover:bg-slate-200 text-black font-bold py-3 px-6 rounded-xl text-sm active:scale-95 transition-all"
                    >
                      Start
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* COMPLETED TASKS */}
        {completedTasks.length > 0 && (
          <section className="opacity-60">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Awaiting Inspection ({completedTasks.length})
            </h2>
            <div className="space-y-3">
              {completedTasks.map((task: any) => (
                <div key={task.id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                  <span className="text-lg font-bold text-white">Room {task.room?.number}</span>
                  <span className="text-xs text-amber-500 font-bold">Pending</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
