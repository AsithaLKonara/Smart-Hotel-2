"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    employeeId: '',
    startTime: '',
    endTime: '',
    role: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [shiftsRes, empRes] = await Promise.all([
        fetch('/api/admin/hr/shifts'),
        fetch('/api/admin/hr/employees')
      ])
      if (shiftsRes.ok) setShifts(await shiftsRes.json())
      if (empRes.ok) setEmployees(await empRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/hr/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Shift assigned")
        setShowForm(false)
        fetchData()
      } else {
        toast.error("Failed to assign shift")
      }
    } catch (e) {
      toast.error("Error submitting form")
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>

  return (
    <div className="p-6 text-white max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif">Shift Roster</h1>
          <p className="text-slate-400">Schedule staff across departments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10" onClick={async () => {
            const attId = prompt('Enter Attendance Record ID to force clock-out:');
            if (attId) {
              const res = await fetch(`/api/admin/hr/attendance/${attId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clockOut: new Date().toISOString(), status: 'COMPLETED' })
              });
              if (res.ok) {
                toast.success('Forced clock-out successful');
              } else if (res.status === 423) {
                toast.error('Cannot modify: Payroll period finalized');
              } else {
                toast.error('Failed to update attendance');
              }
            }
          }}>
            <Clock className="w-4 h-4 mr-2" /> Emergency Clock-Out
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" /> Assign Shift
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>Schedule New Shift</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Employee</label>
                  <select required value={formData.employeeId} onChange={e=>setFormData({...formData, employeeId: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Start Time</label>
                  <input type="datetime-local" required value={formData.startTime} onChange={e=>setFormData({...formData, startTime: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">End Time</label>
                  <input type="datetime-local" required value={formData.endTime} onChange={e=>setFormData({...formData, endTime: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Role Override (Optional)</label>
                  <input value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" placeholder="e.g. Night Manager" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Notes</label>
                  <input value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Schedule</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="p-4 font-medium">Employee</th>
              <th className="p-4 font-medium text-slate-400">Date</th>
              <th className="p-4 font-medium text-slate-400">Time</th>
              <th className="p-4 font-medium text-slate-400">Role</th>
              <th className="p-4 font-medium text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {shifts.map(shift => (
              <tr key={shift.id} className="hover:bg-white/5">
                <td className="p-4 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                    {shift.employee?.firstName?.[0]}{shift.employee?.lastName?.[0]}
                  </div>
                  {shift.employee?.firstName} {shift.employee?.lastName}
                </td>
                <td className="p-4 text-slate-300">
                    <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-slate-500" /> {new Date(shift.startTime).toLocaleDateString()}</div>
                </td>
                <td className="p-4 text-slate-300">
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500" /> {new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </td>
                <td className="p-4 text-slate-300">{shift.role || shift.employee?.position}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-white/5 rounded text-xs">{shift.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shifts.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500">No shifts scheduled.</div>
        )}
      </div>
    </div>
  )
}
