"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  AlertTriangle, 
  Send, 
  MessageSquare, 
  History,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

export default function KitchenComplaintsPage() {
  const { data: session } = useSession()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ subject: '', description: '', category: 'KITCHEN_OPS' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.subject || !formData.description) {
      toast.error("Please provide all details for the escalation.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          priority: 'HIGH'
        })
      })

      if (res.ok) {
        toast.success("Escalation logged. Duty Manager has been alerted.")
        setFormData({ subject: '', description: '', category: 'KITCHEN_OPS' })
      } else {
        throw new Error("Failed to submit")
      }
    } catch (err) {
      toast.error("Network error. Please contact the front desk via intercom.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminPageShell
      title="Operations Escalation"
      subtitle="Report critical kitchen issues, equipment failures, or logistical bottlenecks to the Duty Manager."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Escalation Form */}
        <div className="lg:col-span-7">
          <Card className="bg-[#0c0c0c] border-white/5 p-10 rounded-[40px] space-y-8">
            <div className="flex items-center gap-4 text-red-500">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-serif font-bold text-white">Management Alert</h4>
                <p className="text-xs text-white/40">Direct line to Executive Operations</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Escalation Subject</label>
                <input 
                  type="text" 
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Supply Shortage - Fresh Seafood"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-red-500/40 outline-none"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-red-500/40 outline-none appearance-none"
                  disabled={submitting}
                >
                  <option value="KITCHEN_OPS">Kitchen Operations</option>
                  <option value="EQUIPMENT">Equipment Failure</option>
                  <option value="STAFFING">Staffing Issue</option>
                  <option value="LOGISTICS">Logistics/Supplies</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Situation Details</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide context for the Duty Manager..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-red-500/40 outline-none h-40 resize-none"
                  disabled={submitting}
                />
              </div>

              <Button 
                type="submit"
                disabled={submitting}
                className="w-full h-16 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg shadow-red-900/20"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Send className="w-4 h-4 mr-3" />}
                Escalate to Manager
              </Button>
            </form>
          </Card>
        </div>

        {/* Right: Quick Contacts & Status */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="bg-primary/5 border-primary/20 p-8 rounded-[40px] space-y-4">
            <h5 className="font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Active Shifts
            </h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                <span className="text-xs text-white/60">Duty Manager</span>
                <Badge className="bg-emerald-500/10 text-emerald-500 text-[9px]">Online</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                <span className="text-xs text-white/60">Executive Chef</span>
                <Badge className="bg-emerald-500/10 text-emerald-500 text-[9px]">Online</Badge>
              </div>
            </div>
          </Card>

          <Card className="bg-[#0c0c0c] border-white/5 p-8 rounded-[40px] space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 px-2 flex items-center gap-2">
              <History className="w-4 h-4" /> Recent Logs
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                <div>
                  <p className="text-xs text-white font-medium">Oven #3 Repair Complete</p>
                  <p className="text-[10px] text-white/20 uppercase font-black">2h ago • Resolved</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                <div>
                  <p className="text-xs text-white font-medium">Logistics Delay - Produce</p>
                  <p className="text-[10px] text-white/20 uppercase font-black">5h ago • Awaiting Source</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminPageShell>
  )
}
