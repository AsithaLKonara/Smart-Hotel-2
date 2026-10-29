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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Escalation Form */}
        <div className="lg:col-span-7">
          <Card className="bg-[#121417] border border-[#1E2227] p-6 rounded-xl space-y-6 shadow-sm">
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#1E2227]">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-100">Management Alert Dispatch</h4>
                <p className="text-xs text-zinc-400 font-mono">Direct priority line to Executive Duty Operations</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Escalation Subject</label>
                <input 
                  type="text" 
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Supply Shortage - Fresh Seafood / Oven 2 Heating Fail"
                  className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 outline-none transition-all"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Incident Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3.5 py-2.5 text-xs text-zinc-100 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 outline-none transition-all"
                  disabled={submitting}
                >
                  <option value="KITCHEN_OPS" className="bg-[#181A1D] text-zinc-100">Kitchen Operations</option>
                  <option value="EQUIPMENT" className="bg-[#181A1D] text-zinc-100">Equipment Failure</option>
                  <option value="STAFFING" className="bg-[#181A1D] text-zinc-100">Staffing Issue</option>
                  <option value="LOGISTICS" className="bg-[#181A1D] text-zinc-100">Logistics / Supplies</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Situation Context & Details</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide precise equipment tag, location, guest impact, and immediate needs..."
                  className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 outline-none h-32 resize-none transition-all"
                  disabled={submitting}
                />
              </div>

              <Button 
                type="submit"
                disabled={submitting}
                className="w-full h-10 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Transmit Priority Escalation
              </Button>
            </form>
          </Card>
        </div>

        {/* Right: Quick Contacts & Status */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-[#121417] border border-[#1E2227] p-6 rounded-xl space-y-4 shadow-sm">
            <h5 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-zinc-400" /> Active Operations Desk
            </h5>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 bg-[#181A1D] border border-[#1E2227] rounded-lg">
                <span className="text-xs text-zinc-300 font-medium">Duty Manager</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#181A1D] border border-[#1E2227] rounded-lg">
                <span className="text-xs text-zinc-300 font-medium">Executive Chef</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
            </div>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] p-6 rounded-xl space-y-4 shadow-sm">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-zinc-400" /> Recent Dispatch Logs
            </h4>
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 pb-3 border-b border-[#1E2227]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5" />
                <div className="space-y-0.5">
                  <p className="text-xs text-zinc-200 font-medium">Oven #3 Thermal Sensor Replaced</p>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase">2H AGO • RESOLVED</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5" />
                <div className="space-y-0.5">
                  <p className="text-xs text-zinc-200 font-medium">Produce Shipment Cold-Chain Delay</p>
                  <p className="text-[10px] font-mono text-zinc-400 uppercase">5H AGO • ROUTED TO SUPPLIER</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminPageShell>
  )
}
