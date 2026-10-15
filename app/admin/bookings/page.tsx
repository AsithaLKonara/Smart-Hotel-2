"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, Search, Filter, Eye, Users, DollarSign, 
  Bed, CheckCircle2, Clock, X, RefreshCw, Printer, ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { BookingDetailsModal } from '@/components/admin/booking-details-modal'
import { formatPrice } from '@/lib/utils'
import { useProperty } from '@/contexts/property-context'
import toast from 'react-hot-toast'

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

  if (authStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <PremiumSpinner size="lg" text="Loading Master Bookings Roster..." />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Reservations & Bookings' },
        ]}
        className="mb-2"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-luxury">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-white tracking-wide">
                Reservations Roster
              </h1>
              <p className="text-white/50 text-xs mt-0.5">
                Centralized reservation dossier, guest intake, stay extras, and folio settlements
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchBookings}
            className="border-white/10 text-white/80 hover:text-white rounded-xl text-xs h-10 px-4"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button
            onClick={() => router.push('/booking')}
            className="bg-gold-gradient text-white font-bold text-xs uppercase px-5 rounded-xl h-10 border-none shadow-luxury"
          >
            + New Reservation
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0f0f13] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guest, email, code, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-xs text-white pl-10 pr-4 py-2.5 rounded-xl placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="bg-black/40 border border-white/10 text-xs text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Destinations</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl">
            {['ALL', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-primary text-black font-black'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'All' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <Card className="bg-[#0f0f13] border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-white/40 uppercase text-[10px] border-b border-white/5 font-bold">
              <tr>
                <th className="py-3.5 px-4">Confirmation</th>
                <th className="py-3.5 px-4">Guest</th>
                <th className="py-3.5 px-4">Suite</th>
                <th className="py-3.5 px-4">Stay Dates</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-white/40 italic">
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
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        {b.confirmationCode || b.id.slice(0, 8)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{guest?.name || 'Guest'}</div>
                        <div className="text-[10px] text-white/40">{guest?.email || 'No email'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {room ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-white/10 text-white font-mono">
                              #{room.number}
                            </Badge>
                            <span className="text-white/60">{room.roomType?.name || room.type || 'Suite'}</span>
                          </div>
                        ) : (
                          <span className="text-white/30 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">
                          {new Date(b.checkIn).toLocaleDateString()} &rarr; {new Date(b.checkOut).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-white/40">{nights} Nights &bull; {b.guests || 2} Guests</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-emerald-400 font-bold">{formatPrice(Number(b.totalAmount))}</div>
                        <div className="text-[10px] text-white/40 uppercase">{b.paymentStatus || 'UNPAID'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase ${
                            b.status === 'CONFIRMED' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                            b.status === 'CHECKED_IN' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                            b.status === 'CHECKED_OUT' ? 'border-slate-500/30 text-slate-400 bg-slate-500/10' :
                            'border-rose-500/30 text-rose-400 bg-rose-500/10'
                          }`}
                        >
                          {b.status.replace('_', ' ')}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => setViewingBookingId(b.id)}
                          className="h-8 px-3 text-xs bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 rounded-xl font-bold"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Dossier
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Booking Dossier Popup */}
      <BookingDetailsModal
        bookingId={viewingBookingId}
        onClose={() => setViewingBookingId(null)}
        onStatusUpdated={fetchBookings}
      />
    </div>
  )
}
