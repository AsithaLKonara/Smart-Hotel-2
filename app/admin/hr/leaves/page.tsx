"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, CalendarRange, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [leavesRes, empRes] = await Promise.all([
        fetch('/api/admin/hr/leaves'),
        fetch('/api/admin/hr/employees')
      ])
      if (leavesRes.ok) setLeaves(await leavesRes.json())
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
      const res = await fetch('/api/admin/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Leave request submitted")
        setShowForm(false)
        fetchData()
      } else {
        toast.error("Failed to submit leave")
      }
    } catch (e) {
      toast.error("Error submitting form")
    }
  }

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'APPROVED': return 'text-emerald-400 bg-emerald-500/10'
          case 'REJECTED': return 'text-rose-400 bg-rose-500/10'
          default: return 'text-amber-400 bg-amber-500/10'
      }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>

  return (
    <div className="p-6 text-white max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif">Leave Management</h1>
          <p className="text-slate-400">Track vacations, sick days, and time off</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Request Leave
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>New Leave Request</CardTitle>
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
                  <label className="text-xs text-slate-400">Leave Type</label>
                  <select required value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="UNPAID">Unpaid Leave</option>
                    <option value="MATERNITY">Maternity/Paternity</option>
                  </select>
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div>
                    <label className="text-xs text-slate-400">Start Date</label>
                    <input type="date" required value={formData.startDate} onChange={e=>setFormData({...formData, startDate: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                    </div>
                    <div>
                    <label className="text-xs text-slate-400">End Date</label>
                    <input type="date" required value={formData.endDate} onChange={e=>setFormData({...formData, endDate: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                    </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Reason</label>
                  <textarea value={formData.reason} onChange={e=>setFormData({...formData, reason: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1 h-24" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Submit Request</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaves.map(leave => (
          <Card key={leave.id} className="bg-[#1a1a1a] border-white/10 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                          <CalendarRange className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                          <h3 className="font-bold">{leave.employee?.firstName} {leave.employee?.lastName}</h3>
                          <p className="text-xs text-slate-400">{leave.type} LEAVE</p>
                      </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${getStatusColor(leave.status)}`}>
                      {leave.status}
                  </span>
              </div>
              
              <div className="bg-black/30 rounded p-3 text-sm text-center mb-4">
                  <div className="text-slate-400 text-xs mb-1">Duration</div>
                  {new Date(leave.startDate).toLocaleDateString()} &rarr; {new Date(leave.endDate).toLocaleDateString()}
              </div>

              {leave.reason && (
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">"{leave.reason}"</p>
              )}

              {leave.status === 'PENDING' && (
                  <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20">
                          <Check className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Button variant="outline" className="flex-1 border-rose-500/50 text-rose-400 hover:bg-rose-500/20">
                          <X className="w-4 h-4 mr-2" /> Deny
                      </Button>
                  </div>
              )}
            </CardContent>
          </Card>
        ))}
        {leaves.length === 0 && !loading && (
          <p className="text-slate-500 col-span-3 text-center py-12">No leave requests found.</p>
        )}
      </div>
    </div>
  )
}
