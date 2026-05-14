"use client"

import { useState, useEffect } from 'react'
import {
  Sparkles,
  UtensilsCrossed,
  Clock,
  ShieldAlert,
  Coffee,
  Waves,
  Gift,
  Search,
  Wallet,
  ChevronRight,
  MapPin,
  CalendarDays,
  Gem,
  Bell,
  MessageCircle,
  KeyRound
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StayJourneyTimeline } from './stay-journey-timeline'
import { GuestConciergeIsland } from './guest-concierge-island'
import { motion, AnimatePresence } from 'framer-motion'

interface GuestDashboardViewProps {
  session: any
}

export function GuestDashboardView({ session }: GuestDashboardViewProps) {
  const [activeStep, setActiveStep] = useState(2)
  const [isNfcUnlocking, setIsNfcUnlocking] = useState(false)
  const [isNfcSuccess, setIsNfcSuccess] = useState(false)
  const [activeConciergeDrawer, setActiveConciergeDrawer] = useState<string | null>(null)
  const [orderStatus, setOrderStatus] = useState('PREPARING')
  const [orderTimer, setOrderTimer] = useState(485)

  // Countdown timer for active food order
  useEffect(() => {
    if (orderStatus === 'DELIVERED') return
    const interval = setInterval(() => {
      setOrderTimer(prev => {
        if (prev <= 1) {
          setOrderStatus('DELIVERED')
          toast.success('Order delivered to your suite!', { 
            style: { background: '#0c0c0c', color: '#fff', border: '1px solid #10b981' },
            icon: '🍽️' 
          })
          return 0
        }
        if (prev === 240) setOrderStatus('TRANSIT')
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [orderStatus])

  const triggerNfcUnlock = async () => {
    if (isNfcUnlocking || isNfcSuccess) return
    setIsNfcUnlocking(true)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([100, 50, 100])
    await new Promise(r => setTimeout(r, 1800))
    setIsNfcUnlocking(false)
    setIsNfcSuccess(true)
    toast.success('Sanctuary Unlocked!', { 
      style: { background: '#0c0c0c', color: '#fff', border: '1px solid #c5a059' },
      icon: '🔑' 
    })
    setTimeout(() => setIsNfcSuccess(false), 6000)
  }

  const handleConciergeSubmit = (type: string) => {
    toast.success(`${type} Request received. Your butler is on the way.`, { 
      style: { background: '#0c0c0c', color: '#fff', border: '1px solid #c5a059' },
      icon: '🤵' 
    })
    setActiveConciergeDrawer(null)
  }

  const guestName = session?.user?.name || "Premium Guest"
  const firstName = guestName.split(' ')[0]

  const staySteps = [
    { label: "RESERVED", desc: "Confirmation Verified", date: "May 5" },
    { label: "READY", desc: "Room 401 Assigned", date: "May 7" },
    { label: "IN HOUSE", desc: "Enjoy your stay", date: "Active Now" },
    { label: "DEPARTURE", desc: "Keyless Checkout", date: "May 12" }
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12 pb-40 space-y-16 relative">
      <DashboardHeader 
        title="Welcome Home"
        firstName={firstName}
        subtitle="Your personalized digital retreat. Manage your stay, access premium amenities, and connect with your dedicated concierge team."
        role="Signature Elite"
      />

      <StayJourneyTimeline steps={staySteps} activeStep={activeStep} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Experience Column */}
        <div className="lg:col-span-8 space-y-12">
          {/* Action Quick-Access */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'SPA', label: 'Spa & Wellness', icon: Waves },
              { id: 'DINING', label: 'In-Room Dining', icon: UtensilsCrossed },
              { id: 'BUTLER', label: 'Butler Service', icon: Gem },
              { id: 'SUPPORT', label: 'Guest Support', icon: MessageCircle },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveConciergeDrawer(item.id)}
                className="group flex flex-col items-center justify-center p-6 bg-[#0c0c0c] border border-white/[0.05] hover:border-luxury-500/40 rounded-[32px] transition-all gap-4"
              >
                <div className="p-4 rounded-2xl bg-white/[0.03] text-white/40 group-hover:text-luxury-400 group-hover:bg-luxury-500/10 transition-all">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40 group-hover:text-white transition-colors">{item.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence>
            {activeConciergeDrawer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <Card className="bg-[#0c0c0c] border-luxury-500/20 p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-luxury-500/10 text-luxury-500 border border-luxury-500/20">
                        <Gem className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-xl font-serif font-bold text-white tracking-tight">Concierge Request: {activeConciergeDrawer}</h4>
                        <p className="text-xs text-white/40">How can our team elevate your experience today?</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4">
                    <input 
                      type="text" 
                      placeholder="Special instructions or requests..." 
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-[20px] px-6 h-16 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-luxury-500/50"
                    />
                    <Button 
                      onClick={() => handleConciergeSubmit(activeConciergeDrawer)}
                      className="h-16 px-10 rounded-[20px] bg-luxury-500 hover:bg-luxury-600 text-white font-bold"
                    >
                      Send Request
                    </Button>
                    <button onClick={() => setActiveConciergeDrawer(null)} className="h-16 px-6 text-[10px] font-black uppercase text-white/20 hover:text-white transition-colors">Dismiss</button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Folio Preview (P2) */}
          <Card className="p-10 bg-[#0c0c0c] border-white/[0.05] rounded-[40px] space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Wallet className="w-48 h-48 text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white/40">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white tracking-tight">Stay Folio Preview</h4>
                  <p className="text-xs text-white/40 font-medium">Real-time billing and incidentals</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Current Balance</p>
                <p className="text-3xl font-serif font-bold text-white">$1,240.00</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 border-t border-white/[0.03]">
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="w-4 h-4 text-white/20" />
                  <span className="text-sm font-medium text-white/60">Signature Lounge • Room Service</span>
                </div>
                <span className="text-sm font-bold text-white">$45.00</span>
              </div>
              <div className="flex items-center justify-between py-4 border-t border-white/[0.03]">
                <div className="flex items-center gap-3">
                  <Waves className="w-4 h-4 text-white/20" />
                  <span className="text-sm font-medium text-white/60">Deep Tissue Therapy • Sanctuary SPA</span>
                </div>
                <span className="text-sm font-bold text-white">$180.00</span>
              </div>
            </div>
            <button className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all">
              View Itemized Folio
            </button>
          </Card>
        </div>

        {/* Sidebar Info Column */}
        <div className="lg:col-span-4 space-y-12">
          {/* Locale Card */}
          <Card className="p-10 bg-[#0c0c0c] border-white/[0.05] rounded-[40px] space-y-8 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-luxury-500/5 blur-[80px] rounded-full group-hover:bg-luxury-500/10 transition-colors" />
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Local Time</p>
                <p className="text-3xl font-serif font-bold text-white">08:45 PM</p>
              </div>
              <MapPin className="w-6 h-6 text-luxury-500" />
            </div>
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40 font-medium">Weather</span>
                <span className="text-xs font-bold text-white/80">Clear • 28°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40 font-medium">Flight Status</span>
                <span className="text-xs font-bold text-emerald-400">On-Time (UL504)</span>
              </div>
            </div>
          </Card>

          {/* Hotel Events */}
          <Card className="p-10 bg-[#0c0c0c] border-white/[0.05] rounded-[40px] space-y-8">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-white/40" />
              <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Resort Events</h4>
            </div>
            <div className="space-y-6">
              {[
                { time: '07:00 PM', label: 'Sunset Jazz', loc: 'Sky Deck' },
                { time: '09:30 AM', label: 'Sunrise Yoga', loc: 'Zen Garden' }
              ].map((ev, i) => (
                <div key={i} className="group cursor-pointer">
                  <p className="text-[9px] font-black text-luxury-500 uppercase tracking-wider mb-1">{ev.time}</p>
                  <h5 className="text-sm font-bold text-white group-hover:text-luxury-400 transition-colors">{ev.label}</h5>
                  <p className="text-[10px] text-white/30 font-medium mt-1">{ev.loc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <GuestConciergeIsland 
        guestName={guestName}
        roomNumber="401"
        orderStatus={orderStatus}
        orderTimer={orderTimer}
        onUnlock={triggerNfcUnlock}
        isUnlocking={isNfcUnlocking}
        isSuccess={isNfcSuccess}
      />
    </div>
  )
}
