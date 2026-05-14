"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Clock, Plus, Settings2 } from 'lucide-react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

export function GuestRequests() {
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks?type=GUEST_REQUEST')
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : (data.tasks || []))
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewRequest = () => {
    toast.success('Your butler has been notified.', {
      style: { background: '#0c0c0c', color: '#fff', border: '1px solid #c5a059' },
      icon: '🤵'
    })
  }

  return (
    <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] overflow-hidden group">
      <div className="p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-serif font-bold text-white tracking-tight">Guest Services</h3>
            <p className="text-xs text-white/40 font-medium">Housekeeping, Maintenance & Butler requests</p>
          </div>
          <Button 
            onClick={handleNewRequest}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl h-12 px-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" /> New Request
          </Button>
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center"><PremiumSpinner /></div>
        ) : tasks.length === 0 ? (
          <div className="py-10 text-center space-y-4 bg-white/5 rounded-3xl border border-white/5">
            <Settings2 className="w-10 h-10 text-white/10 mx-auto" />
            <p className="text-sm text-white/30 font-light">No active requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:border-primary/30 transition-all group/item">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white/5 text-white/40 group-hover/item:text-primary transition-colors">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{task.title}</p>
                    <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">{task.status}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 border-white/10 ${task.priority === 'HIGH' ? 'text-red-400' : 'text-white/40'}`}>
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
