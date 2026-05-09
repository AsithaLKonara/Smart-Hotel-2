"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  LogOut,
  Key,
  UtensilsCrossed,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  Bell,
  ShieldAlert,
  Smartphone,
  ChevronRight,
  RefreshCw,
  Gift,
  Coffee,
  Waves
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'

export default function LuxuryGuestExperience() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Real-time alerts integrations
  const { notifications, unreadCount, markAllAsRead } = useRealtimeNotifications()

  // State managers
  const [loading, setLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(2) // 0: Booking, 1: Pre-check, 2: In-House, 3: Departure
  const [isNfcUnlocking, setIsNfcUnlocking] = useState(false)
  const [isNfcSuccess, setIsNfcSuccess] = useState(false)
  const [activeConciergeDrawer, setActiveConciergeDrawer] = useState<string | null>(null) // 'SPA' | 'HOUSEKEEPING' | 'GRIEVANCE' | null

  // Simulated live food order state
  const [orderStatus, setOrderStatus] = useState('PREPARING') // 'PLACED' | 'PREPARING' | 'TRANSIT' | 'DELIVERED'
  const [orderTimer, setOrderTimer] = useState(485) // seconds remaining

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Countdown timer for active food order
  useEffect(() => {
    if (orderStatus === 'DELIVERED') return
    const interval = setInterval(() => {
      setOrderTimer(prev => {
        if (prev <= 1) {
          setOrderStatus('DELIVERED')
          toast.success('Your order has arrived at your door! Enjoy.', {
            icon: '🍽️',
            style: { background: '#10b981', color: '#fff' }
          })
          return 0
        }
        // Progress status on checkpoints
        if (prev === 240) {
          setOrderStatus('TRANSIT')
          toast('Your order is out for delivery! A butler is on the way.', {
            icon: '🛵'
          })
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [orderStatus])

  const recordAuditAction = async (action: string, details: any) => {
    await fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details })
    }).catch(err => console.error(err))
  }

  const recordNotification = async (type: string, title: string, message: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title, message, link: '/dashboard' })
    }).catch(err => console.error(err))
  }

  // Interactive NFC Keycard unlock trigger
  const triggerNfcUnlock = async () => {
    if (isNfcUnlocking || isNfcSuccess) return

    setIsNfcUnlocking(true)
    // Simulate mobile haptic vibration and cryptographic handshake
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100])
    }

    await new Promise(r => setTimeout(r, 1800))
    setIsNfcUnlocking(false)
    setIsNfcSuccess(true)

    toast.success('Sanctuary Unlocked! Welcome back.', {
      icon: '🔑',
      style: { background: '#8b5cf6', color: '#fff', border: '1px solid #c084fc' }
    })

    // Write audit stream logs
    recordAuditAction('NFC_KEYCARD_UNLOCK', { room: '401', lockType: 'NFC_HANDSHAKE' })

    // Automatically relock after 6 seconds
    setTimeout(() => {
      setIsNfcSuccess(false)
    }, 6000)
  }

  // Submit concierge actions
  const handleConciergeSubmit = async (type: string, payload: any) => {
    toast.success(`${type} Request lodged with our Digital Butler!`, {
      icon: '🤵'
    })

    recordAuditAction('CONCIERGE_REQUEST', { type, ...payload })
    recordNotification('task', `New Guest Concierge Request`, `Guest in Room 401 submitted a ${type} request.`)
    setActiveConciergeDrawer(null)
  }

  const formatMinSec = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}m ${rem < 10 ? '0' : ''}${rem}s`
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <PremiumSpinner size="lg" text="Entering your luxury sanctuary portal..." />
      </div>
    )
  }

  const guestName = session.user?.name || "Premium Guest"
  const firstName = guestName.split(' ')[0]

  const staySteps = [
    { label: "CONFIRMED", desc: "Suite Reserved", date: "May 5" },
    { label: "PRE-CHECK", desc: "Digital Welcome Form", date: "May 7" },
    { label: "IN HOUSE", desc: "Room 401 (Presidential)", date: "Active Now" },
    { label: "CHECKOUT", desc: "Keyless Departure", date: "May 12" }
  ]

  return (
    <div className="min-h-screen relative text-white font-sans pt-24 pb-12">
      {/* Dashboard Specific Background Image with Premium Overlay */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
        <img
          src="/images/hotel/hotel-hero-1.jpg"
          alt="Dashboard Background"
          className="w-full h-full object-cover origin-center filter brightness-[0.35] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0714] via-transparent to-[#0c0714]/80" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Luxury Dashboard Banner */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 lg:p-12 text-white relative overflow-hidden border border-white/10 shadow-luxury mb-8">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200')] opacity-10 object-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 text-primary uppercase tracking-widest text-xs font-bold mb-3">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span>SmartHotel Sanctuary Member</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold text-white mb-2">
                Welcome to your Oasis, {firstName}
              </h1>
              <p className="text-white/60 max-w-lg text-sm leading-relaxed">
                Unlock your room, track butler room-services, book therapeutic spa slots, and access our 24/7 digital concierge desk.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="bg-white/5 border-white/10 text-primary hover:bg-primary/10 rounded-xl text-xs font-semibold"
              >
                <Bell className="w-4 h-4 mr-2" /> Unreads ({unreadCount})
              </Button>
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 rounded-xl text-xs font-semibold"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="w-4 h-4 mr-2" /> Depart Portal
              </Button>
            </div>
          </div>
        </div>

        {/* Live Stay Progress Timeline */}
        <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-luxury mb-8">
          <CardContent className="p-6">
            <h3 className="text-xs uppercase tracking-widest font-extrabold text-white/40 mb-6">Stay Journey Timeline</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {staySteps.map((step, idx) => {
                const isActive = idx === activeStep
                const isPassed = idx < activeStep

                return (
                  <div key={idx} className="relative flex flex-col md:flex-row items-start gap-4">
                    {/* Visual node */}
                    <div className="flex items-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${isActive ? 'bg-primary/20 border-primary text-primary shadow-luxury animate-pulse' : isPassed ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                        {isPassed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </span>
                    </div>

                    <div>
                      <h4 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-white/60'}`}>{step.desc}</h4>
                      <Badge className={`text-[9px] uppercase font-bold py-0.5 px-1.5 mt-1 border ${isActive ? 'bg-primary/10 text-primary border-primary/20' : 'bg-transparent border-transparent text-white/30'}`}>{step.label}</Badge>
                      <span className="block text-[10px] text-white/30 mt-1 font-mono">{step.date}</span>
                    </div>

                    {idx < 3 && (
                      <div className="hidden md:block absolute top-4 left-8 right-0 h-0.5 border-t border-dashed border-white/5 -z-10" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Workspace Layout Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Panel: Digital NFC Keycard & Butler Food Progress */}
          <div className="lg:col-span-5 space-y-8">

            {/* Simulated Neon NFC Keycard */}
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-luxury relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-48 h-full bg-primary/5 -skew-x-12 translate-x-10 group-hover:translate-x-5 transition-transform duration-700" />
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-sm uppercase tracking-widest font-extrabold text-white/60 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" /> Mobile Room-Key Dashboard
                </CardTitle>
                <CardDescription className="text-xs text-white/40">Hold near your room-lock device to unlock door.</CardDescription>
              </CardHeader>

              <CardContent className="pt-6 flex flex-col items-center">

                {/* Virtual Keycard Graphic */}
                <div className={`w-[260px] h-[360px] rounded-2xl p-6 flex flex-col justify-between border-2 relative transition-all duration-500 bg-gradient-to-br ${isNfcSuccess ? 'from-emerald-950 to-slate-950 border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.25)]' : 'from-[#140b2a] to-slate-950 border-purple-500/40 shadow-[0_0_25px_rgba(139,92,246,0.15)]'}`}>

                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-white text-lg">SmartHotel OS</h4>
                      <span className="text-[8px] uppercase tracking-widest text-purple-400 font-extrabold">Executive Sanctuary Key</span>
                    </div>
                    <Key className={`w-8 h-8 ${isNfcSuccess ? 'text-emerald-400 animate-bounce' : 'text-purple-400'}`} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">ROOM ACCESSIBLE</span>
                    <span className="font-serif text-3xl font-bold text-white">ROOM 401</span>
                    <span className="text-xs text-slate-400 font-bold tracking-wider mt-1">{guestName}</span>
                  </div>

                  <button
                    onClick={triggerNfcUnlock}
                    disabled={isNfcUnlocking}
                    className={`w-full py-3 text-xs font-bold uppercase tracking-widest border transition-all ${isNfcSuccess ? 'bg-emerald-500 text-white border-transparent' : 'bg-purple-900/30 text-purple-300 hover:text-white border-purple-500/40 hover:bg-purple-600'}`}
                  >
                    {isNfcUnlocking ? "CRYPTO SECURING HANDSHAKE..." : isNfcSuccess ? "ACCESS GRANTED - UNLOCKED" : "HOLD TO NFC UNLOCK"}
                  </button>

                </div>

              </CardContent>
            </Card>

            {/* Room Service Live Tracker */}
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-luxury">
              <CardHeader className="border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm uppercase tracking-widest font-extrabold text-white/60 flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-primary" /> Active Butler Service
                  </CardTitle>
                  <Badge className={`text-[10px] uppercase font-bold border ${orderStatus === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>{orderStatus}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Order: <strong className="text-slate-200">#K104 (Sanctuary Club Sandwich)</strong></span>
                  {orderStatus !== 'DELIVERED' && (
                    <span className="font-mono text-purple-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatMinSec(orderTimer)}
                    </span>
                  )}
                </div>

                {/* Progress bar state indicator */}
                <div className="relative pt-2">
                  <div className="overflow-hidden h-1.5 text-xs flex rounded bg-slate-950 border border-purple-900/10">
                    <div
                      style={{ width: orderStatus === 'DELIVERED' ? '100%' : orderStatus === 'TRANSIT' ? '70%' : '35%' }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-1000"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                    <span className={orderStatus === 'PLACED' ? 'text-purple-400 font-bold' : ''}>PLACED</span>
                    <span className={orderStatus === 'PREPARING' ? 'text-purple-400 font-bold' : ''}>PREPARING</span>
                    <span className={orderStatus === 'TRANSIT' ? 'text-purple-400 font-bold' : ''}>TRANSIT</span>
                    <span className={orderStatus === 'DELIVERED' ? 'text-purple-400 font-bold' : ''}>DELIVERED</span>
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* Right Panel: Digital Concierge Operations Desk */}
          <div className="lg:col-span-7 space-y-8">

            {/* Quick Actions List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveConciergeDrawer('SPA')}
                className="p-5 bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/30 hover:bg-primary/5 rounded-2xl transition-all flex flex-col items-center text-center gap-3 group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Waves className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">SPA Reservation</h4>
                  <p className="text-[10px] text-white/40 mt-1">Book premium wellness slots</p>
                </div>
              </button>

              <button
                onClick={() => setActiveConciergeDrawer('HOUSEKEEPING')}
                className="p-5 bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/30 hover:bg-primary/5 rounded-2xl transition-all flex flex-col items-center text-center gap-3 group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Butler Pillows</h4>
                  <p className="text-[10px] text-white/40 mt-1">Order fresh towels or pillows</p>
                </div>
              </button>

              <button
                onClick={() => setActiveConciergeDrawer('GRIEVANCE')}
                className="p-5 bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/30 hover:bg-primary/5 rounded-2xl transition-all flex flex-col items-center text-center gap-3 group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Lodge Incident</h4>
                  <p className="text-[10px] text-white/40 mt-1">File operational complaints</p>
                </div>
              </button>
            </div>

            {/* Dynamic Concierge Input Drawer Card */}
            {activeConciergeDrawer && (
              <Card className="bg-white/[0.02] border border-purple-500/30 rounded-none shadow-2xl animate-fade-in">
                <CardHeader className="border-b border-purple-950/50">
                  <CardTitle className="text-lg font-serif text-white">
                    {activeConciergeDrawer === 'SPA' && "Wellness SPA Reservation Desk"}
                    {activeConciergeDrawer === 'HOUSEKEEPING' && "Housekeeping Butler Request"}
                    {activeConciergeDrawer === 'GRIEVANCE' && "Sanctuary Quality Escapes Complaint Desk"}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    {activeConciergeDrawer === 'SPA' && "Select your desired therapeutic sessions & treatment durations."}
                    {activeConciergeDrawer === 'HOUSEKEEPING' && "Select amenities, fresh linens, or morning beverage deliveries."}
                    {activeConciergeDrawer === 'GRIEVANCE' && "Submit layout regressions, network discrepancies or physical complaints."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">

                  {/* SPA Booking Form */}
                  {activeConciergeDrawer === 'SPA' && (
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const data = new FormData(e.currentTarget)
                      handleConciergeSubmit('SPA_RESERVATION', {
                        session: data.get('session'),
                        time: data.get('time')
                      })
                    }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">SPA Therapy Session</label>
                          <select name="session" className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-2.5 rounded-none focus:outline-none">
                            <option value="Swedish Massage">Swedish Massage (60 mins)</option>
                            <option value="Hot Stone Treatment">Hot Stone Treatment (90 mins)</option>
                            <option value="Oxygen Facial">Oxygen Facial (45 mins)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Preferred Time Hour</label>
                          <select name="time" className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-2.5 rounded-none focus:outline-none">
                            <option value="10:00 AM">10:00 AM</option>
                            <option value="02:00 PM">02:00 PM</option>
                            <option value="06:00 PM">06:00 PM</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <Button type="button" onClick={() => setActiveConciergeDrawer(null)} variant="outline" className="border-slate-800 text-slate-400 rounded-none text-xs">Cancel</Button>
                        <Button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-none border-0 text-xs font-bold">Book SPA Session</Button>
                      </div>
                    </form>
                  )}

                  {/* Housekeeping Request Form */}
                  {activeConciergeDrawer === 'HOUSEKEEPING' && (
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const data = new FormData(e.currentTarget)
                      handleConciergeSubmit('HOUSEKEEPING_REQUEST', {
                        item: data.get('item'),
                        qty: data.get('qty')
                      })
                    }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Request Item</label>
                          <select name="item" className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-2.5 rounded-none focus:outline-none">
                            <option value="Fresh Pillow Sets">Fresh Pillow Sets (Down Feather)</option>
                            <option value="Luxury Towels">Luxury Linens & Towels</option>
                            <option value="Sparkling Water">Butler Water Bottle (Sparkling)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Quantity</label>
                          <select name="qty" className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-2.5 rounded-none focus:outline-none">
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="4">4</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <Button type="button" onClick={() => setActiveConciergeDrawer(null)} variant="outline" className="border-slate-800 text-slate-400 rounded-none text-xs">Cancel</Button>
                        <Button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-none border-0 text-xs font-bold">Submit Butler Request</Button>
                      </div>
                    </form>
                  )}

                  {/* Grievance Complaint Form */}
                  {activeConciergeDrawer === 'GRIEVANCE' && (
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const data = new FormData(e.currentTarget)
                      handleConciergeSubmit('GUEST_GRIEVANCE', {
                        title: data.get('title'),
                        desc: data.get('desc')
                      })
                    }} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Incident Header</label>
                        <input name="title" required placeholder="e.g. Dynamic NFC handshake failing or room temperature" className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-2.5 rounded-none focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Context Explanation</label>
                        <textarea name="desc" required rows={3} placeholder="Provide details. Our front office manager will call your suite immediately." className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-2.5 rounded-none focus:outline-none" />
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <Button type="button" onClick={() => setActiveConciergeDrawer(null)} variant="outline" className="border-slate-800 text-slate-400 rounded-none text-xs">Cancel</Button>
                        <Button type="submit" className="bg-rose-900/50 hover:bg-rose-600 border border-rose-500/30 text-rose-200 hover:text-white rounded-none text-xs font-bold uppercase tracking-wider">Escalate Ticket</Button>
                      </div>
                    </form>
                  )}

                </CardContent>
              </Card>
            )}

            {/* Exclusive Member Benefits Info */}
            <Card className="bg-[#120a26]/20 border border-purple-900/20 rounded-none p-6">
              <div className="flex items-center gap-3 text-purple-400 mb-3">
                <Gift className="w-6 h-6 text-purple-400" />
                <h4 className="font-bold text-sm text-slate-200">Your Exclusive Member Privileges</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                As a SmartHotel Signature member, you enjoy complimentary high-speed Wi-Fi access, custom room scent settings, priority reservation slots across all hotel SPA programs, and late-checkout indicator buffers up to 2 hours.
              </p>
              <div className="flex items-center justify-between text-[11px] font-mono border-t border-purple-950/40 pt-4 text-slate-500">
                <span>Loyalty Class: PLATINUM</span>
                <span className="text-purple-400 font-bold">Points: 12,400 pts</span>
              </div>
            </Card>

          </div>

        </div>

      </div>
    </div>
  )
}
