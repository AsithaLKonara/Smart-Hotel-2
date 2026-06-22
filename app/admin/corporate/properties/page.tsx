"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Building2, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    country: '',
    timezone: 'UTC',
    totalRooms: 0,
    status: 'ACTIVE'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/corporate/properties')
      if (res.ok) setProperties(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/corporate/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Property added to chain")
        setShowForm(false)
        fetchData()
      } else {
        toast.error("Failed to add property")
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
          <h1 className="text-3xl font-bold font-serif">Global Property Manager</h1>
          <p className="text-slate-400">Manage all hotel locations in the chain</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Add Property
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>Register New Hotel Location</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Property Name</label>
                  <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Property Code (e.g. SH-NYC)</label>
                  <input required value={formData.code} onChange={e=>setFormData({...formData, code: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Address</label>
                  <input required value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">City</label>
                  <input required value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Country</label>
                  <input required value={formData.country} onChange={e=>setFormData({...formData, country: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Total Rooms</label>
                  <input type="number" required value={formData.totalRooms} onChange={e=>setFormData({...formData, totalRooms: parseInt(e.target.value)})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Status</label>
                  <select required value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1">
                    <option value="ACTIVE">Active / Open</option>
                    <option value="PRE_OPENING">Pre-Opening</option>
                    <option value="INACTIVE">Inactive / Closed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Property</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(prop => (
          <Card key={prop.id} className="bg-[#1a1a1a] border-white/10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Globe className="w-24 h-24" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Building2 className="text-indigo-400 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{prop.name}</h3>
                  <p className="text-xs font-mono text-slate-500">{prop.code}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">Location</span>
                    <span className="text-right">{prop.city}, {prop.country}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">Inventory</span>
                    <span>{prop.totalRooms} Rooms</span>
                </div>
                <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Status</span>
                    <span className={`font-bold ${prop.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {prop.status}
                    </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {properties.length === 0 && !loading && (
          <p className="text-slate-500 col-span-3 text-center py-12">No properties registered.</p>
        )}
      </div>
    </div>
  )
}
