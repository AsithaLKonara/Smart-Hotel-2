"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  Tv, 
  ArrowRight,
  ShieldAlert,
  Sliders,
  DollarSign,
  CloudLightning,
  Workflow,
  Globe2,
  Terminal
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

// High-Fidelity Channel and OTA Datastore
const MOCK_CHANNELS = [
  { id: "ch1", name: "Booking.com", status: "SYNCED", latencyMs: 45, mappedRooms: 12, rateMarkupPct: 15, logoColor: "text-blue-400" },
  { id: "ch2", name: "Airbnb", status: "SYNCED", latencyMs: 82, mappedRooms: 8, rateMarkupPct: 10, logoColor: "text-rose-400" },
  { id: "ch3", name: "Expedia", status: "SYNCED", latencyMs: 58, mappedRooms: 12, rateMarkupPct: 12, logoColor: "text-amber-400" },
  { id: "ch4", name: "Agoda", status: "DEGRADED", latencyMs: 340, mappedRooms: 6, rateMarkupPct: 14, logoColor: "text-purple-400" }
]

const INITIAL_SYNC_LOGS = [
  { timestamp: "12:15:32", channel: "Booking.com", event: "WEBHOOK_RECEIVED", details: "Reservation GP1084869 updated (CheckIn: May 12, Guest: Charles Darwin). Reconciling database lock..." },
  { timestamp: "12:14:05", channel: "Airbnb", event: "RATE_PUSH_SUCCESS", details: "Pushed Deluxe Suite Base Rate LKR 25,000 + 10% Channel Markup." },
  { timestamp: "12:12:18", channel: "Expedia", event: "INVENTORY_SYNCED", details: "Room 101 status set to OCCUPIED. Decremented channel inventory slot to 0." },
  { timestamp: "12:08:50", channel: "Agoda", event: "CONNECTION_RETRY", details: "Sync latency exceeded 300ms threshold. Re-attempting handshake with Agoda API nodes..." }
]

export default function OtaChannelSync() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [channels, setChannels] = useState<any[]>(MOCK_CHANNELS)
  const [logs, setLogs] = useState<any[]>(INITIAL_SYNC_LOGS)
  const [syncing, setSyncing] = useState(false)
  const [markupValues, setMarkupValues] = useState<Record<string, number>>({ STANDARD: 15, DELUXE: 10, SUITE: 12 })

  // Simulated live event stream generator
  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessAdminDashboard(session)) {
      toast.error('Access Denied: Administrative operations center access required')
      router.push('/auth/signin')
      return
    }

    const interval = setInterval(() => {
      generateSimulatedOtaEvent()
    }, 15000) // generate mock sync event every 15 seconds

    return () => clearInterval(interval)
  }, [session, status, router])

  const generateSimulatedOtaEvent = () => {
    const channelNames = ["Booking.com", "Airbnb", "Expedia", "Agoda"]
    const eventTypes = ["WEBHOOK_RECEIVED", "RATE_PUSH_SUCCESS", "INVENTORY_SYNCED", "MEMBER_MODIFICATION"]
    const rooms = ["101", "202", "302", "401"]
    
    const randomChannel = channelNames[Math.floor(Math.random() * channelNames.length)]
    const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)]
    const time = new Date().toTimeString().split(' ')[0]

    let details = ""
    if (randomEvent === "WEBHOOK_RECEIVED") {
      details = `Incoming checkout event for Room ${randomRoom}. Freeing channel inventory slot globally.`
    } else if (randomEvent === "RATE_PUSH_SUCCESS") {
      details = `Broadcasting automated yield multiplier rates to ${randomChannel}. Mapping locks secured.`
    } else {
      details = `Inventory block status updated for Room ${randomRoom} across global clusters.`
    }

    setLogs(prev => [
      { timestamp: time, channel: randomChannel, event: randomEvent, details },
      ...prev.slice(0, 15) // limit to 15 logs
    ])

    // Randomize Agoda latency to show self-healing
    setChannels(prev => prev.map(ch => {
      if (ch.name === "Agoda") {
        const healthy = Math.random() > 0.4
        return {
          ...ch,
          status: healthy ? "SYNCED" : "DEGRADED",
          latencyMs: healthy ? 65 : 320
        }
      }
      return ch
    }))
  }

  const triggerGlobalSync = () => {
    setSyncing(true)
    toast.loading("Securing transactional inventory locks across global OTAs...")
    
    setTimeout(() => {
      setSyncing(false)
      toast.dismiss()
      toast.success("All Airbnb, Booking.com, Agoda, and Expedia listings synchronized successfully!", {
        icon: '🌐',
        style: { background: '#10b981', color: '#fff' }
      })
      
      const time = new Date().toTimeString().split(' ')[0]
      setLogs(prev => [
        { timestamp: time, channel: "SYSTEM", event: "GLOBAL_FORCE_SYNC", details: "Global transactional sync forced. Broad-swept inventory locks across 4 OTA clusters." },
        ...prev
      ])
    }, 2000)
  }

  const broadcastRates = () => {
    toast.loading("Broadcasting markup schedules to channel endpoints...")
    setTimeout(() => {
      toast.dismiss()
      toast.success("Channel rate markups recalculated and broadcasted successfully!")
      
      const time = new Date().toTimeString().split(' ')[0]
      setLogs(prev => [
        { timestamp: time, channel: "SYSTEM", event: "MARKUP_BROADCAST", details: "Manual pricing markup push completed. Multi-tier rates pushed with LKR base offsets." },
        ...prev
      ])
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#090514] text-slate-100 p-6 font-sans">
      
      {/* OTA Header Control Cockpit */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-purple-900/40 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 text-xs tracking-wider uppercase font-bold py-1 px-3">
              OTA INTEGRATION HUB
            </Badge>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mt-2">Channel Manager Sync Engine</h1>
          <p className="text-slate-400 text-sm mt-1">Multi-channel inventory locks, automated rate markup broadcasters, and live sync webhook telemetry streams.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={triggerGlobalSync} disabled={syncing} className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white border-0 font-semibold shadow-lg shadow-purple-950">
            {syncing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Workflow className="w-4 h-4 mr-2" />} Sync Channels Global
          </Button>
          <Button onClick={() => router.push('/admin/dashboard')} className="bg-white/5 border-purple-900/50 text-purple-300 hover:bg-purple-900/30">
            Master Console
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side (5-cols): Connected Channel portals and markups */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Channels list */}
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/50 pb-4">
              <CardTitle className="text-lg font-serif text-white flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-blue-400" /> Channel Connections
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">Real-time mapping health of OTA partners</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {channels.map(ch => {
                const isSynced = ch.status === "SYNCED"
                return (
                  <div key={ch.id} className="p-4 bg-white/[0.01] border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isSynced ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        {ch.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Mapped: <strong className="text-slate-300">{ch.mappedRooms} Inventory Slots</strong></p>
                    </div>

                    <div className="text-right">
                      <Badge className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 ${isSynced ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                        {ch.status}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">Ping: <strong className="text-slate-400">{ch.latencyMs}ms</strong></p>
                    </div>
                  </div>
                )
              })}

            </CardContent>
          </Card>

          {/* Pricing Markups Board */}
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/50 pb-4">
              <CardTitle className="text-lg font-serif text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" /> Channel Rate Markup Schedulers
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">Configure base price markups applied on OTA channels to balance reservation commissions.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {["STANDARD", "DELUXE", "SUITE"].map(rmType => (
                <div key={rmType} className="p-3 bg-slate-950/40 border border-slate-800 flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-200">{rmType} MARKUP</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={markupValues[rmType]}
                      onChange={e => setMarkupValues(prev => ({ ...prev, [rmType]: Number(e.target.value) }))}
                      className="bg-slate-950 border border-purple-900/30 text-xs text-slate-100 p-1.5 w-16 text-center focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
              ))}

              <Button onClick={broadcastRates} className="w-full bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs h-9 rounded-none border-0 mt-2">
                Push Global Rates Broadcast
              </Button>

            </CardContent>
          </Card>

        </div>

        {/* Right Side (7-cols): Webhook logs terminal */}
        <div className="lg:col-span-7 space-y-6">
          
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-serif text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" /> Live Sync Log Stream
                </CardTitle>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <CardDescription className="text-slate-400 text-xs">Capturing operational webhooks and booking integration handshakes in real-time.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              
              {/* Shell output window */}
              <div className="bg-slate-950/90 border border-purple-900/40 p-4 font-mono text-[11px] leading-relaxed max-h-[460px] overflow-y-auto space-y-3 shadow-inner text-slate-300">
                
                {logs.map((lg, i) => {
                  let eventCol = "text-purple-400"
                  if (lg.event === "WEBHOOK_RECEIVED") eventCol = "text-blue-400"
                  if (lg.event === "RATE_PUSH_SUCCESS") eventCol = "text-emerald-400"
                  if (lg.event === "CONNECTION_RETRY") eventCol = "text-rose-400 animate-pulse"

                  return (
                    <div key={i} className="border-b border-slate-900/80 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">[{lg.timestamp}]</span>
                        <Badge className="bg-white/5 border border-slate-800 text-slate-300 text-[9px] rounded-xs font-mono py-0 px-1.5">{lg.channel}</Badge>
                        <span className={`font-bold ${eventCol}`}>{lg.event}</span>
                      </div>
                      <p className="text-slate-400 mt-1 pl-1">{lg.details}</p>
                    </div>
                  )
                })}

              </div>

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}
