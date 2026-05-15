"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  ClipboardList, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Wrench,
  Coffee,
  Waves,
  Loader2
} from 'lucide-react'
import { GuestPageShell } from '@/components/dashboard/guest/guest-page-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

const categories = [
  { id: 'HOUSEKEEPING', name: 'Housekeeping', icon: Waves, desc: 'Towels, cleaning, toiletries' },
  { id: 'MAINTENANCE', name: 'Maintenance', icon: Wrench, desc: 'AC, lighting, plumbing' },
  { id: 'GUEST_REQUEST', name: 'Concierge', icon: ClipboardList, desc: 'Transport, bookings, info' },
  { id: 'ROOM_SERVICE', name: 'Amenities', icon: Coffee, desc: 'Minibar, pillows, dental kit' },
]

export default function RequestsPage() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quickRequest, setQuickRequest] = useState("")

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks?type=all')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const submitRequest = async (type: string, title: string, description?: string) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || '',
          type,
          priority: 'MEDIUM'
        })
      })
      if (res.ok) {
        toast.success("Request submitted successfully")
        setQuickRequest("")
        fetchTasks()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to submit request")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GuestPageShell
      title="Guest Requests"
      subtitle="Your direct line to our hospitality team. Request amenities, services, or maintenance with a single tap."
      firstName={session?.user?.name?.split(' ')[0]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: New Request Categories */}
        <div className="lg:col-span-7 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <Card 
                key={cat.id} 
                className="bg-[#0c0c0c] border-white/5 p-6 rounded-[30px] hover:border-primary/30 transition-all group cursor-pointer"
                onClick={() => submitRequest(cat.id, `${cat.name} Request`)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold">{cat.name}</h4>
                    <p className="text-xs text-white/40">{cat.desc}</p>
                  </div>
                  <Plus className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors" />
                </div>
              </Card>
            ))}
          </div>

          <Card className="bg-[#0c0c0c] border-white/5 p-8 rounded-[40px] space-y-6">
            <h4 className="text-lg font-serif font-bold">Quick Request</h4>
            <textarea 
              placeholder="Tell us what you need..."
              value={quickRequest}
              onChange={(e) => setQuickRequest(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-primary/40 outline-none h-32 resize-none"
            />
            <Button 
              disabled={!quickRequest.trim() || submitting}
              onClick={() => submitRequest('GUEST_REQUEST', 'Quick Request', quickRequest)}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
            </Button>
          </Card>
        </div>

        {/* Right: Active Requests Timeline */}
        <div className="lg:col-span-5">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-sm font-black uppercase tracking-widest text-white/40">Recent Activity</h4>
              <Badge variant="outline" className="text-[10px] border-white/10 text-primary">Live Updates</Badge>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
              {loading ? (
                <div className="py-20 text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                </div>
              ) : tasks.length > 0 ? tasks.map((req) => (
                <Card key={req.id} className="bg-[#0c0c0c] border-white/5 p-6 rounded-3xl group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={req.status === 'COMPLETED' ? 'text-emerald-500' : req.status === 'IN_PROGRESS' ? 'text-amber-500' : 'text-primary'}>
                        {req.status === 'COMPLETED' ? <CheckCircle className="w-4 h-4" /> : req.status === 'IN_PROGRESS' ? <Clock className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tighter text-white/40">{req.id.slice(-8)}</span>
                    </div>
                    <Badge className={req.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : req.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}>
                      {req.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <h5 className="font-bold text-white mb-1">{req.title}</h5>
                  {req.description && <p className="text-xs text-white/40 mb-3 line-clamp-2">{req.description}</p>}
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-black">
                    <span className="text-white/20">{req.type}</span>
                    <span className="text-white/40">{new Date(req.createdAt).toLocaleTimeString()}</span>
                  </div>
                </Card>
              )) : (
                <div className="py-20 text-center text-white/20 uppercase tracking-widest font-black text-[10px]">
                  No active requests in this timeline.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </GuestPageShell>
  )
}
