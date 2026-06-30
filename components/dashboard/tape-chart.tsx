"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { format, addDays, startOfDay, differenceInDays, parseISO, isSameDay } from 'date-fns'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

interface TapeChartProps {
  initialStartDate?: Date
  daysToShow?: number
}

const CELL_WIDTH = 100
const ROW_HEIGHT = 60

export default function TapeChart({ initialStartDate = new Date(), daysToShow = 14 }: TapeChartProps) {
  const [startDate, setStartDate] = useState(startOfDay(initialStartDate))
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [draggedAssignment, setDraggedAssignment] = useState<any>(null)
  
  const endDate = addDays(startDate, daysToShow - 1)

  const dateHeaders = useMemo(() => {
    const dates = []
    for (let i = 0; i < daysToShow; i++) {
      dates.push(addDays(startDate, i))
    }
    return dates
  }, [startDate, daysToShow])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tape-chart?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      if (!res.ok) throw new Error('Failed to fetch tape chart data')
      const data = await res.json()
      setRooms(data.rooms)
      setAssignments(data.assignments)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [startDate])

  const handleDragStart = (e: React.DragEvent, assignment: any) => {
    setDraggedAssignment(assignment)
    e.dataTransfer.effectAllowed = 'move'
    // Optional: set drag image
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetRoomId: string, targetDate: Date) => {
    e.preventDefault()
    if (!draggedAssignment) return

    // Calculate new start and end dates based on drop target
    // We keep the same duration for the booking
    const duration = differenceInDays(parseISO(draggedAssignment.endDate), parseISO(draggedAssignment.startDate))
    const newStartDate = targetDate
    const newEndDate = addDays(newStartDate, duration)

    // Optimistic UI update
    const previousAssignments = [...assignments]
    const updatedAssignments = assignments.map(a => 
      a.id === draggedAssignment.id 
        ? { ...a, roomId: targetRoomId, startDate: newStartDate.toISOString(), endDate: newEndDate.toISOString() }
        : a
    )
    setAssignments(updatedAssignments)
    setDraggedAssignment(null)

    try {
      const res = await fetch(`/api/tape-chart/assignment/${draggedAssignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: targetRoomId,
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString()
        })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update assignment')
      }
      toast.success('Room assignment updated')
    } catch (error: any) {
      toast.error(error.message)
      // Revert optimistic update
      setAssignments(previousAssignments)
    }
  }

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PremiumSpinner size="lg" text="Loading Tape Chart Data..." />
      </div>
    )
  }

  // Group rooms by floor or type (for now simple list sorted by floor and number)
  return (
    <div className="w-full bg-[#0a0a0a] border border-purple-900/30 overflow-hidden relative shadow-2xl flex flex-col font-sans">
      
      {/* Tape Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-900/30 bg-[#0f0f15]">
        <h2 className="text-white font-bold text-lg">Room Assignment Gantt</h2>
        <div className="flex gap-2">
          <button 
            className="px-3 py-1 bg-white/5 border border-purple-900/30 text-purple-300 rounded text-sm hover:bg-white/10"
            onClick={() => setStartDate(addDays(startDate, -7))}
          >
            &larr; Prev 7 Days
          </button>
          <button 
            className="px-3 py-1 bg-white/5 border border-purple-900/30 text-purple-300 rounded text-sm hover:bg-white/10"
            onClick={() => setStartDate(addDays(startDate, 7))}
          >
            Next 7 Days &rarr;
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex w-full overflow-x-auto relative">
        
        {/* Y-Axis: Rooms (Sticky left) */}
        <div className="w-48 flex-shrink-0 border-r border-purple-900/30 bg-[#0f0f15] z-20 sticky left-0">
          <div className="h-12 border-b border-purple-900/30 flex items-center px-4">
            <span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Rooms</span>
          </div>
          {rooms.map(room => (
            <div key={room.id} className="border-b border-purple-900/10 px-4 flex flex-col justify-center" style={{ height: ROW_HEIGHT }}>
              <span className="text-white font-bold text-sm">Room {room.number}</span>
              <span className="text-xs text-slate-500">{room.roomType?.name}</span>
            </div>
          ))}
        </div>

        {/* X-Axis and Grid */}
        <div className="flex flex-col flex-1 relative min-w-max">
          
          {/* Header row: Dates */}
          <div className="flex h-12 border-b border-purple-900/30 bg-[#0f0f15]">
            {dateHeaders.map((date, idx) => (
              <div 
                key={idx} 
                className="border-r border-purple-900/30 flex flex-col items-center justify-center"
                style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }}
              >
                <span className="text-[10px] text-slate-500 uppercase">{format(date, 'EEE')}</span>
                <span className="text-white font-bold text-sm">{format(date, 'dd MMM')}</span>
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="relative bg-[#050505]">
            {rooms.map(room => (
              <div key={room.id} className="flex border-b border-purple-900/10 hover:bg-white/[0.02]" style={{ height: ROW_HEIGHT }}>
                {dateHeaders.map((date, idx) => (
                  <div
                    key={idx}
                    className="border-r border-purple-900/10"
                    style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, room.id, date)}
                  />
                ))}
              </div>
            ))}

            {/* Absolute positioned Bookings/Assignments */}
            {assignments.map(assignment => {
              const start = parseISO(assignment.startDate)
              const end = parseISO(assignment.endDate)
              
              // Only render if it overlaps our viewport
              if (end < startDate || start > endDate) return null

              const roomIndex = rooms.findIndex(r => r.id === assignment.roomId)
              if (roomIndex === -1) return null

              // Calculate left position and width based on date difference
              let leftOffsetDays = differenceInDays(start, startDate)
              let durationDays = differenceInDays(end, start)

              // Clip to viewable area for rendering logic if needed, but absolute positioning lets it flow outside if parent has overflow hidden
              const left = leftOffsetDays * CELL_WIDTH
              const width = durationDays * CELL_WIDTH

              const top = roomIndex * ROW_HEIGHT + 6 // +6 for padding
              const height = ROW_HEIGHT - 12

              return (
                <div
                  key={assignment.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, assignment)}
                  className="absolute bg-purple-600/20 border border-purple-500 rounded shadow-md flex items-center px-2 cursor-move hover:bg-purple-600/30 hover:border-purple-400 transition-colors z-10 overflow-hidden"
                  style={{
                    top,
                    left,
                    width,
                    height,
                  }}
                >
                  <div className="flex flex-col select-none">
                    <span className="text-white text-xs font-bold truncate">
                      {assignment.booking?.guest?.name || 'Guest'}
                    </span>
                    <span className="text-slate-300 text-[10px] truncate">
                      {assignment.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
