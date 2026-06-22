"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, DollarSign, CheckCircle, XCircle, Clock, Eye, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Navigation is handled by layout.tsx
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  status: string
  paymentStatus: string
  specialRequests?: string
  room?: {
    id: string
    number: string
    type: string
    price: number
  }
  roomAssignments?: Array<{
    roomId: string
    room: {
      number: string
      roomType: {
        name: string
      }
    }
  }>
  invoice?: {
    id: string
    total: number
    status: string
  }
}

import { GuestPageShell } from '@/components/dashboard/guest/guest-page-shell'

export default function MyBookingsPage() {
  const { data: session, status } = useSession() || { data: null, status: 'unauthenticated' }
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [cancellingBooking, setCancellingBooking] = useState<string | null>(null)
  const userId = session?.user?.id
    
  const fetchBookings = useCallback(async () => {
    if (!userId) {
      return
    }
    try {
      const response = await fetch('/api/bookings?userId=' + userId)
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      const data = await response.json()
      const bookingsArray = Array.isArray(data) ? data : (Array.isArray(data?.bookings) ? data.bookings : [])
      setBookings(bookingsArray)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin?callbackUrl=/my-bookings')
      return
    }

    fetchBookings()
  }, [session, status, router, fetchBookings])

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    setCancellingBooking(bookingId)
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel booking')
      }

      toast.success('Booking cancelled successfully')
      await fetchBookings() 
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Failed to cancel booking')
    } finally {
      setCancellingBooking(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'CHECKED_IN':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'CHECKED_OUT':
        return 'bg-white/5 text-white/40 border-white/10'
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      default:
        return 'bg-white/5 text-white/40 border-white/10'
    }
  }

  const canCancelBooking = (booking: Booking) => {
    return ['PENDING', 'CONFIRMED'].includes(booking.status) && 
           new Date(booking.checkIn) > new Date()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <GuestPageShell
      title="My Reservations"
      subtitle="Your journey history and upcoming sanctuary bookings. Manage your stay details and view stay archives."
      firstName={session.user.name?.split(' ')[0] || 'Guest'}
    >
      <div className="space-y-8">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven't made any bookings yet.
              </p>
              <Button onClick={() => router.push('/booking')}>
                Book a Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden border-white/5 bg-[#0c0c0c]">
                <CardHeader className="pb-4 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-serif">
                        {booking.roomAssignments && booking.roomAssignments.length > 0
                          ? `Room ${booking.roomAssignments[0].room.number} — ${booking.roomAssignments[0].room.roomType.name}`
                          : booking.room ? `Room ${booking.room.number} — ${booking.room.type}` : 'Room details pending'}
                      </CardTitle>
                      <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mt-1">
                        ID: {booking.id}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                        {booking.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-white/20">Dates</p>
                        <p className="text-sm font-medium">{formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-white/20">Occupancy</p>
                        <p className="text-sm font-medium">{booking.guests} Guests</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-white/20">Total</p>
                        <p className="text-sm font-medium">{formatPrice(booking.totalAmount)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 pt-6 border-t border-white/5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest px-6"
                      onClick={() => {
                        setSelectedBooking(booking)
                        setShowDetailsModal(true)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" /> View Details
                    </Button>
                    
                    {canCancelBooking(booking) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-rose-500/20 text-rose-500 hover:bg-rose-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest px-6"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingBooking === booking.id}
                      >
                        {cancellingBooking === booking.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showDetailsModal && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <Card className="w-full max-w-lg bg-[#0c0c0c] border-white/10 rounded-[40px] overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-2xl font-serif">Reservation Details</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] uppercase font-black text-white/20 mb-1">Room</p>
                      <p className="text-lg font-medium">
                        {selectedBooking.roomAssignments && selectedBooking.roomAssignments.length > 0
                          ? `${selectedBooking.roomAssignments[0].room.number} — ${selectedBooking.roomAssignments[0].room.roomType.name}`
                          : selectedBooking.room ? `${selectedBooking.room.number} — ${selectedBooking.room.type}` : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-white/20 mb-1">Booking ID</p>
                      <p className="text-sm font-mono text-white/40">{selectedBooking.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-white/20 mb-1">Check-in</p>
                      <p className="text-sm font-medium">{formatDate(selectedBooking.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-white/20 mb-1">Check-out</p>
                      <p className="text-sm font-medium">{formatDate(selectedBooking.checkOut)}</p>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-[10px] uppercase font-black text-white/20 mb-2">Status Overview</p>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(selectedBooking.status)}>
                        {selectedBooking.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPaymentStatusColor(selectedBooking.paymentStatus)}>
                        {selectedBooking.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  {selectedBooking.specialRequests && (
                    <div className="pt-6 border-t border-white/5">
                      <p className="text-[10px] uppercase font-black text-white/20 mb-1">Special Requests</p>
                      <p className="text-sm text-white/60 leading-relaxed">{selectedBooking.specialRequests}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-10 pt-6 border-t border-white/5 flex justify-end">
                  <Button
                    variant="outline"
                    className="bg-white/5 border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest px-8"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </GuestPageShell>
  )
}