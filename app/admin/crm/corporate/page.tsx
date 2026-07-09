"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Users, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import * as Dialog from '@radix-ui/react-dialog'
import toast from 'react-hot-toast'

export default function CorporateCRMPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    negotiatedRate: ''
  })

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/crm/corporate')
      const data = await res.json()
      if (data.accounts) setAccounts(data.accounts)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/crm/corporate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData,
          negotiatedRate: formData.negotiatedRate ? parseFloat(formData.negotiatedRate) : null 
        })
      })
      if (res.ok) {
        toast.success('Corporate account created')
        setShowAddModal(false)
        setFormData({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', negotiatedRate: '' })
        fetchAccounts()
      } else {
        toast.error('Failed to create account')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const filteredAccounts = accounts.filter(a => 
    a.companyName.toLowerCase().includes(search.toLowerCase()) || 
    a.contactEmail.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminPageShell title="Corporate & B2B Accounts" subtitle="Manage negotiated rates and corporate portfolios." onRefresh={fetchAccounts}>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input 
            placeholder="Search accounts by company or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white w-full"
          />
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-primary text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Account
        </Button>
      </div>
      
      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAccounts.map((account: any) => (
            <Card key={account.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors shadow-2xl">
              <CardContent className="p-6 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg leading-none">{account.companyName}</h3>
                      <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{account.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  {account.negotiatedRate && (
                    <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold">
                        {account.negotiatedRate}% Off
                    </span>
                  )}
                </div>
                
                <div className="mt-2 bg-[#1a1a24] rounded-xl p-4 border border-white/5">
                  <p className="text-sm font-semibold text-white/90">{account.contactName}</p>
                  <p className="text-xs text-white/50 mt-1">{account.contactEmail}</p>
                  {account.contactPhone && <p className="text-xs text-white/50 mt-0.5">{account.contactPhone}</p>}
                </div>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">{account._count?.users || 0} Registered Employees</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredAccounts.length === 0 && (
            <div className="text-white/50 p-12 bg-white/5 rounded-xl border-2 border-dashed border-white/10 text-center col-span-full">
              No corporate accounts found.
            </div>
          )}
        </div>
      )}

      <Dialog.Root open={showAddModal} onOpenChange={setShowAddModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50">
            <h2 className="text-2xl font-bold text-white mb-6">Create Corporate Account</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Company Name</label>
                <Input required value={formData.companyName} onChange={e=>setFormData({...formData, companyName: e.target.value})} className="bg-[#1a1a24] border-white/10 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Contact Name</label>
                  <Input required value={formData.contactName} onChange={e=>setFormData({...formData, contactName: e.target.value})} className="bg-[#1a1a24] border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Contact Phone</label>
                  <Input value={formData.contactPhone} onChange={e=>setFormData({...formData, contactPhone: e.target.value})} className="bg-[#1a1a24] border-white/10 text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Contact Email</label>
                <Input type="email" required value={formData.contactEmail} onChange={e=>setFormData({...formData, contactEmail: e.target.value})} className="bg-[#1a1a24] border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Negotiated Discount Rate (%)</label>
                <Input type="number" min="0" max="100" placeholder="e.g. 15 for 15%" value={formData.negotiatedRate} onChange={e=>setFormData({...formData, negotiatedRate: e.target.value})} className="bg-[#1a1a24] border-white/10 text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white">Create Account</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </AdminPageShell>
  )
}
