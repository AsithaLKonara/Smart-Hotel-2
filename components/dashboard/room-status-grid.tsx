"use client"

import { Sparkles, Search, SlidersHorizontal, Info, CheckCircle2, XCircle, Clock, Hammer, Ban, Filter, ChevronRight, UserCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Room {
  id: string
  number: string
  type: string
  floor: number
  status: string
  price: number
  vip?: boolean
  guestName?: string
}

interface RoomStatusGridProps {
  rooms: Room[]
  selectedRoomNumber?: string
  onSelectRoom: (room: Room) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
}

const STATUS_CONFIG: Record<string, { label: string, color: string, badge: string, icon: any }> = {
  AVAILABLE: { label: "Available", color: "bg-emerald-950/20 border-emerald-500/30", badge: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", icon: CheckCircle2 },
  OCCUPIED: { label: "Occupied", color: "bg-rose-950/40 border-rose-500/30", badge: "text-rose-400 border-rose-500/20 bg-rose-500/10", icon: UserCheck },
  DIRTY: { label: "Dirty", color: "bg-amber-950/40 border-amber-500/30", badge: "text-amber-400 border-amber-500/20 bg-amber-500/10", icon: Clock },
  INSPECTED: { label: "Inspected", color: "bg-blue-950/40 border-blue-500/30", badge: "text-blue-400 border-blue-500/20 bg-blue-500/10", icon: CheckCircle2 },
  MAINTENANCE: { label: "Maintenance", color: "bg-slate-900/60 border-slate-700/40", badge: "text-slate-400 border-slate-700/20 bg-slate-700/10", icon: Hammer },
  BLOCKED: { label: "Blocked", color: "bg-black/60 border-white/10", badge: "text-white/40 border-white/10 bg-white/5", icon: Ban },
}

export function RoomStatusGrid({
  rooms,
  selectedRoomNumber,
  onSelectRoom,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}: RoomStatusGridProps) {
  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.number.includes(searchQuery) || r.type.toLowerCase().includes(searchQuery.toLowerCase()) || (r.guestName?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Group rooms by floor
  const roomsByFloor = filteredRooms.reduce((acc, room) => {
    if (!acc[room.floor]) acc[room.floor] = []
    acc[room.floor].push(room)
    return acc
  }, {} as Record<number, Room[]>)

  const floors = Object.keys(roomsByFloor).map(Number).sort((a, b) => b - a)

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader className="px-0 pb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-serif text-white">Inventory Matrix 2.0</CardTitle>
              <CardDescription className="text-white/40 text-xs mt-1">Operational floor-map & state intelligence</CardDescription>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search Room, Type or Guest..." 
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="bg-white/5 border border-white/10 text-xs text-white rounded-2xl pl-12 pr-4 py-4 w-full focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder-white/20 transition-all shadow-inner-light"
              />
            </div>
            
            <div className="flex items-center gap-1 bg-black/40 p-1.5 border border-white/10 rounded-2xl">
              <div className="px-3 text-[10px] font-black text-white/20 uppercase tracking-widest hidden md:block">Filter</div>
              <div className="flex items-center gap-1">
                {["ALL", "AVAILABLE", "OCCUPIED", "DIRTY", "MAINTENANCE"].map(st => (
                  <button 
                    key={st}
                    onClick={() => onStatusFilterChange(st)}
                    className={cn(
                      "text-[9px] uppercase tracking-[0.1em] font-black px-3 py-2.5 rounded-xl transition-all whitespace-nowrap",
                      statusFilter === st ? 'bg-primary text-white shadow-lg' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                    )}
                  >
                    {st === "ALL" ? "View All" : st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-0 pt-0 space-y-12">
        {floors.map(floor => (
          <div key={floor} className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em] whitespace-nowrap">Floor {floor}</h2>
              <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <AnimatePresence mode="popLayout">
                {roomsByFloor[floor].map((room, idx) => {
                  const config = STATUS_CONFIG[room.status] || STATUS_CONFIG.AVAILABLE
                  const isSelected = selectedRoomNumber === room.number
                  const StatusIcon = config.icon

                  return (
                    <motion.div
                      key={room.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: idx * 0.01 }}
                      onClick={() => onSelectRoom(room)}
                      className={cn(
                        "group relative p-5 border cursor-pointer transition-all duration-300 flex flex-col justify-between h-[150px] rounded-[32px]",
                        config.color,
                        isSelected ? 'ring-2 ring-primary border-transparent' : 'hover:border-white/20 hover:bg-white/[0.08]'
                      )}
                    >
                      {/* Interaction Overlay (Quick Actions) */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 flex items-center justify-center gap-2 bg-black/40 backdrop-blur-[2px] rounded-[32px] z-20">
                        <button className="p-2.5 rounded-full bg-white/10 hover:bg-primary transition-colors pointer-events-auto shadow-lg" title="Inspect Room">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </button>
                        <button className="p-2.5 rounded-full bg-white/10 hover:bg-amber-500 transition-colors pointer-events-auto shadow-lg" title="Assign Cleaning">
                          <Clock className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-2xl font-serif font-bold text-white tracking-tight leading-none">
                              {room.number}
                            </h3>
                            <p className="text-white/40 text-[9px] uppercase tracking-widest font-black mt-2">{room.type}</p>
                          </div>
                          {room.vip && (
                            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400/20" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative z-10 flex flex-col gap-2">
                        {room.guestName && (
                          <p className="text-[10px] text-white/60 font-medium truncate">
                            {room.guestName}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg", config.badge)}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-wider">{config.label}</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
