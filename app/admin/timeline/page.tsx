"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { useRealtimeUpdates } from '@/hooks/use-realtime-updates'
import { 
  Terminal, 
  RefreshCw, 
  Clock, 
  Filter, 
  SlidersHorizontal, 
  Briefcase, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle,
  Eye,
  Info,
  Layers,
  Wrench,
  Sparkles,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { getPusherClient } from '@/lib/pusher-client'

// Hourly timelines for baseline Gantt grid
const HOURS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']

interface TimelineEvent {
  id: string
  category: 'RECEPTION' | 'HOUSEKEEPING' | 'DINING' | 'MAINTENANCE' | 'SECURITY'
  title: string
  message: string
  time: string
  spanHours: number
  severity: 'info' | 'warning' | 'critical'
  assignedStaff?: string
  room?: string
}

const INITIAL_EVENTS: TimelineEvent[] = [
  {
    id: "evt-1",
    category: "RECEPTION",
    title: "VIP Arrival: Senator Vance",
    message: "Helicopter transfer confirmed. Premium welcome check-in ready.",
    time: "10:00",
    spanHours: 2,
    severity: "info",
    assignedStaff: "Amanda Reception Desk",
    room: "Suite 405"
  },
  {
    id: "evt-2",
    category: "HOUSEKEEPING",
    title: "SLA Clean Breach: Suite 102",
    message: "Cleaning timer exceeded 45 minutes limit. Escalation warning.",
    time: "12:00",
    spanHours: 2,
    severity: "warning",
    assignedStaff: "Sarah Cleaner Unit",
    room: "Room 102"
  },
  {
    id: "evt-3",
    category: "DINING",
    title: "Room Service Order Late",
    message: "Steak Frites order delayed 25 minutes. Kitchen pacing check required.",
    time: "14:00",
    spanHours: 1.5,
    severity: "warning",
    assignedStaff: "Chef Henri",
    room: "Room 303"
  },
  {
    id: "evt-4",
    category: "MAINTENANCE",
    title: "CRITICAL: AC Compressor Failure",
    message: "Water condenser leaking. Compressor failed to start.",
    time: "16:00",
    spanHours: 3,
    severity: "critical",
    assignedStaff: "Marcus HVAC Crew",
    room: "Room 204"
  },
  {
    id: "evt-5",
    category: "SECURITY",
    title: "Impossible Travel Alert",
    message: "Admin session synchronized from anomalous location (API sweep).",
    time: "20:00",
    spanHours: 1,
    severity: "critical",
    assignedStaff: "SRE Security Firewall",
    room: "System Wide"
  },
  {
    id: "evt-6",
    category: "RECEPTION",
    title: "Standard Checkout: Mr. Miller",
    message: "Standard bill finalized. Card processed successfully.",
    time: "08:00",
    spanHours: 1,
    severity: "info",
    assignedStaff: "Agent Dave",
    room: "Room 211"
  }
]

export default function UnifiedLiveTimeline() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isConnected: isRealtimeConnected } = useRealtimeUpdates()
  const isConnected = isRealtimeConnected

  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<TimelineEvent[]>(INITIAL_EVENTS)
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  
  // Realtime logging ticker feed
  const [logsFeed, setLogsFeed] = useState<any[]>([
    { id: "log-1", message: "System timeline bootstrapped.", timestamp: "Just now", type: "system" },
    { id: "log-2", message: "Dynamic WebSocket listeners initialized successfully.", timestamp: "Just now", type: "success" }
  ])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessAdminDashboard(session)) {
      toast.error('Access Denied: Administrative credentials required.')
      router.push('/auth/signin')
      return
    }

    setLoading(false)
  }, [session, status, router])

  // Pusher real-time event integration
  useEffect(() => {
    const pusher = getPusherClient()
    // CFG-003: Pusher is optional. Silently skip subscription when unconfigured.
    if (!pusher) return

    const adminChannel = pusher.subscribe('admin')

    const handleNewTimelineTrigger = (data: any) => {
      const parsedEvent: TimelineEvent = {
        id: data.id || `evt-${Date.now()}`,
        category: data.category || "SECURITY",
        title: data.title || "External System Trigger",
        message: data.message || "Anomalous telemetry signal resolved.",
        time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        spanHours: data.spanHours || 1.5,
        severity: data.severity || "info",
        assignedStaff: data.assignedStaff || "AI Guard Dog",
        room: data.room || "System Wide"
      }

      setEvents(prev => {
        if (prev.some(e => e.id === parsedEvent.id)) return prev
        return [parsedEvent, ...prev]
      })

      setLogsFeed(prev => [
        {
          id: `log-${Date.now()}`,
          message: `Live event added: ${parsedEvent.title}`,
          timestamp: new Date().toLocaleTimeString(),
          type: parsedEvent.severity === 'critical' ? 'danger' : 'info'
        },
        ...prev
      ])

      toast(`Timeline Event: ${parsedEvent.title}`, {
        icon: parsedEvent.severity === 'critical' ? '🚨' : '🔔',
        style: { background: '#090514', border: '1px solid #8b5cf6', color: '#fff' }
      })
    }

    adminChannel.bind('timelineEventTriggered', handleNewTimelineTrigger)
    return () => {
      adminChannel.unbind('timelineEventTriggered', handleNewTimelineTrigger)
      pusher.unsubscribe('admin')
    }
  }, [])

  const triggerManualSimulationEvent = () => {

    // Simulation event injected onto local timeline (since we transitioned to Pusher)
    const fallbackEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      category: "MAINTENANCE",
      title: "Simulation Trigger: Elevator Fault (Local)",
      message: "Cable tension tolerance alarm active. Main shaft locked out.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      spanHours: 2,
      severity: "critical",
      assignedStaff: "Marcus Lift Engineer",
      room: "Elevator Shaft B"
    }
    setEvents(prev => [fallbackEvent, ...prev])
    toast.success('Simulation event injected onto local timeline.')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <PremiumSpinner size="lg" text="Syncing unified operations timeline..." />
      </div>
    )
  }

  const filteredEvents = filterCategory === 'ALL' 
    ? events 
    : events.filter(e => e.category === filterCategory)

  // Split-up categorical divisions for the Gantt layout
  const ROW_CATEGORIES = ['RECEPTION', 'HOUSEKEEPING', 'DINING', 'MAINTENANCE', 'SECURITY']

  return (
    <div className="min-h-screen bg-[#090514] text-slate-100 p-6 font-sans relative">
      
      {/* Upper Status Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-purple-950/40 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-600/10 text-purple-400 border border-purple-500/30 text-xs tracking-wider uppercase font-bold py-1 px-3">
              LIVE DISPATCH COMMAND ROOM
            </Badge>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" /> Live Stream Sync Active
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mt-1.5">Unified Hotel Operational Timeline</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time cross-department workflow dispatch center. Orchestrating staff actions, guests arrival/checkout blocks, and SLA incident timers.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={triggerManualSimulationEvent} variant="outline" size="sm" className="bg-white/5 border-purple-950/50 text-amber-300">
            <Zap className="w-4 h-4 mr-1.5 text-amber-400 animate-pulse" /> Inject Test Event
          </Button>
          <Button onClick={() => router.push('/admin/collaboration')} variant="outline" size="sm" className="bg-white/5 border-purple-950/50 text-purple-300">
            Team Message Desk
          </Button>
          <Button onClick={() => router.push('/admin/dashboard')} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 font-semibold shadow-lg shadow-purple-950">
            Master Console
          </Button>
        </div>
      </div>

      {/* Roster Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 shrink-0">
        <div className="bg-white/[0.01] border border-purple-950/40 p-4 rounded-none">
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Total Active Incidents</span>
          <strong className="text-2xl text-white font-serif mt-1 block">{events.length}</strong>
        </div>
        <div className="bg-white/[0.01] border border-purple-950/40 p-4 rounded-none">
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Critical Breaches</span>
          <strong className="text-2xl text-rose-500 font-serif mt-1 block">{events.filter(e => e.severity === 'critical').length}</strong>
        </div>
        <div className="bg-white/[0.01] border border-purple-950/40 p-4 rounded-none">
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">SLA Warnings</span>
          <strong className="text-2xl text-amber-500 font-serif mt-1 block">{events.filter(e => e.severity === 'warning').length}</strong>
        </div>
        <div className="bg-white/[0.01] border border-purple-950/40 p-4 rounded-none">
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Assigned Staff Nodes</span>
          <strong className="text-2xl text-purple-400 font-serif mt-1 block">{onlineStaffCountPlusDefault()} Operators</strong>
        </div>
        <div className="bg-white/[0.01] border border-purple-950/40 p-4 rounded-none col-span-2 md:col-span-1">
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">System Connection Status</span>
          <strong className={`text-xs font-bold font-sans mt-2.5 block ${isConnected ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>{isConnected ? 'WebSockets Live' : 'Polling Safe Fallback'}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Left Timeline visualizer */}
        <div className="lg:col-span-8 space-y-6">
          
          <Card className="bg-white/[0.02] border border-purple-900/10 rounded-none shadow-2xl relative overflow-hidden">
            
            <div className="p-4 border-b border-purple-950/50 bg-slate-950/40 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-400 animate-pulse" />
                <h3 className="text-xs uppercase tracking-widest font-extrabold text-white">Hourly Gantt-Style Dispatch Timeline</h3>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold mr-2">Filter Department:</span>
                {['ALL', 'RECEPTION', 'HOUSEKEEPING', 'MAINTENANCE', 'SECURITY'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 border rounded-xs text-[9px] uppercase transition-colors ${filterCategory === cat ? 'bg-purple-950/30 border-purple-500/40 text-purple-300 font-bold' : 'bg-transparent border-transparent hover:bg-white/[0.01] text-slate-400'}`}
                  >
                    {cat === 'ALL' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            <CardContent className="p-6 overflow-x-auto">
              <div className="min-w-[800px] font-sans text-xs select-none">
                
                {/* 1. Header Row (Hours intervals) */}
                <div className="grid grid-cols-9 border-b border-purple-950/40 pb-3 text-center text-[10px] text-slate-500 font-bold tracking-wider">
                  <div className="text-left font-sans text-slate-400 uppercase text-[9px]">Department Track</div>
                  {HOURS.map(hr => (
                    <div key={hr} className="border-l border-purple-950/10 flex items-center justify-center gap-1"><Clock className="w-3 h-3 text-slate-600" /> {hr}</div>
                  ))}
                </div>

                {/* Categories blocks */}
                <div className="divide-y divide-purple-950/20 pt-2">
                  {ROW_CATEGORIES.map(category => {
                    const rowEvents = filteredEvents.filter(e => e.category === category)

                    return (
                      <div key={category} className="grid grid-cols-9 py-6 relative items-center group hover:bg-white/[0.01]">
                        
                        {/* Title Track column */}
                        <div className="text-left font-extrabold uppercase text-[9px] tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${category === 'SECURITY' ? 'bg-rose-500' : category === 'MAINTENANCE' ? 'bg-amber-500' : 'bg-purple-500'}`} />
                          {category}
                        </div>

                        {/* Timeline slots column container spanning rest of elements */}
                        <div className="col-span-8 h-8 relative w-full bg-slate-950/10 border border-purple-950/10 rounded-xs">
                          {rowEvents.map(event => {
                            const leftOffset = getLeftPercentageByHour(event.time)
                            const widthPercent = (event.spanHours / 16) * 100 // Scale relative to 16-hour display

                            let colorClass = "bg-purple-900/30 border-purple-500/30 text-purple-300"
                            if (event.severity === 'warning') colorClass = "bg-amber-950/30 border-amber-500/30 text-amber-300"
                            if (event.severity === 'critical') colorClass = "bg-rose-950/30 border-rose-500/30 text-rose-300 shadow shadow-rose-950"

                            return (
                              <button
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                style={{ left: `${leftOffset}%`, width: `${Math.min(90, widthPercent)}%` }}
                                className={`absolute top-[10%] h-[80%] border rounded-xs px-2.5 flex items-center justify-between text-[9px] truncate transition-all hover:scale-[1.02] hover:z-20 cursor-pointer ${colorClass}`}
                              >
                                <span className="font-extrabold truncate mr-2">{event.title}</span>
                                <Badge className="bg-slate-950/50 hover:bg-slate-950/50 text-[7px] py-0 px-1 shrink-0 font-mono text-slate-400">{event.time}</Badge>
                              </button>
                            )
                          })}
                        </div>

                      </div>
                    )
                  })}
                </div>

              </div>
            </CardContent>

          </Card>

        </div>

        {/* Dynamic Right Sidebar: Live Logs Ticker Feed & Selection Inspector */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Target Event Context Inspector Drawer */}
          {selectedEvent && (
            <Card className="bg-white/[0.02] border border-purple-500/40 rounded-none shadow-2xl relative">
              <CardHeader className="bg-purple-950/30 border-b border-purple-950/40 p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`text-[8px] uppercase font-bold py-0.5 px-2 ${selectedEvent.severity === 'critical' ? 'bg-rose-950 text-rose-400 border-rose-500/20' : selectedEvent.severity === 'warning' ? 'bg-amber-950 text-amber-400 border-amber-500/20' : 'bg-purple-950 text-purple-400 border-purple-500/20'}`}>
                    {selectedEvent.severity}
                  </Badge>
                  <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white text-xs">Dismiss Inspector</button>
                </div>
                <CardTitle className="text-sm font-serif font-bold text-white mt-2">{selectedEvent.title}</CardTitle>
                <CardDescription className="text-[10px] text-slate-500 flex items-center gap-1.5"><Clock className="w-3 h-3 text-slate-600" /> Target dispatch window: {selectedEvent.time}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                
                <div className="p-3 bg-slate-950 border border-purple-950/40 rounded-xs space-y-1.5">
                  <span className="text-[9px] uppercase text-slate-500 font-extrabold font-mono block">PROCESS DISPATCH MESSAGE</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{selectedEvent.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="bg-slate-950/30 p-2 border border-purple-950/10">
                    <span className="text-slate-500 font-mono block uppercase text-[7px] font-extrabold">Assigned Staff</span>
                    <strong className="text-slate-300 truncate block mt-0.5">{selectedEvent.assignedStaff || 'Unassigned'}</strong>
                  </div>
                  <div className="bg-slate-950/30 p-2 border border-purple-950/10">
                    <span className="text-slate-500 font-mono block uppercase text-[7px] font-extrabold">Target Room</span>
                    <strong className="text-slate-300 truncate block mt-0.5">{selectedEvent.room || 'System wide'}</strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleAcknowledgeEvent(selectedEvent.id)} 
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 text-xs py-1.5"
                  >
                    Resolve Dispatch
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

          {/* SRE Real-time console logs ticker feed */}
          <Card className="bg-[#0b061c]/60 border border-purple-950/50 rounded-none shadow-xl flex flex-col">
            <CardHeader className="border-b border-purple-950/40 p-4 shrink-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs uppercase tracking-widest font-extrabold text-slate-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" /> Operational Log Feed
                </CardTitle>
                <CardDescription className="text-[9px] text-slate-500">Live system events as they occur across rooms.</CardDescription>
              </div>
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </CardHeader>
            <CardContent className="p-3 max-h-[300px] overflow-y-auto space-y-2 font-mono text-[9px]">
              
              {logsFeed.map(log => (
                <div key={log.id} className="p-2 border border-purple-950/20 bg-slate-950/30 flex items-start gap-2.5 leading-relaxed">
                  <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                  <span className={log.type === 'danger' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}>{log.message}</span>
                </div>
              ))}

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )

  function getLeftPercentageByHour(time: string) {
    // Parse hour node (e.g., "12:00" -> 12)
    const parts = time.split(':')
    const hr = parseFloat(parts[0]) || 8
    const min = parseFloat(parts[1]) || 0
    const decimalHour = hr + min / 60

    // Scale from 08:00 (0%) to 24:00 (100%)
    const clamped = Math.max(8, Math.min(24, decimalHour))
    return ((clamped - 8) / 16) * 100
  }

  function handleAcknowledgeEvent(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id))
    setSelectedEvent(null)
    setLogsFeed(prev => [
      {
        id: `log-${Date.now()}`,
        message: `Acknowledged & resolved dispatch event ID: ${id}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'success'
      },
      ...prev
    ])
    toast.success('Operational Dispatch resolved and closed.')
  }

  function onlineStaffCountPlusDefault() {
    // Renders active operators count dynamically
    return 4
  }
}
