"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Box, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'HVAC',
    location: '',
    serialNumber: '',
    installationDate: '',
    warrantyExpiry: '',
    notes: ''
  })

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/admin/cmms/assets')
      if (res.ok) {
        setAssets(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/cmms/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Asset added")
        setShowForm(false)
        fetchAssets()
      } else {
        toast.error("Failed to add asset")
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
          <h1 className="text-3xl font-bold font-serif">Asset Registry</h1>
          <p className="text-slate-400">Track heavy machinery and hotel property</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Add Asset
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>Register New Asset</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Asset Name</label>
                  <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Category</label>
                  <select required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="HVAC">HVAC</option>
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="KITCHEN_EQUIPMENT">Kitchen Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Location</label>
                  <input required value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Serial Number</label>
                  <input value={formData.serialNumber} onChange={e=>setFormData({...formData, serialNumber: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Installation Date</label>
                  <input type="date" value={formData.installationDate} onChange={e=>setFormData({...formData, installationDate: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Warranty Expiry</label>
                  <input type="date" value={formData.warrantyExpiry} onChange={e=>setFormData({...formData, warrantyExpiry: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Notes</label>
                  <input value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Asset</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map(asset => (
          <Card key={asset.id} className="bg-[#1a1a1a] border-white/10 text-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Wrench className="text-orange-400 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg line-clamp-1">{asset.name}</h3>
                  <p className="text-xs font-bold text-slate-500">{asset.category}</p>
                </div>
              </div>
              <div className="mt-6 space-y-2 text-sm text-slate-300">
                <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Status</span>
                    <span className="text-emerald-400 font-bold">{asset.status}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Location</span>
                    <span>{asset.location}</span>
                </div>
                {asset.serialNumber && (
                    <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-slate-500">S/N</span>
                        <span className="text-xs font-mono">{asset.serialNumber}</span>
                    </div>
                )}
                {asset.warrantyExpiry && (
                    <div className="flex justify-between pt-1">
                        <span className="text-slate-500">Warranty</span>
                        <span className="text-xs text-amber-400">{new Date(asset.warrantyExpiry).toLocaleDateString()}</span>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {assets.length === 0 && !loading && (
          <p className="text-slate-500 col-span-3 text-center py-12">No assets registered yet.</p>
        )}
      </div>
    </div>
  )
}
