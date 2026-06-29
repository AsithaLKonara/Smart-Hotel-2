"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Building2, Mail, Phone, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/admin/procurement/vendors')
      if (res.ok) {
        setVendors(await res.json())
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
      const res = await fetch('/api/admin/procurement/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Vendor added")
        setShowForm(false)
        setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' })
        fetchVendors()
      } else {
        toast.error("Failed to add vendor")
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
          <h1 className="text-3xl font-bold font-serif">Vendors & Suppliers</h1>
          <p className="text-slate-400">Manage procurement partners</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> New Vendor
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 bg-[#1a1a1a] border-white/10 text-white">
          <CardHeader>
            <CardTitle>Add New Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Company Name</label>
                  <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Contact Person</label>
                  <input value={formData.contactPerson} onChange={e=>setFormData({...formData, contactPerson: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Email</label>
                  <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Phone</label>
                  <input value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400">Address</label>
                  <input value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full p-2 rounded bg-black/50 border border-white/10 mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Vendor</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map(v => (
          <Card key={v.id} className="bg-[#1a1a1a] border-white/10 text-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="text-blue-400 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{v.name}</h3>
                  {v.contactPerson && <p className="text-sm text-slate-400">{v.contactPerson}</p>}
                </div>
              </div>
              <div className="mt-6 space-y-2 text-sm text-slate-300">
                {v.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-500" /> {v.email}</div>}
                {v.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-500" /> {v.phone}</div>}
                {v.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500" /> {v.address}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
        {vendors.length === 0 && !loading && (
          <p className="text-slate-500 col-span-3 text-center py-12">No vendors found. Add one to get started.</p>
        )}
      </div>
    </div>
  )
}
