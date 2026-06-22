"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    assetId: '',
    taskName: '',
    frequencyDays: 30,
    assignedToRole: 'MAINTENANCE'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [schedRes, assetsRes] = await Promise.all([
        fetch('/api/admin/cmms/schedules'),
        fetch('/api/admin/cmms/assets')
      ])
      if (schedRes.ok) setSchedules(await schedRes.json())
      if (assetsRes.ok) setAssets(await assetsRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/cmms/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Schedule created")
        setShowForm(false)
        fetchData()
      } else {
        toast.error("Failed to create schedule")
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
          <h1 className="text-3xl font-bold font-serif">Preventative Schedules</h1>
          <p className="text-slate-400">Configure recurring maintenance routines</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> New Schedule
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>Create Routine Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Target Asset</label>
                  <select required value={formData.assetId} onChange={e=>setFormData({...formData, assetId: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="">Select Asset...</option>
                    {assets.map(asset => (
                        <option key={asset.id} value={asset.id}>{asset.name} ({asset.location})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Task Name</label>
                  <input required value={formData.taskName} onChange={e=>setFormData({...formData, taskName: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" placeholder="e.g. Inspect filters and check fluid levels" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Frequency (Days)</label>
                  <input type="number" required value={formData.frequencyDays} onChange={e=>setFormData({...formData, frequencyDays: parseInt(e.target.value)})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Assign To</label>
                  <input value={formData.assignedToRole} onChange={e=>setFormData({...formData, assignedToRole: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Schedule</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="p-4 font-medium">Task</th>
              <th className="p-4 font-medium text-slate-400">Asset</th>
              <th className="p-4 font-medium text-slate-400">Frequency</th>
              <th className="p-4 font-medium text-slate-400">Next Run</th>
              <th className="p-4 font-medium text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {schedules.map(sched => {
                const isOverdue = new Date(sched.nextRun) < new Date()
                return (
              <tr key={sched.id} className="hover:bg-white/5">
                <td className="p-4 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                    <CalendarClock className="w-4 h-4 text-slate-400" />
                  </div>
                  {sched.taskName}
                </td>
                <td className="p-4 text-slate-300">{sched.asset?.name}</td>
                <td className="p-4 text-slate-300">Every {sched.frequencyDays} days</td>
                <td className="p-4 font-bold">
                    <span className={isOverdue ? "text-rose-400" : "text-emerald-400"}>
                        {new Date(sched.nextRun).toLocaleDateString()}
                    </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 bg-white/5 rounded text-xs ${sched.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {sched.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
        {schedules.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500">No schedules created yet.</div>
        )}
      </div>
    </div>
  )
}
