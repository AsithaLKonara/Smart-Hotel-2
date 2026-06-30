"use client"

import { useState, useEffect, useRef } from 'react'
import {
  X,
  User,
  Phone,
  Mail,
  Search,
  CheckCheck,
  Loader2,
  CalendarDays,
  CreditCard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface Room {
  id: string
  number: string
  status: string
}

interface ExpressCheckInModalProps {
  rooms: Room[]
  onClose: () => void
  onCreateWalkIn: (data: any) => Promise<void>
}

export function ExpressCheckInModal({ rooms, onClose, onCreateWalkIn }: ExpressCheckInModalProps) {
  const [roomQuery, setRoomQuery] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [nights, setNights] = useState('1')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus the first input on mount
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedRoom, guestName, guestPhone, guestEmail, nights])

  const availableRooms = rooms.filter(r => r.status === 'AVAILABLE' && r.number.toLowerCase().includes(roomQuery.toLowerCase()))

  const handleSubmit = async () => {
    if (!selectedRoom) {
      toast.error("Please select an available room")
      return
    }
    if (!guestName) {
      toast.error("Guest name is required")
      return
    }
    
    setIsSubmitting(true)
    try {
      await onCreateWalkIn({
        roomId: selectedRoom.id,
        roomNumber: selectedRoom.number,
        guestName,
        guestPhone,
        guestEmail: guestEmail || `${guestName.toLowerCase().replace(/\s+/g, '.')}@walkin.smarthotel.com`,
        nights: parseInt(nights)
      })
      onClose()
    } catch (err: any) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Accent */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Express Check-in <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-white/50 border border-white/5">Alt+C</span>
            </h2>
            <p className="text-sm text-white/40 mt-1">Walk-in reservation workflow</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Room Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">1. Select Room</label>
            {!selectedRoom ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type room number to search..."
                  value={roomQuery}
                  onChange={(e) => setRoomQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && availableRooms.length > 0) {
                      setSelectedRoom(availableRooms[0])
                    }
                  }}
                />
                
                {roomQuery && (
                  <div className="absolute z-10 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-xl">
                    {availableRooms.length === 0 ? (
                      <div className="p-4 text-sm text-white/40 text-center">No available rooms match</div>
                    ) : (
                      availableRooms.map((room, idx) => (
                        <button
                          key={room.id}
                          onClick={() => setSelectedRoom(room)}
                          className={cn(
                            "w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center justify-between border-b border-white/5 last:border-0",
                            idx === 0 && "bg-white/5"
                          )}
                        >
                          <span className="font-bold text-white">Room {room.number}</span>
                          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Available</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                <div>
                  <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Selected Room</p>
                  <p className="text-white font-bold text-lg">{selectedRoom.number}</p>
                </div>
                <button 
                  onClick={() => { setSelectedRoom(null); setRoomQuery(''); setTimeout(() => inputRef.current?.focus(), 50) }}
                  className="text-xs text-white/50 hover:text-white underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Guest Details */}
          <div className={cn("space-y-4 transition-opacity duration-300", !selectedRoom ? "opacity-30 pointer-events-none" : "opacity-100")}>
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">2. Guest Details</label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="relative col-span-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
                  autoFocus={!!selectedRoom}
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Phone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  placeholder="Email (Optional)"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
                />
              </div>
              
              <div className="relative col-span-2">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <select
                  value={nights}
                  onChange={(e) => setNights(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none"
                >
                  {[1, 2, 3, 4, 5, 7, 10, 14, 21].map(n => (
                    <option key={n} value={n} className="bg-[#1a1a1a]">{n} {n === 1 ? 'Night' : 'Nights'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
          <p className="text-xs text-white/30 font-mono">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 mx-1 border border-white/10">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 mx-1 border border-white/10">Enter</kbd> to submit
          </p>
          <button
            disabled={!selectedRoom || !guestName || isSubmitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 text-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Confirm Walk-in
          </button>
        </div>
      </div>
    </div>
  )
}
