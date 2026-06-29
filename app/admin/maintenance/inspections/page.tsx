"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, ClipboardCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    assetId: '',
    technicianName: '',
    status: 'PASS',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [inspRes, assetsRes] = await Promise.all([
        fetch('/api/admin/cmms/inspections'),
        fetch('/api/admin/cmms/assets')
      ])
      if (inspRes.ok) setInspections(await inspRes.json())
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
      const res = await fetch('/api/admin/cmms/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Inspection logged")
        setShowForm(false)
        fetchData()
      } else {
        toast.error("Failed to log inspection")
      }
    } catch (e) {
      toast.error("Error submitting form")
    }
  }

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'PASS': return 'text-emerald-400 bg-emerald-500/10'
          case 'FAIL': return 'text-rose-400 bg-rose-500/10'
          case 'REPAIR_NEEDED': return 'text-amber-400 bg-amber-500/10'
          default: return 'text-slate-400 bg-slate-500/10'
      }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8" /></div>

  return (
    <div className="p-6 text-white max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif">Inspection Logs</h1>
          <p className="text-slate-400">Historical ledger of technician work</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Log Inspection
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>Log Preventative Inspection</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Asset Inspected</label>
                  <select required value={formData.assetId} onChange={e=>setFormData({...formData, assetId: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="">Select Asset...</option>
                    {assets.map(asset => (
                        <option key={asset.id} value={asset.id}>{asset.name} ({asset.location})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Technician Name</label>
                  <input required value={formData.technicianName} onChange={e=>setFormData({...formData, technicianName: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Result / Status</label>
                  <select required value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="PASS">Pass (Operational)</option>
                    <option value="REPAIR_NEEDED">Repair Needed</option>
                    <option value="FAIL">Fail (Out of Order)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Inspection Notes</label>
                  <textarea value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1 h-24" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Log</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inspections.map(insp => (
          <Card key={insp.id} className="bg-[#1a1a1a] border-white/10 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                          <ClipboardCheck className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                          <h3 className="font-bold line-clamp-1">{insp.asset?.name}</h3>
                          <p className="text-xs text-slate-400">{new Date(insp.inspectionDate).toLocaleString()}</p>
                      </div>
                  </div>
              </div>
              
              <div className="mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(insp.status)}`}>
                      {insp.status}
                  </span>
              </div>

              {insp.notes && (
                  <p className="text-sm text-slate-400 line-clamp-3 mb-4 bg-black/30 p-2 rounded border border-white/5">
                      "{insp.notes}"
                  </p>
              )}

              <div className="text-xs text-slate-500 font-mono mt-auto">
                  Technician: {insp.technicianName}
              </div>
            </CardContent>
          </Card>
        ))}
        {inspections.length === 0 && !loading && (
          <p className="text-slate-500 col-span-3 text-center py-12">No inspections logged.</p>
        )}
      </div>
    </div>
  )
}
