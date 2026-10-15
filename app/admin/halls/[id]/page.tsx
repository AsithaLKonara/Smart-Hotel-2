'use client'

import { useState, useEffect, useCallback } from 'react'
import { use } from 'react'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Building2, Users, DollarSign, Calendar, Clock, Phone, Mail,
  CheckCircle, XCircle, AlertCircle, Plus, Edit, Trash2, X,
  ChevronLeft, ChevronRight, MapPin, Tag, CalendarDays, Receipt
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useProperty } from '@/contexts/property-context'
import { useRouter } from 'next/navigation'
import { useLuxuryConfirm } from '@/components/ui/luxury-confirm-dialog'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  CONFIRMED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
  COMPLETED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const PAYMENT_COLORS: Record<string, string> = {
  UNPAID: 'text-red-400',
  PARTIAL: 'text-amber-400',
  PAID: 'text-emerald-400',
}

const HALL_TYPE_LABELS: Record<string, string> = {
  HALL: 'Hall', CONFERENCE_ROOM: 'Conference Room',
  BALLROOM: 'Ballroom', BOARDROOM: 'Boardroom', OUTDOOR: 'Outdoor Venue'
}

function ModalShell({ open, onClose, title, children }: {
  open: boolean, onClose: () => void, title: string, children: React.ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function FormField({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

const emptyBookingForm = {
  contactName: '', contactEmail: '', contactPhone: '',
  purpose: '', guestCount: '', totalAmount: '',
  paymentStatus: 'UNPAID' as 'UNPAID' | 'PARTIAL' | 'PAID',
  notes: '', startTime: '', endTime: '', status: 'CONFIRMED' as const
}

interface Booking {
  id: string
  confirmationCode: string
  startTime: string
  endTime: string
  status: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  purpose?: string
  guestCount: number
  totalAmount: number
  paymentStatus: string
  notes?: string
  event?: { id: string, name: string }
}

interface Hall {
  id: string
  name: string
  description?: string
  type: string
  capacity: number
  floorNumber?: number
  hourlyRate: number
  dailyRate: number
  amenities: string[]
  images: string[]
  isActive: boolean
  bookings: Booking[]
  _count: { bookings: number }
}

// ---- Mini Calendar for availability ----
function AvailabilityCalendar({ hallId, activePropertyId }: { hallId: string, activePropertyId: string }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookedSlots, setBookedSlots] = useState<{ startTime: string, endTime: string, status: string, confirmationCode: string, contactName?: string, purpose?: string }[]>([])
  const [calLoading, setCalLoading] = useState(false)

  const fetchAvailability = useCallback(async () => {
    setCalLoading(true)
    const from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)
    try {
      const res = await fetch(
        `/api/admin/halls/${hallId}/availability?from=${from.toISOString()}&to=${to.toISOString()}`,
        { headers: { 'x-property-id': activePropertyId } }
      )
      const data = await res.json()
      setBookedSlots(data.data || [])
    } catch { toast.error('Failed to fetch availability') }
    finally { setCalLoading(false) }
  }, [hallId, currentDate, activePropertyId])

  useEffect(() => { fetchAvailability() }, [fetchAvailability])

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const isDayBooked = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return bookedSlots.some(slot => {
      const start = new Date(slot.startTime)
      const end = new Date(slot.endTime)
      return date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
        date <= new Date(end.getFullYear(), end.getMonth(), end.getDate())
    })
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="font-bold text-white">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </p>
        <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {calLoading ? (
        <div className="py-8 flex justify-center"><PremiumSpinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-xs text-white/30 font-bold py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const booked = isDayBooked(day)
              const today = new Date()
              const isToday = day === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear()
              return (
                <div
                  key={day}
                  className={`text-center text-xs py-2 rounded-lg font-medium ${
                    booked
                      ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  } ${isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-transparent' : ''}`}
                  title={booked ? 'Booked' : 'Available'}
                >
                  {day}
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-white/50">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/40" />
              Available
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/40" />
              Booked
            </div>
          </div>
        </>
      )}

      {bookedSlots.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Upcoming Bookings This Month</p>
          <div className="space-y-2">
            {bookedSlots.map(slot => (
              <div key={slot.confirmationCode} className="flex justify-between items-center text-xs bg-[#1a1a24] p-2.5 rounded-lg border border-white/5">
                <div>
                  <p className="text-white font-medium">{slot.contactName || slot.purpose || 'Booking'}</p>
                  <p className="text-white/40 mt-0.5">
                    {new Date(slot.startTime).toLocaleDateString()} – {new Date(slot.endTime).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={`text-xs border ${STATUS_COLORS[slot.status] || STATUS_COLORS.CONFIRMED}`}>
                  {slot.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function HallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { activePropertyId } = useProperty()
  const router = useRouter()
  const confirm = useLuxuryConfirm()
  const [hall, setHall] = useState<Hall | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [inHouseBookings, setInHouseBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'availability'>('overview')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [bookingForm, setBookingForm] = useState({ ...emptyBookingForm, linkedBookingId: '' })
  const [saving, setSaving] = useState(false)

  const fetchHall = useCallback(async () => {
    setLoading(true)
    try {
      const [hallRes, bookingsRes, inHouseRes] = await Promise.all([
        fetch(`/api/admin/halls/${id}`, { headers: { 'x-property-id': activePropertyId || '' } }),
        fetch(`/api/admin/halls/bookings?spaceId=${id}`, { headers: { 'x-property-id': activePropertyId || '' } }),
        fetch('/api/bookings?status=CHECKED_IN', { headers: { 'x-property-id': activePropertyId || '' } })
      ])
      const hallData = await hallRes.json()
      const bookingsData = await bookingsRes.json()
      const inHouseData = await inHouseRes.json()
      setHall(hallData.data)
      setBookings(bookingsData.data || [])
      setInHouseBookings(Array.isArray(inHouseData.bookings) ? inHouseData.bookings : [])
    } catch { toast.error('Failed to load hall') }
    finally { setLoading(false) }
  }, [id, activePropertyId])

  useEffect(() => { if (activePropertyId) fetchHall() }, [activePropertyId, fetchHall])

  const openCreateBooking = () => {
    setEditingBooking(null)
    setBookingForm({ ...emptyBookingForm, linkedBookingId: '' })
    setShowBookingModal(true)
  }

  const openEditBooking = (booking: Booking) => {
    setEditingBooking(booking)
    setBookingForm({
      contactName: booking.contactName || '',
      contactEmail: booking.contactEmail || '',
      contactPhone: booking.contactPhone || '',
      purpose: booking.purpose || '',
      guestCount: booking.guestCount.toString(),
      totalAmount: booking.totalAmount.toString(),
      paymentStatus: booking.paymentStatus as any,
      notes: booking.notes || '',
      startTime: new Date(booking.startTime).toISOString().slice(0, 16),
      endTime: new Date(booking.endTime).toISOString().slice(0, 16),
      status: booking.status as any,
      linkedBookingId: '',
    })
    setShowBookingModal(true)
  }

  const handleSaveBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...bookingForm,
        spaceId: id,
        guestCount: parseInt(bookingForm.guestCount || '1'),
        totalAmount: parseFloat(bookingForm.totalAmount || '0'),
        startTime: new Date(bookingForm.startTime).toISOString(),
        endTime: new Date(bookingForm.endTime).toISOString(),
        bookingId: bookingForm.linkedBookingId || undefined,
      }

      const url = editingBooking
        ? `/api/admin/halls/bookings/${editingBooking.id}`
        : '/api/admin/halls/bookings'
      const method = editingBooking ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-property-id': activePropertyId || '' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(editingBooking ? 'Booking updated!' : `Booking confirmed! Code: ${data.data?.confirmationCode}`)
        setShowBookingModal(false)
        fetchHall()
      } else {
        toast.error(data.error || 'Failed to save booking')
      }
    } catch { toast.error('Error saving booking') }
    finally { setSaving(false) }
  }

  const handleCancelBooking = async (bookingId: string) => {
    const approved = await confirm({
      title: 'Cancel Hall Booking',
      message: 'Are you sure you want to cancel this event hall reservation?',
      confirmText: 'Cancel Booking',
      isDestructive: true
    })
    if (!approved) return
    try {
      const res = await fetch(`/api/admin/halls/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      })
      if (res.ok) { toast.success('Booking cancelled'); fetchHall() }
      else toast.error('Failed to cancel booking')
    } catch { toast.error('Error cancelling booking') }
  }

  const handleMarkPaid = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/admin/halls/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'PAID' })
      })
      if (res.ok) { toast.success('Marked as paid'); fetchHall() }
      else toast.error('Failed to update payment')
    } catch { toast.error('Error updating payment') }
  }

  const [folioModalBooking, setFolioModalBooking] = useState<Booking | null>(null)
  const [selectedFolioBookingId, setSelectedFolioBookingId] = useState<string>('')
  const [postingFolio, setPostingFolio] = useState(false)

  const handleChargeToFolio = async () => {
    if (!folioModalBooking || !selectedFolioBookingId) return toast.error('Please select an in-house room booking')
    setPostingFolio(true)
    try {
      const res = await fetch(`/api/admin/halls/bookings/${folioModalBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: selectedFolioBookingId })
      })
      if (res.ok) {
        toast.success(`Charged $${Number(folioModalBooking.totalAmount).toFixed(2)} to guest folio!`)
        setFolioModalBooking(null)
        fetchHall()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to post charge to folio')
      }
    } catch {
      toast.error('Network error posting charge to folio')
    } finally {
      setPostingFolio(false)
    }
  }

  if (loading) {
    return (
      <AdminPageShell title="Loading..." subtitle="">
        <div className="py-20 flex justify-center"><PremiumSpinner /></div>
      </AdminPageShell>
    )
  }

  if (!hall) {
    return (
      <AdminPageShell title="Not Found" subtitle="">
        <div className="py-20 text-center text-white/40">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Hall not found.</p>
        </div>
      </AdminPageShell>
    )
  }

  const activeBookings = bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status))
  const revenue = bookings.filter(b => b.status !== 'CANCELLED').reduce((s, b) => s + Number(b.totalAmount), 0)

  return (
    <AdminPageShell
      title={hall.name}
      subtitle={`${HALL_TYPE_LABELS[hall.type]} · Capacity ${hall.capacity}`}
      onRefresh={fetchHall}
    >
      {/* Breadcrumb Back */}
      <button
        onClick={() => router.push('/admin/halls')}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Halls
      </button>

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-56 bg-gradient-to-br from-primary/20 via-violet-900/30 to-slate-900">
        {hall.images?.[0] && (
          <img src={hall.images[0]} alt={hall.name} className="w-full h-full object-cover absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-3 mb-2">
            <Badge className="text-xs border bg-primary/20 text-primary border-primary/30">
              {HALL_TYPE_LABELS[hall.type]}
            </Badge>
            <Badge className={`text-xs border ${hall.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
              {hall.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-white">{hall.name}</h1>
          {hall.description && <p className="text-white/60 text-sm mt-1">{hall.description}</p>}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Capacity', value: hall.capacity, icon: Users, color: 'text-violet-400' },
          { label: 'Active Bookings', value: activeBookings.length, icon: CalendarDays, color: 'text-blue-400' },
          { label: 'Total Revenue', value: `$${revenue.toFixed(0)}`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Total Bookings', value: hall._count.bookings, icon: CheckCircle, color: 'text-amber-400' },
        ].map(s => (
          <Card key={s.label} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/5 p-1 rounded-xl mb-6 w-fit">
        {(['overview', 'bookings', 'availability'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Hall Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-white/50">Type</span><span className="text-white font-medium">{HALL_TYPE_LABELS[hall.type]}</span></div>
                {hall.floorNumber != null && (
                  <div className="flex justify-between"><span className="text-white/50">Floor</span><span className="text-white font-medium">{hall.floorNumber}</span></div>
                )}
                <div className="flex justify-between"><span className="text-white/50">Capacity</span><span className="text-white font-medium">{hall.capacity} persons</span></div>
                <div className="flex justify-between"><span className="text-white/50">Hourly Rate</span><span className="text-emerald-400 font-bold">${Number(hall.hourlyRate).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-white/50">Daily Rate</span><span className="text-emerald-400 font-bold">${Number(hall.dailyRate).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-white/50">Status</span>
                  <span className={hall.isActive ? 'text-emerald-400' : 'text-red-400'}>
                    {hall.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Amenities</h3>
              {hall.amenities?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {hall.amenities.map(a => (
                    <span key={a} className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20 font-medium">
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-white/30 text-sm">No amenities listed.</p>
              )}
            </CardContent>
          </Card>

          {hall.images?.length > 0 && (
            <div className="md:col-span-2">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-5">
                  <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Photos</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {hall.images.map((img, idx) => (
                      <img key={idx} src={img} alt={`${hall.name} ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-white/10" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={openCreateBooking} className="bg-primary text-white">
              <Plus className="w-4 h-4 mr-2" /> New Booking
            </Button>
          </div>

          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-xl text-white/40">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No bookings yet. Create the first one!</p>
              </div>
            ) : bookings.map(booking => (
              <Card key={booking.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`text-xs border ${STATUS_COLORS[booking.status]}`}>
                          {booking.status}
                        </Badge>
                        <span className="text-xs text-white/30 font-mono">{booking.confirmationCode}</span>
                        {booking.event && (
                          <span className="text-xs text-primary/70">Event: {booking.event.name}</span>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        {booking.contactName && (
                          <div className="flex items-center gap-2 text-white">
                            <Users className="w-3.5 h-3.5 text-white/40" />
                            {booking.contactName}
                          </div>
                        )}
                        {booking.purpose && (
                          <div className="flex items-center gap-2 text-white/60">
                            <Tag className="w-3.5 h-3.5 text-white/40" />
                            {booking.purpose}
                          </div>
                        )}
                        {booking.contactEmail && (
                          <div className="flex items-center gap-2 text-white/60">
                            <Mail className="w-3.5 h-3.5 text-white/40" />
                            {booking.contactEmail}
                          </div>
                        )}
                        {booking.contactPhone && (
                          <div className="flex items-center gap-2 text-white/60">
                            <Phone className="w-3.5 h-3.5 text-white/40" />
                            {booking.contactPhone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-white/60">
                          <Calendar className="w-3.5 h-3.5 text-white/40" />
                          {new Date(booking.startTime).toLocaleString()} → {new Date(booking.endTime).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                          <Users className="w-3.5 h-3.5 text-white/40" />
                          {booking.guestCount} guests
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xl font-bold text-white">${Number(booking.totalAmount).toFixed(2)}</p>
                      <p className={`text-xs font-bold ${PAYMENT_COLORS[booking.paymentStatus]}`}>
                        {booking.paymentStatus}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 justify-end">
                        {booking.status !== 'CANCELLED' && booking.paymentStatus !== 'PAID' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs"
                              onClick={() => {
                                setFolioModalBooking(booking)
                                setSelectedFolioBookingId(inHouseBookings[0]?.id || '')
                              }}
                            >
                              <Receipt className="w-3 h-3 mr-1" /> Charge to Folio
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs"
                              onClick={() => handleMarkPaid(booking.id)}
                            >
                              Mark Paid
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-white/60 border-white/10 hover:bg-white/5 text-xs"
                          onClick={() => openEditBooking(booking)}
                        >
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {booking.notes && (
                    <p className="mt-3 text-xs text-white/40 border-t border-white/10 pt-3 italic">
                      Note: {booking.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Availability Tab */}
      {activeTab === 'availability' && (
        <div className="max-w-md">
          <AvailabilityCalendar hallId={id} activePropertyId={activePropertyId || ''} />
        </div>
      )}

      {/* Booking Modal */}
      <ModalShell
        open={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title={editingBooking ? 'Edit Booking' : `Book: ${hall.name}`}
      >
        <form onSubmit={handleSaveBooking} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date & Time">
              <Input
                type="datetime-local"
                required
                value={bookingForm.startTime}
                onChange={e => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                className="bg-[#1a1a24] border-white/10 text-white"
              />
            </FormField>
            <FormField label="End Date & Time">
              <Input
                type="datetime-local"
                required
                value={bookingForm.endTime}
                onChange={e => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                className="bg-[#1a1a24] border-white/10 text-white"
              />
            </FormField>
          </div>

          <FormField label="Contact Name">
            <Input
              required
              value={bookingForm.contactName}
              onChange={e => setBookingForm({ ...bookingForm, contactName: e.target.value })}
              className="bg-[#1a1a24] border-white/10 text-white"
              placeholder="e.g. John Silva"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email">
              <Input
                type="email"
                value={bookingForm.contactEmail}
                onChange={e => setBookingForm({ ...bookingForm, contactEmail: e.target.value })}
                className="bg-[#1a1a24] border-white/10 text-white"
              />
            </FormField>
            <FormField label="Phone">
              <Input
                value={bookingForm.contactPhone}
                onChange={e => setBookingForm({ ...bookingForm, contactPhone: e.target.value })}
                className="bg-[#1a1a24] border-white/10 text-white"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Purpose / Event Type">
              <Input
                value={bookingForm.purpose}
                onChange={e => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                className="bg-[#1a1a24] border-white/10 text-white"
                placeholder="e.g. Wedding"
              />
            </FormField>
            <FormField label="Guest Count">
              <Input
                type="number"
                min="1"
                max={hall.capacity}
                required
                value={bookingForm.guestCount}
                onChange={e => setBookingForm({ ...bookingForm, guestCount: e.target.value })}
                className="bg-[#1a1a24] border-white/10 text-white"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Total Amount ($)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={bookingForm.totalAmount}
                onChange={e => setBookingForm({ ...bookingForm, totalAmount: e.target.value })}
                className="bg-[#1a1a24] border-white/10 text-white"
              />
            </FormField>
            <FormField label="Payment Status">
              <select
                value={bookingForm.paymentStatus}
                onChange={e => setBookingForm({ ...bookingForm, paymentStatus: e.target.value as any })}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white"
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </FormField>
          </div>

          <FormField label="Charge to Guest Room Folio (Optional)">
            <select
              value={bookingForm.linkedBookingId}
              onChange={e => {
                const bId = e.target.value
                const selected = inHouseBookings.find(b => b.id === bId)
                setBookingForm({
                  ...bookingForm,
                  linkedBookingId: bId,
                  contactName: selected ? (selected.guest?.name || bookingForm.contactName) : bookingForm.contactName,
                  contactEmail: selected ? (selected.guest?.email || bookingForm.contactEmail) : bookingForm.contactEmail,
                  paymentStatus: bId ? 'PAID' : bookingForm.paymentStatus
                })
              }}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white"
            >
              <option value="">None (Standalone / Pay at Counter)</option>
              {inHouseBookings.map((b: any) => {
                const roomNum = b.roomAssignments?.[0]?.room?.number || 'TBD'
                return (
                  <option key={b.id} value={b.id}>
                    Room #{roomNum} — {b.guest?.name || 'Guest'} (Code: {b.confirmationCode})
                  </option>
                )
              })}
            </select>
            {bookingForm.linkedBookingId && (
              <p className="text-[11px] text-emerald-400 mt-1">
                ✓ Total amount will post directly as an &quot;EVENTS&quot; charge to the guest&apos;s open room folio.
              </p>
            )}
          </FormField>

          {editingBooking && (
            <FormField label="Booking Status">
              <select
                value={bookingForm.status}
                onChange={e => setBookingForm({ ...bookingForm, status: e.target.value as any })}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </FormField>
          )}

          <FormField label="Notes (Optional)">
            <textarea
              value={bookingForm.notes}
              onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white resize-none"
              rows={2}
              placeholder="Special requirements, setup notes..."
            />
          </FormField>

          {/* Rate Calculator */}
          {bookingForm.startTime && bookingForm.endTime && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Rate Calculator</p>
              {(() => {
                const hrs = (new Date(bookingForm.endTime).getTime() - new Date(bookingForm.startTime).getTime()) / 3600000
                if (isNaN(hrs) || hrs <= 0) return null
                const byHour = hrs * Number(hall.hourlyRate)
                const byDay = (hrs / 24) * Number(hall.dailyRate)
                return (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-white/50">{hrs.toFixed(1)}h × ${Number(hall.hourlyRate).toFixed(0)}/hr</p>
                      <p className="text-white font-bold">${byHour.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-white/50">Daily Rate (proportional)</p>
                      <p className="text-white font-bold">${byDay.toFixed(2)}</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setShowBookingModal(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" className="bg-primary text-white" disabled={saving}>
              {saving ? 'Saving...' : editingBooking ? 'Update Booking' : 'Confirm Booking'}
            </Button>
          </div>
        </form>
      </ModalShell>

      {/* Charge to Folio Modal */}
      <ModalShell
        open={!!folioModalBooking}
        onClose={() => setFolioModalBooking(null)}
        title="Post Charge to Guest Room Folio"
      >
        {folioModalBooking && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Hall Booking Code:</span>
                <span className="font-mono text-primary font-bold">{folioModalBooking.confirmationCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Amount to Charge:</span>
                <span className="font-bold text-white">${Number(folioModalBooking.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Purpose / Contact:</span>
                <span className="text-white">{folioModalBooking.purpose || folioModalBooking.contactName || 'Venue Reservation'}</span>
              </div>
            </div>

            <FormField label="Select Active In-House Guest / Room">
              <select
                value={selectedFolioBookingId}
                onChange={e => setSelectedFolioBookingId(e.target.value)}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-lg p-2.5 text-sm text-white"
              >
                {inHouseBookings.length === 0 ? (
                  <option value="">No currently checked-in guests found</option>
                ) : (
                  inHouseBookings.map((b: any) => {
                    const roomNum = b.roomAssignments?.[0]?.room?.number || 'TBD'
                    return (
                      <option key={b.id} value={b.id}>
                        Room #{roomNum} — {b.guest?.name || 'Guest'} (Code: {b.confirmationCode})
                      </option>
                    )
                  })
                )}
              </select>
            </FormField>

            <p className="text-[11px] text-white/50 leading-relaxed">
              Posting this charge will create an <strong className="text-white">EVENTS</strong> line item on the customer&apos;s open room folio and record a double-entry debit against the Guest Ledger.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button type="button" variant="ghost" onClick={() => setFolioModalBooking(null)} disabled={postingFolio}>
                Cancel
              </Button>
              <Button
                onClick={handleChargeToFolio}
                disabled={postingFolio || inHouseBookings.length === 0 || !selectedFolioBookingId}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                {postingFolio ? 'Posting to Folio...' : `Charge $${Number(folioModalBooking.totalAmount).toFixed(2)} to Room`}
              </Button>
            </div>
          </div>
        )}
      </ModalShell>
    </AdminPageShell>
  )
}
