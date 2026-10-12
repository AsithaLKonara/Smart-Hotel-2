"use client"

import React, { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  User,
  Bed,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Filter,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  Eye,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns'

export interface CalendarBooking {
  id: string
  checkIn: string
  checkOut: string
  status: string
  guests?: number
  totalAmount?: number
  guest?: {
    id?: string
    name?: string
    email?: string
  }
  roomAssignments?: Array<{
    roomId?: string
    status?: string
    room?: {
      number?: string
      type?: string
      price?: number
    }
  }>
}

export interface ReceptionCalendarDeskProps {
  bookings: CalendarBooking[]
  rooms: any[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
  highlightedRoomId?: string | null
  onClearRoomHighlight?: () => void
  onSelectBooking?: (booking: CalendarBooking) => void
  onQuickCheckIn?: (bookingId: string) => void
}

export function ReceptionCalendarDesk({
  bookings = [],
  rooms = [],
  selectedDate,
  onSelectDate,
  highlightedRoomId,
  onClearRoomHighlight,
  onSelectBooking,
  onQuickCheckIn
}: ReceptionCalendarDeskProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date())
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isDayRosterOpen, setIsDayRosterOpen] = useState<boolean>(false)

  // Navigation handlers
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const handleToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    onSelectDate(today)
  }

  // Pre-process bookings into efficient date buckets
  const totalRoomsCount = Math.max(rooms.length, 1)

  // Helper to check if a booking occupies a room
  const isRoomInBooking = (b: CalendarBooking, roomId: string) => {
    if (b.roomAssignments && b.roomAssignments.length > 0) {
      return b.roomAssignments.some(a => a.roomId === roomId && a.status !== 'MOVED')
    }
    return false
  }

  // Filter bookings based on status and search query
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        b.status?.toUpperCase() === statusFilter.toUpperCase()

      const guestName = b.guest?.name?.toLowerCase() || ''
      const roomNum = b.roomAssignments?.[0]?.room?.number || ''
      const matchesSearch =
        searchQuery === '' ||
        guestName.includes(searchQuery.toLowerCase()) ||
        roomNum.includes(searchQuery)

      return matchesStatus && matchesSearch
    })
  }, [bookings, statusFilter, searchQuery])

  // Map bookings to dates for O(1) cell lookup
  const bookingsByDateMap = useMemo(() => {
    const map = new Map<string, {
      all: CalendarBooking[]
      arrivals: CalendarBooking[]
      departures: CalendarBooking[]
      inHouse: CalendarBooking[]
    }>()

    for (const b of filteredBookings) {
      if (!b.checkIn || !b.checkOut) continue
      try {
        const inDate = startOfDaySafe(b.checkIn)
        const outDate = startOfDaySafe(b.checkOut)

        // Iterate through dates between inDate and outDate
        let curr = inDate
        while (curr <= outDate) {
          const key = format(curr, 'yyyy-MM-dd')
          if (!map.has(key)) {
            map.set(key, { all: [], arrivals: [], departures: [], inHouse: [] })
          }
          const entry = map.get(key)!
          entry.all.push(b)

          if (isSameDay(curr, inDate)) {
            entry.arrivals.push(b)
          } else if (isSameDay(curr, outDate)) {
            entry.departures.push(b)
          } else {
            entry.inHouse.push(b)
          }

          curr = addDays(curr, 1)
        }
      } catch (err) {
        // Skip invalid date strings safely
      }
    }
    return map
  }, [filteredBookings])

  function startOfDaySafe(dateStr: string) {
    const d = new Date(dateStr)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }

  // Calculate Month Grid Days
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days: Date[] = []
    let day = startDate
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentMonth])

  // Metrics for the currently selected date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd')
  const selectedDayData = bookingsByDateMap.get(selectedDateKey) || {
    all: [],
    arrivals: [],
    departures: [],
    inHouse: []
  }

  const selectedOccupancyRate = Math.min(
    100,
    Math.round(((selectedDayData.inHouse.length + selectedDayData.arrivals.length) / totalRoomsCount) * 100)
  )

  const highlightedRoomNumber = useMemo(() => {
    if (!highlightedRoomId) return null
    const r = rooms.find(rm => rm.id === highlightedRoomId)
    return r?.number || null
  }, [highlightedRoomId, rooms])

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 1. Header Toolbar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={handlePrevMonth}
              variant="outline"
              size="icon"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-9 w-9"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-base font-serif font-bold text-white min-w-[130px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <Button
              onClick={handleNextMonth}
              variant="outline"
              size="icon"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-9 w-9"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleToday}
              variant="outline"
              size="sm"
              className="bg-primary/10 border-primary/20 text-xs font-semibold text-primary hover:bg-primary/20 rounded-xl h-9"
            >
              Today
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-44">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guest or room..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-xs text-white pl-8 pr-3 py-1.5 rounded-xl placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-black/40 border border-white/10 text-xs text-white/80 px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="CHECKED_OUT">Checked Out</option>
            </select>
          </div>
        </div>

        {/* Room Highlighting Alert Banner (if a room was clicked in the Room Matrix) */}
        {highlightedRoomNumber && (
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span>Filtering calendar stays for <strong>Room #{highlightedRoomNumber}</strong></span>
            </div>
            <button
              onClick={onClearRoomHighlight}
              className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 underline"
            >
              <X className="w-3 h-3" /> Show All Rooms
            </button>
          </div>
        )}
      </div>

      {/* 2. Selected Focal Date Overview Bar */}
      <div className="bg-gradient-to-r from-primary/10 via-white/[0.04] to-transparent border border-primary/20 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
            {format(selectedDate, 'dd')}
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{format(selectedDate, 'EEEE, MMMM do, yyyy')}</span>
              {isToday(selectedDate) && (
                <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10 py-0 px-1.5">
                  TODAY
                </Badge>
              )}
            </div>
            <div className="text-[11px] text-white/50 mt-0.5">
              Room Matrix is projected for this date
            </div>
          </div>
        </div>

        {/* Daily KPI Badges */}
        <div className="flex items-center gap-2">
          <div className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-center">
            <span className="text-[10px] text-white/40 block leading-tight">Occupancy</span>
            <span className="text-xs font-bold text-amber-400">{selectedOccupancyRate}%</span>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-center">
            <span className="text-[10px] text-emerald-400/70 block leading-tight">Arrivals</span>
            <span className="text-xs font-bold text-emerald-400">{selectedDayData.arrivals.length}</span>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-center">
            <span className="text-[10px] text-rose-400/70 block leading-tight">Departures</span>
            <span className="text-xs font-bold text-rose-400">{selectedDayData.departures.length}</span>
          </div>

          <Button
            size="sm"
            onClick={() => setIsDayRosterOpen(!isDayRosterOpen)}
            variant="outline"
            className="text-xs bg-white/5 border-white/10 text-white hover:bg-white/10 h-8 px-2.5 rounded-xl ml-1"
          >
            <Users className="w-3.5 h-3.5 mr-1 text-primary" />
            {isDayRosterOpen ? 'Hide Day List' : 'Day Roster'}
          </Button>
        </div>
      </div>

      {/* 3. Optional Day Roster Drawer (Quick list of arrivals/departures for focal date) */}
      {isDayRosterOpen && (
        <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200 max-h-56 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center justify-between">
            <span>Roster for {format(selectedDate, 'MMM dd')}</span>
            <span className="text-[10px] font-normal text-white/40">{selectedDayData.all.length} Total Bookings</span>
          </div>

          {selectedDayData.all.length === 0 ? (
            <div className="py-4 text-center text-xs text-white/40">
              No reservations scheduled for this date.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedDayData.all.map(b => {
                const isArrival = isSameDay(startOfDaySafe(b.checkIn), selectedDate)
                const isDeparture = isSameDay(startOfDaySafe(b.checkOut), selectedDate)
                const roomNum = b.roomAssignments?.[0]?.room?.number || 'TBD'

                return (
                  <div
                    key={b.id}
                    onClick={() => onSelectBooking && onSelectBooking(b)}
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-primary/40 hover:bg-white/[0.06] transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{b.guest?.name || 'Guest'}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-white/10 text-white/60">
                          #{roomNum}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                        {isArrival && <span className="text-emerald-400 font-medium">● Check-in</span>}
                        {isDeparture && <span className="text-rose-400 font-medium">● Check-out</span>}
                        {!isArrival && !isDeparture && <span className="text-blue-400 font-medium">● In-House</span>}
                        <span>• Status: {b.status}</span>
                      </div>
                    </div>

                    {isArrival && b.status !== 'CHECKED_IN' && onQuickCheckIn && (
                      <Button
                        size="sm"
                        onClick={e => {
                          e.stopPropagation()
                          onQuickCheckIn(b.id)
                        }}
                        className="h-7 px-2 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/40 rounded-lg"
                      >
                        Check-in
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. The Monthly Calendar Grid */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-luxury flex-1 flex flex-col">
        {/* Day of Week Header */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-slate-950/40">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="text-center py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/40 border-r border-white/5 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 divide-x divide-y divide-white/5 bg-[#080808]/40 flex-1">
          {monthDays.map(day => {
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = isSameDay(day, selectedDate)
            const isTodayDay = isToday(day)
            const dayKey = format(day, 'yyyy-MM-dd')
            const dayData = bookingsByDateMap.get(dayKey)
            const totalDayBookings = dayData?.all?.length || 0

            // Check if this cell contains a booking for the highlighted room
            const containsHighlightedRoom = highlightedRoomId
              ? dayData?.all.some(b => isRoomInBooking(b, highlightedRoomId))
              : false

            // Occupancy calculation for this day
            const dayOccupancy = totalDayBookings > 0
              ? Math.min(100, Math.round((totalDayBookings / totalRoomsCount) * 100))
              : 0

            return (
              <div
                key={dayKey}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "relative p-2 min-h-[85px] sm:min-h-[100px] flex flex-col justify-between transition-all duration-200 cursor-pointer select-none group",
                  !isCurrentMonth && "bg-white/[0.01] opacity-30",
                  isSelected && "bg-primary/[0.08] ring-2 ring-primary ring-inset z-10",
                  !isSelected && "hover:bg-white/[0.04]",
                  containsHighlightedRoom && "bg-amber-500/10 ring-1 ring-amber-400/50"
                )}
              >
                {/* Day Header Row */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-mono font-bold flex items-center justify-center transition-colors",
                      isTodayDay
                        ? "bg-primary text-black h-5 w-5 rounded-full shadow-md shadow-primary/30"
                        : isSelected
                        ? "text-primary font-black"
                        : "text-white/70 group-hover:text-white"
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  {totalDayBookings > 0 && (
                    <div className="flex items-center gap-1">
                      {/* Occupancy Mini Heat Badge */}
                      <span
                        className={cn(
                          "text-[9px] font-mono px-1 py-0.2 rounded font-semibold",
                          dayOccupancy >= 80
                            ? "bg-rose-500/20 text-rose-300"
                            : dayOccupancy >= 50
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        )}
                      >
                        {dayOccupancy}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Day Micro Bookings Summary */}
                <div className="mt-1.5 space-y-1 overflow-hidden flex-1 flex flex-col justify-end">
                  {dayData && dayData.all.slice(0, 2).map(b => {
                    const isRoomMatch = highlightedRoomId ? isRoomInBooking(b, highlightedRoomId) : false
                    const roomNum = b.roomAssignments?.[0]?.room?.number || 'TBD'

                    return (
                      <div
                        key={b.id}
                        onClick={e => {
                          e.stopPropagation()
                          onSelectDate(day)
                          if (onSelectBooking) onSelectBooking(b)
                        }}
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded truncate font-medium flex items-center justify-between transition-transform hover:scale-[1.02]",
                          isRoomMatch
                            ? "bg-amber-400 text-black font-bold ring-1 ring-amber-300 shadow-md"
                            : b.status === 'CHECKED_IN'
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : b.status === 'CONFIRMED'
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "bg-white/10 text-white/80 border border-white/10"
                        )}
                      >
                        <span className="truncate max-w-[55px]">
                          {b.guest?.name?.split(' ')[0] || 'Guest'}
                        </span>
                        <span className="font-mono text-[8px] opacity-80 shrink-0">
                          #{roomNum}
                        </span>
                      </div>
                    )
                  })}

                  {totalDayBookings > 2 && (
                    <div className="text-[8px] text-white/40 text-center font-bold">
                      +{totalDayBookings - 2} more
                    </div>
                  )}
                </div>

                {/* Bottom Occupancy Progress Bar */}
                {totalDayBookings > 0 && (
                  <div className="w-full bg-white/5 h-0.5 rounded-full mt-1 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        dayOccupancy >= 80 ? "bg-rose-500" : dayOccupancy >= 50 ? "bg-amber-400" : "bg-emerald-400"
                      )}
                      style={{ width: `${dayOccupancy}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
