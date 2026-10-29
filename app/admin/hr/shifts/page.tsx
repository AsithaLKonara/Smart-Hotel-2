"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, Clock, Calendar as CalendarIcon, X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProperty } from '@/contexts/property-context'

function ModalShell({ open, onClose, title, children }: { open: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o: boolean) => !o && onClose()}>
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

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [activeAttendances, setActiveAttendances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { activePropertyId } = useProperty()
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [showClockOutModal, setShowClockOutModal] = useState(false)
  const [clockOutAttId, setClockOutAttId] = useState('')
  const [clockingOut, setClockingOut] = useState(false)
  const [showClockInModal, setShowClockInModal] = useState(false)
  const [clockInEmpId, setClockInEmpId] = useState('')
  const [clockInTime, setClockInTime] = useState('')
  const [clockingIn, setClockingIn] = useState(false)

  const [formData, setFormData] = useState({
    employeeId: '', startTime: '', endTime: '', role: '', notes: ''
  })

  const fetchData = async () => {
    if (!activePropertyId) return
    setLoading(true)
    try {
      const headers = { 'x-property-id': activePropertyId }
      const [sr, er, ar] = await Promise.all([
        fetch('/api/admin/hr/shifts', { headers }),
        fetch('/api/admin/hr/employees', { headers }),
        fetch('/api/admin/hr/attendance/active', { headers })
      ])
      if (sr.ok) setShifts(await sr.json())
      if (er.ok) setEmployees(await er.json())
      if (ar.ok) setActiveAttendances(await ar.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [activePropertyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/hr/shifts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-property-id': activePropertyId || ''
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Shift assigned")
        setShowShiftModal(false)
        setFormData({ employeeId: '', startTime: '', endTime: '', role: '', notes: '' })
        fetchData()
      } else {
        toast.error("Failed to assign shift")
      }
    } catch { toast.error("Error submitting form") }
  }

  const handleForceClockOut = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clockOutAttId.trim()) return
    setClockingOut(true)
    try {
      const res = await fetch(`/api/admin/hr/attendance/${clockOutAttId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clockOut: new Date().toISOString(), status: 'COMPLETED' })
      })
      if (res.ok) {
        toast.success('Forced clock-out successful')
        setShowClockOutModal(false)
        setClockOutAttId('')
      } else if (res.status === 423) {
        toast.error('Cannot modify: Payroll period finalized')
      } else {
        toast.error('Failed to update attendance')
      }
    } catch { toast.error('Error during clock-out') }
    finally { setClockingOut(false) }
  }

  const handleManualClockIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clockInEmpId || !clockInTime) return
    setClockingIn(true)
    try {
      const res = await fetch('/api/admin/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: clockInEmpId, clockInTime })
      })
      if (res.ok) {
        toast.success('Successfully clocked in employee manually')
        setShowClockInModal(false)
        setClockInEmpId('')
        setClockInTime('')
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to manually clock in')
      }
    } catch { toast.error('Error during manual clock-in') }
    finally { setClockingIn(false) }
  }

  return (
    <AdminPageShell title="Shift Roster" subtitle="Schedule staff across departments and manage attendance." onRefresh={fetchData}>

      <div className="flex gap-3 justify-end mb-8">
        <Button variant="outline" onClick={() => setShowClockInModal(true)}
          className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20">
          <Clock className="w-4 h-4 mr-2" /> Manual Clock-In
        </Button>
        <Button variant="outline" onClick={() => setShowClockOutModal(true)}
          className="border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20">
          <AlertTriangle className="w-4 h-4 mr-2" /> Emergency Clock-Out
        </Button>
        <Button onClick={() => setShowShiftModal(true)} className="bg-primary text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Assign Shift
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="p-4 text-white/50 text-xs uppercase">Employee</th>
                <th className="p-4 text-white/50 text-xs uppercase">Date</th>
                <th className="p-4 text-white/50 text-xs uppercase">Time</th>
                <th className="p-4 text-white/50 text-xs uppercase">Role</th>
                <th className="p-4 text-white/50 text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {shifts.map(shift => (
                <tr key={shift.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                        {shift.employee?.firstName?.[0]}{shift.employee?.lastName?.[0]}
                      </div>
                      <span>{shift.employee?.firstName} {shift.employee?.lastName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-white/70">
                    <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-white/30" />
                      {new Date(shift.startTime).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4 text-white/70 font-mono text-xs">
                    {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 text-white/60">{shift.role || shift.employee?.position}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      shift.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 
                      shift.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : 
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {shift.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {shifts.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center text-white/40">No shifts scheduled.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Shift Modal */}
      <ModalShell open={showShiftModal} onClose={() => setShowShiftModal(false)} title="Schedule New Shift">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Employee</label>
            <select required value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
              <option value="">Select employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.department})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Start Time</label>
              <Input type="datetime-local" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">End Time</label>
              <Input type="datetime-local" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Role Override (Optional)</label>
            <Input value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="e.g. Night Manager" className="bg-[#1a1a24] border-white/10 text-white" />
          </div>
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Notes</label>
            <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setShowShiftModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-black font-semibold">Schedule Shift</Button>
          </div>
        </form>
      </ModalShell>

      {/* Emergency Clock-Out Modal */}
      <ModalShell open={showClockOutModal} onClose={() => setShowClockOutModal(false)} title="Emergency Clock-Out">
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-5">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300">This will force clock-out an attendance record immediately using the current server time. Use only in emergencies.</p>
        </div>
        <form onSubmit={handleForceClockOut} className="space-y-4">
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Select Employee to Clock-Out</label>
            <select required value={clockOutAttId} onChange={e => setClockOutAttId(e.target.value)}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
              <option value="" disabled>
                {activeAttendances.length === 0 ? "No employees currently clocked in" : "Select an active shift..."}
              </option>
              {activeAttendances.map(att => (
                <option key={att.id} value={att.id}>
                  {att.employee.firstName} {att.employee.lastName} ({att.employee.department}) - Clocked In: {new Date(att.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setShowClockOutModal(false)}>Cancel</Button>
            <Button type="submit" disabled={clockingOut} className="bg-rose-600 hover:bg-rose-500 text-white">
              {clockingOut ? 'Processing...' : 'Force Clock-Out'}
            </Button>
          </div>
        </form>
      </ModalShell>

      {/* Manual Clock-In Modal */}
      <ModalShell open={showClockInModal} onClose={() => setShowClockInModal(false)} title="Manual Clock-In">
        <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-5">
          <Clock className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-300">Manually clock-in an employee who forgot to punch in. This will bypass normal restrictions.</p>
        </div>
        <form onSubmit={handleManualClockIn} className="space-y-4">
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Employee</label>
            <select required value={clockInEmpId} onChange={e => setClockInEmpId(e.target.value)}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white">
              <option value="">Select an employee...</option>
              {employees.filter(emp => !activeAttendances.some(att => att.employeeId === emp.id)).map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.department})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Clock-In Time</label>
            <Input type="datetime-local" required value={clockInTime} onChange={e => setClockInTime(e.target.value)} className="bg-[#1a1a24] border-white/10 text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setShowClockInModal(false)}>Cancel</Button>
            <Button type="submit" disabled={clockingIn} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {clockingIn ? 'Processing...' : 'Clock In Manually'}
            </Button>
          </div>
        </form>
      </ModalShell>

    </AdminPageShell>
  )
}
