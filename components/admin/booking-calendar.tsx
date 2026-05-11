"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  User,
  Bed,
  Clock,
  XCircle,
  ArrowRightLeft,
  X,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import toast from 'react-hot-toast'

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  status: string
  paymentStatus: string
  specialRequests?: string | null
  confirmationCode?: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  room: {
    id: string
    number: string
    type: string
    price: number
  }
}

interface BookingCalendarProps {
  onMutationSuccess?: () => void
}

export function BookingCalendar({ onMutationSuccess }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedDayBookings, setSelectedDayBookings] = useState<{ day: Date; bookings: Booking[] } | null>(null)

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch('/api/bookings', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      const bookingsArray: Booking[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.bookings)
        ? data.bookings
        : []

      setBookings(bookingsArray)
    } catch (error: any) {
      console.error('Error fetching calendar bookings:', error)
      toast.error('Failed to load bookings in calendar view')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update booking status')

      toast.success(`Booking ${newStatus.toLowerCase().replace('_', ' ')} successfully!`)
      
      // Update selected booking details inline
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null)
      }

      // Close day modal and refetch everything
      setSelectedDayBookings(null)
      fetchBookings()
      
      if (onMutationSuccess) {
        onMutationSuccess()
      }
    } catch (error) {
      console.error('Error updating booking in calendar:', error)
      toast.error('Failed to update booking status')
    }
  }

  // Prev / Next Month Navigators
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Calculate grid metrics
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const startDayOfWeek = firstDayOfMonth.getDay() // 0 is Sunday, 6 is Saturday
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Grid list representing all days mapped on the calendar layout
  const gridDays: (Date | null)[] = []

  // Pad previous month's cells
  for (let i = 0; i < startDayOfWeek; i++) {
    gridDays.push(null)
  }

  // Populate days of this month
  for (let d = 1; d <= daysInMonth; d++) {
    gridDays.push(new Date(year, month, d))
  }

  // Date comparison helper
  const isOverlap = (booking: Booking, cellDate: Date) => {
    const d = new Date(cellDate)
    d.setHours(0, 0, 0, 0)

    const start = new Date(booking.checkIn)
    start.setHours(0, 0, 0, 0)

    const end = new Date(booking.checkOut)
    end.setHours(0, 0, 0, 0)

    return d >= start && d <= end
  }

  // Filter bookings based on user criteria
  const getFilteredBookingsForDate = (cellDate: Date) => {
    return bookings.filter(b => {
      // 1. Must overlap with date
      const overlaps = isOverlap(b, cellDate)
      if (!overlaps) return false

      // 2. Search query check
      const matchesSearch = searchTerm === '' || 
        b.confirmationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.room?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())

      // 3. Status filter check
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/35'
      case 'CHECKED_IN':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/35'
      case 'CHECKED_OUT':
        return 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/35'
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 border border-red-500/35'
      case 'PENDING':
      default:
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/35'
    }
  }

  const formatLKR = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  return (
    <div className="space-y-6">
      {/* Calendar Filters & Control Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-md p-4 border border-white/10 rounded-2xl">
        <div className="flex items-center space-x-3">
          <Button onClick={prevMonth} variant="outline" size="icon" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-9 w-9">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-lg font-serif font-bold text-white min-w-[140px] text-center">
            {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
          </div>
          <Button onClick={nextMonth} variant="outline" size="icon" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-9 w-9">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => setCurrentDate(new Date())} 
            variant="outline" 
            size="sm" 
            className="bg-white/5 border-white/10 text-xs text-purple-300 hover:bg-purple-950/20 hover:text-white rounded-xl h-9"
          >
            Today
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guests, rooms, codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-xs text-white pl-10 pr-4 py-2.5 rounded-xl placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-slate-950/60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 bg-slate-950 border border-white/10 text-xs text-slate-300 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all">All Reservation Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Grid Calendar */}
      {loading ? (
        <div className="h-[480px] bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
          <PremiumSpinner size="lg" text="Syncing PMS calendars..." />
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-luxury">
          {/* Calendar Day Header */}
          <div className="grid grid-cols-7 border-b border-white/10 bg-slate-950/25">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="text-center py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/40 border-r border-white/5 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-white/5 bg-[#090514]/30 min-h-[460px]">
            {gridDays.map((day, idx) => {
              if (day === null) {
                return (
                  <div key={`empty-${idx}`} className="p-2 min-h-[90px] sm:min-h-[110px] bg-white/[0.01] opacity-25 border-r border-b border-white/5" />
                )
              }

              const dateBookings = getFilteredBookingsForDate(day)
              const todayMark = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => dateBookings.length > 0 && setSelectedDayBookings({ day, bookings: dateBookings })}
                  className={`p-2 min-h-[90px] sm:min-h-[110px] border-r border-b border-white/5 flex flex-col justify-between transition-colors hover:bg-white/[0.02] cursor-pointer ${todayMark ? 'bg-purple-950/15 border-purple-500/40' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] sm:text-xs font-mono font-bold ${todayMark ? 'bg-primary text-white h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center shadow-lg shadow-purple-950' : 'text-white/60'}`}>
                      {day.getDate()}
                    </span>
                    {dateBookings.length > 0 && (
                      <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] px-1 py-0 sm:py-0.5">
                        {dateBookings.length}
                      </Badge>
                    )}
                  </div>

                  {/* Micro timeline stripe layouts */}
                  <div className="mt-2 space-y-1 overflow-hidden flex-1 flex flex-col justify-end">
                    {dateBookings.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBooking(b)
                        }}
                        className={`text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center justify-between hover:scale-[1.02] transition-transform ${getStatusStyle(b.status)}`}
                      >
                        <span className="truncate mr-1 max-w-[50px] sm:max-w-[80px]">
                          {b.user?.name || "Guest"}
                        </span>
                        <span className="font-mono text-[7px] sm:text-[9px] opacity-80 shrink-0">
                          #{b.room?.number || "N/A"}
                        </span>
                      </div>
                    ))}
                    {dateBookings.length > 3 && (
                      <div className="text-[7px] sm:text-[9px] text-white/30 text-center font-bold">
                        +{dateBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Day Bookings Detail Modal Overlay */}
      {selectedDayBookings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-xl bg-slate-950/90 border border-white/10 rounded-2xl shadow-luxury max-h-[80vh] overflow-y-auto">
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xl font-serif text-white flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Reservations on {selectedDayBookings.day.toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' })}
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">A total of {selectedDayBookings.bookings.length} guests booked for stay.</CardDescription>
              </div>
              <Button onClick={() => setSelectedDayBookings(null)} variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {selectedDayBookings.bookings.map((b) => (
                <div 
                  key={b.id} 
                  onClick={() => {
                    setSelectedBooking(b)
                    setSelectedDayBookings(null)
                  }}
                  className="p-4 bg-white/5 border border-white/10 hover:border-primary/40 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{b.user?.name || "Guest"}</h4>
                      <Badge className={`text-[9px] py-0.5 px-1.5 uppercase font-bold tracking-wider ${getStatusStyle(b.status)}`}>
                        {b.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/50">{b.user?.email || "No email"}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-white/30 font-mono">
                      <span>Room {b.room?.number || "N/A"} ({b.room?.type || "Standard"})</span>
                      <span>•</span>
                      <span>{new Date(b.checkIn).toLocaleDateString()} to {new Date(b.checkOut).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                    <div className="text-right sm:mr-2">
                      <p className="text-xs text-white/40 font-mono">TOTAL CHARGE</p>
                      <p className="text-sm font-bold text-white">{formatLKR(b.totalAmount)}</p>
                    </div>
                    <Button size="sm" className="bg-primary/20 hover:bg-primary border border-primary/30 text-white rounded-xl h-8 text-xs font-semibold">
                      Open PMS
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Detailed Booking Panel (PMS Core) Drawer Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <Card className="w-full max-w-2xl bg-[#0e0a1b]/95 border border-white/10 rounded-2xl shadow-luxury relative overflow-hidden">
            {/* Design header lines */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="absolute right-0 top-0 w-40 h-full bg-primary/5 -skew-x-12 translate-x-10 pointer-events-none" />

            <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-center justify-between bg-slate-950/20">
              <div className="space-y-1">
                <Badge className="bg-primary/15 text-primary border border-primary/20 text-[9px] uppercase tracking-widest font-extrabold px-2 py-0.5">
                  SmartHotel PMS Console
                </Badge>
                <CardTitle className="text-2xl font-serif text-white flex items-center gap-2 mt-1">
                  <Bed className="w-6 h-6 text-primary" />
                  Reservation: {selectedBooking.confirmationCode || selectedBooking.id.slice(-8)}
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">Verify booking property credentials, billing limits, and guest preferences.</CardDescription>
              </div>
              <Button onClick={() => setSelectedBooking(null)} variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl absolute top-4 right-4">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Split view Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Guest & Contact section */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest font-extrabold text-white/40 flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <User className="w-3.5 h-3.5 text-primary" /> Guest Identification
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                      <span className="text-slate-400">Full Name</span>
                      <strong className="text-slate-100">{selectedBooking.user?.name || "Premium Guest"}</strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                      <span className="text-slate-400">Email Address</span>
                      <strong className="text-slate-100 truncate max-w-[160px]">{selectedBooking.user?.email || "N/A"}</strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                      <span className="text-slate-400">Guests Quantity</span>
                      <strong className="text-slate-100 font-mono">{selectedBooking.guests} stay guest{selectedBooking.guests > 1 ? 's' : ''}</strong>
                    </div>
                  </div>
                </div>

                {/* Booking Room & Financial section */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest font-extrabold text-white/40 flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Bed className="w-3.5 h-3.5 text-primary" /> Stay & Property Settings
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                      <span className="text-slate-400">Assigned Room</span>
                      <strong className="text-slate-100 font-mono">Room {selectedBooking.room?.number || "N/A"} ({selectedBooking.room?.type || "Standard"})</strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                      <span className="text-slate-400">Check-In / Out</span>
                      <strong className="text-slate-100 font-mono">{new Date(selectedBooking.checkIn).toLocaleDateString()} &rarr; {new Date(selectedBooking.checkOut).toLocaleDateString()}</strong>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                      <span className="text-slate-400">Total Charge</span>
                      <strong className="text-emerald-400 font-bold font-mono">
                        {formatLKR(selectedBooking.totalAmount)} ({selectedBooking.paymentStatus})
                      </strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Special demands note */}
              {selectedBooking.specialRequests && (
                <div className="bg-purple-950/20 p-4 border border-purple-900/30 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-purple-400">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Guest Demands & Special Requests
                  </div>
                  <p className="text-xs text-purple-200/80 italic leading-relaxed">
                    "{selectedBooking.specialRequests}"
                  </p>
                </div>
              )}

              {/* Interactive SRE operations workflow box */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-primary" /> PMS Interactive Dispatch Desk
                  </span>
                  <Badge className={`text-[9px] uppercase tracking-wider font-extrabold py-0.5 px-2 ${getStatusStyle(selectedBooking.status)}`}>
                    Status: {selectedBooking.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <Button
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'PENDING')}
                    disabled={selectedBooking.status === 'PENDING'}
                    variant="outline"
                    className="border-white/10 text-white/80 hover:text-white text-xs h-9 font-semibold hover:bg-white/5 rounded-xl"
                  >
                    Set Pending
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'CONFIRMED')}
                    disabled={selectedBooking.status === 'CONFIRMED'}
                    className="bg-emerald-950/30 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white text-emerald-400 text-xs h-9 font-bold rounded-xl"
                  >
                    Confirm Booking
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'CHECKED_IN')}
                    disabled={selectedBooking.status === 'CHECKED_IN'}
                    className="bg-blue-950/30 border border-blue-500/20 hover:bg-blue-600 hover:text-white text-blue-400 text-xs h-9 font-bold rounded-xl"
                  >
                    Check In 🔑
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'CHECKED_OUT')}
                    disabled={selectedBooking.status === 'CHECKED_OUT'}
                    className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-700 hover:text-white text-zinc-300 text-xs h-9 font-bold rounded-xl"
                  >
                    Check Out 🧹
                  </Button>
                </div>

                {selectedBooking.status !== 'CANCELLED' && (
                  <Button
                    onClick={() => handleStatusUpdate(selectedBooking.id, 'CANCELLED')}
                    className="w-full bg-rose-950/30 border border-rose-500/30 hover:bg-rose-600 text-rose-300 hover:text-white text-xs h-9 font-bold rounded-xl uppercase tracking-wider mt-2"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" /> Void / Cancel Reservation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
