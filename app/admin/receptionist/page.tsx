"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApi } from '@/hooks/use-api'
import { canAccessReceptionistFeatures } from '@/lib/rbac-helpers'
import { 
  Bed, 
  RefreshCw,
  Search,
  Filter,
  LayoutDashboard,
  CalendarRange,
  CalendarDays,
  CheckCircle2,
  User,
  CreditCard,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { useProperty } from '@/contexts/property-context'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { RoomActionDesk } from '@/components/dashboard/room-action-desk'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
import { ExpressCheckInModal } from '@/components/dashboard/express-checkin-modal'
import { ReceptionCalendarDesk } from '@/components/dashboard/reception-calendar-desk'
import { ReceptionRoomMatrixDesk } from '@/components/dashboard/reception-room-matrix-desk'
import { ReceptionSplitContainer } from '@/components/dashboard/reception-split-container'
import TapeChart from '@/components/dashboard/tape-chart'
import { format, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

export default function ReceptionistOperationsCenter() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <PremiumSpinner size="lg" text="Loading Reception Command Desk..." />
      </div>
    }>
      <ReceptionistOperationsContent />
    </Suspense>
  )
}

function ReceptionistOperationsContent() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialViewParam = searchParams.get('view')
  
  const [activeView, setActiveView] = useState<'COMMAND_DESK' | 'TAPE_CHART' | 'BOOKINGS_LIST'>(
    initialViewParam === 'tape-chart' ? 'TAPE_CHART' : initialViewParam === 'bookings' ? 'BOOKINGS_LIST' : 'COMMAND_DESK'
  )
  const queryClient = useQueryClient()
  const { activePropertyId } = useProperty()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isExpressModalOpen, setIsExpressModalOpen] = useState(false)
  
  // Reservations Table Sub-Filters
  const [rosterSearch, setRosterSearch] = useState("")
  const [rosterStatusFilter, setRosterStatusFilter] = useState("ALL")
  
  // Availability UI State
  const [availabilityDates, setAvailabilityDates] = useState({
    checkIn: format(new Date(), 'yyyy-MM-dd'),
    checkOut: format(addDays(new Date(), 1), 'yyyy-MM-dd')
  })
  const [availableRoomsCount, setAvailableRoomsCount] = useState<number | null>(null)

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date)
    setAvailabilityDates({
      checkIn: format(date, 'yyyy-MM-dd'),
      checkOut: format(addDays(date, 1), 'yyyy-MM-dd')
    })
  }

  const handleSelectRoom = (room: any) => {
    setSelectedRoom(room)
    setHighlightedRoomId(room.id)
  }

  const handleClearRoomHighlight = () => {
    setHighlightedRoomId(null)
  }

  const checkAvailability = async () => {
    if (!availabilityDates.checkIn || !availabilityDates.checkOut) return toast.error('Select check-in and check-out dates')
    try {
      const res = await fetch(`/api/rooms/check-availability?checkIn=${availabilityDates.checkIn}&checkOut=${availabilityDates.checkOut}`)
      const data = await res.json()
      if (res.ok) {
        setAvailableRoomsCount(data.totalAvailable)
        toast.success(`Found ${data.totalAvailable} rooms available for these dates!`)
      } else {
        toast.error(data.error || 'Check failed')
      }
    } catch (e) {
      toast.error('Failed to check availability')
    }
  }

  // Fetch Rooms Data
  const { data: roomsData, isLoading: roomsLoading } = useApi('/api/rooms')

  // Fetch Bookings Data
  const { data: bookingsData, isLoading: bookingsLoading } = useApi('/api/bookings')

  useEffect(() => {
    // Rely solely on middleware.ts for enterprise-grade edge protection.
    // Client-side redirects cause race conditions during Playwright E2E hydration.
  }, [session, authStatus])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Alt+C for Express Check-in
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        setIsExpressModalOpen(true)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const rooms = roomsData?.rooms || []
  const allBookings = bookingsData?.bookings || []

  const filteredRosterBookings = useMemo(() => {
    return allBookings.filter((b: any) => {
      const guestName = (b.guest?.name || '').toLowerCase()
      const guestEmail = (b.guest?.email || '').toLowerCase()
      const confCode = (b.confirmationCode || '').toLowerCase()
      const roomNum = (b.roomAssignments?.[0]?.room?.number || '').toLowerCase()
      const matchesSearch = !rosterSearch || 
        guestName.includes(rosterSearch.toLowerCase()) || 
        guestEmail.includes(rosterSearch.toLowerCase()) || 
        confCode.includes(rosterSearch.toLowerCase()) ||
        roomNum.includes(rosterSearch.toLowerCase())
      
      const matchesStatus = rosterStatusFilter === 'ALL' || b.status === rosterStatusFilter
      return matchesSearch && matchesStatus
    })
  }, [allBookings, rosterSearch, rosterStatusFilter])

  // Helper to check if a booking occupies a specific room (handles DDD split-stays)
  const isRoomAssigned = (booking: any, targetRoomId: string) => {
    if (booking.roomAssignments && booking.roomAssignments.length > 0) {
      return booking.roomAssignments.some((a: any) => a.roomId === targetRoomId && a.status !== 'MOVED');
    }
    return booking.roomId === targetRoomId; // Legacy fallback
  }

  // Simple mutations for status updates
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-property-id': activePropertyId || 'all'
        },
        body: JSON.stringify({ status })
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', activePropertyId] })
      queryClient.invalidateQueries({ queryKey: ['rooms', activePropertyId] })
    }
  })

  const handleStatusTransition = async (roomNumber: string, nextStatus: string) => {
    const room = rooms.find((r: any) => r.number === roomNumber)
    if (!room) return
    try {
      await fetch(`/api/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-property-id': activePropertyId || 'all'
        },
        body: JSON.stringify({ status: nextStatus })
      })
      queryClient.invalidateQueries({ queryKey: ['rooms', activePropertyId] })
      toast.success(`Room ${roomNumber} updated to ${nextStatus}`)
    } catch (err) {
      toast.error('Update failed')
    }
  }

  const handleCheckIn = async (roomNumber: string) => {
    const room = rooms.find((r: any) => r.number === roomNumber)
    if (!room) return
    const booking = allBookings.find((b: any) => isRoomAssigned(b, room.id) && (b.status === 'CONFIRMED' || b.status === 'PENDING'))
    if (!booking) {
      toast.error('No pending/confirmed booking found for this room.')
      return
    }
    updateBookingMutation.mutate({ id: booking.id, status: 'CHECKED_IN' })
    toast.success(`Check-in successful for Room ${roomNumber}`)
  }

  const handleCheckOut = async (roomNumber: string) => {
    const room = rooms.find((r: any) => r.number === roomNumber)
    if (!room) return
    const booking = allBookings.find((b: any) => isRoomAssigned(b, room.id) && b.status === 'CHECKED_IN')
    if (!booking) {
      toast.error('No active resident found in this room.')
      return
    }
    
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/checkout`, {
        method: 'POST',
        headers: {
          'x-property-id': activePropertyId || 'all'
        }
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to checkout')
      
      queryClient.invalidateQueries({ queryKey: ['bookings', activePropertyId] })
      queryClient.invalidateQueries({ queryKey: ['rooms', activePropertyId] })
      toast.success(`Check-out and settlement completed for Room ${roomNumber}`)
    } catch (err: any) {
      toast.error(err.message || 'Check-out failed')
    }
  }

  const handleCreateBooking = async (data: any) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-property-id': activePropertyId || 'all'
        },
        body: JSON.stringify({
          roomId: data.roomId,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
          guests: 1,
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + data.nights * 24 * 60 * 60 * 1000).toISOString(),
          paymentMethod: 'pay_later'
        })
      })
      
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to create booking')
      
      if (result.booking?.id) {
        await fetch(`/api/bookings/${result.booking.id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'x-property-id': activePropertyId || 'all'
          },
          body: JSON.stringify({ status: 'CHECKED_IN' })
        })
      }

      queryClient.invalidateQueries({ queryKey: ['bookings', activePropertyId] })
      queryClient.invalidateQueries({ queryKey: ['rooms', activePropertyId] })
      toast.success(`Walk-in for ${data.guestName} created and checked into Room ${data.roomNumber}.`)
    } catch (err: any) {
      toast.error(err.message || 'Walk-in creation failed')
    }
  }

  if (authStatus === 'loading' || roomsLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <PremiumSpinner size="lg" text="Loading Reception Desk..." />
      </div>
    )
  }

  const handleShiftClose = async () => {
    const cash = prompt('Enter total cash in drawer ($):')
    if (!cash) return
    try {
      const res = await fetch('/api/accounting/shift-reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: session?.user?.id || '00000000-0000-0000-0000-000000000000',
          shiftStart: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), 
          shiftEnd: new Date().toISOString(),
          declaredCash: Number(cash)
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Shift reconciled! Variance: $${data.data.variance} (${data.data.status})`)
      } else {
        toast.error('Reconciliation failed')
      }
    } catch {
      toast.error('Failed to submit shift reconciliation')
    }
  }

  return (
    <AdminPageShell
      title="Reception Desk"
      subtitle="Monitor room occupancy, assign rooms, and manage reservations."
      onRefresh={() => {
        queryClient.invalidateQueries({ queryKey: ['rooms', activePropertyId] })
        queryClient.invalidateQueries({ queryKey: ['bookings', activePropertyId] })
      }}
    >
      <div className="space-y-6">
        {/* Top View Selector & Fast Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <button
              onClick={() => setActiveView('COMMAND_DESK')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
                activeView === 'COMMAND_DESK'
                  ? "bg-primary text-black shadow-lg font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Command Desk (Dual Split)</span>
            </button>
            <button
              onClick={() => setActiveView('TAPE_CHART')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
                activeView === 'TAPE_CHART'
                  ? "bg-primary text-black shadow-lg font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Tape Chart (14-Day)</span>
            </button>
            <button
              onClick={() => setActiveView('BOOKINGS_LIST')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
                activeView === 'BOOKINGS_LIST'
                  ? "bg-primary text-black shadow-lg font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Reservations ({allBookings.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsExpressModalOpen(true)}
              className="bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 text-xs font-bold h-9 rounded-xl"
            >
              ⚡ Express Walk-in
            </Button>
            <Button
              onClick={handleShiftClose}
              variant="destructive"
              className="bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/40 text-xs font-bold h-9 rounded-xl"
            >
              Close Shift
            </Button>
          </div>
        </div>

        {/* View 1: Dual-Column Command Desk (Split Screen) */}
        {activeView === 'COMMAND_DESK' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-end justify-between gap-4 backdrop-blur-md">
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/50 mb-1 block">Check-in</label>
                  <input
                    type="date"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    value={availabilityDates.checkIn}
                    onChange={e => setAvailabilityDates({...availabilityDates, checkIn: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/50 mb-1 block">Check-out</label>
                  <input
                    type="date"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    value={availabilityDates.checkOut}
                    onChange={e => setAvailabilityDates({...availabilityDates, checkOut: e.target.value})}
                  />
                </div>
                <Button onClick={checkAvailability} className="bg-primary text-black font-bold text-xs h-9 rounded-xl hover:bg-primary/90">
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                  Check Availability
                </Button>
                {availableRoomsCount !== null && (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 py-1.5 px-3 text-xs font-bold h-9 rounded-xl">
                    {availableRoomsCount} Rooms Available
                  </Badge>
                )}
              </div>
            </div>

            <ReceptionSplitContainer
              calendarBookingsCount={allBookings.length}
              totalRoomsCount={rooms.length}
              calendarNode={
                <ReceptionCalendarDesk
                  bookings={allBookings}
                  rooms={rooms}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                  highlightedRoomId={highlightedRoomId}
                  onClearRoomHighlight={handleClearRoomHighlight}
                  onSelectBooking={(b) => {
                    const assignedRoom = rooms.find((r: any) => isRoomAssigned(b, r.id))
                    if (assignedRoom) {
                      setSelectedRoom(assignedRoom)
                      setHighlightedRoomId(assignedRoom.id)
                    }
                  }}
                  onQuickCheckIn={(bookingId) => {
                    updateBookingMutation.mutate({ id: bookingId, status: 'CHECKED_IN' })
                    toast.success('Guest check-in initiated.')
                  }}
                />
              }
              matrixNode={
                <ReceptionRoomMatrixDesk
                  rooms={rooms}
                  bookings={allBookings}
                  selectedDate={selectedDate}
                  onResetDateToToday={() => handleSelectDate(new Date())}
                  selectedRoomId={selectedRoom?.id}
                  onSelectRoom={handleSelectRoom}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                />
              }
            />
          </div>
        )}

        {/* View 2: 14-Day Tape Chart */}
        {activeView === 'TAPE_CHART' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md overflow-x-auto custom-scrollbar">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-white">14-Day Tape Chart Grid</h3>
                <p className="text-xs text-white/40">Real-time booking blocks across physical rooms.</p>
              </div>
            </div>
            <TapeChart initialStartDate={selectedDate} daysToShow={14} />
          </div>
        )}

        {/* View 3: Live Reservations Table */}
        {activeView === 'BOOKINGS_LIST' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search guest, email, code, room..."
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-xs text-white pl-9 pr-3 py-2 rounded-xl placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
                {["ALL", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"].map(st => (
                  <button
                    key={st}
                    onClick={() => setRosterStatusFilter(st)}
                    className={cn(
                      "text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg transition-all",
                      rosterStatusFilter === st
                        ? "bg-primary text-black font-black"
                        : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {st === "ALL" ? "All Status" : st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-white/5 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] text-white/40 uppercase text-[10px] font-bold border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4">Guest</th>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {filteredRosterBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-white/40">
                        No reservations found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRosterBookings.map((b: any) => {
                      const room = b.roomAssignments?.[0]?.room
                      const isArrival = format(new Date(b.checkIn), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                      const isCheckedIn = b.status === 'CHECKED_IN'

                      return (
                        <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{b.guest?.name || 'Guest'}</div>
                            <div className="text-[10px] text-white/40">{b.guest?.email || 'No email'}</div>
                          </td>
                          <td className="py-3 px-4">
                            {room ? (
                              <Badge variant="outline" className="border-white/10 text-white font-mono">
                                #{room.number}
                              </Badge>
                            ) : (
                              <span className="text-white/30 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-white font-medium">
                              {format(new Date(b.checkIn), 'MMM dd')} - {format(new Date(b.checkOut), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-[10px] text-white/40">
                              {Math.max(1, Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000))} nights
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-primary">
                            {b.confirmationCode || b.id.slice(0, 8)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-2 py-0.5 font-bold uppercase",
                                b.status === 'CHECKED_IN' && "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
                                b.status === 'CONFIRMED' && "border-blue-500/30 text-blue-400 bg-blue-500/10",
                                b.status === 'CHECKED_OUT' && "border-slate-500/30 text-slate-400 bg-slate-500/10",
                                b.status === 'CANCELLED' && "border-rose-500/30 text-rose-400 bg-rose-500/10"
                              )}
                            >
                              {b.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            {b.status === 'CONFIRMED' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  updateBookingMutation.mutate({ id: b.id, status: 'CHECKED_IN' })
                                  toast.success(`Checked in ${b.guest?.name || 'guest'}`)
                                }}
                                className="h-7 px-2.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-lg"
                              >
                                Check-in
                              </Button>
                            )}
                            {b.status === 'CHECKED_IN' && room && (
                              <Button
                                size="sm"
                                onClick={() => handleCheckOut(room.number)}
                                className="h-7 px-2.5 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 rounded-lg"
                              >
                                Check-out
                              </Button>
                            )}
                            {room && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedRoom(room)
                                  setHighlightedRoomId(room.id)
                                }}
                                className="h-7 px-2 text-[10px] text-white/50 hover:text-white"
                              >
                                Room Desk →
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedRoom && (
          <RoomActionDesk 
            room={selectedRoom}
            onStatusTransition={handleStatusTransition}
            roomBookings={allBookings.filter((b: any) => isRoomAssigned(b, selectedRoom?.id))}
            onClose={() => setSelectedRoom(null)}
            isVip={false}
            onToggleVip={() => {}}
            notes=""
            onNotesChange={() => {}}
            onUpdateMetadata={() => {}}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onCreateBooking={handleCreateBooking}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpressModalOpen && (
          <ExpressCheckInModal
            rooms={rooms}
            onClose={() => setIsExpressModalOpen(false)}
            onCreateWalkIn={handleCreateBooking}
          />
        )}
      </AnimatePresence>
    </AdminPageShell>
  )
}
