"use client"

import { useState, useMemo, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { 
  Brush, 
  Wrench, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  CheckCheck,
  AlertTriangle,
  Plus,
  Bed,
  Layers,
  Sparkles,
  Search,
  Filter,
  Check
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { motion, AnimatePresence } from 'framer-motion'
import { useProperty } from '@/contexts/property-context'
import { cn } from '@/lib/utils'

export default function RoomOperationsHub() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <PremiumSpinner size="lg" text="Loading Room Operations & Housekeeping..." />
      </div>
    }>
      <RoomOperationsContent />
    </Suspense>
  )
}

function RoomOperationsContent() {
  const queryClient = useQueryClient()
  const { activePropertyId } = useProperty()
  const searchParams = useSearchParams()
  const initialTabParam = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState<'HOUSEKEEPING' | 'MAINTENANCE'>(
    initialTabParam === 'maintenance' ? 'MAINTENANCE' : 'HOUSEKEEPING'
  )

  // Sub-filters
  const [roomFloorFilter, setRoomFloorFilter] = useState<number | 'ALL'>('ALL')
  const [roomStatusFilter, setRoomStatusFilter] = useState<string>('ALL')
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('ALL')

  // Quick Work Order Modal State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [submittingTicket, setSubmittingTicket] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    roomId: '',
    issue: '',
    priority: 'medium'
  })

  // 1. Fetch Rooms Data
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms', activePropertyId],
    queryFn: async () => {
      const res = await fetch('/api/rooms', {
        headers: { 'x-property-id': activePropertyId || 'all' }
      })
      const data = await res.json()
      return data.rooms || []
    }
  })

  // 2. Fetch Maintenance Tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['maintenance-tickets', activePropertyId],
    queryFn: async () => {
      const res = await fetch('/api/admin/maintenance/tickets')
      const data = await res.json()
      return data.tickets || []
    }
  })

  // 3. Room Status Transition Mutation
  const updateRoomStatus = useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string; status: string }) => {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-property-id': activePropertyId || 'all'
        },
        body: JSON.stringify({ status })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update room status')
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', activePropertyId] })
      toast.success(`Room updated to ${variables.status.replace('_', ' ')}`)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Status transition failed')
    }
  })

  // 4. Ticket Status Transition Mutation
  const updateTicketStatus = useMutation({
    mutationFn: async ({ id, status, roomId }: { id: string; status: string; roomId?: string }) => {
      const res = await fetch('/api/admin/maintenance/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update ticket')
      }

      // If resolved and roomId provided, restore room to DIRTY for inspection turnaround
      if (status === 'RESOLVED' && roomId) {
        await fetch(`/api/rooms/${roomId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'x-property-id': activePropertyId || 'all'
          },
          body: JSON.stringify({ status: 'DIRTY' })
        }).catch(() => {})
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets', activePropertyId] })
      queryClient.invalidateQueries({ queryKey: ['rooms', activePropertyId] })
      toast.success('Work order status updated.')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update ticket')
    }
  })

  // 5. Handle New Ticket Creation
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketForm.issue.trim()) return toast.error('Please enter the issue description')

    setSubmittingTicket(true)
    try {
      const res = await fetch('/api/admin/maintenance/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create work order')

      // Flag the room as MAINTENANCE immediately if a room was assigned
      if (ticketForm.roomId) {
        await fetch(`/api/rooms/${ticketForm.roomId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'x-property-id': activePropertyId || 'all'
          },
          body: JSON.stringify({ status: 'MAINTENANCE' })
        }).catch(() => {})
      }

      queryClient.invalidateQueries({ queryKey: ['maintenance-tickets', activePropertyId] })
      queryClient.invalidateQueries({ queryKey: ['rooms', activePropertyId] })
      toast.success('Work order dispatched! Room flagged for maintenance.')
      setIsTicketModalOpen(false)
      setTicketForm({ roomId: '', issue: '', priority: 'medium' })
    } catch (err: any) {
      toast.error(err.message || 'Error creating ticket')
    } finally {
      setSubmittingTicket(false)
    }
  }

  // Floors & Groupings
  const roomsByFloor = useMemo(() => {
    const acc: Record<number, any[]> = {}
    rooms.forEach((r: any) => {
      const floor = r.floor || 1
      if (!acc[floor]) acc[floor] = []
      acc[floor].push(r)
    })
    return acc
  }, [rooms])

  const sortedFloors = useMemo(() => {
    return Object.keys(roomsByFloor).map(Number).sort((a, b) => b - a)
  }, [roomsByFloor])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = rooms.length
    const clean = rooms.filter((r: any) => r.status === 'AVAILABLE' || r.status === 'INSPECTED').length
    const dirty = rooms.filter((r: any) => r.status === 'DIRTY').length
    const inProgress = rooms.filter((r: any) => r.status === 'CLEANING').length
    const maintenance = rooms.filter((r: any) => r.status === 'MAINTENANCE').length
    const openTickets = tickets.filter((t: any) => t.status === 'OPEN' || t.status === 'PENDING').length
    return { total, clean, dirty, inProgress, maintenance, openTickets }
  }, [rooms, tickets])

  const filteredTickets = useMemo(() => {
    if (ticketStatusFilter === 'ALL') return tickets
    return tickets.filter((t: any) => t.status === ticketStatusFilter)
  }, [tickets, ticketStatusFilter])

  if (roomsLoading || ticketsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PremiumSpinner size="lg" text="Loading Room Operations & Housekeeping..." />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1560px] mx-auto text-zinc-100">
      {/* 1. Header & Unified Operational Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C2025] pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Brush className="w-6 h-6 text-white" /> Room Operations & Housekeeping
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Real-time floor turnaround board, cleaning inspections, and maintenance work orders.
          </p>
        </div>

        {/* View Switcher Pill */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121417] border border-[#1E2227] rounded-xl">
          <button
            onClick={() => setActiveTab('HOUSEKEEPING')}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
              activeTab === 'HOUSEKEEPING'
                ? "bg-[#181A1D] text-white border border-[#2B3037] shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#131518]"
            )}
          >
            <Brush className="w-3.5 h-3.5" />
            <span>Turnaround Board ({metrics.dirty} Dirty)</span>
          </button>
          <button
            onClick={() => setActiveTab('MAINTENANCE')}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
              activeTab === 'MAINTENANCE'
                ? "bg-[#181A1D] text-white border border-[#2B3037] shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#131518]"
            )}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Work Orders ({metrics.openTickets} Open)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Total Rooms</span>
            <Bed className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-2">{metrics.total}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Clean / Ready</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
              Active
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight mt-2">{metrics.clean}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Needs Cleaning</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono text-amber-400 bg-amber-500/10 border-amber-500/20">
              Pending
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight mt-2">{metrics.dirty}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Cleaning Now</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono text-blue-400 bg-blue-500/10 border-blue-500/20">
              In-Flight
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono tracking-tight mt-2">{metrics.inProgress}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between hover:border-zinc-700 transition-colors group col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Maintenance</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border font-mono text-rose-400 bg-rose-500/10 border-rose-500/20">
              Alert
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight mt-2">{metrics.maintenance}</div>
        </div>
      </div>

      {/* 3. TAB 1: Housekeeping Floor Turnaround Board */}
      {activeTab === 'HOUSEKEEPING' && (
        <div className="space-y-6">
          {/* Quick Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121417] border border-[#1E2227] p-2.5 rounded-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              {['ALL', 'DIRTY', 'CLEANING', 'AVAILABLE', 'MAINTENANCE'].map(st => (
                <button
                  key={st}
                  onClick={() => setRoomStatusFilter(st)}
                  className={cn(
                    "text-[10px] uppercase font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap border",
                    roomStatusFilter === st
                      ? "bg-[#181A1D] text-white border-[#2B3037] shadow-sm"
                      : "bg-[#141619] text-zinc-400 border-[#1E2227] hover:text-white hover:bg-[#16181B]"
                  )}
                >
                  {st === 'ALL' ? 'All Rooms' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={() => {
                setTicketForm({ roomId: '', issue: '', priority: 'medium' })
                setIsTicketModalOpen(true)
              }}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg h-8 px-3 transition-all shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New Work Order
            </Button>
          </div>

          {/* Floor-by-Floor Cards */}
          <div className="space-y-8">
            {sortedFloors.map(floor => {
              const floorRooms = roomsByFloor[floor].filter((r: any) => {
                if (roomStatusFilter === 'ALL') return true
                return r.status === roomStatusFilter
              })

              if (floorRooms.length === 0) return null

              return (
                <div key={floor} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500 font-mono">
                      Floor {floor}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#1E2227] to-transparent" />
                    <span className="text-[10px] text-zinc-500 font-mono">{floorRooms.length} Rooms</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {floorRooms.map((room: any) => {
                      const isDirty = room.status === 'DIRTY'
                      const isCleaning = room.status === 'CLEANING'
                      const isClean = room.status === 'AVAILABLE' || room.status === 'INSPECTED'
                      const isMaintenance = room.status === 'MAINTENANCE'

                      return (
                        <div
                          key={room.id}
                          className="p-4 rounded-2xl bg-[#121417] border border-[#1E2227] hover:border-zinc-700 transition-colors flex flex-col justify-between space-y-4 shadow-sm"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <span className="text-2xl font-black font-mono text-white">
                                {room.number}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-2 py-0.5 font-bold uppercase font-mono",
                                  isClean && "border-emerald-500/20 text-emerald-400 bg-emerald-500/10",
                                  isDirty && "border-amber-500/20 text-amber-400 bg-amber-500/10",
                                  isCleaning && "border-blue-500/20 text-blue-400 bg-blue-500/10",
                                  isMaintenance && "border-rose-500/20 text-rose-400 bg-rose-500/10"
                                )}
                              >
                                {room.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1 uppercase font-semibold tracking-wider">
                              {room.roomType?.name || room.type || 'Standard'}
                            </div>
                          </div>

                          {/* 1-Tap Action Buttons */}
                          <div className="pt-3 border-t border-[#1C2025] flex items-center gap-1.5 flex-wrap">
                            {isDirty && (
                              <Button
                                size="sm"
                                onClick={() => updateRoomStatus.mutate({ roomId: room.id, status: 'CLEANING' })}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold h-7 px-2.5 rounded-lg flex-1 transition-colors"
                              >
                                <Brush className="w-3 h-3 mr-1" /> Start Cleaning
                              </Button>
                            )}

                            {isCleaning && (
                              <Button
                                size="sm"
                                onClick={() => updateRoomStatus.mutate({ roomId: room.id, status: 'AVAILABLE' })}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold h-7 px-2.5 rounded-lg flex-1 transition-colors"
                              >
                                <Check className="w-3 h-3 mr-1" /> Mark Clean
                              </Button>
                            )}

                            {isClean && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateRoomStatus.mutate({ roomId: room.id, status: 'DIRTY' })}
                                className="bg-[#181A1D] border border-[#2B3037] text-zinc-300 hover:text-amber-400 text-[10px] h-7 px-2.5 rounded-lg transition-colors"
                              >
                                Mark Dirty
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setTicketForm({ roomId: room.id, issue: '', priority: 'medium' })
                                setIsTicketModalOpen(true)
                              }}
                              className="bg-[#181A1D] border border-[#2B3037] text-zinc-300 hover:text-rose-400 text-[10px] h-7 px-2.5 rounded-lg transition-colors ml-auto"
                            >
                              <Wrench className="w-3 h-3 mr-1" /> Report Issue
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 2: Maintenance Work Orders */}
      {activeTab === 'MAINTENANCE' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121417] border border-[#1E2227] p-2.5 rounded-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setTicketStatusFilter(st)}
                  className={cn(
                    "text-[10px] uppercase font-semibold px-3 py-1.5 rounded-lg transition-all border",
                    ticketStatusFilter === st
                      ? "bg-[#181A1D] text-white border-[#2B3037] shadow-sm"
                      : "bg-[#141619] text-zinc-400 border-[#1E2227] hover:text-white hover:bg-[#16181B]"
                  )}
                >
                  {st === 'ALL' ? 'All Tickets' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <Button
              onClick={() => {
                setTicketForm({ roomId: '', issue: '', priority: 'medium' })
                setIsTicketModalOpen(true)
              }}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs h-8 px-3 rounded-lg transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New Work Order
            </Button>
          </div>

          <div className="border border-[#1E2227] rounded-xl overflow-hidden overflow-x-auto bg-[#121417]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141619] text-zinc-500 uppercase text-[10px] font-semibold tracking-wider border-b border-[#1E2227]">
                <tr>
                  <th className="py-3 px-4">Work Order / Issue</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1D21] text-zinc-200">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">
                      No maintenance work orders found. All assets operational!
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket: any) => {
                    const isResolved = ticket.status === 'RESOLVED'
                    const isOpen = ticket.status === 'OPEN' || ticket.status === 'PENDING'

                    return (
                      <tr key={ticket.id} className="hover:bg-[#16181B] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white text-sm">{ticket.issue || ticket.description || 'Facility Issue'}</div>
                          {ticket.assignedStaff && (
                            <div className="text-[10px] text-zinc-500 mt-0.5">Assigned to: {ticket.assignedStaff}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {ticket.room?.number ? (
                            <Badge variant="outline" className="border-[#2B3037] bg-[#181A1D] text-white font-mono text-[11px]">
                              Room {ticket.room.number}
                            </Badge>
                          ) : (
                            <span className="text-zinc-600 italic">General Facility</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5 font-bold uppercase font-mono",
                              ticket.priority?.toLowerCase() === 'urgent' && "border-rose-500/20 text-rose-400 bg-rose-500/10",
                              ticket.priority?.toLowerCase() === 'high' && "border-amber-500/20 text-amber-400 bg-amber-500/10",
                              ticket.priority?.toLowerCase() === 'medium' && "border-blue-500/20 text-blue-400 bg-blue-500/10",
                              ticket.priority?.toLowerCase() === 'low' && "border-zinc-700 text-zinc-400 bg-zinc-800/30"
                            )}
                          >
                            {ticket.priority || 'Medium'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5 font-bold uppercase font-mono",
                              isResolved && "border-emerald-500/20 text-emerald-400 bg-emerald-500/10",
                              !isResolved && isOpen && "border-rose-500/20 text-rose-400 bg-rose-500/10",
                              !isResolved && !isOpen && "border-blue-500/20 text-blue-400 bg-blue-500/10"
                            )}
                          >
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-500 text-[11px] font-mono">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Today'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {isOpen && (
                            <Button
                              size="sm"
                              onClick={() => updateTicketStatus.mutate({ id: ticket.id, status: 'IN_PROGRESS' })}
                              className="h-7 px-2.5 text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 rounded font-medium transition-colors"
                            >
                              Start Repair
                            </Button>
                          )}
                          {!isResolved && (
                            <Button
                              size="sm"
                              onClick={() => updateTicketStatus.mutate({ id: ticket.id, status: 'RESOLVED', roomId: ticket.roomId || ticket.room?.id })}
                              className="h-7 px-2.5 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded font-semibold transition-colors"
                            >
                              Mark Resolved
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

      {/* 5. Fast New Work Order Modal */}
      {isTicketModalOpen && (
        <Modal open={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title="Dispatch Maintenance Work Order">
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">Associated Room</label>
              <select
                className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-zinc-400"
                value={ticketForm.roomId}
                onChange={e => setTicketForm({ ...ticketForm, roomId: e.target.value })}
              >
                <option value="">General Facility / No Room</option>
                {rooms.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    Room {r.number} ({r.roomType?.name || r.type || 'Standard'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">Issue Description</label>
              <Input
                placeholder="e.g. AC leaking water, bulb blown in bathroom..."
                value={ticketForm.issue}
                onChange={e => setTicketForm({ ...ticketForm, issue: e.target.value })}
                className="bg-[#181A1D] border-[#2B3037] text-xs rounded-lg text-white placeholder-zinc-500 focus:border-zinc-400"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">Urgency / Priority</label>
              <select
                className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-zinc-400"
                value={ticketForm.priority}
                onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}
              >
                <option value="low">Low (Cosmetic, touch-up)</option>
                <option value="medium">Medium (Standard repair)</option>
                <option value="high">High (Affecting guest comfort)</option>
                <option value="urgent">Urgent (Room out of service)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[#1C2025] flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsTicketModalOpen(false)} className="text-xs text-zinc-400 hover:text-white">
                Cancel
              </Button>
              <Button type="submit" disabled={submittingTicket} className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg px-4 py-2 shadow-sm">
                {submittingTicket ? 'Dispatching...' : 'Dispatch Work Order'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
