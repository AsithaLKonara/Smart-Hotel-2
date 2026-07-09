"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Plane, Users, Plus, Search } from 'lucide-react'
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
  
  const [formData, setFormData] = useState({
    agencyName: '',
    iataNumber: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    commissionRate: '10.0'
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
        setFormData({ agencyName: '', iataNumber: '', contactName: '', contactEmail: '', contactPhone: '', commissionRate: '10.0' })
        fetchAgents()
      } else {
        toast.error('Failed to create travel agent')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
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
        <Button onClick={() => setShowAddModal(true)} className="bg-primary text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Agent
        </Button>
      </div>
      
      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAgents.map((agent: any) => (
            <Card key={agent.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors shadow-2xl">
              <CardContent className="p-6 flex flex-col gap-3">
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

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">{agent._count?.users || 0} Sub-agents</span>
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

      <Dialog.Root open={showAddModal} onOpenChange={setShowAddModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50">
            <h2 className="text-2xl font-bold text-white mb-6">Register Travel Agent</h2>
            <form onSubmit={handleCreate} className="space-y-4">
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
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Commission Rate (%)</label>
                <Input type="number" step="0.1" min="0" max="100" placeholder="e.g. 10.0 for 10%" value={formData.commissionRate} onChange={e=>setFormData({...formData, commissionRate: e.target.value})} className="bg-[#1a1a24] border-white/10 text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-white">Register Agent</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </AdminPageShell>
  )
}
