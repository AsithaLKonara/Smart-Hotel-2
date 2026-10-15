"use client"

import React, { useState, useEffect } from 'react'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, Users, DollarSign, MapPin, Phone, Mail, 
  Sparkles, CheckCircle, Clock, AlertTriangle, Printer, 
  X, Bed, CreditCard, ShieldCheck, Tag, Loader2
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useLuxuryConfirm } from '@/components/ui/luxury-confirm-dialog'

interface BookingDetailsModalProps {
  bookingId: string | null
  onClose: () => void
  onStatusUpdated?: () => void
}

export function BookingDetailsModal({
  bookingId,
  onClose,
  onStatusUpdated
}: BookingDetailsModalProps) {
  const { confirm } = useLuxuryConfirm()
  const [booking, setBooking] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails(bookingId)
    } else {
      setBooking(null)
    }
  }, [bookingId])

  const fetchBookingDetails = async (id: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/bookings/${id}`)
      if (!res.ok) throw new Error('Failed to load reservation details')
      const data = await res.json()
      setBooking(data)
    } catch (err: any) {
      toast.error(err.message || 'Error loading booking')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!booking) return

    let confirmMsg = `Update reservation to ${newStatus}?`
    if (newStatus === 'CHECKED_IN') confirmMsg = `Check in ${booking.guest?.name || booking.user?.name || 'guest'} and assign keys?`
    if (newStatus === 'CHECKED_OUT') confirmMsg = `Check out guest and mark room for housekeeping inspection?`
    if (newStatus === 'CANCELLED') confirmMsg = `Cancel reservation ${booking.confirmationCode}? This cannot be undone.`

    const approved = await confirm({
      title: 'Confirm Status Change',
      description: confirmMsg,
      confirmText: `Confirm ${newStatus.replace('_', ' ')}`,
      variant: newStatus === 'CANCELLED' ? 'danger' : 'primary'
    })

    if (!approved) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update reservation')
      }

      toast.success(`Reservation updated to ${newStatus.replace('_', ' ')}`)
      fetchBookingDetails(booking.id)
      if (onStatusUpdated) onStatusUpdated()
    } catch (err: any) {
      toast.error(err.message || 'Status update failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!bookingId) return null

  const guest = booking?.guest || booking?.user
  const roomAssignment = booking?.roomAssignments?.[0]
  const room = roomAssignment?.room || booking?.room
  const folio = booking?.folios?.[0]
  const lineItems = folio?.lineItems || []
  
  const checkInDate = booking?.checkIn ? new Date(booking.checkIn) : null
  const checkOutDate = booking?.checkOut ? new Date(booking.checkOut) : null
  const nights = checkInDate && checkOutDate 
    ? Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 1

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/30">CONFIRMED</Badge>
      case 'CHECKED_IN':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">CHECKED IN</Badge>
      case 'CHECKED_OUT':
        return <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/30">CHECKED OUT</Badge>
      case 'CANCELLED':
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30">CANCELLED</Badge>
      default:
        return <Badge className="bg-white/10 text-white/70">{status}</Badge>
    }
  }

  return (
    <Dialog open={!!bookingId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#111116] border-white/10 text-white max-w-4xl p-6 rounded-2xl max-h-[92vh] overflow-y-auto print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        {loading || !booking ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-white/60 text-xs tracking-wider uppercase font-bold">Loading Reservation Dossier...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <DialogHeader className="border-b border-white/10 pb-4 print:border-black/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-serif font-bold text-white print:text-black">
                      Reservation {booking.confirmationCode || booking.id.slice(0, 8)}
                    </span>
                    {getStatusBadge(booking.status)}
                  </div>
                  <p className="text-xs text-white/50 print:text-black/60 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Booked on {new Date(booking.createdAt).toLocaleDateString()} via {booking.source || 'Direct Website'}
                  </p>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="border-white/10 text-white hover:bg-white/5 rounded-xl text-xs h-9"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5 text-primary" />
                    Print Folio
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Grid 1: Guest Profile & Suite Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guest Profile Card */}
              <div className="bg-[#0f0f13] border border-white/10 p-5 rounded-2xl space-y-3 print:bg-transparent print:border-black/20">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-primary">
                  <Users className="w-4 h-4" />
                  <span>Guest Profile</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-serif font-bold text-white print:text-black">
                    {guest?.name || 'Valued Guest'}
                  </h4>

                  <div className="space-y-1.5 text-xs text-white/70 print:text-black/80 font-light">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>{guest?.email || 'No email registered'}</span>
                    </div>
                    {guest?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        <span>{guest.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/40 print:text-black/50 text-[11px] pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Guest Account ID: {guest?.id ? `${guest.id.slice(0, 12)}...` : 'Guest Checkout'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room & Stay Details Card */}
              <div className="bg-[#0f0f13] border border-white/10 p-5 rounded-2xl space-y-3 print:bg-transparent print:border-black/20">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-primary">
                  <Bed className="w-4 h-4" />
                  <span>Suite & Allocation</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-serif font-bold text-white print:text-black">
                      {room ? `Room #${room.number}` : 'Room Unassigned'}
                    </h4>
                    {room?.type && (
                      <Badge variant="outline" className="border-white/20 text-white font-mono text-xs">
                        {room.type}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-white/70 print:text-black/80 pt-1">
                    <div>
                      <span className="text-white/40 print:text-black/50 block text-[10px] uppercase">Check-In</span>
                      <span className="font-bold text-white print:text-black">
                        {checkInDate ? checkInDate.toLocaleDateString() : 'N/A'} (15:00)
                      </span>
                    </div>

                    <div>
                      <span className="text-white/40 print:text-black/50 block text-[10px] uppercase">Check-Out</span>
                      <span className="font-bold text-white print:text-black">
                        {checkOutDate ? checkOutDate.toLocaleDateString() : 'N/A'} (11:00)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/50 print:text-black/60 pt-2 border-t border-white/5">
                    <span>Duration: <strong className="text-white print:text-black">{nights} Nights</strong></span>
                    <span>Party: <strong className="text-white print:text-black">{booking.guests || 2} Guests</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Financial Folio & Stay Extras Itemization */}
            <div className="bg-[#0f0f13] border border-white/10 rounded-2xl p-5 space-y-4 print:bg-transparent print:border-black/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-primary">
                  <DollarSign className="w-4 h-4" />
                  <span>Financial Breakdown & Extras Folio</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50 print:text-black/60 uppercase">Payment:</span>
                  <Badge variant="outline" className={`text-[10px] font-bold uppercase ${
                    booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed'
                      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                      : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                  }`}>
                    {booking.paymentStatus || 'UNPAID'}
                  </Badge>
                  <span className="text-xs text-white/40 uppercase font-mono">({booking.paymentMethod || 'Card'})</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-white/40 uppercase text-[10px] border-b border-white/5">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80 print:text-black">
                    <tr>
                      <td className="p-3 font-medium">
                        {room?.type || 'Luxury Suite'} ({nights} Nights @ {formatPrice(room?.price || 0)}/night)
                      </td>
                      <td className="p-3 text-white/50">ROOM</td>
                      <td className="p-3 text-right font-mono text-white">
                        {formatPrice((room?.price || 0) * nights)}
                      </td>
                    </tr>

                    {lineItems.length > 0 ? (
                      lineItems.map((item: any) => (
                        <tr key={item.id}>
                          <td className="p-3 font-medium flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                            {item.description}
                          </td>
                          <td className="p-3 text-white/50">{item.category}</td>
                          <td className="p-3 text-right font-mono text-emerald-400">
                            {formatPrice(Number(item.amount))}
                          </td>
                        </tr>
                      ))
                    ) : null}

                    <tr className="bg-white/[0.02]">
                      <td colSpan={2} className="p-3 font-medium text-white/60">
                        Taxes & Luxury Resort Levies (15%)
                      </td>
                      <td className="p-3 text-right font-mono text-white/70">
                        {formatPrice(Number(booking.totalAmount) - (Number(booking.totalAmount) / 1.15))}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t border-white/10 bg-white/5 font-bold">
                    <tr>
                      <td colSpan={2} className="p-3 text-white uppercase tracking-wider text-xs">
                        Total Reservation Folio Gross
                      </td>
                      <td className="p-3 text-right font-mono text-primary font-bold text-base">
                        {formatPrice(Number(booking.totalAmount))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Special Requests / Notes */}
            {booking.specialRequests && (
              <div className="bg-[#0f0f13] border border-white/10 p-4 rounded-2xl space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Guest Special Requests</span>
                <p className="text-xs text-white/80 font-light italic">
                  "{booking.specialRequests}"
                </p>
              </div>
            )}

            {/* Lifecycle Action Buttons */}
            <DialogFooter className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                {booking.status === 'CONFIRMED' && (
                  <Button
                    onClick={() => handleUpdateStatus('CHECKED_IN')}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase px-5 rounded-xl h-10 shadow-lg shadow-emerald-900/30"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Check In Guest
                  </Button>
                )}

                {booking.status === 'CHECKED_IN' && (
                  <Button
                    onClick={() => handleUpdateStatus('CHECKED_OUT')}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase px-5 rounded-xl h-10 shadow-lg shadow-blue-900/30"
                  >
                    <Clock className="w-4 h-4 mr-1.5" />
                    Check Out Guest
                  </Button>
                )}

                {booking.status !== 'CANCELLED' && booking.status !== 'CHECKED_OUT' && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('CANCELLED')}
                    disabled={actionLoading}
                    className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs h-10"
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                onClick={onClose}
                className="border-white/10 text-white/70 hover:text-white rounded-xl text-xs h-10 px-6"
              >
                Close Dossier
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
