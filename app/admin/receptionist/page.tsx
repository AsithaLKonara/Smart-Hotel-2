"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessReceptionistFeatures } from '@/lib/rbac-helpers'
import { 
  Bed, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { RoomStatusGrid } from '@/components/dashboard/room-status-grid'
import { RoomActionDesk } from '@/components/dashboard/room-action-desk'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'

export default function ReceptionistOperationsCenter() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)

  // Fetch Rooms Data
  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await fetch('/api/rooms')
      if (!res.ok) throw new Error('Failed to fetch rooms')
      return res.json()
    }
  })

  // Fetch Bookings Data
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings')
      if (!res.ok) throw new Error('Failed to fetch bookings')
      return res.json()
    }
  })

  useEffect(() => {
    // Rely solely on middleware.ts for enterprise-grade edge protection.
    // Client-side redirects cause race conditions during Playwright E2E hydration.
  }, [session, authStatus])

  const rooms = roomsData?.rooms || []
  const allBookings = bookingsData?.bookings || []

  // Simple mutations for status updates
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    }
  })

  const handleStatusTransition = async (roomNumber: string, nextStatus: string) => {
    const room = rooms.find((r: any) => r.number === roomNumber)
    if (!room) return
    try {
      await fetch(`/api/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success(`Room ${roomNumber} updated to ${nextStatus}`)
    } catch (err) {
      toast.error('Update failed')
    }
  }

  const handleCheckIn = async (roomNumber: string) => {
    const room = rooms.find((r: any) => r.number === roomNumber)
    if (!room) return
    const booking = allBookings.find((b: any) => b.roomId === room.id && (b.status === 'CONFIRMED' || b.status === 'PENDING'))
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
    const booking = allBookings.find((b: any) => b.roomId === room.id && b.status === 'CHECKED_IN')
    if (!booking) {
      toast.error('No active resident found in this room.')
      return
    }
    updateBookingMutation.mutate({ id: booking.id, status: 'CHECKED_OUT' })
    toast.success(`Check-out and settlement initiated for Room ${roomNumber}`)
  }

  const handleCreateBooking = async (data: any) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CHECKED_IN' })
        })
      }

      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
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

  return (
    <AdminPageShell
      title="Reception Desk"
      subtitle="Monitor room occupancy and manage guest assignments."
      onRefresh={() => queryClient.invalidateQueries({ queryKey: ['rooms'] })}
    >
      <div className="space-y-12">
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-serif font-bold flex items-center gap-3">
              <Bed className="w-6 h-6 text-primary" /> Room Matrix
            </h2>
            <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 uppercase tracking-widest px-4 py-1">
              {rooms.length} Units Online
            </Badge>
          </div>
          <RoomStatusGrid 
            rooms={rooms}
            selectedRoomNumber={selectedRoom?.number}
            onSelectRoom={setSelectedRoom}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </section>
      </div>

      <AnimatePresence>
        {selectedRoom && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            >
              <RoomActionDesk 
                room={selectedRoom}
                onStatusTransition={handleStatusTransition}
                roomBookings={allBookings.filter((b: any) => b.roomId === selectedRoom?.id)}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPageShell>
  )
}
