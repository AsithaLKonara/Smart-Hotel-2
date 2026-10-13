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
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-white">
      {/* 1. Header & Unified Operational Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            <Brush className="w-8 h-8 text-primary" /> Room Operations & Housekeeping
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Real-time floor turnaround board, cleaning inspections, and maintenance work orders.
          </p>
        </div>

        {/* View Switcher Pill */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab('HOUSEKEEPING')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
              activeTab === 'HOUSEKEEPING'
                ? "bg-primary text-black font-black shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Brush className="w-4 h-4" />
            <span>Turnaround Board ({metrics.dirty} Dirty)</span>
          </button>
          <button
            onClick={() => setActiveTab('MAINTENANCE')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
              activeTab === 'MAINTENANCE'
                ? "bg-primary text-black font-black shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Wrench className="w-4 h-4" />
            <span>Work Orders ({metrics.openTickets} Open)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Total Rooms</span>
            <div className="text-2xl font-mono font-black text-white mt-0.5">{metrics.total}</div>
          </div>
          <Bed className="w-5 h-5 text-white/30" />
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Clean / Ready</span>
            <div className="text-2xl font-mono font-black text-emerald-300 mt-0.5">{metrics.clean}</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Needs Cleaning</span>
            <div className="text-2xl font-mono font-black text-amber-300 mt-0.5">{metrics.dirty}</div>
          </div>
          <Clock className="w-5 h-5 text-amber-400" />
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Cleaning Now</span>
            <div className="text-2xl font-mono font-black text-blue-300 mt-0.5">{metrics.inProgress}</div>
          </div>
          <Brush className="w-5 h-5 text-blue-400" />
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Maintenance</span>
            <div className="text-2xl font-mono font-black text-rose-300 mt-0.5">{metrics.maintenance}</div>
          </div>
          <AlertTriangle className="w-5 h-5 text-rose-400" />
        </div>
      </div>

      {/* 3. TAB 1: Housekeeping Floor Turnaround Board */}
      {activeTab === 'HOUSEKEEPING' && (
        <div className="space-y-6">
          {/* Quick Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              {['ALL', 'DIRTY', 'CLEANING', 'AVAILABLE', 'MAINTENANCE'].map(st => (
                <button
                  key={st}
                  onClick={() => setRoomStatusFilter(st)}
                  className={cn(
                    "text-[10px] uppercase font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap",
                    roomStatusFilter === st
                      ? "bg-primary text-black font-black shadow-md"
                      : "text-white/40 hover:text-white hover:bg-white/5"
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
              className="bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 text-xs font-bold rounded-xl h-8"
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
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-white/40">
                      Floor {floor}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    <span className="text-[10px] text-white/30 font-mono">{floorRooms.length} Rooms</span>
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
                          className={cn(
                            "p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-lg",
                            isDirty && "bg-amber-950/20 border-amber-500/30",
                            isCleaning && "bg-blue-950/20 border-blue-500/30",
                            isClean && "bg-emerald-950/20 border-emerald-500/30",
                            isMaintenance && "bg-rose-950/20 border-rose-500/30",
                            !isDirty && !isCleaning && !isClean && !isMaintenance && "bg-white/[0.03] border-white/10"
                          )}
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <span className="text-2xl font-black font-mono text-white">
                                {room.number}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-2 py-0.5 font-bold uppercase",
                                  isClean && "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
                                  isDirty && "border-amber-500/40 text-amber-400 bg-amber-500/10",
                                  isCleaning && "border-blue-500/40 text-blue-400 bg-blue-500/10",
                                  isMaintenance && "border-rose-500/40 text-rose-400 bg-rose-500/10"
                                )}
                              >
                                {room.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-white/50 mt-1 uppercase font-semibold tracking-wider">
                              {room.roomType?.name || room.type || 'Standard'}
                            </div>
                          </div>

                          {/* 1-Tap Action Buttons */}
                          <div className="pt-3 border-t border-white/5 flex items-center gap-1.5 flex-wrap">
                            {isDirty && (
                              <Button
                                size="sm"
                                onClick={() => updateRoomStatus.mutate({ roomId: room.id, status: 'CLEANING' })}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold h-7 px-2.5 rounded-lg flex-1"
                              >
                                <Brush className="w-3 h-3 mr-1" /> Start Cleaning
                              </Button>
                            )}

                            {isCleaning && (
                              <Button
                                size="sm"
                                onClick={() => updateRoomStatus.mutate({ roomId: room.id, status: 'AVAILABLE' })}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold h-7 px-2.5 rounded-lg flex-1"
                              >
                                <Check className="w-3 h-3 mr-1" /> Mark Clean
                              </Button>
                            )}

                            {isClean && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateRoomStatus.mutate({ roomId: room.id, status: 'DIRTY' })}
                                className="text-white/40 hover:text-amber-400 text-[10px] h-7 px-2"
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
                              className="text-white/40 hover:text-rose-400 text-[10px] h-7 px-2"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setTicketStatusFilter(st)}
                  className={cn(
                    "text-[10px] uppercase font-bold px-3 py-1.5 rounded-xl transition-all",
                    ticketStatusFilter === st
                      ? "bg-primary text-black font-black"
                      : "text-white/40 hover:text-white hover:bg-white/5"
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
              className="bg-primary text-black font-bold text-xs h-9 rounded-xl hover:bg-primary/90"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New Work Order
            </Button>
          </div>

          <div className="border border-white/10 rounded-2xl overflow-hidden overflow-x-auto bg-white/[0.02]">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.04] text-white/40 uppercase text-[10px] font-bold border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Work Order / Issue</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-white/40">
                      No maintenance work orders found. All assets operational!
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket: any) => {
                    const isResolved = ticket.status === 'RESOLVED'
                    const isOpen = ticket.status === 'OPEN' || ticket.status === 'PENDING'

                    return (
                      <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{ticket.issue || ticket.description || 'Facility Issue'}</div>
                          {ticket.assignedStaff && (
                            <div className="text-[10px] text-white/40 mt-0.5">Assigned to: {ticket.assignedStaff}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {ticket.room?.number ? (
                            <Badge variant="outline" className="border-white/10 text-white font-mono">
                              Room {ticket.room.number}
                            </Badge>
                          ) : (
                            <span className="text-white/30 italic">General Facility</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5 font-bold uppercase",
                              ticket.priority?.toLowerCase() === 'urgent' && "border-rose-500/40 text-rose-400 bg-rose-500/10",
                              ticket.priority?.toLowerCase() === 'high' && "border-amber-500/40 text-amber-400 bg-amber-500/10",
                              ticket.priority?.toLowerCase() === 'medium' && "border-blue-500/40 text-blue-400 bg-blue-500/10",
                              ticket.priority?.toLowerCase() === 'low' && "border-slate-500/40 text-slate-400 bg-slate-500/10"
                            )}
                          >
                            {ticket.priority || 'Medium'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5 font-bold uppercase",
                              isResolved && "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
                              !isResolved && isOpen && "border-rose-500/40 text-rose-400 bg-rose-500/10",
                              !isResolved && !isOpen && "border-blue-500/40 text-blue-400 bg-blue-500/10"
                            )}
                          >
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-white/40 text-[11px]">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Today'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {isOpen && (
                            <Button
                              size="sm"
                              onClick={() => updateTicketStatus.mutate({ id: ticket.id, status: 'IN_PROGRESS' })}
                              className="h-7 px-2.5 text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 rounded-lg"
                            >
                              Start Repair
                            </Button>
                          )}
                          {!isResolved && (
                            <Button
                              size="sm"
                              onClick={() => updateTicketStatus.mutate({ id: ticket.id, status: 'RESOLVED', roomId: ticket.roomId || ticket.room?.id })}
                              className="h-7 px-2.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-lg"
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
              <label className="text-xs font-bold text-white/60 mb-1 block">Associated Room</label>
              <select
                className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-primary"
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
              <label className="text-xs font-bold text-white/60 mb-1 block">Issue Description</label>
              <Input
                placeholder="e.g. AC leaking water, bulb blown in bathroom..."
                value={ticketForm.issue}
                onChange={e => setTicketForm({ ...ticketForm, issue: e.target.value })}
                className="bg-black/60 border-white/10 text-xs rounded-xl"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white/60 mb-1 block">Urgency / Priority</label>
              <select
                className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-primary"
                value={ticketForm.priority}
                onChange={e => setTicketForm({ ...ticketForm, priority: e.target.value })}
              >
                <option value="low">Low (Cosmetic, touch-up)</option>
                <option value="medium">Medium (Standard repair)</option>
                <option value="high">High (Affecting guest comfort)</option>
                <option value="urgent">Urgent (Room out of service)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsTicketModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={submittingTicket} className="bg-primary text-black font-bold text-xs">
                {submittingTicket ? 'Dispatching...' : 'Dispatch Work Order'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
