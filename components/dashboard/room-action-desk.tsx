"use client"

import { useState, useEffect } from 'react'
import {
  X,
  User,
  Phone,
  Mail,
  BedDouble,
  CheckCircle,
  LogOut,
  Wrench,
  Sparkles,
  ClipboardList,
  CalendarDays,
  Clock,
  Star,
  Receipt,
  ShoppingCart,
  ChevronRight,
  Zap,
  AlertCircle,
  CheckCheck,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Room {
  id: string
  number: string
  status: string
  vip?: boolean
}

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  status: string
  user?: {
    name: string
    email: string
  }
}

interface RoomActionDeskProps {
  room: Room
  isVip: boolean
  onToggleVip: (val: boolean) => void
  notes: string
  onNotesChange: (val: string) => void
  onUpdateMetadata: () => void
  onStatusTransition: (roomNumber: string, status: string) => void
  onCheckIn: (roomNumber: string) => void
  onCheckOut: (roomNumber: string) => void
  onCreateBooking: (data: any) => Promise<void>
  roomBookings?: Booking[]
  onClose: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  AVAILABLE:          { label: 'Available',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  OCCUPIED:           { label: 'Occupied',    color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       dot: 'bg-rose-400' },
  CLEANING:           { label: 'Cleaning',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     dot: 'bg-amber-400' },
  MAINTENANCE:        { label: 'Maintenance', color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20',     dot: 'bg-slate-400' },
  DIRTY:              { label: 'Needs Clean', color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20',   dot: 'bg-orange-400' },
  INSPECTION_PENDING: { label: 'Inspection',  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       dot: 'bg-blue-400' },
  OUT_OF_ORDER:       { label: 'Out of Order',color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         dot: 'bg-red-400' },
}

type Tab = 'actions' | 'guest' | 'booking'

export function RoomActionDesk({
  room,
  isVip,
  onToggleVip,
  notes,
  onNotesChange,
  onUpdateMetadata,
  onStatusTransition,
  onCheckIn,
  onCheckOut,
  onCreateBooking,
  roomBookings = [],
  onClose
}: RoomActionDeskProps) {
  const [activeTab, setActiveTab] = useState<Tab>('actions')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [contact, setContact] = useState('')
  const [nights, setNights] = useState('1')
  const [isCreating, setIsCreating] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const currentStatus = STATUS_CONFIG[room.status] ?? STATUS_CONFIG['AVAILABLE']
  const currentBooking = roomBookings.find(b => b.status === 'CHECKED_IN')
  const upcomingBookings = roomBookings
    .filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING')
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleCheckIn = async () => {
    setIsCheckingIn(true)
    try { await onCheckIn(room.number) }
    finally { setIsCheckingIn(false) }
  }

  const handleCheckOut = async () => {
    setIsCheckingOut(true)
    try {
      if (currentBooking) {
        const res = await fetch(`/api/admin/bookings/${currentBooking.id}/checkout`, { method: 'POST' })
        if (!res.ok) {
          const err = await res.json()
          alert(`Checkout failed: ${err.error}`)
          return
        }
      }
      await onCheckOut(room.number)
    } finally { 
      setIsCheckingOut(false) 
    }
  }

  const handleQuickReserve = async () => {
    if (!guestName) return
    setIsCreating(true)
    try {
      await onCreateBooking({
        guestName,
        guestEmail: guestEmail || `${guestName.toLowerCase().replace(/\s+/g, '.')}.${Date.now().toString().slice(-4)}@walkin.smarthotel.com`,
        guestPhone: contact,
        nights: parseInt(nights),
        roomId: room.id,
        roomNumber: room.number
      })
      setGuestName(''); setGuestEmail(''); setContact('')
    } finally { setIsCreating(false) }
  }

  const ROOM_STATUS_BUTTONS = [
    {
      label: 'Mark Available',
      sublabel: 'Room is ready for guests',
      status: 'AVAILABLE',
      icon: CheckCircle,
      style: 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300',
      activeStyle: 'ring-2 ring-emerald-500/50 bg-emerald-500/20',
    },
    {
      label: 'Mark Occupied',
      sublabel: 'Guest is currently staying',
      status: 'OCCUPIED',
      icon: BedDouble,
      style: 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300',
      activeStyle: 'ring-2 ring-rose-500/50 bg-rose-500/20',
    },
    {
      label: 'Send for Cleaning',
      sublabel: 'Housekeeping team will be notified',
      status: 'CLEANING',
      icon: Sparkles,
      style: 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300',
      activeStyle: 'ring-2 ring-amber-500/50 bg-amber-500/20',
    },
    {
      label: 'Mark Maintenance',
      sublabel: 'Room needs a repair',
      status: 'MAINTENANCE',
      icon: Wrench,
      style: 'border-slate-400/30 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300',
      activeStyle: 'ring-2 ring-slate-400/50 bg-slate-500/20',
    },
  ]

  const TABS = [
    { id: 'actions' as Tab, label: 'Room Actions', icon: BedDouble },
    { id: 'guest'   as Tab, label: 'Guest Info',   icon: User },
    { id: 'booking' as Tab, label: 'Walk-in',      icon: Zap },
  ]

  return (
    // Full-screen overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[95vh] flex flex-col bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-[0_40px_140px_-20px_rgba(0,0,0,0.9)] overflow-hidden">

        {/* Gold top line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Status pill */}
            <div className={cn('flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-semibold', currentStatus.bg)}>
              <div className={cn('w-2 h-2 rounded-full animate-pulse', currentStatus.dot)} />
              <span className={currentStatus.color}>{currentStatus.label}</span>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Room</p>
              <h2 className="text-2xl font-bold text-white leading-tight">
                Suite <span className="text-primary">{room.number}</span>
              </h2>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── TABS ─── */}
        <div className="flex border-b border-white/5 flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all',
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-white/40 hover:text-white/60 border-b-2 border-transparent'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ─── CONTENT ─── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── TAB: ROOM ACTIONS ── */}
          {activeTab === 'actions' && (
            <div className="p-6 space-y-6">

              {/* Primary action banner */}
              {(room.status === 'AVAILABLE' || room.status === 'OCCUPIED' || room.status === 'CHECKOUT_PENDING') && (
                <div className={cn(
                  'rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  room.status === 'AVAILABLE'
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-primary/10 border-primary/20'
                )}>
                  <div>
                    <p className={cn('text-xs font-bold uppercase tracking-widest mb-0.5', room.status === 'AVAILABLE' ? 'text-emerald-400' : 'text-primary')}>
                      {room.status === 'AVAILABLE' ? '✅ Room is Ready' : '🔑 Guest is Staying'}
                    </p>
                    <p className="text-white font-semibold text-sm">
                      {room.status === 'AVAILABLE'
                        ? 'This room is clean and ready to accept a guest.'
                        : currentBooking?.user?.name
                          ? `${currentBooking.user.name} is currently checked in.`
                          : 'A guest is currently checked in to this room.'}
                    </p>
                  </div>
                  {room.status === 'AVAILABLE' ? (
                    <button
                      onClick={handleCheckIn}
                      disabled={isCheckingIn}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/30 whitespace-nowrap text-sm"
                    >
                      {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                      Check In Guest
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckOut}
                      disabled={isCheckingOut}
                      className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 whitespace-nowrap text-sm"
                    >
                      {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                      Check Out & Settle Bill
                    </button>
                  )}
                </div>
              )}

              {/* Status change section */}
              <div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" /> Change Room Status
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ROOM_STATUS_BUTTONS.map(btn => {
                    const isActive = room.status === btn.status
                    return (
                      <button
                        key={btn.status}
                        onClick={() => onStatusTransition(room.number, btn.status)}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-2xl border text-left transition-all',
                          btn.style,
                          isActive && btn.activeStyle
                        )}
                      >
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                          <btn.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm leading-tight">{btn.label}</p>
                          <p className="text-[11px] opacity-60 mt-0.5 truncate">{btn.sublabel}</p>
                        </div>
                        {isActive && <CheckCircle className="w-4 h-4 ml-auto flex-shrink-0 opacity-80" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick links & Payments */}
              <div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-3">Billing & Payments</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    onClick={async () => {
                      if (!currentBooking) return window.location.href = '/admin/accounting'
                      try {
                        const res = await fetch(`/api/bookings/${currentBooking.id}/folios`)
                        const folios = await res.json()
                        if (res.ok) alert(`Loaded ${folios.length} folios. Folio 1 ID: ${folios[0]?.id}`)
                      } catch {
                        alert('Failed to load folios.')
                      }
                    }}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] text-white/60 hover:text-white transition-all text-left"
                  >
                    <Receipt className="w-5 h-5" />
                    <div>
                      <p className="font-semibold text-sm">View Folios</p>
                      <p className="text-[11px] opacity-50">Guest bills & windows</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      const invoiceId = prompt('Enter Invoice ID to download PDF receipt:')
                      if (invoiceId) window.open(`/api/invoices/${invoiceId}/receipt`, '_blank')
                    }}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] text-white/60 hover:text-white transition-all text-left"
                  >
                    <Receipt className="w-5 h-5" />
                    <div>
                      <p className="font-semibold text-sm">Download Receipt</p>
                      <p className="text-[11px] opacity-50">Generate PDF invoice</p>
                    </div>
                  </button>
                </div>
                {currentBooking && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={async () => {
                        const res = await fetch('/api/payments/pre-auth', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ bookingId: currentBooking.id, paymentMethodId: 'pm_card_mock', amount: 100 })
                        })
                        if (res.ok) alert('Pre-Auth of $100 placed successfully.')
                      }}
                      className="flex items-center gap-2 p-3 rounded-xl border border-white/8 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all text-left justify-center"
                    >
                      <p className="font-semibold text-xs">Pre-Auth Card ($100)</p>
                    </button>
                    <button
                      onClick={async () => {
                        const res = await fetch('/api/payments/terminal', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ bookingId: currentBooking.id, amount: 50, currency: 'USD', readerId: 'tmr_mock' })
                        })
                        if (res.ok) alert('Sent $50 charge to physical terminal.')
                      }}
                      className="flex items-center gap-2 p-3 rounded-xl border border-white/8 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-all text-left justify-center"
                    >
                      <p className="font-semibold text-xs">Send to Terminal ($50)</p>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: GUEST INFO ── */}
          {activeTab === 'guest' && (
            <div className="p-6 space-y-5">

              {/* Current guest */}
              {currentBooking ? (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Current Guest</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                      <User className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{currentBooking.user?.name || 'Unknown Guest'}</p>
                      <p className="text-white/40 text-sm">{currentBooking.user?.email}</p>
                      <p className="text-emerald-400 text-xs mt-1 font-semibold">
                        Checked in · Leaves {format(new Date(currentBooking.checkOut), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-5 text-center">
                  <User className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm font-medium">No guest currently in this room</p>
                </div>
              )}

              {/* VIP toggle */}
              <button
                onClick={() => onToggleVip(!isVip)}
                className={cn(
                  'w-full flex items-center gap-4 p-5 rounded-2xl border transition-all text-left',
                  isVip
                    ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-950/20'
                    : 'bg-white/[0.03] border-white/8 hover:border-white/15'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0',
                  isVip ? 'bg-amber-500 text-black' : 'bg-white/8 text-white/30'
                )}>
                  <Star className={cn('w-6 h-6', isVip && 'fill-black')} />
                </div>
                <div className="flex-1">
                  <p className={cn('font-bold text-sm', isVip ? 'text-amber-400' : 'text-white/60')}>
                    VIP Treatment
                  </p>
                  <p className="text-[12px] text-white/30 mt-0.5">
                    {isVip ? '⭐ Active — extra care and perks enabled' : 'Tap to mark this guest as VIP'}
                  </p>
                </div>
                <div className={cn(
                  'w-12 h-6 rounded-full transition-all relative flex-shrink-0',
                  isVip ? 'bg-amber-500' : 'bg-white/10'
                )}>
                  <div className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow',
                    isVip ? 'right-1' : 'left-1'
                  )} />
                </div>
              </button>

              {/* Upcoming arrivals */}
              {upcomingBookings.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5" /> Upcoming Arrivals
                  </p>
                  <div className="space-y-2">
                    {upcomingBookings.slice(0, 3).map(booking => (
                      <div key={booking.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.05] transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-primary transition-colors">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{booking.user?.name || 'Guest'}</p>
                          <p className="text-xs text-white/40">
                            Arrives {format(new Date(booking.checkIn), 'MMM dd')} · Leaves {format(new Date(booking.checkOut), 'MMM dd')}
                          </p>
                        </div>
                        <button
                          onClick={() => onCheckIn(room.number)}
                          className="text-xs font-semibold text-primary hover:text-white flex items-center gap-1 transition-colors"
                        >
                          Check In <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs text-white/40 font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ml-1">
                  <ClipboardList className="w-3.5 h-3.5" /> Notes & Special Requests
                </label>
                <textarea
                  value={notes}
                  onChange={(e: any) => onNotesChange(e.target.value)}
                  onBlur={onUpdateMetadata}
                  placeholder="e.g. Guest is allergic to nuts, prefers extra pillows, celebrating anniversary..."
                  rows={4}
                  className="w-full bg-white/[0.03] border border-white/10 text-sm text-white p-4 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-2xl placeholder-white/20 resize-none transition-all leading-relaxed"
                />
                <p className="text-xs text-white/20 mt-1 ml-1">Saved automatically when you click away</p>
              </div>
            </div>
          )}

          {/* ── TAB: WALK-IN BOOKING ── */}
          {activeTab === 'booking' && (
            <div className="p-6 space-y-5">

              {room.status !== 'AVAILABLE' ? (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-400 font-bold text-sm">Room is Not Available</p>
                    <p className="text-white/50 text-xs mt-1">You can only add a walk-in booking when the room status is <strong>Available</strong>. Change the room status first in the <strong>Room Actions</strong> tab.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex gap-3">
                    <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/70">
                      Use this for <strong className="text-white">walk-in guests</strong> who arrive without a prior reservation. Fill in their details and confirm the booking in one step.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Guest Name */}
                    <div>
                      <label className="text-xs text-white/40 font-semibold uppercase tracking-wider ml-1 mb-1.5 block">Guest Name *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          type="text"
                          placeholder="Full name of the guest"
                          value={guestName}
                          onChange={(e: any) => setGuestName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 h-12 pl-11 pr-4 rounded-xl text-sm text-white placeholder-white/20 focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="text-xs text-white/40 font-semibold uppercase tracking-wider ml-1 mb-1.5 block">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          type="text"
                          placeholder="Phone or WhatsApp"
                          value={contact}
                          onChange={(e: any) => setContact(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 h-12 pl-11 pr-4 rounded-xl text-sm text-white placeholder-white/20 focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-xs text-white/40 font-semibold uppercase tracking-wider ml-1 mb-1.5 block">Email <span className="normal-case text-white/20">(optional)</span></label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          type="email"
                          placeholder="guest@email.com"
                          value={guestEmail}
                          onChange={(e: any) => setGuestEmail(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 h-12 pl-11 pr-4 rounded-xl text-sm text-white placeholder-white/20 focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Nights */}
                    <div>
                      <label className="text-xs text-white/40 font-semibold uppercase tracking-wider ml-1 mb-1.5 block">How Many Nights?</label>
                      <div className="relative">
                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <select
                          value={nights}
                          onChange={(e: any) => setNights(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 h-12 pl-11 pr-4 rounded-xl text-sm text-white focus:ring-2 focus:ring-primary/40 focus:outline-none appearance-none transition-all"
                        >
                          {[1, 2, 3, 4, 5, 7, 10, 14, 21, 28].map(n => (
                            <option key={n} value={n} className="bg-slate-900 text-white">
                              {n} {n === 1 ? 'Night' : 'Nights'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={!guestName || isCreating}
                    onClick={handleQuickReserve}
                    className="w-full h-14 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm"
                  >
                    {isCreating
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Booking...</>
                      : <><CheckCheck className="w-5 h-5" /> Confirm Walk-in Booking</>
                    }
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
