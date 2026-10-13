"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessReceptionistFeatures } from '@/lib/rbac-helpers'
import { useProperty } from '@/contexts/property-context'
import { useApi } from '@/hooks/use-api'
import { Calendar, Search, Filter, DollarSign, User, Bed, Edit, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  status: string
  paymentStatus: string
  specialRequests?: string
  confirmationCode?: string
  guest: {
    id: string
    name: string
    email: string
  }
  roomAssignments?: Array<{
    room: {
      id: string
      number: string
      type: string
      price: number
    }
  }>
}

import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'

export function BookingsClient({ initialBookings }: { initialBookings: Booking[] }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { activePropertyId } = useProperty()
  const { data: rawBookings, isLoading: apiLoading, mutate: fetchBookings } = useApi('/api/bookings')
  const bookings: Booking[] = Array.isArray(rawBookings) ? rawBookings : (Array.isArray(rawBookings?.bookings) ? rawBookings.bookings : initialBookings)
  const loading = apiLoading && !rawBookings

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [checkoutDialog, setCheckoutDialog] = useState<{ isOpen: boolean; booking: Booking | null }>({ isOpen: false, booking: null })

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-property-id': activePropertyId || 'all'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update booking')

      toast.success(`Booking ${newStatus.toLowerCase()} successfully`)
      fetchBookings()
    } catch (error) {
      toast.error('Failed to update booking')
    }
  }

  const filteredBookings = (Array.isArray(bookings) ? bookings : []).filter(booking => {
    const matchesSearch = booking.confirmationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.roomAssignments?.[0]?.room?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.guest?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus
    const matchesPayment = filterPayment === 'all' || booking.paymentStatus === filterPayment
    return matchesSearch && matchesStatus && matchesPayment
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'CHECKED_IN': return 'bg-primary/10 text-primary border-primary/20'
      case 'CHECKED_OUT': return 'bg-white/10 text-white/40 border-white/10'
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed': return 'text-emerald-500'
      case 'pending': return 'text-amber-500'
      case 'failed': return 'text-rose-500'
      case 'unpaid': return 'text-rose-500/70'
      default: return 'text-white/40'
    }
  }

  const bookingsArray = Array.isArray(bookings) ? bookings : []
  const statsData = {
    total: bookingsArray.length,
    confirmed: bookingsArray.filter(b => b.status === 'CONFIRMED').length,
    checkedIn: bookingsArray.filter(b => b.status === 'CHECKED_IN').length,
    totalRevenue: bookingsArray.filter(b => b.paymentStatus === 'completed' || b.paymentStatus === 'PAID').reduce((sum, b) => sum + (b.totalAmount || 0), 0)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <PremiumSpinner size="lg" text="Fetching Bookings..." />
      </div>
    )
  }

  return (
    <AdminPageShell
      title="Booking Control"
      subtitle="Manage guest reservations and bookings"
      onRefresh={fetchBookings}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="bg-[#0c0c0c] border-white/5 p-6 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Total Active</p>
              <p className="text-2xl font-serif font-bold text-white mt-1">{statsData.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="bg-[#0c0c0c] border-white/5 p-6 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Confirmed</p>
              <p className="text-2xl font-serif font-bold text-emerald-500 mt-1">{statsData.confirmed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>

        <Card className="bg-[#0c0c0c] border-white/5 p-6 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">In Residence</p>
              <p className="text-2xl font-serif font-bold text-primary mt-1">{statsData.checkedIn}</p>
            </div>
            <Bed className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="bg-[#0c0c0c] border-white/5 p-6 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Revenue</p>
              <p className="text-2xl font-serif font-bold text-primary mt-1">
                {formatPrice(statsData.totalRevenue)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20 w-4 h-4" />
          <input
            type="text"
            placeholder="Search code, room, or guest name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 bg-[#0c0c0c] border border-white/5 rounded-2xl w-full text-white placeholder:text-white/20 focus:border-primary/50 transition-all outline-none"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-[#0c0c0c] border border-white/5 rounded-2xl text-white outline-none focus:border-primary/50 transition-all text-xs font-bold uppercase tracking-widest"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="CHECKED_OUT">Checked Out</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="px-4 py-3 bg-[#0c0c0c] border border-white/5 rounded-2xl text-white outline-none focus:border-primary/50 transition-all text-xs font-bold uppercase tracking-widest"
        >
          <option value="all">All Payment</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
        </select>

        <Button 
          variant="outline"
          className="px-6 py-3 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest rounded-2xl h-auto"
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.csv'
            input.onchange = async (e: any) => {
              const file = e.target.files[0]
              if (!file) return
              const groupId = prompt('Enter Group Block ID for this rooming list:')
              if (!groupId) return
              
              const formData = new FormData()
              formData.append('file', file)
              formData.append('groupBlockId', groupId)
              
              const toastId = toast.loading('Importing rooming list...')
              try {
                const res = await fetch('/api/bookings/group-rooming-list', {
                  method: 'POST',
                  headers: {
                    'x-property-id': activePropertyId || 'all'
                  },
                  body: formData
                })
                const data = await res.json()
                if (res.ok) {
                  toast.success(data.message, { id: toastId })
                  fetchBookings()
                } else {
                  toast.error(data.error || 'Import failed', { id: toastId })
                }
              } catch {
                toast.error('Network error during import', { id: toastId })
              }
            }
            input.click()
          }}
        >
          Import Rooming List (CSV)
        </Button>
      </div>

      {/* Bookings Table */}
      <Card className="bg-[#0c0c0c] border-white/5 rounded-3xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-4 text-left text-[10px] font-black text-white/20 uppercase tracking-widest">Booking</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-white/20 uppercase tracking-widest">Guest</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-white/20 uppercase tracking-widest">Room</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-white/20 uppercase tracking-widest">Dates</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-white/20 uppercase tracking-widest">Revenue</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-white/20 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-white/20 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                      {booking.confirmationCode || booking.id.slice(-8)}
                    </div>
                    <div className="text-[10px] text-white/20 font-black uppercase tracking-tighter">
                      {booking.guests} GUEST{booking.guests > 1 ? 'S' : ''}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-white">{booking.guest.name}</div>
                    <div className="text-[10px] text-white/40">{booking.guest.email}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-white">ROOM {booking.roomAssignments?.[0]?.room?.number || 'TBD'}</div>
                    <div className="text-[10px] text-white/40 uppercase font-black">{booking.roomAssignments?.[0]?.room?.type || 'TBD'}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs text-white">{formatDate(booking.checkIn)}</div>
                    <div className="text-[10px] text-white/20">TO {formatDate(booking.checkOut)}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-serif font-bold text-white">{formatPrice(booking.totalAmount)}</div>
                    <div className={cn("text-[10px] font-black uppercase", getPaymentStatusColor(booking.paymentStatus))}>
                      {booking.paymentStatus}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest", getStatusColor(booking.status))}>
                      {booking.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-2">
                      {booking.status === 'PENDING' && (
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest h-8 px-4" onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}>
                          Confirm
                        </Button>
                      )}
                      {booking.status === 'CONFIRMED' && (
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest h-8 px-4" onClick={() => handleStatusUpdate(booking.id, 'CHECKED_IN')}>
                          Check In
                        </Button>
                      )}
                      {booking.status === 'CHECKED_IN' && (
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-white rounded-xl text-[10px] font-black uppercase tracking-widest h-8 px-4" 
                          onClick={() => {
                            const isPaid = booking.paymentStatus?.toLowerCase() === 'completed' || booking.paymentStatus?.toLowerCase() === 'paid'
                            if (!isPaid) {
                              toast.error('Booking has an unpaid balance. Redirecting to POS to settle folio...')
                              router.push(`/admin/pos?bookingId=${booking.id}&mode=checkout`)
                            } else {
                              setCheckoutDialog({ isOpen: true, booking })
                            }
                          }}
                        >
                          Check Out
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="p-20 text-center">
            <Calendar className="w-16 h-16 mx-auto text-white/10 mb-6" />
            <h3 className="text-xl font-serif font-bold text-white mb-2">No reservations found</h3>
            <p className="text-white/40 text-sm max-w-xs mx-auto">
              We couldn't find any bookings matching your current filters. Try broadening your search criteria.
            </p>
          </div>
        )}
      </Card>

      {/* Checkout Confirmation Dialog */}
      <Dialog open={checkoutDialog.isOpen} onOpenChange={(o) => setCheckoutDialog(prev => ({...prev, isOpen: o}))}>
        <DialogContent className="bg-[#111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Checkout</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to checkout {checkoutDialog.booking?.guest?.name}? This will mark Room {checkoutDialog.booking?.roomAssignments?.[0]?.room?.number || 'TBD'} as needing cleaning.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-3 sm:justify-start">
            <Button variant="ghost" className="hover:bg-white/10" onClick={() => setCheckoutDialog({ isOpen: false, booking: null })}>Cancel</Button>
            <Button 
              className="bg-primary text-white" 
              onClick={() => {
                if (checkoutDialog.booking) {
                  handleStatusUpdate(checkoutDialog.booking.id, 'CHECKED_OUT')
                  setCheckoutDialog({ isOpen: false, booking: null })
                }
              }}
            >
              Confirm Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}





