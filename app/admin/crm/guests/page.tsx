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
    <AdminPageShell title="Guest CRM & Profiles" subtitle="Manage guest relationships, loyalty tiers, restriction flags, and lifetime stay histories." onRefresh={fetchGuests}>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input 
            placeholder="Search guests by name, email, or guest ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 placeholder:text-zinc-500 rounded-lg pl-9 pr-3.5 py-2 outline-none focus:border-zinc-400 font-mono transition-all"
          />
        </div>
        <button 
          onClick={() => setVipOnly(!vipOnly)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono transition-all ${
            vipOnly 
              ? 'bg-white text-black font-semibold shadow-sm' 
              : 'bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300'
          }`}
        >
          <Star className="w-3.5 h-3.5" /> VIP Only
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <div className="bg-[#121417] border border-[#1E2227] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141619] border-b border-[#1E2227] text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Guest Profile</th>
                  <th className="p-3.5">Loyalty Tier</th>
                  <th className="p-3.5">Total Stays</th>
                  <th className="p-3.5">Lifetime Value</th>
                  <th className="p-3.5 text-right">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2227]">
                {guests.map((guest: any) => (
                  <tr key={guest.id} onClick={() => openGuestProfile(guest)} className="hover:bg-[#16181B] cursor-pointer transition-colors group">
                    <td className="p-3.5">
                      <p className="font-semibold text-zinc-100 group-hover:text-white transition-colors">{guest.name}</p>
                      <p className="text-[11px] font-mono text-zinc-400">{guest.email}</p>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                        guest.vipStatus !== 'STANDARD' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-[#181A1D] text-zinc-400 border border-[#2B3037]'
                      }`}>
                        {guest.vipStatus}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-zinc-300">
                      {guest.guestHistory?.totalStays || 0} stays
                    </td>
                    <td className="p-3.5 font-mono font-bold text-zinc-100">
                      ${(guest.guestHistory?.totalSpend || 0).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right">
                      {guest.blacklistStatus ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <Ban className="w-3 h-3" /> BLACKLISTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <UserCheck className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {guests.length === 0 && (
                  <tr><td colSpan={5} className="p-12 text-center text-zinc-500 font-mono">No guests found matching search parameters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guest Profile Dialog */}
      <Dialog.Root open={!!selectedGuest} onOpenChange={(open: boolean) => !open && setSelectedGuest(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#121417] border border-[#1E2227] rounded-xl shadow-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
            {selectedGuest && (
              <div className="space-y-6 text-zinc-100">
                <div className="flex justify-between items-start border-b border-[#1E2227] pb-4">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-100">{selectedGuest.name}</h2>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">{selectedGuest.email} {selectedGuest.phone ? `• ${selectedGuest.phone}` : ''}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                    selectedGuest.vipStatus !== 'STANDARD' 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                      : 'bg-[#181A1D] text-zinc-400 border border-[#2B3037]'
                  }`}>
                    {selectedGuest.vipStatus}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#181A1D] p-3.5 rounded-lg border border-[#1E2227]">
                    <p className="text-[10px] font-mono uppercase text-zinc-400 mb-1 flex items-center"><CalendarDays className="w-3 h-3 mr-1" /> Total Stays</p>
                    <p className="text-lg font-mono font-bold text-zinc-100">{selectedGuest.guestHistory?.totalStays || 0}</p>
                  </div>
                  <div className="bg-[#181A1D] p-3.5 rounded-lg border border-[#1E2227]">
                    <p className="text-[10px] font-mono uppercase text-zinc-400 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1" /> Total Nights</p>
                    <p className="text-lg font-mono font-bold text-zinc-100">{selectedGuest.guestHistory?.totalNights || 0}</p>
                  </div>
                  <div className="bg-[#181A1D] p-3.5 rounded-lg border border-[#1E2227]">
                    <p className="text-[10px] font-mono uppercase text-zinc-400 mb-1 flex items-center"><DollarSign className="w-3 h-3 mr-1" /> Lifetime Value</p>
                    <p className="text-lg font-mono font-bold text-emerald-400">${(selectedGuest.guestHistory?.totalSpend || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-[#181A1D] rounded-lg border border-[#1E2227] p-4 space-y-4">
                   <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-200 font-semibold flex items-center">
                     <Edit className="w-3.5 h-3.5 mr-1.5 text-zinc-400" /> Operational Overrides & Controls
                   </h3>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 block">Loyalty Tier</label>
                       <select 
                         className="w-full bg-[#121417] border border-[#2B3037] rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none focus:border-zinc-400 font-mono"
                         value={editVip}
                         onChange={(e) => setEditVip(e.target.value)}
                       >
                         <option value="STANDARD" className="bg-[#121417] text-zinc-100">Standard</option>
                         <option value="SILVER" className="bg-[#121417] text-zinc-100">Silver</option>
                         <option value="GOLD" className="bg-[#121417] text-zinc-100">Gold</option>
                         <option value="PLATINUM" className="bg-[#121417] text-zinc-100">Platinum</option>
                         <option value="VIP" className="bg-[#121417] text-zinc-100">VIP</option>
                       </select>
                     </div>

                     <div>
                       <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 block flex items-center">
                         <ShieldAlert className="w-3 h-3 mr-1 text-rose-400" /> Restriction Flag
                       </label>
                       <label className="flex items-center gap-2 text-xs p-2.5 bg-[#121417] rounded-lg border border-[#2B3037] cursor-pointer">
                         <input 
                           type="checkbox" 
                           checked={editBlacklist} 
                           onChange={(e) => setEditBlacklist(e.target.checked)}
                           className="w-4 h-4 rounded bg-[#181A1D] border-[#2B3037] accent-rose-500"
                         />
                         <span className={`font-mono text-xs ${editBlacklist ? 'text-rose-400 font-bold' : 'text-zinc-300'}`}>Blacklist Guest Record</span>
                       </label>
                     </div>
                   </div>

                   {editBlacklist && (
                     <div className="space-y-1.5 pt-1">
                       <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">Incident Justification</label>
                       <input 
                         value={editReason}
                         onChange={(e) => setEditReason(e.target.value)}
                         placeholder="e.g. Caused property damage / unauthorized disturbance during stay..."
                         className="w-full bg-[#121417] border border-rose-500/30 text-zinc-100 text-xs rounded-lg px-3 py-2 outline-none focus:border-rose-500 font-mono"
                       />
                     </div>
                   )}

                   <div className="flex justify-end pt-3 border-t border-[#1E2227]">
                     <Button onClick={saveGuestUpdates} className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg h-9 px-4 shadow-sm">
                       Save Profile Updates
                     </Button>
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
