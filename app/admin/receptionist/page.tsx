"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessReceptionistFeatures } from '@/lib/rbac-helpers'
import { 
  Calendar, 
  Users, 
  DoorOpen, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Compass, 
  ShieldAlert, 
  ClipboardList, 
  DollarSign, 
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Info
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { BookingCalendar } from '@/components/admin/booking-calendar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { ArrivalsDeparturesGrid } from '@/components/dashboard/arrivals-departures-grid'
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
  const [guestNotes, setGuestNotes] = useState("")
  const [isVip, setIsVip] = useState(false)
  const [activeTab, setActiveTab] = useState('grid')

  // 1. Fetch Rooms Data
  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await fetch('/api/rooms')
      if (!res.ok) throw new Error('Failed to fetch rooms')
      return res.json()
    }
  })

  // 2. Fetch Bookings Data (Arrivals/Departures)
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
      toast.error('Access Denied: Receptionist authorization required')
      router.push('/auth/signin')
      return
    }
  }, [session, authStatus, router])

  const rooms = roomsData?.rooms || []
  const allBookings = bookingsData?.bookings || []

  // Derive Arrivals and Departures from allBookings
  const today = new Date().toISOString().split('T')[0]
  
  const arrivals = allBookings
    .filter((b: any) => b.status === 'CONFIRMED' && b.checkIn.startsWith(today))
    .map((b: any) => ({
      id: b.id,
      guestName: b.user?.name || 'Guest',
      roomNumber: b.room?.number || 'N/A',
      roomType: b.room?.type || 'Standard',
      time: 'Today',
      vip: b.specialRequests?.toLowerCase().includes('vip') || false,
      payment: b.paymentStatus,
      notes: b.specialRequests
    }))

  const departures = allBookings
    .filter((b: any) => b.status === 'CHECKED_IN' && b.checkOut.startsWith(today))
    .map((b: any) => ({
      id: b.id,
      guestName: b.user?.name || 'Guest',
      roomNumber: b.room?.number || 'N/A',
      roomType: b.room?.type || 'Standard',
      time: 'Today',
      payment: b.paymentStatus,
      balance: b.paymentStatus === 'PAID' ? 0 : b.totalAmount
    }))

  // Mutations
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update booking')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    }
  })

  const handleCheckIn = async (roomNumber: string) => {
    const booking = arrivals.find((a: any) => a.roomNumber === roomNumber)
    if (!booking) return
    
    toast.promise(
      updateBookingMutation.mutateAsync({ id: booking.id, status: 'CHECKED_IN' }),
      {
        loading: 'Checking in guest...',
        success: `Room ${roomNumber} checked in successfully!`,
        error: 'Failed to check in'
      }
    )
    setSelectedRoom(null)
  }

  const handleCheckOut = async (roomNumber: string) => {
    const booking = departures.find((d: any) => d.roomNumber === roomNumber)
    if (!booking) return

    toast.promise(
      updateBookingMutation.mutateAsync({ id: booking.id, status: 'CHECKED_OUT' }),
      {
        loading: 'Checking out guest...',
        success: `Room ${roomNumber} checked out. Housekeeping notified.`,
        error: 'Failed to check out'
      }
    )
    setSelectedRoom(null)
  }

  const handleCreateBooking = async (data: any) => {
    const today = new Date()
    const checkIn = today.toISOString()
    const checkOut = new Date(today.getTime() + (data.nights * 24 * 60 * 60 * 1000)).toISOString()

    toast.promise(
      (async () => {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: data.roomId,
            checkIn,
            checkOut,
            guests: 1, // Default for quick reserve
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            guestPhone: data.guestPhone,
            paymentMethod: 'pay_later'
          })
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create booking')
        }
        return res.json()
      })(),
      {
        loading: 'Creating direct booking...',
        success: `Booking for ${data.guestName} created!`,
        error: (err) => err.message
      }
    )
    setSelectedRoom(null)
  }

  const handleStatusTransition = async (roomNumber: string, nextStatus: string) => {
    // For manual room status changes (maintenance etc)
    const room = rooms.find((r: any) => r.number === roomNumber)
    if (!room) return

    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      if (!res.ok) throw new Error('Failed to update room')
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success(`Room ${roomNumber} updated to ${nextStatus}`)
    } catch (err) {
      toast.error('Failed to update room status')
    }
  }

  const updateRoomMetadata = () => {
    toast.error("Metadata updates are restricted to System Admins.")
  }

  const selectRoomCard = (room: any) => {
    setSelectedRoom(room)
    setGuestNotes(room.notes || "")
    setIsVip(room.vip || false)
  }

  // Filter computation
  const filteredRooms = rooms.filter((r: any) => {
    const matchesSearch = r.number.includes(searchQuery) || r.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (authStatus === 'loading' || roomsLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <PremiumSpinner size="lg" text="Decompressing operational matrices..." />
      </div>
    )
  }

  const occupancyRate = Math.round((rooms.filter((r: any) => r.status === 'OCCUPIED').length / rooms.length) * 100)
  const vipArrivalsCount = arrivals.filter((a: any) => a.vip).length

  return (
    <div className="min-h-screen bg-transparent text-slate-100 p-8 lg:p-12 font-sans">
      <DashboardHeader 
        title="Reception Operations"
        firstName={session?.user?.name?.split(' ')[0]}
        subtitle="Manage live room occupancy, check-in timelines, and guest relations from your central command desk."
        role="Front-Desk Controller"
        unreadNotifications={3}
      />

      {/* KPI Stats Pulse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KpiCard 
          title="Daily Arrivals" 
          value={arrivals.length} 
          delta={12} 
          deltaLabel="vs yesterday"
          icon={<Users className="w-5 h-5" />}
          color="success"
        />
        <KpiCard 
          title="Occupancy" 
          value={`${occupancyRate}%`} 
          delta={5} 
          deltaLabel="vs last week"
          icon={<DoorOpen className="w-5 h-5" />}
          color="primary"
        />
        <KpiCard 
          title="VIP Arrivals" 
          value={vipArrivalsCount} 
          icon={<Sparkles className="w-5 h-5" />}
          color="warning"
          subtitle="Requires priority attention"
        />
        <KpiCard 
          title="Pending Checkouts" 
          value={departures.length} 
          icon={<Clock className="w-5 h-5" />}
          color="info"
        />
      </div>

      <div className="space-y-10">
        {/* Arrivals & Departures (P0) */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-white">Live Operations Timeline</h2>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-black text-white/40">Real-time Sync Active</span>
            </div>
          </div>
          <ArrivalsDeparturesGrid 
            arrivals={arrivals.map((a: any) => ({ ...a, time: a.time }))}
            departures={departures.map((d: any) => ({ ...d, time: d.time }))}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
          />
        </section>

        {/* Room Inventory (P1) */}
        <section>
          <div className="mb-8">
            <div className="flex border-b border-white/5 w-fit mb-6">
              <button
                onClick={() => setActiveTab('grid')}
                className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'grid' ? 'text-primary border-b-2 border-primary' : 'text-white/30 hover:text-white/60'}`}
              >
                Room Status Matrix
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'calendar' ? 'text-primary border-b-2 border-primary' : 'text-white/30 hover:text-white/60'}`}
              >
                Booking Calendar
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'grid' ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <RoomStatusGrid 
                    rooms={rooms}
                    selectedRoomNumber={selectedRoom?.number}
                    onSelectRoom={selectRoomCard}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-white/5 border-white/10 p-6">
                    <BookingCalendar onMutationSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ['rooms'] })
                      queryClient.invalidateQueries({ queryKey: ['bookings'] })
                    }} />
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Room Action Desk (Modal System) */}
        <AnimatePresence>
          {selectedRoom && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8 lg:p-12 bg-slate-950/60 backdrop-blur-md overflow-y-auto pt-20 md:pt-24 pb-12"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-6xl relative"
              >
                <RoomActionDesk 
                  room={selectedRoom}
                  isVip={isVip}
                  onToggleVip={setIsVip}
                  notes={guestNotes}
                  onNotesChange={setGuestNotes}
                  onUpdateMetadata={updateRoomMetadata}
                  onStatusTransition={handleStatusTransition}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onCreateBooking={handleCreateBooking}
                  roomBookings={allBookings.filter((b: any) => b.roomId === selectedRoom?.id)}
                  onClose={() => setSelectedRoom(null)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
