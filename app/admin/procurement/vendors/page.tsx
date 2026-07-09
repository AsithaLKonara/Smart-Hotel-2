"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, Search, Building2, Mail, Phone, MapPin, X, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'

function ModalShell({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
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

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '' })

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/procurement/vendors')
      if (res.ok) setVendors(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchVendors() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/procurement/vendors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Vendor added")
        setShowModal(false)
        setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '' })
        fetchVendors()
      } else { toast.error("Failed to add vendor") }
    } catch { toast.error("Error submitting form") }
  }

  const filtered = vendors.filter(v =>
    `${v.name} ${v.email || ''} ${v.contactPerson || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminPageShell title="Vendors & Suppliers" subtitle="Manage procurement partners and supply chain contacts." onRefresh={fetchVendors}>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white" />
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" /> New Vendor
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(v => (
            <Card key={v.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="text-primary w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-white truncate">{v.name}</h3>
                    {v.contactPerson && <p className="text-sm text-white/50">{v.contactPerson}</p>}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-white/60">
                  {v.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-white/30 flex-shrink-0" /><span className="truncate">{v.email}</span></div>}
                  {v.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-white/30 flex-shrink-0" />{v.phone}</div>}
                  {v.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-white/30 flex-shrink-0" /><span className="truncate">{v.address}</span></div>}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <Badge className={v.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}>
                    {v.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-white/30 flex items-center gap-1"><ShoppingCart className="w-3 h-3" />{v._count?.purchaseOrders || 0} orders</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-slate-500 col-span-3 text-center py-12">No vendors found.</p>
          )}
        </div>
      )}

      <ModalShell open={showModal} onClose={() => setShowModal(false)} title="Add New Vendor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Company Name</label>
              <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Contact Person</label>
              <Input value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Phone</label>
              <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Email</label>
              <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-white/60 uppercase font-bold tracking-wider mb-2 block">Address</label>
              <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="bg-[#1a1a24] border-white/10 text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-white">Save Vendor</Button>
          </div>
        </form>
      </ModalShell>

    </AdminPageShell>
  )
}
