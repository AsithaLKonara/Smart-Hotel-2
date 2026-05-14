"use client"

import { useState } from 'react'
import { 
  SlidersHorizontal, 
  ClipboardList, 
  Sparkles, 
  CheckCircle2, 
  LogOut, 
  X, 
  User, 
  Phone, 
  MessageSquare,
  Zap,
  CalendarDays,
  CalendarCheck,
  History,
  ArrowRightCircle,
  Clock as TimeIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Room {
  id: string
  number: string
  status: string
  vip?: boolean
}

interface Booking {
  id: string
  checkIn: string
  checkOut: string
  status: string
  user?: {
    name: string
    email: string
  }
}

interface RoomActionDeskProps {
  room: Room
  isVip: boolean
  onToggleVip: (val: boolean) => void
  notes: string
  onNotesChange: (val: string) => void
  onUpdateMetadata: () => void
  onStatusTransition: (roomNumber: string, status: string) => void
  onCheckIn: (roomNumber: string) => void
  onCheckOut: (roomNumber: string) => void
  onCreateBooking: (data: any) => Promise<void>
  roomBookings?: Booking[]
  onClose: () => void
}

export function RoomActionDesk({
  room,
  isVip,
  onToggleVip,
  notes,
  onNotesChange,
  onUpdateMetadata,
  onStatusTransition,
  onCheckIn,
  onCheckOut,
  onCreateBooking,
  roomBookings = [],
  onClose
}: RoomActionDeskProps) {
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [contact, setContact] = useState('')
  const [nights, setNights] = useState('1')
  const [isCreating, setIsCreating] = useState(false)

  const handleQuickReserve = async () => {
    if (!guestName) return
    setIsCreating(true)
    try {
      await onCreateBooking({
        guestName,
        guestEmail: guestEmail || `${guestName.toLowerCase().replace(/\s+/g, '.')}.${Date.now().toString().slice(-4)}@walkin.smarthotel.com`,
        guestPhone: contact,
        nights: parseInt(nights),
        roomId: room.id,
        roomNumber: room.number
      })
      setGuestName('')
      setGuestEmail('')
      setContact('')
    } finally {
      setIsCreating(false)
    }
  }

  const currentBooking = roomBookings.find(b => b.status === 'CHECKED_IN')
  const upcomingBookings = roomBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING')
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())

  return (
    <Card className="bg-[#0c0c0c]/90 border-white/10 backdrop-blur-3xl shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] overflow-hidden rounded-[48px] border-t-white/20">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      
      <CardHeader className="border-b border-white/5 bg-white/[0.03] p-8 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-[0.2em] font-black px-4 py-1.5 rounded-full">
                Operational Command Desk
              </Badge>
              {room.status === 'AVAILABLE' && (
                <div className="flex items-center gap-2 text-emerald-500">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Inventory Live</span>
                </div>
              )}
            </div>
            <CardTitle className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
              Suite <span className="text-primary">{room.number}</span> <span className="text-white/20">/</span> Control Center
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="self-end md:self-auto text-white/40 hover:text-white hover:bg-white/10 rounded-3xl h-16 w-16 p-0 transition-all border border-white/5"
          >
            <X className="w-8 h-8" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-8 md:p-12 lg:p-16 grid grid-cols-1 xl:grid-cols-2 gap-16 overflow-y-auto max-h-[70vh]">
        {/* Left Column: Lifecycle & Quick Reserve */}
        <div className="space-y-12">
          
          {/* Current Status Section */}
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-primary" /> Lifecycle State Control
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Set Available", status: "AVAILABLE", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" },
                { name: "Set Occupied", status: "OCCUPIED", class: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20" },
                { name: "Set Cleaning", status: "CLEANING", class: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20" },
                { name: "Set Maintenance", status: "MAINTENANCE", class: "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20" }
              ].map(stBtn => (
                <Button 
                  key={stBtn.status}
                  variant="outline"
                  onClick={() => onStatusTransition(room.number, stBtn.status)}
                  className={cn(
                    "text-[11px] h-12 rounded-2xl font-bold uppercase tracking-wider transition-all",
                    stBtn.class,
                    room.status === stBtn.status ? "ring-2 ring-white/20 opacity-100 shadow-lg" : "opacity-70"
                  )}
                >
                  {stBtn.name}
                </Button>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
              {room.status === "AVAILABLE" && (
                <Button 
                  onClick={() => onCheckIn(room.number)} 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl h-16 text-sm shadow-xl shadow-emerald-900/20"
                >
                  Instant Walk-in Check-In 🔑
                </Button>
              )}
              {(room.status === "OCCUPIED" || room.status === "CHECKOUT_PENDING") && (
                <Button 
                  onClick={() => onCheckOut(room.number)} 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl h-16 text-sm shadow-xl shadow-primary/20"
                >
                  Check-Out & Settlement 🧾
                </Button>
              )}
            </div>
          </div>

          {/* Quick Reserve Section (Only for Available Rooms) */}
          {room.status === 'AVAILABLE' && (
            <div className="space-y-6 bg-white/[0.03] p-8 rounded-[32px] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap className="w-20 h-20 text-primary" />
              </div>
              
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-primary flex items-center gap-2.5">
                <Zap className="w-4 h-4" /> Instant Walk-in / Call-in
              </h4>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="text" 
                      placeholder="Guest Name"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 h-12 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="email" 
                      placeholder="Guest Email (Optional)"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 h-12 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="text" 
                      placeholder="Contact / WhatsApp"
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 h-12 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <select 
                      value={nights}
                      onChange={e => setNights(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 h-12 pl-12 pr-4 rounded-2xl text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none appearance-none transition-all"
                    >
                      {[1,2,3,4,5,7,10,14].map(n => <option key={n} value={n} className="bg-slate-900">{n} Night{n>1?'s':''}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-end">
                  <Button 
                    disabled={!guestName || isCreating}
                    onClick={handleQuickReserve}
                    className="w-full md:w-auto h-12 px-12 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-primary/20"
                  >
                    {isCreating ? 'Creating...' : 'Create Direct Booking'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: CRM & intelligence */}
        <div className="space-y-12 xl:border-l xl:border-white/5 xl:pl-12">
          
          {/* Reservation Intel */}
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 flex items-center gap-2.5">
              <CalendarCheck className="w-4 h-4 text-primary" /> Reservation Intelligence
            </h4>
            
            <div className="space-y-3">
              {currentBooking ? (
                <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Active Resident</p>
                      <p className="text-sm font-bold text-white mt-0.5">{currentBooking.user?.name}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase text-[9px]">In House</Badge>
                </div>
              ) : (
                <div className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-4 text-white/20">
                  <User className="w-6 h-6" />
                  <p className="text-[11px] font-bold uppercase tracking-widest italic">No Active Resident</p>
                </div>
              )}

              <div className="space-y-2 mt-4">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Upcoming Arrivals</p>
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.slice(0, 3).map(booking => (
                    <div key={booking.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.05] transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-primary transition-colors">
                          <TimeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-white/80">{booking.user?.name}</p>
                          <p className="text-[9px] text-white/30">{format(new Date(booking.checkIn), 'MMM dd')} - {format(new Date(booking.checkOut), 'MMM dd')}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        onClick={() => onCheckIn(room.number)}
                        className="h-8 w-8 p-0 rounded-lg text-primary hover:bg-primary/10"
                      >
                        <ArrowRightCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-white/5 flex items-center justify-center">
                    <p className="text-[10px] text-white/20 font-medium uppercase tracking-widest">No pending arrivals</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CRM Intelligence */}
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 flex items-center gap-2.5">
              <ClipboardList className="w-4 h-4 text-primary" /> Guest Intelligence Memo
            </h4>
            
            <div className="space-y-6">
              <button 
                onClick={() => onToggleVip(!isVip)}
                className={cn(
                  "w-full flex items-center gap-4 p-5 rounded-3xl border transition-all text-left group",
                  isVip ? "bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-950/20" : "bg-white/5 border-white/5 hover:border-white/10"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                  isVip ? "bg-amber-500 text-black shadow-xl" : "bg-white/5 text-white/40"
                )}>
                  <Sparkles className={cn("w-6 h-6", isVip && "animate-pulse")} />
                </div>
                <div>
                  <p className={cn("text-sm font-bold uppercase tracking-widest", isVip ? "text-amber-400" : "text-white/60")}>
                    VIP Guest Status
                  </p>
                  <p className="text-[10px] text-white/30 mt-0.5 font-medium uppercase tracking-wider">Prioritize room services and perks</p>
                </div>
              </button>

              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">Active Preferences & Alerts</label>
                  <Badge variant="outline" className="text-[8px] border-white/10 text-white/30 uppercase tracking-tighter px-1.5">Auto-Saving</Badge>
                </div>
                <textarea 
                  value={notes}
                  onChange={e => onNotesChange(e.target.value)}
                  placeholder="Enter specific guest preferences, dietary alerts, or special housekeeping requests..."
                  className="w-full h-32 bg-white/[0.03] border border-white/10 text-sm text-white p-6 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-[32px] placeholder-white/10 resize-none transition-all leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <Button variant="outline" className="h-14 rounded-2xl border-white/5 bg-white/5 text-white/40 hover:text-white">
                    <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp Guest
                 </Button>
                 <Button 
                  onClick={onUpdateMetadata} 
                  className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-white/10"
                >
                  Sync Intel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
