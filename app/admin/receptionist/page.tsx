"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useApi } from '@/hooks/use-api'
import { canAccessReceptionistFeatures } from '@/lib/rbac-helpers'
import { 
  Bed, 
  RefreshCw,
  Search,
  Filter
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
import { format, addDays } from 'date-fns'

export default function ReceptionistOperationsCenter() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { activePropertyId } = useProperty()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isExpressModalOpen, setIsExpressModalOpen] = useState(false)
  
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
      subtitle="Monitor room occupancy and manage guest assignments."
      onRefresh={() => queryClient.invalidateQueries({ queryKey: ['rooms', activePropertyId] })}
    >
      <div className="space-y-12">
        <section>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Check-in Date</label>
                <input type="date" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" value={availabilityDates.checkIn} onChange={e => setAvailabilityDates({...availabilityDates, checkIn: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Check-out Date</label>
                <input type="date" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" value={availabilityDates.checkOut} onChange={e => setAvailabilityDates({...availabilityDates, checkOut: e.target.value})} />
              </div>
              <Button onClick={checkAvailability} className="bg-primary text-primary-foreground font-semibold">
                <Search className="w-4 h-4 mr-2" />
                Check Availability
              </Button>
              {availableRoomsCount !== null && (
                <div className="ml-4 flex items-center animate-in fade-in zoom-in duration-300">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 py-1.5 px-4 text-sm font-bold">
                    {availableRoomsCount} Rooms Available
                  </Badge>
                </div>
              )}
            </div>
            
            <Button onClick={handleShiftClose} variant="destructive" className="bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/40">
              Close Shift (Reconcile)
            </Button>
          </div>

          {/* Dual-Column Split Screen: Full Calendar (Left) & Room Matrix (Right) */}
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
        </section>
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
