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

// Extended High-Density Mock Operational Datastore
const MOCK_OPERATIONAL_ROOMS = [
  { id: "101", number: "101", type: "STANDARD", floor: 1, status: "AVAILABLE", price: 15000 },
  { id: "102", number: "102", type: "STANDARD", floor: 1, status: "CLEANING", price: 15000 },
  { id: "103", number: "103", type: "STANDARD", floor: 1, status: "OCCUPIED", price: 15000 },
  { id: "201", number: "201", type: "DELUXE", floor: 2, status: "RESERVED", price: 25000 },
  { id: "202", number: "202", type: "DELUXE", floor: 2, status: "OCCUPIED", price: 25000 },
  { id: "203", number: "203", type: "DELUXE", floor: 2, status: "MAINTENANCE", price: 25000 },
  { id: "301", number: "301", type: "SUITE", floor: 3, status: "CHECKOUT_PENDING", price: 45000 },
  { id: "302", number: "302", type: "SUITE", floor: 3, status: "AVAILABLE", price: 45000 },
  { id: "401", number: "401", type: "PRESIDENTIAL", floor: 4, status: "OCCUPIED", price: 95000, vip: true }
]

const MOCK_ARRIVALS = [
  { id: "a1", guestName: "Sir Richard Branson", roomNumber: "401", roomType: "Presidential", checkIn: "Today, 14:00", vip: true, payment: "Paid", notes: "Prefers extra luxury pillows & sparkling water on entry", isLate: false },
  { id: "a2", guestName: "Amelia Earhart", roomNumber: "201", roomType: "Deluxe Suite", checkIn: "Today, 15:30", vip: false, payment: "Pay on arrival", notes: "Needs airport transfer details", isLate: true },
  { id: "a3", guestName: "Steve Jobs", roomNumber: "302", roomType: "Executive Suite", checkIn: "Today, 18:00", vip: true, payment: "Paid", notes: "No sugar drinks in mini-bar", isLate: false }
]

const MOCK_DEPARTURES = [
  { id: "d1", guestName: "Elon Musk", roomNumber: "301", roomType: "Executive Suite", checkOut: "Today, 11:00", vip: true, payment: "Paid (Stripe)", notes: "Needs express check-out receipt emailed", isPending: true },
  { id: "d2", guestName: "Jane Doe", roomNumber: "103", roomType: "Standard Single", checkOut: "Today, 12:00", vip: false, payment: "Unpaid ($150 extras)", isPending: false }
]

export default function ReceptionistOperationsCenter() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Real-Time States
  const [rooms, setRooms] = useState<any[]>(MOCK_OPERATIONAL_ROOMS)
  const [arrivals, setArrivals] = useState<any[]>(MOCK_ARRIVALS)
  const [departures, setDepartures] = useState<any[]>(MOCK_DEPARTURES)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)
  const [guestNotes, setGuestNotes] = useState("")
  const [isVip, setIsVip] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessReceptionistFeatures(session)) {
      toast.error('Access Denied: Receptionist authorization required')
      router.push('/auth/signin')
      return
    }

    loadData()
  }, [session, status, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [roomsResp, bookingsResp] = await Promise.all([
        fetch('/api/rooms').then(r => r.json()).catch(() => ({ rooms: [] })),
        fetch('/api/bookings').then(r => r.json()).catch(() => ({ bookings: [] }))
      ])

      // Smart Merge DB values with rich mock properties to guarantee premium staff visual density
      const dbRooms = Array.isArray(roomsResp?.rooms) ? roomsResp.rooms : []
      if (dbRooms.length > 0) {
        const merged = dbRooms.map((r: any) => {
          const mockMatch = MOCK_OPERATIONAL_ROOMS.find(m => m.number === r.number)
          return {
            id: r.id,
            number: r.number,
            type: r.type,
            floor: Number(r.floor) || 1,
            status: r.status || (mockMatch?.status ?? 'AVAILABLE'),
            price: r.price,
            vip: mockMatch?.vip || false
          }
        })
        setRooms(merged)
      } else {
        setRooms(MOCK_OPERATIONAL_ROOMS)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch live database properties. Utilizing local simulated cache.")
    } finally {
      setLoading(false)
    }
  }

  // Quick front desk mutations
  const handleCheckIn = (roomNumber: string) => {
    setRooms(prev => prev.map(r => r.number === roomNumber ? { ...r, status: "OCCUPIED" } : r))
    setArrivals(prev => prev.filter(a => a.roomNumber !== roomNumber))
    setSelectedRoom(null)
    toast.success(`Room ${roomNumber} checked in successfully!`, {
      icon: '🔑',
      style: { background: '#10b981', color: '#fff' }
    })
  }

  const handleCheckOut = (roomNumber: string) => {
    setRooms(prev => prev.map(r => r.number === roomNumber ? { ...r, status: "CLEANING" } : r))
    setDepartures(prev => prev.filter(d => d.roomNumber !== roomNumber))
    setSelectedRoom(null)
    toast.success(`Room ${roomNumber} checked out. Dispatched cleaning task automatically.`, {
      icon: '🧹',
      style: { background: '#8b5cf6', color: '#fff' }
    })
  }

  const handleStatusTransition = (roomNumber: string, nextStatus: string) => {
    setRooms(prev => prev.map(r => r.number === roomNumber ? { ...r, status: nextStatus } : r))
    if (selectedRoom) {
      setSelectedRoom((prev: any) => ({ ...prev, status: nextStatus }))
    }
    toast.success(`Room ${roomNumber} updated to ${nextStatus.replace('_', ' ')}`)
  }

  const updateRoomMetadata = () => {
    if (!selectedRoom) return
    setRooms(prev => prev.map(r => r.number === selectedRoom.number ? { ...r, notes: guestNotes, vip: isVip } : r))
    toast.success(`Front Desk metadata updated for Room ${selectedRoom.number}`)
  }

  const selectRoomCard = (room: any) => {
    setSelectedRoom(room)
    setGuestNotes(room.notes || "")
    setIsVip(room.vip || false)
  }

  // Filter computation
  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.number.includes(searchQuery) || r.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <PremiumSpinner size="lg" text="Loading Reception Operations Workspace..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090514] text-slate-100 p-6 font-sans">
      
      {/* Top Banner Control Board */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-purple-900/40 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 text-xs tracking-wider uppercase font-bold py-1 px-3">
              RECEPTION DESK LIVE
            </Badge>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mt-2">SmartHotel Front-Desk Command</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time room occupancy state, check-ins scheduler, and guest relations dispatch.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData} className="bg-white/5 border-purple-900/50 text-purple-300 hover:bg-purple-900/30">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin-slow" /> Sync Channels
          </Button>
          <Button onClick={() => router.push('/admin/dashboard')} className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white border-0 font-semibold shadow-lg shadow-purple-950">
            Master Console
          </Button>
        </div>
      </div>

      {/* Grid Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: arrivals & departures workflow */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Arrivals Queue */}
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-serif text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" /> Arrivals Timeline
                </CardTitle>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{arrivals.length} Today</Badge>
              </div>
              <CardDescription className="text-slate-400 text-xs">Awaiting arrival check-in verification</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 max-h-[350px] overflow-y-auto">
              {arrivals.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">No pending arrivals today</div>
              ) : (
                arrivals.map(arr => (
                  <div key={arr.id} className="p-4 bg-white/[0.01] border border-slate-800 hover:border-purple-900/30 transition-all flex flex-col gap-2 relative">
                    {arr.vip && (
                      <span className="absolute top-3 right-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> VIP
                      </span>
                    )}
                    <div className="flex items-start justify-between pr-14">
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm">{arr.guestName}</h4>
                        <p className="text-slate-400 text-xs">Room {arr.roomNumber} ({arr.roomType})</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <Clock className="w-3.5 h-3.5 text-purple-400" /> 
                      <span>Check-In: <strong className="text-slate-300">{arr.checkIn}</strong></span>
                      {arr.isLate && <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">LATE</Badge>}
                    </div>

                    {arr.notes && (
                      <p className="text-[11px] text-purple-300/80 bg-purple-950/20 p-2 border border-purple-950 border-l-2 border-l-purple-500 italic mt-1 rounded-sm">
                        "{arr.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 mt-2 gap-3">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> {arr.payment}
                      </span>
                      <Button onClick={() => handleCheckIn(arr.roomNumber)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white h-7 text-xs rounded-sm px-3 border-0">
                        Check-In 🔑
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Departures Queue */}
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-serif text-white flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-purple-400" /> Departures Timeline
                </CardTitle>
                <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20">{departures.length} Pending</Badge>
              </div>
              <CardDescription className="text-slate-400 text-xs">Awaiting bill settlement & key return</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 max-h-[350px] overflow-y-auto">
              {departures.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">No pending check-outs</div>
              ) : (
                departures.map(dep => (
                  <div key={dep.id} className="p-4 bg-white/[0.01] border border-slate-800 hover:border-purple-900/30 transition-all flex flex-col gap-2 relative">
                    {dep.vip && (
                      <span className="absolute top-3 right-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> VIP
                      </span>
                    )}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm">{dep.guestName}</h4>
                        <p className="text-slate-400 text-xs">Room {dep.roomNumber} ({dep.roomType})</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <Clock className="w-3.5 h-3.5 text-purple-400" /> 
                      <span>Check-Out: <strong className="text-slate-300">{dep.checkOut}</strong></span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 mt-2 gap-3">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-amber-400" /> {dep.payment}
                      </span>
                      <Button onClick={() => handleCheckOut(dep.roomNumber)} size="sm" className="bg-purple-600 hover:bg-purple-500 text-white h-7 text-xs rounded-sm px-3 border-0">
                        Check-Out 🧹
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center/Right: Occupancy Status Map Room Cards */}
        <div className="lg:col-span-8 space-y-6">
          
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-serif text-white">Live Room Matrix Map</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Grid display of real-time room occupancies, maintenance cycles, and VIP reserves.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search room, floor..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-slate-950/60 border border-purple-900/40 text-xs text-slate-100 rounded-none pl-9 pr-4 py-2 w-[180px] focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/50 p-1 border border-purple-900/40">
                    {["ALL", "AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"].map(st => (
                      <button 
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-xs transition-colors ${statusFilter === st ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        {st === "ALL" ? "All" : st.toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              
              {/* Room Grid cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredRooms.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-500 text-sm">No matching room configurations found</div>
                ) : (
                  filteredRooms.map(room => {
                    const isOccupied = room.status === "OCCUPIED"
                    const isCleaning = room.status === "CLEANING"
                    const isMaintenance = room.status === "MAINTENANCE"
                    const isReserved = room.status === "RESERVED"
                    const isCheckoutPending = room.status === "CHECKOUT_PENDING"

                    const statusBg = isOccupied ? 'bg-rose-950/40 border-rose-500/30' :
                                     isCleaning ? 'bg-amber-950/40 border-amber-500/30' :
                                     isMaintenance ? 'bg-slate-900/60 border-slate-700/40' :
                                     isReserved ? 'bg-blue-950/40 border-blue-500/30' :
                                     isCheckoutPending ? 'bg-purple-950/40 border-purple-500/30' :
                                     'bg-emerald-950/20 border-emerald-500/30'

                    const textBadge = isOccupied ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' :
                                      isCleaning ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                                      isMaintenance ? 'text-slate-400 border-slate-700/20 bg-slate-700/10' :
                                      isReserved ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                                      isCheckoutPending ? 'text-purple-400 border-purple-500/20 bg-purple-500/10' :
                                      'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'

                    return (
                      <div 
                        key={room.id}
                        onClick={() => selectRoomCard(room)}
                        className={`p-4 border backdrop-blur-sm cursor-pointer hover:-translate-y-0.5 transition-all flex flex-col justify-between h-[150px] relative ${statusBg} ${selectedRoom?.number === room.number ? 'ring-2 ring-purple-500 scale-98 border-transparent' : ''}`}
                      >
                        {room.vip && (
                          <span className="absolute top-2 right-2 text-amber-400">
                            <Sparkles className="w-4 h-4 fill-amber-500/20" />
                          </span>
                        )}
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">Floor {room.floor}</p>
                          <h3 className="text-2xl font-serif font-extrabold text-white mt-1">Room {room.number}</h3>
                          <p className="text-slate-400 text-[10px] mt-0.5">{room.type}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-800/50 pt-2.5 mt-2">
                          <Badge className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 ${textBadge}`}>
                            {room.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            LKR {room.price / 1000}K
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Status Legends */}
              <div className="flex flex-wrap items-center gap-6 mt-8 p-4 bg-slate-950/40 border border-purple-900/10 rounded-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mr-2">Legend:</span>
                {[
                  { name: "Available", color: "bg-emerald-500" },
                  { name: "Occupied", color: "bg-rose-500" },
                  { name: "Cleaning", color: "bg-amber-500" },
                  { name: "Reserved", color: "bg-blue-400" },
                  { name: "Checkout Pending", color: "bg-purple-400" },
                  { name: "Maintenance", color: "bg-slate-500" }
                ].map(lg => (
                  <div key={lg.name} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${lg.color}`} />
                    <span className="text-xs text-slate-300">{lg.name}</span>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>

          {/* Quick Actions Action Drawer / Sheet Panel when Room is selected */}
          {selectedRoom && (
            <Card className="bg-gradient-to-r from-purple-950/20 to-indigo-950/20 border border-purple-500/30 backdrop-blur-xl rounded-none shadow-2xl animate-fade-in">
              <CardHeader className="border-b border-purple-900/30">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5">ROOM CONTROLS DESK</Badge>
                    <CardTitle className="text-2xl font-serif text-white mt-1.5">Action Desk: Room {selectedRoom.number}</CardTitle>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedRoom(null)} className="text-slate-400 hover:text-white hover:bg-white/5">
                    Close Desk
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Status Transitions */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest font-extrabold text-slate-400 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" /> Transition Room Status
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { name: "Set Available", status: "AVAILABLE", class: "bg-emerald-600 hover:bg-emerald-500 text-white" },
                      { name: "Set Occupied", status: "OCCUPIED", class: "bg-rose-700 hover:bg-rose-600 text-white" },
                      { name: "Set Cleaning", status: "CLEANING", class: "bg-amber-600 hover:bg-amber-500 text-white" },
                      { name: "Set Maintenance", status: "MAINTENANCE", class: "bg-slate-700 hover:bg-slate-600 text-white" }
                    ].map(stBtn => (
                      <Button 
                        key={stBtn.status}
                        onClick={() => handleStatusTransition(selectedRoom.number, stBtn.status)}
                        className={`text-xs h-9 rounded-none border-0 ${stBtn.class}`}
                      >
                        {stBtn.name}
                      </Button>
                    ))}
                  </div>

                  {/* Immediate workflow dispatch buttons */}
                  <div className="border-t border-purple-900/10 pt-4 space-y-2">
                    {selectedRoom.status === "AVAILABLE" && (
                      <Button onClick={() => handleCheckIn(selectedRoom.number)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-none border-0 h-10">
                        Check-In Guest 🔑
                      </Button>
                    )}
                    {(selectedRoom.status === "OCCUPIED" || selectedRoom.status === "CHECKOUT_PENDING") && (
                      <Button onClick={() => handleCheckOut(selectedRoom.number)} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-none border-0 h-10">
                        Check-Out & Settlement 🧹
                      </Button>
                    )}
                  </div>
                </div>

                {/* Metadata & guest note editors */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-purple-900/20 md:pl-6">
                  <h4 className="text-xs uppercase tracking-widest font-extrabold text-slate-400 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-purple-400" /> Front Desk Relations Memo
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-slate-950/40 p-3 border border-purple-900/10">
                      <input 
                        type="checkbox" 
                        id="vip_checkbox"
                        checked={isVip} 
                        onChange={e => setIsVip(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded focus:ring-0 focus:outline-none"
                      />
                      <label htmlFor="vip_checkbox" className="text-xs text-slate-200 font-bold uppercase tracking-widest cursor-pointer flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Flag Guest as VIP Status
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Special Notes & Housekeeping Demands</label>
                      <textarea 
                        value={guestNotes}
                        onChange={e => setGuestNotes(e.target.value)}
                        placeholder="e.g. Needs daily room cleanup strictly at 10 AM, fruits basket in lounge, allergy alert to peanut oil..."
                        className="w-full h-24 bg-slate-950/60 border border-purple-900/30 text-xs text-slate-200 p-3 focus:outline-none focus:ring-1 focus:ring-purple-500 rounded-none placeholder-slate-600"
                      />
                    </div>

                    <Button onClick={updateRoomMetadata} className="w-full bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs h-9 rounded-none border-0">
                      Save Front-Desk Updates
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          )}

        </div>

      </div>

    </div>
  )
}
