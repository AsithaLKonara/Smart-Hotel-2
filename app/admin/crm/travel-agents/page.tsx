"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Plane, Users, Plus, Search, Edit2, Trash2, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import * as Dialog from '@radix-ui/react-dialog'
import toast from 'react-hot-toast'

export default function TravelAgentCRMPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    agencyName: '',
    iataNumber: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    commissionRate: '10.0',
    isActive: true
  })

  const [commissionData, setCommissionData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    settlementResult: null as any
  })

  const fetchAgents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/crm/travel-agents')
      const data = await res.json()
      if (data.agents) setAgents(data.agents)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/crm/travel-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData,
          commissionRate: parseFloat(formData.commissionRate) 
        })
      })
      if (res.ok) {
        toast.success('Travel Agent profile created')
        setShowAddModal(false)
        resetForm()
        fetchAgents()
      } else {
        toast.error('Failed to create travel agent')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAgent) return
    try {
      const res = await fetch(`/api/admin/crm/travel-agents/${selectedAgent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData,
          commissionRate: parseFloat(formData.commissionRate) 
        })
      })
      if (res.ok) {
        toast.success('Travel Agent profile updated')
        setShowEditModal(false)
        resetForm()
        fetchAgents()
      } else {
        toast.error('Failed to update travel agent')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const handleDelete = async () => {
    if (!selectedAgent) return
    try {
      const res = await fetch(`/api/admin/crm/travel-agents/${selectedAgent.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        const data = await res.json()
        if (data.deactivated) {
           toast.success('Travel Agent has active users and was deactivated instead of deleted')
        } else {
           toast.success('Travel Agent deleted successfully')
        }
        setShowDeleteModal(false)
        fetchAgents()
      } else {
        toast.error('Failed to delete travel agent')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const handleSettleCommission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAgent) return
    try {
      const res = await fetch('/api/accounting/commissions/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          travelAgentId: selectedAgent.id,
          month: parseInt(String(commissionData.month)),
          year: parseInt(String(commissionData.year))
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setCommissionData(prev => ({ ...prev, settlementResult: data }))
        toast.success(data.message)
      } else {
        toast.error(data.error || 'Failed to settle commission')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const resetForm = () => {
    setFormData({ agencyName: '', iataNumber: '', contactName: '', contactEmail: '', contactPhone: '', commissionRate: '10.0', isActive: true })
    setSelectedAgent(null)
  }

  const openEdit = (agent: any) => {
    setSelectedAgent(agent)
    setFormData({
      agencyName: agent.agencyName,
      iataNumber: agent.iataNumber || '',
      contactName: agent.contactName,
      contactEmail: agent.contactEmail,
      contactPhone: agent.contactPhone || '',
      commissionRate: String(agent.commissionRate),
      isActive: agent.isActive
    })
    setShowEditModal(true)
  }

  const openDelete = (agent: any) => {
    setSelectedAgent(agent)
    setShowDeleteModal(true)
  }

  const openCommission = (agent: any) => {
    setSelectedAgent(agent)
    setCommissionData({
       month: new Date().getMonth() + 1,
       year: new Date().getFullYear(),
       settlementResult: null
    })
    setShowCommissionModal(true)
  }

  const filteredAgents = agents.filter(a => 
    a.agencyName.toLowerCase().includes(search.toLowerCase()) || 
    a.contactEmail.toLowerCase().includes(search.toLowerCase()) ||
    (a.iataNumber && a.iataNumber.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <AdminPageShell title="Travel Agents & OTAs" subtitle="Manage travel agency profiles and commission rates." onRefresh={fetchAgents}>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input 
            placeholder="Search agencies by name, email, or IATA..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white w-full"
          />
        </div>
        <Button onClick={() => { resetForm(); setShowAddModal(true); }} className="bg-primary text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Agent
        </Button>
      </div>
      
      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAgents.map((agent: any) => (
            <Card key={agent.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors shadow-2xl flex flex-col group">
              <CardContent className="p-6 flex flex-col gap-3 flex-1">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Plane className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg leading-none">{agent.agencyName}</h3>
                      <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{agent.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  {agent.commissionRate !== null && (
                    <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold">
                        {agent.commissionRate}% Comm
                    </span>
                  )}
                </div>
                
                <div className="mt-2 bg-[#1a1a24] rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-semibold text-white/90">{agent.contactName}</p>
                    {agent.iataNumber && <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded font-mono border border-white/10">IATA: {agent.iataNumber}</span>}
                  </div>
                  <p className="text-xs text-white/50">{agent.contactEmail}</p>
                  {agent.contactPhone && <p className="text-xs text-white/50 mt-0.5">{agent.contactPhone}</p>}
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">{agent._count?.users || 0} Sub-agents</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openCommission(agent)} className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" title="Commissions">
                      <DollarSign className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(agent)} className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDelete(agent)} className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredAgents.length === 0 && (
            <div className="text-white/50 p-12 bg-white/5 rounded-xl border-2 border-dashed border-white/10 text-center col-span-full">
              No travel agents found.
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Agent Modal */}
      <Dialog.Root open={showAddModal || showEditModal} onOpenChange={(open) => {
         if (!open) { setShowAddModal(false); setShowEditModal(false); }
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50">
            <h2 className="text-2xl font-bold text-white mb-6">{showEditModal ? 'Edit Travel Agent' : 'Register Travel Agent'}</h2>
            <form onSubmit={showEditModal ? handleEdit : handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Agency Name</label>
                  <Input required value={formData.agencyName} onChange={e=>setFormData({...formData, agencyName: e.target.value})} className="bg-[#1a1a24] border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">IATA Number</label>
                  <Input value={formData.iataNumber} onChange={e=>setFormData({...formData, iataNumber: e.target.value})} className="bg-[#1a1a24] border-white/10 text-white font-mono" placeholder="Optional" />
                </div>
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
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Commission Rate (%)</label>
                  <Input type="number" step="0.1" min="0" max="100" placeholder="e.g. 10.0" value={formData.commissionRate} onChange={e=>setFormData({...formData, commissionRate: e.target.value})} className="bg-[#1a1a24] border-white/10 text-white" />
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
                <Button type="submit" className="bg-primary text-white">{showEditModal ? 'Save Changes' : 'Register Agent'}</Button>
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
            <h2 className="text-xl font-bold text-white mb-2">Delete Travel Agent</h2>
            <p className="text-sm text-white/70 mb-6">Are you sure you want to delete <strong>{selectedAgent?.agencyName}</strong>? This action cannot be undone. If the agent has active users or bookings, they will be deactivated instead.</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button onClick={handleDelete} className="bg-rose-500 text-white hover:bg-rose-600">Delete Agent</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Commission Settlement Modal */}
      <Dialog.Root open={showCommissionModal} onOpenChange={setShowCommissionModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50">
            <h2 className="text-2xl font-bold text-white mb-1">Commission Settlement</h2>
            <p className="text-sm text-slate-400 mb-6">Calculate commissions for <strong>{selectedAgent?.agencyName}</strong> ({selectedAgent?.commissionRate}% rate).</p>
            
            <form onSubmit={handleSettleCommission} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Month</label>
                  <select 
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                    value={commissionData.month}
                    onChange={(e) => setCommissionData({...commissionData, month: parseInt(e.target.value)})}
                  >
                     {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                       <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                     ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Year</label>
                  <Input type="number" required value={commissionData.year} onChange={e=>setCommissionData({...commissionData, year: parseInt(e.target.value)})} className="bg-[#1a1a24] border-white/10 text-white" />
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button type="submit" className="bg-emerald-500 text-white hover:bg-emerald-600">Calculate & Settle</Button>
              </div>
            </form>

            {commissionData.settlementResult && (
              <div className="mt-6 p-4 bg-[#1a1a24] border border-white/5 rounded-xl space-y-3">
                 {commissionData.settlementResult.data ? (
                    <>
                      <h3 className="font-bold text-emerald-400 text-lg border-b border-white/10 pb-2 mb-2">Settlement Summary</h3>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Commissionable Bookings</span>
                        <span className="font-bold text-white">{commissionData.settlementResult.data.bookingsCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Total Room Revenue</span>
                        <span className="font-bold text-white">${commissionData.settlementResult.data.totalRoomRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2 pt-2 border-t border-white/5">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Total Commission Payout</span>
                        <span className="font-black text-emerald-400">${commissionData.settlementResult.data.totalCommission.toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 text-center mt-2">This transaction has been logged in the system audit logs.</p>
                    </>
                 ) : (
                    <div className="text-center py-4 text-slate-400">
                       {commissionData.settlementResult.message || 'No data found.'}
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
