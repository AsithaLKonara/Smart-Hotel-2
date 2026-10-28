"use client"

import React, { useState, useEffect } from 'react'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, Users, DollarSign, MapPin, Phone, Mail, 
  Sparkles, CheckCircle, Clock, AlertTriangle, Printer, 
  X, Bed, CreditCard, ShieldCheck, Tag, Loader2
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useLuxuryConfirm } from '@/components/ui/luxury-confirm-dialog'
import { cn } from '@/lib/utils'

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
        return <span className="font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/20 text-blue-400 bg-blue-500/10">CONFIRMED</span>
      case 'CHECKED_IN':
        return <span className="font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-emerald-400 bg-emerald-500/10">CHECKED IN</span>
      case 'CHECKED_OUT':
        return <span className="font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-zinc-500/20 text-zinc-400 bg-zinc-500/10">CHECKED OUT</span>
      case 'CANCELLED':
        return <span className="font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-rose-500/20 text-rose-400 bg-rose-500/10">CANCELLED</span>
      default:
        return <span className="font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-zinc-500/20 text-zinc-300 bg-zinc-500/10">{status}</span>
    }
  }

  return (
    <Dialog open={!!bookingId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="relative bg-[#121417] border border-[#2B3037] text-zinc-100 max-w-3xl p-6 rounded-2xl max-h-[92vh] overflow-y-auto print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#181A1D] border border-[#2B3037] text-zinc-400 hover:text-white transition-colors print:hidden"
        >
          <X className="w-4 h-4" />
        </button>
        {loading || !booking ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-7 h-7 text-zinc-400 animate-spin" />
            <p className="text-zinc-400 text-xs tracking-wider uppercase font-mono">Loading Reservation Dossier...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <DialogHeader className="border-b border-[#1E2227] pb-4 print:border-black/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-white font-mono print:text-black">
                      Reservation {booking.confirmationCode || booking.id.slice(0, 8)}
                    </span>
                    {getStatusBadge(booking.status)}
                  </div>
                  <p className="text-xs text-zinc-400 print:text-black/60 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    Booked {new Date(booking.createdAt).toLocaleDateString()} &bull; Source: {booking.source || 'Direct Console'}
                  </p>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-zinc-300 text-xs font-mono transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Print Folio</span>
                  </button>
                </div>
              </div>
            </DialogHeader>

            {/* Grid 1: Guest Profile & Suite Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Guest Profile Card */}
              <div className="bg-[#181A1D] border border-[#22262B] p-4 rounded-xl space-y-2.5 print:bg-transparent print:border-black/20">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-zinc-400 font-mono">
                  <Users className="w-3.5 h-3.5" />
                  <span>Guest Profile</span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-semibold text-white print:text-black">
                    {guest?.name || 'Valued Guest'}
                  </h4>

                  <div className="space-y-1 text-xs text-zinc-400 print:text-black/80 font-mono">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{guest?.email || 'No email registered'}</span>
                    </div>
                    {guest?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{guest.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-zinc-500 text-[11px] pt-1 border-t border-[#22262B]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Account ID: {guest?.id ? `${guest.id.slice(0, 10)}...` : 'Guest Checkout'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room & Stay Details Card */}
              <div className="bg-[#181A1D] border border-[#22262B] p-4 rounded-xl space-y-2.5 print:bg-transparent print:border-black/20">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-zinc-400 font-mono">
                  <Bed className="w-3.5 h-3.5" />
                  <span>Room & Allocation</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-white print:text-black font-mono">
                      {room ? `Room ${room.number}` : 'Unassigned Room'}
                    </h4>
                    {room?.type && (
                      <span className="text-[11px] font-mono text-zinc-300 bg-[#121417] border border-[#2B3037] px-2 py-0.5 rounded-md">
                        {room.type}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 print:text-black/80 font-mono">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">Check-In</span>
                      <span className="font-semibold text-zinc-200">
                        {checkInDate ? checkInDate.toLocaleDateString() : 'N/A'} (15:00)
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">Check-Out</span>
                      <span className="font-semibold text-zinc-200">
                        {checkOutDate ? checkOutDate.toLocaleDateString() : 'N/A'} (11:00)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 font-mono pt-1.5 border-t border-[#22262B]">
                    <span>Duration: <strong className="text-zinc-300">{nights} Nights</strong></span>
                    <span>Party: <strong className="text-zinc-300">{booking.guests || 2} Guests</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Financial Folio & Stay Extras Itemization */}
            <div className="bg-[#181A1D] border border-[#22262B] rounded-xl p-4 space-y-3 print:bg-transparent print:border-black/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-zinc-400 font-mono">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Financial Breakdown & Folio</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-mono uppercase">Payment:</span>
                  <span className={cn(
                    "text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase",
                    booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed'
                      ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10"
                      : "border-amber-500/20 text-amber-400 bg-amber-500/10"
                  )}>
                    {booking.paymentStatus || 'UNPAID'}
                  </span>
                  <span className="text-xs text-zinc-500 uppercase font-mono">({booking.paymentMethod || 'Card'})</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-[#22262B] rounded-lg overflow-hidden bg-[#121417]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#141619] border-b border-[#22262B] text-zinc-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2025] text-zinc-300">
                    <tr>
                      <td className="p-2.5 font-medium">
                        {room?.type || 'Standard Room'} ({nights} Nights @ {formatPrice(room?.price || 0)}/night)
                      </td>
                      <td className="p-2.5 text-zinc-500">ROOM</td>
                      <td className="p-2.5 text-right font-mono text-zinc-200">
                        {formatPrice((room?.price || 0) * nights)}
                      </td>
                    </tr>

                    {lineItems.length > 0 ? (
                      lineItems.map((item: any) => (
                        <tr key={item.id}>
                          <td className="p-2.5 font-medium flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-zinc-400 shrink-0" />
                            {item.description}
                          </td>
                          <td className="p-2.5 text-zinc-500">{item.category}</td>
                          <td className="p-2.5 text-right font-mono text-emerald-400">
                            {formatPrice(Number(item.amount))}
                          </td>
                        </tr>
                      ))
                    ) : null}

                    <tr className="bg-[#141619]/50">
                      <td colSpan={2} className="p-2.5 font-medium text-zinc-400">
                        Taxes & Service Levies (15%)
                      </td>
                      <td className="p-2.5 text-right font-mono text-zinc-400">
                        {formatPrice(Number(booking.totalAmount) - (Number(booking.totalAmount) / 1.15))}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t border-[#22262B] bg-[#141619] font-bold">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-white uppercase tracking-wider text-xs">
                        Total Reservation Folio Gross
                      </td>
                      <td className="p-2.5 text-right font-mono text-emerald-400 font-bold text-sm">
                        {formatPrice(Number(booking.totalAmount))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Special Requests / Notes */}
            {booking.specialRequests && (
              <div className="bg-[#181A1D] border border-[#22262B] p-3 rounded-xl space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-mono">Guest Special Requests</span>
                <p className="text-xs text-zinc-300 font-mono italic">
                  "{booking.specialRequests}"
                </p>
              </div>
            )}

            {/* Lifecycle Action Buttons */}
            <DialogFooter className="pt-3 border-t border-[#1E2227] flex flex-wrap items-center justify-between gap-2.5 print:hidden">
              <div className="flex items-center gap-2">
                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleUpdateStatus('CHECKED_IN')}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Check In Guest</span>
                  </button>
                )}

                {booking.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => handleUpdateStatus('CHECKED_OUT')}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Check Out Guest</span>
                  </button>
                )}

                {booking.status !== 'CANCELLED' && booking.status !== 'CHECKED_OUT' && (
                  <button
                    onClick={() => handleUpdateStatus('CANCELLED')}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl bg-transparent border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 font-mono text-xs transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-transparent border border-[#2B3037] text-zinc-400 hover:text-white text-xs font-mono transition-colors"
              >
                Close Dossier
              </button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
