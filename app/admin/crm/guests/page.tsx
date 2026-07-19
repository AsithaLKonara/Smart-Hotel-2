"use client"

import { useState, useEffect } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, UserCheck, Star, Ban, Clock, CalendarDays, DollarSign, Edit, ShieldAlert } from 'lucide-react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import toast from 'react-hot-toast'
import * as Dialog from '@radix-ui/react-dialog'

export default function GuestCRMPage() {
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [vipOnly, setVipOnly] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<any>(null)
  
  // Edit State
  const [editVip, setEditVip] = useState('')
  const [editBlacklist, setEditBlacklist] = useState(false)
  const [editReason, setEditReason] = useState('')

  const fetchGuests = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/crm/guests?search=${encodeURIComponent(search)}&vipOnly=${vipOnly}`)
      if (res.ok) {
        const data = await res.json()
        setGuests(data.guests || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchGuests, 300)
    return () => clearTimeout(timer)
  }, [search, vipOnly])

  const openGuestProfile = (guest: any) => {
    setSelectedGuest(guest)
    setEditVip(guest.vipStatus)
    setEditBlacklist(guest.blacklistStatus)
    setEditReason(guest.blacklistReason || '')
  }

  const saveGuestUpdates = async () => {
    if (!selectedGuest) return
    try {
      const res = await fetch('/api/admin/crm/guests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedGuest.id,
          vipStatus: editVip,
          blacklistStatus: editBlacklist,
          blacklistReason: editBlacklist ? editReason : null
        })
      })
      if (res.ok) {
        toast.success('Guest profile updated')
        setSelectedGuest(null)
        fetchGuests()
      } else {
        toast.error('Failed to update guest')
      }
    } catch (e) {
      toast.error('Error updating guest')
    }
  }

  return (
    <AdminPageShell title="Guest CRM & Profiles" subtitle="Manage guest relationships, loyalty, and stay histories." onRefresh={fetchGuests}>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input 
            placeholder="Search guests by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white w-full"
          />
        </div>
        <Button 
          variant={vipOnly ? 'default' : 'outline'} 
          onClick={() => setVipOnly(!vipOnly)}
          className={vipOnly ? 'bg-primary text-white border-primary' : 'bg-white/5 border-white/10 text-white'}
        >
          <Star className="w-4 h-4 mr-2" /> VIP Only
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm text-white">
            <thead className="bg-white/5 text-white/50 text-xs uppercase">
              <tr>
                <th className="p-4">Guest</th>
                <th className="p-4">Loyalty Tier</th>
                <th className="p-4">Total Stays</th>
                <th className="p-4">Lifetime Value</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {guests.map((guest: any) => (
                <tr key={guest.id} onClick={() => openGuestProfile(guest)} className="hover:bg-white/10 cursor-pointer transition-colors group">
                  <td className="p-4">
                    <p className="font-bold text-white group-hover:text-primary transition-colors">{guest.name}</p>
                    <p className="text-xs text-white/50">{guest.email}</p>
                  </td>
                  <td className="p-4">
                    <Badge variant={guest.vipStatus === 'STANDARD' ? 'outline' : 'default'} className={guest.vipStatus !== 'STANDARD' ? 'bg-primary/20 text-primary border-primary/30' : 'text-white/60 border-white/20'}>
                      {guest.vipStatus}
                    </Badge>
                  </td>
                  <td className="p-4 text-white/80">
                    {guest.guestHistory?.totalStays || 0} stays
                  </td>
                  <td className="p-4 font-mono font-semibold text-white/90">
                    ${(guest.guestHistory?.totalSpend || 0).toFixed(2)}
                  </td>
                  <td className="p-4">
                    {guest.blacklistStatus ? (
                      <span className="flex items-center text-rose-400 text-xs font-bold"><Ban className="w-3 h-3 mr-1" /> Blacklisted</span>
                    ) : (
                      <span className="flex items-center text-emerald-400 text-xs font-bold"><UserCheck className="w-3 h-3 mr-1" /> Active</span>
                    )}
                  </td>
                </tr>
              ))}
              {guests.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center text-white/40">No guests found matching your criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Guest Profile Dialog */}
      <Dialog.Root open={!!selectedGuest} onOpenChange={(open: boolean) => !open && setSelectedGuest(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
            {selectedGuest && (
              <div className="space-y-6 text-white">
                <div className="flex justify-between items-start border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedGuest.name}</h2>
                    <p className="text-slate-400">{selectedGuest.email} {selectedGuest.phone ? `• ${selectedGuest.phone}` : ''}</p>
                  </div>
                  <Badge variant={selectedGuest.vipStatus === 'STANDARD' ? 'outline' : 'default'} className="text-sm px-3 py-1 bg-primary/20 text-primary border-primary/30">
                    {selectedGuest.vipStatus}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-white/50 mb-1 flex items-center"><CalendarDays className="w-3 h-3 mr-1" /> Total Stays</p>
                    <p className="text-xl font-bold">{selectedGuest.guestHistory?.totalStays || 0}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-white/50 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1" /> Total Nights</p>
                    <p className="text-xl font-bold">{selectedGuest.guestHistory?.totalNights || 0}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-white/50 mb-1 flex items-center"><DollarSign className="w-3 h-3 mr-1" /> Lifetime Value</p>
                    <p className="text-xl font-bold text-primary">${(selectedGuest.guestHistory?.totalSpend || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
                   <h3 className="font-bold flex items-center text-lg"><Edit className="w-4 h-4 mr-2 text-white/50" /> Management Controls</h3>
                   
                   <div className="grid grid-cols-2 gap-6">
                     <div>
                       <label className="text-xs text-white/60 mb-2 block uppercase tracking-wider font-bold">Loyalty Tier</label>
                       <select 
                         className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                         value={editVip}
                         onChange={(e) => setEditVip(e.target.value)}
                       >
                         <option value="STANDARD">Standard</option>
                         <option value="SILVER">Silver</option>
                         <option value="GOLD">Gold</option>
                         <option value="PLATINUM">Platinum</option>
                         <option value="VIP">VIP</option>
                       </select>
                     </div>

                     <div>
                       <label className="text-xs text-white/60 mb-2 block uppercase tracking-wider font-bold flex items-center">
                         <ShieldAlert className="w-3 h-3 mr-1 text-rose-500" /> Account Restriction
                       </label>
                       <label className="flex items-center gap-2 text-sm p-2 bg-[#1a1a24] rounded-lg border border-white/10 cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={editBlacklist} 
                           onChange={(e) => setEditBlacklist(e.target.checked)}
                           className="rounded border-white/20 bg-transparent text-rose-500 focus:ring-rose-500"
                         />
                         <span className={editBlacklist ? 'text-rose-400 font-bold' : 'text-white'}>Blacklist this Guest</span>
                       </label>
                     </div>
                   </div>

                   {editBlacklist && (
                     <div className="pt-2">
                       <label className="text-xs text-white/60 mb-2 block">Reason for Blacklist</label>
                       <Input 
                         value={editReason}
                         onChange={(e) => setEditReason(e.target.value)}
                         placeholder="e.g. Caused property damage during stay..."
                         className="bg-[#1a1a24] border-rose-500/30 text-white placeholder:text-white/30"
                       />
                     </div>
                   )}

                   <div className="flex justify-end pt-4 border-t border-white/5">
                     <Button onClick={saveGuestUpdates} className="bg-primary text-white">Save Changes</Button>
                   </div>
                </div>

              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AdminPageShell>
  )
}
