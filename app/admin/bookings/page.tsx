"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, Search, Filter, Eye, Users, DollarSign, 
  Bed, CheckCircle2, Clock, X, RefreshCw, Printer, ShieldCheck, Plus
} from 'lucide-react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { BookingDetailsModal } from '@/components/admin/booking-details-modal'
import { formatPrice } from '@/lib/utils'
import { useProperty } from '@/contexts/property-context'
import toast from 'react-hot-toast'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { cn } from '@/lib/utils'

export default function AdminBookingsPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const { properties, activePropertyId } = useProperty()

  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [viewingBookingId, setViewingBookingId] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [activePropertyId])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/bookings')
      if (!res.ok) throw new Error('Failed to load reservations')
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.bookings || data.items || [])
      setBookings(list)
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter(b => {
    const guestName = b.guest?.name || b.user?.name || ''
    const guestEmail = b.guest?.email || b.user?.email || ''
    const code = b.confirmationCode || b.id || ''
    const roomNum = b.roomAssignments?.[0]?.room?.number || b.room?.number || ''

    const matchesSearch = 
      guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guestEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roomNum.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter
    const matchesProperty = 
      propertyFilter === 'all' || 
      b.propertyId === propertyFilter || 
      b.roomAssignments?.[0]?.room?.propertyId === propertyFilter

    return matchesSearch && matchesStatus && matchesProperty
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'CHECKED_IN':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'CHECKED_OUT':
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
      case 'CANCELLED':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      default:
        return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <PremiumSpinner size="lg" text="Loading Reservations Roster..." />
      </div>
    )
  }

  return (
    <AdminPageShell
      title="Reservations Roster & Folios"
      subtitle="Centralized reservation registry, stay allocations, guest billing folios, and lifecycle settlements."
      onRefresh={fetchBookings}
    >
      {/* Filters Bar */}
      <div className="bg-[#121417] border border-[#1E2227] p-3.5 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between mb-6">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto flex-1">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guest, email, code, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181A1D] border border-[#2B3037] text-xs font-mono text-white pl-9 pr-3 py-2 rounded-xl placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
            />
          </div>

          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="bg-[#181A1D] border border-[#2B3037] text-xs font-mono text-white px-3 py-2 rounded-xl focus:outline-none focus:border-zinc-400"
          >
            <option value="all">All Destinations</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
            ))}
          </select>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 bg-[#090A0C] border border-[#1E2227] p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {['ALL', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all whitespace-nowrap",
                statusFilter === st
                  ? "bg-[#181A1D] border border-[#2B3037] text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              {st === 'ALL' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table (Section 4.C) */}
      <div className="rounded-2xl bg-[#121417] border border-[#1E2227] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#141619] border-b border-[#1E2227] text-zinc-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">Confirmation</th>
                <th className="py-3 px-4 font-sans">Guest Profile</th>
                <th className="py-3 px-4">Suite Allocation</th>
                <th className="py-3 px-4">Stay Dates</th>
                <th className="py-3 px-4">Folio Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1D21] text-zinc-300">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500 font-mono italic">
                    No reservations found matching the active criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const guest = b.guest || b.user
                  const room = b.roomAssignments?.[0]?.room || b.room
                  const nights = b.checkIn && b.checkOut
                    ? Math.max(1, Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000))
                    : 1

                  return (
                    <tr key={b.id} className="hover:bg-[#16181B] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-100">
                        {b.confirmationCode || b.id.slice(0, 8)}
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-white text-xs">{guest?.name || 'Guest'}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{guest?.email || 'No email registered'}</div>
                      </td>

                      <td className="py-3 px-4">
                        {room ? (
                          <div className="flex items-center gap-2">
                            <span className="bg-[#181A1D] border border-[#2B3037] text-zinc-200 font-mono text-xs px-2 py-0.5 rounded-md">
                              #{room.number}
                            </span>
                            <span className="text-zinc-400 text-xs font-sans truncate max-w-[140px]">
                              {room.roomType?.name || room.type || 'Standard'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 font-mono italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-200">
                          {new Date(b.checkIn).toLocaleDateString()} &rarr; {new Date(b.checkOut).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-zinc-500">{nights} Nights &bull; {b.guests || 2} Guests</div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="text-emerald-400 font-bold">{formatPrice(Number(b.totalAmount))}</div>
                        <div className="text-[10px] text-zinc-500 uppercase">{b.paymentStatus || 'UNPAID'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={cn(
                          "font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border tracking-wide uppercase",
                          getStatusBadge(b.status)
                        )}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewingBookingId(b.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-200 text-xs font-mono transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Dossier</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Dossier Popup */}
      <BookingDetailsModal
        bookingId={viewingBookingId}
        onClose={() => setViewingBookingId(null)}
        onStatusUpdated={fetchBookings}
      />
    </AdminPageShell>
  )
}
