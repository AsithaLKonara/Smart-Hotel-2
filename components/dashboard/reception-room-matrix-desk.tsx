"use client"

import React, { useMemo } from 'react'
import {
  SlidersHorizontal,
  Search,
  CheckCircle2,
  Clock,
  Hammer,
  Ban,
  UserCheck,
  Bed,
  Calendar,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { format, isToday, isSameDay } from 'date-fns'

export interface Room {
  id: string
  number: string
  type?: string
  floor?: number
  status: string
  price?: number
  vip?: boolean
  guestName?: string
  roomType?: {
    name?: string
    baseRate?: number
  }
}

export interface ReceptionRoomMatrixDeskProps {
  rooms: Room[]
  bookings: any[]
  selectedDate: Date
  onResetDateToToday?: () => void
  selectedRoomId?: string | null
  onSelectRoom: (room: Room) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  onQuickInspect?: (room: Room) => void
  onQuickClean?: (room: Room) => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; badge: string; icon: any }> = {
  AVAILABLE: {
    label: "Available",
    color: "bg-emerald-950/20 border-emerald-500/30",
    badge: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    icon: CheckCircle2
  },
  OCCUPIED: {
    label: "Occupied",
    color: "bg-rose-950/40 border-rose-500/30",
    badge: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    icon: UserCheck
  },
  DIRTY: {
    label: "Dirty",
    color: "bg-amber-950/40 border-amber-500/30",
    badge: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    icon: Clock
  },
  INSPECTED: {
    label: "Inspected",
    color: "bg-blue-950/40 border-blue-500/30",
    badge: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    icon: CheckCircle2
  },
  MAINTENANCE: {
    label: "Maintenance",
    color: "bg-slate-900/60 border-slate-700/40",
    badge: "text-slate-400 border-slate-700/20 bg-slate-700/10",
    icon: Hammer
  },
  BLOCKED: {
    label: "Blocked",
    color: "bg-black/60 border-white/10",
    badge: "text-white/40 border-white/10 bg-white/5",
    icon: Ban
  },
}

export function ReceptionRoomMatrixDesk({
  rooms = [],
  bookings = [],
  selectedDate,
  onResetDateToToday,
  selectedRoomId,
  onSelectRoom,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onQuickInspect,
  onQuickClean
}: ReceptionRoomMatrixDeskProps) {
  const isDateToday = isToday(selectedDate)

  // Helper to check if a booking occupies a specific room on the selected date
  const getBookingForRoomOnDate = (roomId: string, date: Date) => {
    const targetTime = date.getTime()
    return bookings.find(b => {
      if (!b.checkIn || !b.checkOut) return false
      if (['CANCELLED', 'CHECKED_OUT'].includes(b.status)) return false

      const isAssigned =
        b.roomAssignments?.some((a: any) => a.roomId === roomId && a.status !== 'MOVED') ||
        b.roomId === roomId

      if (!isAssigned) return false

      const inTime = new Date(b.checkIn).setHours(0, 0, 0, 0)
      const outTime = new Date(b.checkOut).setHours(23, 59, 59, 999)
      const targetMidnight = new Date(targetTime).setHours(12, 0, 0, 0)

      return targetMidnight >= inTime && targetMidnight <= outTime
    })
  }

  // Calculate projected rooms based on selectedDate
  const projectedRooms = useMemo(() => {
    return rooms.map(room => {
      const roomTypeStr = room.type || room.roomType?.name || 'Standard'
      const roomFloor = typeof room.floor === 'number' ? room.floor : 1

      // If viewing today, use actual live room status
      if (isDateToday) {
        const liveBooking = getBookingForRoomOnDate(room.id, selectedDate)
        return {
          ...room,
          type: roomTypeStr,
          floor: roomFloor,
          guestName: liveBooking?.guest?.name || room.guestName
        }
      }

      // If viewing future/past date, project temporal status
      const activeBooking = getBookingForRoomOnDate(room.id, selectedDate)

      let projectedStatus = 'AVAILABLE'
      let guestName: string | undefined = undefined

      if (room.status === 'MAINTENANCE') {
        projectedStatus = 'MAINTENANCE'
      } else if (activeBooking) {
        projectedStatus = 'OCCUPIED'
        guestName = activeBooking.guest?.name || 'Booked Guest'
      }

      return {
        ...room,
        type: roomTypeStr,
        floor: roomFloor,
        status: projectedStatus,
        guestName
      }
    })
  }, [rooms, bookings, selectedDate, isDateToday])

  // Apply search query and status filter
  const filteredRooms = useMemo(() => {
    return projectedRooms.filter(r => {
      const matchesSearch =
        searchQuery === '' ||
        r.number.includes(searchQuery) ||
        (r.type && r.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.guestName && r.guestName.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus =
        statusFilter === 'ALL' || r.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projectedRooms, searchQuery, statusFilter])

  // Group rooms by floor
  const roomsByFloor = useMemo(() => {
    return filteredRooms.reduce((acc, room) => {
      const floorNum = room.floor || 1
      if (!acc[floorNum]) acc[floorNum] = []
      acc[floorNum].push(room)
      return acc
    }, {} as Record<number, Room[]>)
  }, [filteredRooms])

  const floors = useMemo(() => {
    return Object.keys(roomsByFloor)
      .map(Number)
      .sort((a, b) => b - a)
  }, [roomsByFloor])

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 1. Header & Temporal Context Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-serif font-bold text-white flex items-center gap-2">
                <span>Room Matrix</span>
                <Badge variant="outline" className="text-[10px] border-white/10 text-white/50 px-2 py-0.5">
                  {rooms.length} Units
                </Badge>
              </div>
              <div className="text-[11px] text-white/40 mt-0.5">
                Physical floor layout & live occupancy
              </div>
            </div>
          </div>

          {/* Temporal Status Badge */}
          <div className="flex items-center gap-2">
            {isDateToday ? (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] px-2.5 py-1">
                ● Live Real-Time
              </Badge>
            ) : (
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="border-amber-500/30 text-amber-300 bg-amber-500/10 text-[10px] px-2.5 py-1">
                  📅 Projected: {format(selectedDate, 'MMM dd')}
                </Badge>
                {onResetDateToToday && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onResetDateToToday}
                    className="h-7 px-2 text-[10px] text-white/50 hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Today
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-3.5 pt-3.5 border-t border-white/5 flex flex-col md:flex-row items-center gap-2.5">
          <div className="relative w-full md:w-60">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search room, type, guest..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-black/40 border border-white/10 text-xs text-white pl-8 pr-3 py-1.5 rounded-xl placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto w-full pb-1 md:pb-0 custom-scrollbar">
            {["ALL", "AVAILABLE", "OCCUPIED", "DIRTY", "MAINTENANCE"].map(st => (
              <button
                key={st}
                onClick={() => onStatusFilterChange(st)}
                className={cn(
                  "text-[9px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap",
                  statusFilter === st
                    ? "bg-primary text-black shadow-md font-black"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                {st === "ALL" ? "All" : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Floors & Rooms Grid Container */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
        {floors.length === 0 ? (
          <div className="py-12 text-center text-xs text-white/40 bg-white/[0.02] border border-white/5 rounded-2xl">
            No rooms match the current search or filter criteria.
          </div>
        ) : (
          floors.map(floor => (
            <div key={floor} className="space-y-3">
              {/* Floor Header Bar */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.25em]">
                  Floor {floor}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <span className="text-[10px] text-white/30 font-mono">
                  {roomsByFloor[floor]?.length || 0} Rooms
                </span>
              </div>

              {/* Responsive Room Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-3.5">
                <AnimatePresence mode="popLayout">
                  {roomsByFloor[floor].map((room, idx) => {
                    const config = STATUS_CONFIG[room.status] || STATUS_CONFIG.AVAILABLE
                    const isSelected = selectedRoomId === room.id
                    const StatusIcon = config.icon

                    return (
                      <motion.div
                        key={room.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15, delay: idx * 0.01 }}
                        onClick={() => onSelectRoom(room)}
                        className={cn(
                          "group relative p-3.5 border cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[124px] rounded-2xl select-none",
                          config.color,
                          isSelected
                            ? "ring-2 ring-primary border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                            : "hover:border-white/20 hover:bg-white/[0.08]"
                        )}
                      >
                        {/* Top: Room Number & Type */}
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xl font-black font-mono tracking-tight text-white group-hover:text-primary transition-colors">
                              {room.number}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider text-white/40 font-semibold truncate max-w-[85px] text-right">
                              {room.type}
                            </span>
                          </div>

                          {room.guestName ? (
                            <div className="text-[10px] text-white/90 font-medium truncate mt-1 flex items-center gap-1.5 bg-black/30 px-2 py-0.5 rounded-lg border border-white/5">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                              <span className="truncate">{room.guestName}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-white/25 italic mt-1 font-mono">
                              No active folio
                            </div>
                          )}
                        </div>

                        {/* Bottom: Status Pill & Action */}
                        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/5">
                          <span className={cn(
                            "text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border shrink-0",
                            config.badge
                          )}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {config.label}
                          </span>

                          <span className="text-[9px] text-white/30 group-hover:text-primary transition-colors flex items-center gap-0.5 shrink-0">
                            Action
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
