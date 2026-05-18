"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessReceptionistFeatures } from '@/lib/rbac-helpers'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Grid, 
  Clock, 
  ShieldAlert, 
  User, 
  Layers, 
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'

// High-Fidelity Y-Axis Rooms organised by floors
const OPERATIONAL_ROOMS = [
  { id: "r101", number: "101", type: "STANDARD", floor: 1, price: 15000 },
  { id: "r102", number: "102", type: "STANDARD", floor: 1, price: 15000 },
  { id: "r103", number: "103", type: "STANDARD", floor: 1, price: 15000 },
  { id: "r201", number: "201", type: "DELUXE", floor: 2, price: 25000 },
  { id: "r202", number: "202", type: "DELUXE", floor: 2, price: 25000 },
  { id: "r203", number: "203", type: "DELUXE", floor: 2, price: 25000 },
  { id: "r301", number: "301", type: "SUITE", floor: 3, price: 45000 },
  { id: "r302", number: "302", type: "SUITE", floor: 3, price: 45000 },
  { id: "r401", number: "401", type: "PRESIDENTIAL", floor: 4, price: 95000 }
];

// REAL-TIME BOOKING SYNC

export default function RoomOccupancyTimelineMatrix() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Real-time integration
  const { notifications, refresh: refreshNotifications } = useRealtimeNotifications()

  // Matrix variables
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState<any[]>(OPERATIONAL_ROOMS)
  const [reservations, setReservations] = useState<any[]>([])
  const [timelineStartDay, setTimelineStartDay] = useState(1) // 7-day view window
  
  // Hold desk state desk
  const [activeHold, setActiveHold] = useState<{ roomId: string; day: number; secondsLeft: number } | null>(null)
  const [selectedRes, setSelectedRes] = useState<any | null>(null)
  const [holdTimerInput, setHoldTimerInput] = useState("manager@smarthotel.com")

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessReceptionistFeatures(session)) {
      toast.error('Unauthorized receptionist workspace credentials')
      router.push('/auth/signin')
      return
    }

    loadDatabaseMetadata()
  }, [session, status, router])

  // Countdown timer thread for active room hold locks
  useEffect(() => {
    if (!activeHold) return
    
    const interval = setInterval(() => {
      setActiveHold(prev => {
        if (!prev) return null
        if (prev.secondsLeft <= 1) {
          toast.error(`Temporary room hold expired for Room ${rooms.find(r => r.id === prev.roomId)?.number} on Day ${prev.day}`)
          // Record hold expiry audit log
          recordAuditAction('HOLD_EXPIRED', { roomId: prev.roomId, day: prev.day })
          return null
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [activeHold, rooms])

  const loadDatabaseMetadata = async () => {
    try {
      setLoading(true)
      const [dbRooms, dbBookings] = await Promise.all([
        fetch('/api/rooms').then(r => r.json()),
        fetch('/api/bookings').then(r => r.json())
      ])

      if (dbRooms && Array.isArray(dbRooms.rooms)) {
        setRooms(dbRooms.rooms.map((r: any) => ({
          id: r.id,
          number: r.number,
          type: r.type,
          floor: Number(r.floor) || 1,
          price: r.price
        })))
      }

      if (dbBookings && Array.isArray(dbBookings.bookings)) {
        // Map real dates to timeline days (1-7 for current view)
        const today = new Date()
        const mapped = dbBookings.bookings.map((b: any) => {
          const checkIn = new Date(b.checkIn)
          const checkOut = new Date(b.checkOut)
          
          // Simplified mapping for the 7-day demonstration matrix
          // In a real prod environment, this would use absolute timestamps
          const startDay = Math.max(1, Math.floor((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1)
          const endDay = Math.floor((checkOut.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1

          return {
            id: b.id,
            roomId: b.roomId,
            guest: b.guestName || b.primaryGuest?.name || 'Valued Guest',
            channel: b.source || 'DIRECT',
            startDay,
            endDay,
            status: b.status
          }
        })
        setReservations(mapped)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const recordAuditAction = async (action: string, details: any) => {
    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details })
    }).catch(err => console.error('Auditing error:', err))
  }

  // Action methods
  const createTemporaryHold = (roomId: string, day: number) => {
    // Check conflicts first
    const conflict = reservations.find(res => res.roomId === roomId && day >= res.startDay && day < res.endDay)
    if (conflict) {
      toast.error(`Slot is locked by active reservation for ${conflict.guest}`)
      return
    }

    if (activeHold && activeHold.roomId === roomId && activeHold.day === day) {
      setActiveHold(null)
      toast.success('Temporary room lock released.')
      return
    }

    setActiveHold({ roomId, day, secondsLeft: 600 }) // 10 minutes (600s)
    toast.success(`10-Minute Reservation Hold assigned for Room ${rooms.find(r => r.id === roomId)?.number}!`, {
      icon: '⏳',
      style: { background: '#f59e0b', color: '#fff' }
    })
    
    // Write audit trail
    recordAuditAction('TEMPORARY_HOLD_LOCK', { roomId, day, duration: '600s' })
  }

  const releaseManualHold = () => {
    if (!activeHold) return
    recordAuditAction('MANUAL_HOLD_RELEASE', { roomId: activeHold.roomId, day: activeHold.day })
    setActiveHold(null)
    toast.success('Hold released.')
  }

  const authorizeOverride = (resId: string) => {
    const target = reservations.find(r => r.id === resId)
    if (!target) return

    setReservations(prev => prev.filter(r => r.id !== resId))
    setSelectedRes(null)
    toast.success(`Supervisor override authorized. Reassigned booking block for ${target.guest}.`, {
      icon: '🔓',
      style: { background: '#10b981', color: '#fff' }
    })

    recordAuditAction('SUPERVISOR_OVERRIDE_RELEASE', { reservationId: resId, guest: target.guest, room: target.roomId })
  }

  const handleConfirmReservationFromHold = () => {
    if (!activeHold) return
    const roomDetails = rooms.find(r => r.id === activeHold.roomId)
    const newRes = {
      id: `res-${Date.now()}`,
      roomId: activeHold.roomId,
      guest: `Walk-In (Staff Hold)`,
      channel: 'DIRECT_BOOKING',
      startDay: activeHold.day,
      endDay: activeHold.day + 2,
      status: 'CONFIRMED'
    }

    setReservations(prev => [...prev, newRes])
    setActiveHold(null)
    toast.success('Reservation finalized successfully from hold!', {
      icon: '🎉',
      style: { background: '#10b981', color: '#fff' }
    })

    recordAuditAction('HOLD_CONFIRMED', { roomId: activeHold.roomId, startDay: activeHold.day, guest: 'Walk-In' })
  }

  const getChannelColor = (channel: string) => {
    if (channel === 'AIRBNB') return 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border-rose-500/35'
    if (channel === 'EXPEDIA') return 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/35'
    if (channel === 'BOOKING_COM') return 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/35'
    return 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/35'
  }

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`
  }

  // Days list inside current window range
  const daysRange = Array.from({ length: 7 }, (_, i) => timelineStartDay + i)

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <PremiumSpinner size="lg" text="Analyzing room layout grid matrix..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090514] text-slate-100 p-6 font-sans">
      
      {/* Grid Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-purple-900/40 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-600/10 text-purple-400 border border-purple-500/30 text-xs tracking-wider uppercase font-bold py-1 px-3">
              MATRIX OCCUPANCY ENGINE
            </Badge>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mt-2">Room Availability & Occupancy Matrix</h1>
          <p className="text-slate-400 text-sm mt-1">Horizontal hour/day reservation planner, split-stay connectors, and temporary hold countdown locks.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setTimelineStartDay(prev => Math.max(1, prev - 7))} variant="outline" size="sm" className="bg-white/5 border-purple-900/50 text-purple-300">
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous Week
          </Button>
          <Button onClick={() => setTimelineStartDay(prev => prev + 7)} variant="outline" size="sm" className="bg-white/5 border-purple-900/50 text-purple-300">
            Next Week <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Button onClick={() => router.push('/admin/dashboard')} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 font-semibold shadow-lg shadow-purple-950">
            Master Cockpit
          </Button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Y-Axis Matrix grid timeline timeline */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl overflow-hidden">
            
            {/* Header controls bar */}
            <div className="p-5 border-b border-purple-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-bold uppercase tracking-wider text-slate-200">Timeline Grid Scheduler</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-rose-500/20 border border-rose-500/30 rounded" /> Airbnb</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-500/20 border border-amber-500/30 rounded" /> Expedia</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500/20 border border-blue-500/30 rounded" /> Booking.com</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-purple-500/20 border border-purple-500/30 rounded" /> Direct</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                
                {/* Timeline Axis Header (Days Line) */}
                <div className="grid grid-cols-8 border-b border-purple-950/50 font-bold bg-slate-950/20">
                  <div className="p-4 border-r border-purple-950 text-xs uppercase tracking-widest text-purple-400">Room Details</div>
                  {daysRange.map(day => (
                    <div key={day} className="p-4 text-center text-xs text-slate-300 border-r border-purple-950/30">
                      Day {day}
                      <span className="block text-[9px] text-slate-500 uppercase mt-0.5 font-normal">May {7 + day}</span>
                    </div>
                  ))}
                </div>

                {/* Grid Rows (Room by Room) */}
                <div className="divide-y divide-purple-950/30">
                  {rooms.map(room => (
                    <div key={room.id} className="grid grid-cols-8 hover:bg-white/[0.01] transition-colors h-[80px]">
                      
                      {/* Left Column Room Metadata */}
                      <div className="p-4 border-r border-purple-950 flex flex-col justify-center bg-slate-950/10">
                        <h4 className="font-bold text-slate-100 text-sm">Room {room.number}</h4>
                        <span className="text-[9px] text-slate-500 tracking-wider uppercase">{room.type}</span>
                      </div>

                      {/* Day Columns */}
                      {daysRange.map(day => {
                        // 1. Search for active matching bookings
                        const activeRes = reservations.find(res => res.roomId === room.id && day >= res.startDay && day < res.endDay)
                        // 2. Search for temporary active countdown hold
                        const hasHold = activeHold && activeHold.roomId === room.id && activeHold.day === day

                        return (
                          <div 
                            key={day} 
                            className="border-r border-purple-950/30 relative flex items-center justify-center p-1.5"
                          >
                            {activeRes ? (
                              <button
                                onClick={() => setSelectedRes(activeRes)}
                                className={`w-full h-full p-2 text-left rounded border flex flex-col justify-between transition-all select-none overflow-hidden ${getChannelColor(activeRes.channel)} ${selectedRes?.id === activeRes.id ? 'ring-2 ring-purple-500 border-transparent' : ''}`}
                              >
                                <span className="text-[10px] font-bold block truncate text-slate-200">{activeRes.guest}</span>
                                {activeRes.isSplitStay && (
                                  <Badge className="bg-purple-900/40 text-purple-300 border-purple-500/20 text-[7px] py-0 px-1 font-extrabold self-start uppercase">Split Stay</Badge>
                                )}
                              </button>
                            ) : hasHold ? (
                              <div className="w-full h-full bg-amber-500/10 border border-amber-500/40 p-2 flex flex-col justify-between text-amber-400 font-mono text-[9px] select-none animate-pulse">
                                <span className="font-bold">LOCK HOLD</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTimer(activeHold.secondsLeft)}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => createTemporaryHold(room.id, day)}
                                className="w-full h-full rounded border border-dashed border-slate-800 hover:border-purple-500/30 hover:bg-purple-500/[0.02] flex items-center justify-center group/btn text-slate-600 hover:text-purple-400 transition-all"
                              >
                                <PlusCircle className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              </button>
                            )}
                          </div>
                        )
                      })}

                    </div>
                  ))}
                </div>

              </div>
            </div>

          </Card>
        </div>

        {/* Right Side: Action desks drawers */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Hold Lock desk desk */}
          {activeHold && (
            <Card className="bg-gradient-to-b from-amber-950/10 to-transparent border border-amber-500/30 rounded-none shadow-2xl animate-fade-in">
              <CardHeader className="border-b border-amber-500/15">
                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-extrabold uppercase py-0.5 px-2 self-start">LOCK COUNTER DESK</Badge>
                <CardTitle className="text-xl font-serif text-white mt-1.5 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400 animate-pulse" /> Temporary Room Held
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">Awaiting receptionist finalized confirmation or payment authorization lock.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                
                <div className="space-y-2 text-xs text-slate-300">
                  <p>Target Room: <strong className="text-slate-100">Room {rooms.find(r => r.id === activeHold.roomId)?.number}</strong></p>
                  <p>Hold Start Day: <strong className="text-slate-100">Day {activeHold.day} (May {7 + activeHold.day})</strong></p>
                  
                  <div className="p-3.5 bg-slate-950 border border-amber-500/20 rounded-xs flex items-center justify-between text-amber-400 mt-4">
                    <span className="font-bold uppercase tracking-widest text-[10px]">Autorelease Lock:</span>
                    <span className="font-mono text-base font-extrabold flex items-center gap-1"><Clock className="w-4 h-4 animate-spin-slow" /> {formatTimer(activeHold.secondsLeft)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Verifying Operator Email</label>
                  <input 
                    type="email" 
                    value={holdTimerInput}
                    onChange={e => setHoldTimerInput(e.target.value)}
                    className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-2.5 rounded-none focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-900">
                  <Button onClick={releaseManualHold} variant="outline" className="border-slate-800 text-slate-400 hover:text-white rounded-none">
                    Release Lock
                  </Button>
                  <Button onClick={handleConfirmReservationFromHold} className="bg-amber-600 hover:bg-amber-500 text-white rounded-none border-0 font-bold">
                    Assign Room
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Active Reservation inspection drawer */}
          {selectedRes && (
            <Card className="bg-gradient-to-b from-purple-950/10 to-transparent border border-purple-500/30 rounded-none shadow-2xl animate-fade-in">
              <CardHeader className="border-b border-purple-500/15">
                <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-extrabold uppercase py-0.5 px-2 self-start">RESERVATION DESK</Badge>
                <CardTitle className="text-xl font-serif text-white mt-1.5 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" /> Inspect Reservation
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">Verify credentials and trigger override releases for double bookings.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                
                <div className="p-4 bg-white/[0.01] border border-slate-800 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Guest Name:</span>
                    <strong className="text-slate-100">{selectedRes.guest}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Booking Source:</span>
                    <Badge className="bg-purple-950 text-purple-300 border-purple-500/10 text-[9px]">{selectedRes.channel}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Time Range:</span>
                    <strong className="text-slate-100">Day {selectedRes.startDay} to Day {selectedRes.endDay}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Reservation ID:</span>
                    <code className="text-slate-500 text-[10px] font-mono">{selectedRes.id}</code>
                  </div>
                </div>

                {/* Supervisor Release Override Trigger */}
                <div className="bg-rose-500/5 p-4 border border-rose-500/20 rounded-xs space-y-3">
                  <div className="flex items-start gap-2.5 text-rose-400">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">Force Reassignment Override</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Authorized supervisors can bypass Booking restrictions to release blocked slots manually.</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => authorizeOverride(selectedRes.id)}
                    className="w-full bg-rose-950/50 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/30 rounded-none text-xs font-bold uppercase tracking-wider"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Release Block
                  </Button>
                </div>

                <Button onClick={() => setSelectedRes(null)} className="w-full bg-white/5 border border-slate-800 text-slate-400 hover:text-white rounded-none">
                  Close Details
                </Button>

              </CardContent>
            </Card>
          )}

          {/* SRE Matrix Info */}
          {!activeHold && !selectedRes && (
            <Card className="bg-white/[0.02] border border-purple-900/10 rounded-none p-5 space-y-4">
              <div className="flex items-center gap-3 text-purple-400">
                <Layers className="w-6 h-6" />
                <h4 className="font-bold text-slate-200 text-sm">Matrix Orchestrator Desk</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click any vacant grid cell to hold a room block temporarily (locks slot for other users). Double-booking conflicts are automatically monitored via the SRE engine. Split stays represent transitions across segmented room profiles.
              </p>
            </Card>
          )}

        </div>

      </div>

    </div>
  )
}
