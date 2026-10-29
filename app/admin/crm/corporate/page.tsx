"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Users, Plus, Search, Edit2, Trash2, Receipt } from 'lucide-react'
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBillingModal, setShowBillingModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    negotiatedRate: '',
    isActive: true
  })

  const [billingData, setBillingData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    settlementResult: null as any
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
        resetForm()
        fetchAccounts()
      } else {
        toast.error('Failed to create account')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return
    try {
      const res = await fetch(`/api/admin/crm/corporate/${selectedAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData,
          negotiatedRate: formData.negotiatedRate ? parseFloat(formData.negotiatedRate) : null 
        })
      })
      if (res.ok) {
        toast.success('Corporate account updated')
        setShowEditModal(false)
        resetForm()
        fetchAccounts()
      } else {
        toast.error('Failed to update account')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const handleDelete = async () => {
    if (!selectedAccount) return
    try {
      const res = await fetch(`/api/admin/crm/corporate/${selectedAccount.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        const data = await res.json()
        if (data.deactivated) {
           toast.success('Corporate Account has active employees and was deactivated instead of deleted')
        } else {
           toast.success('Corporate Account deleted successfully')
        }
        setShowDeleteModal(false)
        fetchAccounts()
      } else {
        toast.error('Failed to delete account')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const handleSettleBilling = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return
    try {
      const res = await fetch('/api/accounting/corporate/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          corporateAccountId: selectedAccount.id,
          month: parseInt(String(billingData.month)),
          year: parseInt(String(billingData.year))
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setBillingData(prev => ({ ...prev, settlementResult: data }))
        toast.success(data.message)
      } else {
        toast.error(data.error || 'Failed to generate billing statement')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const resetForm = () => {
    setFormData({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', negotiatedRate: '', isActive: true })
    setSelectedAccount(null)
  }

  const openEdit = (account: any) => {
    setSelectedAccount(account)
    setFormData({
      companyName: account.companyName,
      contactName: account.contactName,
      contactEmail: account.contactEmail,
      contactPhone: account.contactPhone || '',
      negotiatedRate: account.negotiatedRate ? String(account.negotiatedRate) : '',
      isActive: account.isActive
    })
    setShowEditModal(true)
  }

  const openDelete = (account: any) => {
    setSelectedAccount(account)
    setShowDeleteModal(true)
  }

  const openBilling = (account: any) => {
    setSelectedAccount(account)
    setBillingData({
       month: new Date().getMonth() + 1,
       year: new Date().getFullYear(),
       settlementResult: null
    })
    setShowBillingModal(true)
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
        <Button onClick={() => { resetForm(); setShowAddModal(true); }} className="bg-primary text-black font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Account
        </Button>
      </div>
      
      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAccounts.map((account: any) => (
            <Card key={account.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors shadow-2xl flex flex-col group">
              <CardContent className="p-6 flex flex-col gap-3 flex-1">
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

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">{account._count?.users || 0} Registered Employees</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openBilling(account)} className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 hover:bg-sky-500/30" title="Generate Invoice">
                      <Receipt className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(account)} className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDelete(account)} className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

      {/* Add / Edit Account Modal */}
      <Dialog.Root open={showAddModal || showEditModal} onOpenChange={(open) => {
         if (!open) { setShowAddModal(false); setShowEditModal(false); }
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50">
            <h2 className="text-2xl font-bold text-white mb-6">{showEditModal ? 'Edit Corporate Account' : 'Create Corporate Account'}</h2>
            <form onSubmit={showEditModal ? handleEdit : handleCreate} className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Negotiated Discount Rate (%)</label>
                  <Input type="number" step="0.1" min="0" max="100" placeholder="e.g. 15 for 15%" value={formData.negotiatedRate} onChange={e=>setFormData({...formData, negotiatedRate: e.target.value})} className="bg-[#1a1a24] border-white/10 text-white" />
                </div>
                {showEditModal && (
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Status</label>
                    <div className="flex items-center gap-2 mt-2">
                       <input type="checkbox" checked={formData.isActive} onChange={e=>setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 rounded border-white/20 bg-transparent text-primary" />
                       <span className="text-sm text-white">Active</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                <Button type="button" variant="ghost" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancel</Button>
                <Button type="submit" className="bg-primary text-black font-semibold">{showEditModal ? 'Save Changes' : 'Create Account'}</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#0a0a0f] border border-rose-500/30 rounded-2xl shadow-2xl p-6 z-50">
            <h2 className="text-xl font-bold text-white mb-2">Delete Corporate Account</h2>
            <p className="text-sm text-white/70 mb-6">Are you sure you want to delete <strong>{selectedAccount?.companyName}</strong>? This action cannot be undone. If the account has registered employees, it will be deactivated instead.</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button onClick={handleDelete} className="bg-rose-500 text-white hover:bg-rose-600">Delete Account</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Billing Settlement Modal */}
      <Dialog.Root open={showBillingModal} onOpenChange={setShowBillingModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50">
            <h2 className="text-2xl font-bold text-white mb-1">Billing Statement</h2>
            <p className="text-sm text-slate-400 mb-6">Generate billing statement for <strong>{selectedAccount?.companyName}</strong>.</p>
            
            <form onSubmit={handleSettleBilling} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Month</label>
                  <select 
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                    value={billingData.month}
                    onChange={(e) => setBillingData({...billingData, month: parseInt(e.target.value)})}
                  >
                     {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                       <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                     ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Year</label>
                  <Input type="number" required value={billingData.year} onChange={e=>setBillingData({...billingData, year: parseInt(e.target.value)})} className="bg-[#1a1a24] border-white/10 text-white" />
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button type="submit" className="bg-sky-500 text-white hover:bg-sky-600">Generate Statement</Button>
              </div>
            </form>

            {billingData.settlementResult && (
              <div className="mt-6 p-4 bg-[#1a1a24] border border-white/5 rounded-xl space-y-3">
                 {billingData.settlementResult.data ? (
                    <>
                      <h3 className="font-bold text-sky-400 text-lg border-b border-white/10 pb-2 mb-2">Statement Summary</h3>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Billable Stays</span>
                        <span className="font-bold text-white">{billingData.settlementResult.data.bookingsCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Gross Room Revenue</span>
                        <span className="font-bold text-white">${billingData.settlementResult.data.totalRoomRevenue.toFixed(2)}</span>
                      </div>
                      {billingData.settlementResult.data.roomDiscount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-400">
                          <span>Negotiated Discount (-{selectedAccount?.negotiatedRate}%)</span>
                          <span>-${billingData.settlementResult.data.roomDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Incidental/Other Charges</span>
                        <span className="font-bold text-white">${billingData.settlementResult.data.totalOtherRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2 pt-2 border-t border-white/5">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Total Amount Due</span>
                        <span className="font-black text-sky-400">${billingData.settlementResult.data.totalBilled.toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 text-center mt-2">This transaction has been logged in the system audit logs.</p>
                    </>
                 ) : (
                    <div className="text-center py-4 text-slate-400">
                       {billingData.settlementResult.message || 'No data found.'}
                    </div>
                 )}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </AdminPageShell>
  )
}
