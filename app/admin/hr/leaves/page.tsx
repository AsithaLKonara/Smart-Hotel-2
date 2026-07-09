"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, Check, X, CalendarRange, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

function ModalShell({ open, onClose, title, children }: { open: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const STATUS_STYLE: Record<string, string> = {
  APPROVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    employeeId: '', type: 'ANNUAL', startDate: '', endDate: '', reason: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [lr, er] = await Promise.all([
        fetch('/api/admin/hr/leaves'),
        fetch('/api/admin/hr/employees')
      ])
      if (lr.ok) setLeaves(await lr.json())
      if (er.ok) setEmployees(await er.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        })
      })
      if (res.ok) {
        toast.success("Leave request submitted")
        setShowModal(false)
        setFormData({ employeeId: '', type: 'ANNUAL', startDate: '', endDate: '', reason: '' })
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to submit leave")
      }
    } catch { toast.error("Error submitting form") }
  }

  const handleApprove = async (id: string, approved: boolean) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/hr/leaves/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: approved ? 'APPROVED' : 'REJECTED' })
      })
      if (res.ok) {
        toast.success(approved ? 'Leave approved' : 'Leave rejected')
        fetchData()
      } else {
        toast.error('Failed to update leave status')
      }
    } catch { toast.error('Error updating leave') }
    finally { setUpdating(null) }
  }

  const daysBetween = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <AdminPageShell title="Leave Management" subtitle="Track and approve vacations, sick days, and time off requests." onRefresh={fetchData}>

      <div className="flex justify-end mb-8">
        <Button onClick={() => setShowModal(true)} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" /> New Leave Request
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {leaves.map(leave => (
            <div key={leave.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {leave.employee?.firstName?.[0]}{leave.employee?.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{leave.employee?.firstName} {leave.employee?.lastName}</h3>
                    <p className="text-xs text-white/50 uppercase tracking-wider mt-0.5">{leave.type} LEAVE</p>
                  </div>
                </div>
                <Badge className={`text-[10px] font-bold border ${STATUS_STYLE[leave.status] || STATUS_STYLE.PENDING}`}>
                  {leave.status}
                </Badge>
              </div>

              <div className="bg-[#1a1a24] rounded-xl p-4 border border-white/5 mb-4 text-center">
                <div className="text-xs text-white/40 mb-2 flex items-center justify-center gap-1">
                  <CalendarRange className="w-3 h-3" /> Duration
                </div>
                <p className="text-sm font-medium text-white">
                  {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-primary mt-1 font-bold">{daysBetween(leave.startDate, leave.endDate)} days</p>
              </div>

              {leave.reason && (
                <p className="text-sm text-white/50 italic line-clamp-2 mb-4">"{leave.reason}"</p>
              )}

              {leave.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={updating === leave.id}
                    onClick={() => handleApprove(leave.id, true)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updating === leave.id}
                    onClick={() => handleApprove(leave.id, false)}
                    className="flex-1 border-rose-500/50 text-rose-400 hover:bg-rose-500/10 text-xs"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Deny
                  </Button>
                </div>
              )}
            </div>
          ))}
          {leaves.length === 0 && (
            <p className="text-slate-500 col-span-3 text-center py-12">No leave requests found.</p>
          )}
        </div>
      )}

      <ModalShell open={showModal} onClose={() => setShowModal(false)} title="New Leave Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Employee</label>
            <select required value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
              <option value="">Select employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} — {emp.department}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Leave Type</label>
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
              <option value="ANNUAL">Annual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
              <option value="MATERNITY">Maternity Leave</option>
              <option value="PATERNITY">Paternity Leave</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Start Date</label>
              <Input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">End Date</label>
              <Input type="date" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Reason (optional)</label>
            <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-3 text-sm text-white h-24 resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-white">Submit Request</Button>
          </div>
        </form>
      </ModalShell>

    </AdminPageShell>
  )
}
