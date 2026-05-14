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
    if (authStatus === 'loading') return
    if (!canAccessReceptionistFeatures(session)) {
      router.push('/auth/signin')
      return
    }
  }, [session, authStatus, router])

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

  if (authStatus === 'loading' || roomsLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <PremiumSpinner size="lg" text="Loading Reception Desk..." />
      </div>
    )
  }

  return (
    <div className="p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Reception Desk</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor room occupancy and manage guest assignments.</p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['rooms'] })} className="bg-white/5 border-white/10">
          <RefreshCw className="w-4 h-4 mr-2" /> Sync Rooms
        </Button>
      </div>

      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <Bed className="w-5 h-5 mr-2 text-primary" /> Room Matrix
            </h2>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
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
                onCheckIn={() => {}}
                onCheckOut={() => {}}
                onCreateBooking={() => {}}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
