"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { 
  ShieldAlert, 
  Activity, 
  User, 
  Timer, 
  Clock, 
  RefreshCw, 
  Send, 
  Flame, 
  CheckCircle, 
  Sliders, 
  ArrowRight,
  Database,
  Layers,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

// Dynamic State lifecycle path lists
const LIFECYCLE_STATES = ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'MITIGATED', 'RESOLVED', 'CLOSED']

interface Incident {
  id: string
  title: string
  category: 'RECEPTION' | 'HOUSEKEEPING' | 'DINING' | 'MAINTENANCE' | 'SECURITY'
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY'
  status: 'OPEN' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'CLOSED'
  owner: string
  slaMinutesRemaining: number
  message: string
  notes: string
  createdAt: string
}

export default function IncidentCommandRoom() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null)
  
  // Custom creator dialog state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTitle, setNewTitle] = useState("Keycard Sensor Disconnect")
  const [newCategory, setNewCategory] = useState<'RECEPTION' | 'HOUSEKEEPING' | 'DINING' | 'MAINTENANCE' | 'SECURITY'>('SECURITY')
  const [newSeverity, setNewSeverity] = useState<'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY'>('CRITICAL')
  const [newOwner, setNewOwner] = useState("SRE Security Desk")
  const [newMessage, setNewMessage] = useState("RFID card readers on floor 3 reporting consecutive timeout dropouts.")

  // Edit states inside investigator drawer
  const [notesDraft, setNotesDraft] = useState("")
  const [ownerDraft, setOwnerDraft] = useState("")

  useEffect(() => {
    if (status === 'loading') return
    if (!canAccessAdminDashboard(session)) {
      toast.error('Access Denied: Administrative credentials required.')
      router.push('/auth/signin')
      return
    }

    loadIncidents()
  }, [session, status, router])

  const loadIncidents = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/incidents').then(r => r.json()).catch(() => null)
      if (res && res.incidents) {
        setIncidents(res.incidents)
      }
    } catch {
      toast.error('Failed to load active incident states.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast.error('Please enter a descriptive incident title.')
      return
    }

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          severity: newSeverity,
          owner: newOwner,
          message: newMessage
        })
      }).then(r => r.json())

      if (res && res.success) {
        toast.success(`Incident ticket ${res.incident.id} opened!`, {
          icon: '🚨',
          style: { background: '#f43f5e', color: '#fff' }
        })
        setShowCreateForm(false)
        loadIncidents()
      } else {
        toast.error('Failed to register incident.')
      }
    } catch {
      toast.error('Error dispatching POST request.')
    }
  }

  const handleUpdateIncident = async (statusUpdate?: string) => {
    if (!activeIncident) return

    try {
      const payload = {
        id: activeIncident.id,
        status: statusUpdate || activeIncident.status,
        notes: notesDraft,
        owner: ownerDraft
      }

      const res = await fetch('/api/incidents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json())

      if (res && res.success) {
        toast.success(`Incident ${activeIncident.id} successfully updated!`)
        loadIncidents()
        setActiveIncident(res.incident)
      } else {
        toast.error('Failed to update incident parameters.')
      }
    } catch {
      toast.error('Error dispatching PATCH request.')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <PremiumSpinner size="lg" text="Syncing Incident Command Center lifecycle engine..." />
      </div>
    )
  }

  // Interactive Department pressure mock variables
  const DEPARTMENTS_PRESSURE = [
    { name: 'Reception / Front Desk', index: 38, workload: 'Normal Pacing', color: 'bg-emerald-500' },
    { name: 'Housekeeping Desk', index: 84, workload: 'High Overload Risk', color: 'bg-amber-500 animate-pulse' },
    { name: 'Kitchen / Dining SLA', index: 45, workload: 'Moderate Pacing', color: 'bg-emerald-500' },
    { name: 'Maintenance HVAC', index: 92, workload: 'CRITICAL PRESSURE', color: 'bg-rose-500 animate-ping' }
  ]

  return (
    <div className="min-h-screen bg-[#090514] text-slate-100 p-6 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* Top Command Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-purple-950/40 pb-5 mb-5 shrink-0 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-rose-600/10 text-rose-400 border border-rose-500/20 text-xs tracking-wider uppercase font-bold py-1 px-3 flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" /> SECURITY & SRE COMMAND CENTER
            </Badge>
            <span className="text-xs text-slate-400 flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> Incident Orchestrator Live</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mt-1.5">Enterprise Incident Control Room</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowCreateForm(prev => !prev)} className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white border-0 font-bold uppercase tracking-wider text-xs px-4">
            {showCreateForm ? "Cancel Form" : "File Critical Incident"}
          </Button>
          <Button onClick={loadIncidents} variant="outline" size="sm" className="bg-white/5 border-purple-950/50 text-purple-300">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Reload Dashboard
          </Button>
          <Button onClick={() => router.push('/admin/timeline')} variant="outline" size="sm" className="bg-white/5 border-purple-950/50 text-purple-300">
            Unified Timeline
          </Button>
        </div>
      </div>

      {/* 1. Department Pressure Heatmaps Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
        {DEPARTMENTS_PRESSURE.map((dept, idx) => (
          <Card key={idx} className="bg-white/[0.01] border border-purple-950/40 p-4 rounded-none">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 truncate">{dept.name}</span>
              <span className="text-xs font-mono font-extrabold text-slate-200">{dept.index}% Load</span>
            </div>
            
            {/* Visual Heatmap Indicator Bar */}
            <div className="w-full h-1.5 bg-slate-950/50 rounded-full overflow-hidden mb-1.5">
              <div className={`h-full ${dept.color}`} style={{ width: `${dept.index}%` }} />
            </div>

            <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
              <Flame className="w-3 h-3 text-amber-500" /> State: <span className="text-slate-300 font-bold">{dept.workload}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Column: Interactive Incidents Grid */}
        <div className="lg:col-span-8 flex flex-col min-h-0">
          
          {/* Create Incident form overlay */}
          {showCreateForm ? (
            <Card className="bg-white/[0.02] border border-rose-500/20 rounded-none shadow-2xl p-6 overflow-y-auto max-h-full">
              <h3 className="text-sm uppercase tracking-widest font-extrabold text-rose-400 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" /> File New Operational Incident Ticket
              </h3>
              <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Incident Title</label>
                    <input 
                      type="text" 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-purple-900/20 text-slate-200 p-2.5 rounded-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Owner Dispatcher</label>
                    <input 
                      type="text" 
                      value={newOwner} 
                      onChange={e => setNewOwner(e.target.value)}
                      className="w-full bg-slate-950 border border-purple-900/20 text-slate-200 p-2.5 rounded-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Category Division</label>
                    <select 
                      value={newCategory} 
                      onChange={e => setNewCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-purple-900/20 p-2.5 focus:outline-none"
                    >
                      <option value="RECEPTION">Reception</option>
                      <option value="HOUSEKEEPING">Housekeeping</option>
                      <option value="DINING">Dining</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="SECURITY">Security / SRE</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Severity Metric Level</label>
                    <select 
                      value={newSeverity} 
                      onChange={e => setNewSeverity(e.target.value as any)}
                      className="w-full bg-slate-950 border border-purple-900/20 p-2.5 focus:outline-none"
                    >
                      <option value="INFO">INFO</option>
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="EMERGENCY">EMERGENCY</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Diagnostic Message</label>
                  <textarea 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-purple-900/20 text-slate-200 p-2.5 rounded-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold uppercase tracking-wider h-11 border-0"
                >
                  Register Critical Incident
                </Button>

              </form>
            </Card>
          ) : (
            <Card className="bg-white/[0.01] border border-purple-900/10 rounded-none flex-1 flex flex-col min-h-0">
              
              <div className="p-4 border-b border-purple-950/40 bg-slate-950/40 flex justify-between items-center shrink-0">
                <span className="text-xs uppercase tracking-widest font-extrabold text-purple-400">Active Incident Lifecycle Tracks</span>
                <Badge variant="outline" className="text-[9px] border-rose-500/30 text-rose-400 font-mono font-extrabold">{incidents.length} Registered Cases</Badge>
              </div>

              {/* Incidents Table-styled list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {incidents.length === 0 ? (
                  <div className="text-slate-600 text-center py-20 text-xs">No active operational incidents. System is completely stable.</div>
                ) : (
                  incidents.map((inc) => {
                    const isCritical = inc.severity === 'CRITICAL' || inc.severity === 'EMERGENCY'
                    const isSlaBreaching = inc.slaMinutesRemaining <= 10

                    return (
                      <button
                        key={inc.id}
                        onClick={() => {
                          setActiveIncident(inc)
                          setNotesDraft(inc.notes)
                          setOwnerDraft(inc.owner)
                        }}
                        className={`w-full p-4 border rounded-none flex items-start justify-between gap-4 transition-all text-left bg-slate-950/30 hover:bg-white/[0.02] border-purple-950/30 ${activeIncident?.id === inc.id ? 'bg-purple-950/10 border-purple-500/40' : ''}`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-slate-950 hover:bg-slate-950 text-[8px] font-mono border-purple-500/20 text-purple-300">{inc.id}</Badge>
                            <h4 className="text-xs font-extrabold text-slate-100 truncate block">{inc.title}</h4>
                            <Badge className={`text-[7px] py-0 px-1 uppercase ${isCritical ? 'bg-rose-950 text-rose-400 border-rose-500/25 animate-pulse' : 'bg-amber-950 text-amber-400 border-amber-500/25'}`}>
                              {inc.severity}
                            </Badge>
                          </div>

                          <p className="text-[10px] text-slate-500 truncate leading-relaxed">{inc.message}</p>

                          <div className="flex items-center gap-3.5 text-[9px] font-mono text-slate-500">
                            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-600" /> Owner: <strong className="text-slate-300">{inc.owner}</strong></span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-600" /> Filed: {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="flex items-center gap-1 uppercase font-bold text-slate-400"><Sliders className="w-3.5 h-3.5 text-slate-600" /> Status: <span className="text-purple-400 font-extrabold">{inc.status}</span></span>
                          </div>
                        </div>

                        {/* SLA timer indicator widget */}
                        <div className={`shrink-0 flex flex-col items-end text-right font-mono ${isSlaBreaching ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                          <span className="text-[8px] uppercase text-slate-500 font-extrabold">RESPONSE SLA</span>
                          <span className="text-[11px] flex items-center gap-1 mt-0.5"><Timer className={`w-3.5 h-3.5 ${isSlaBreaching ? 'animate-bounce text-rose-500' : 'text-slate-500'}`} /> {inc.slaMinutesRemaining}m left</span>
                        </div>

                      </button>
                    )
                  })
                )}
              </div>

            </Card>
          )}

        </div>

        {/* Right Column: Detailed Investigation Drawer Panel */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-0">
          
          {activeIncident ? (
            <Card className="bg-white/[0.02] border border-purple-500/20 rounded-none flex-1 flex flex-col min-h-0 shadow-2xl relative">
              
              <div className="border-b border-purple-950/40 p-4 bg-purple-950/20 shrink-0 flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="bg-slate-950 text-purple-400 text-[8px] uppercase font-mono font-extrabold tracking-wider px-2 py-0.5">{activeIncident.id} Lifecycle</Badge>
                  <h3 className="text-xs uppercase tracking-widest font-extrabold text-slate-200 mt-1.5 truncate max-w-[200px]">{activeIncident.title}</h3>
                </div>
                <button onClick={() => setActiveIncident(null)} className="text-slate-500 hover:text-white text-xs">Dismiss</button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                
                <div className="space-y-1">
                  <span className="text-[9px] uppercase text-slate-500 font-extrabold font-mono block">DIAGNOSTIC EVENT DATA</span>
                  <div className="p-3 bg-slate-950 border border-purple-950/30 leading-relaxed text-slate-300 rounded-none">
                    {activeIncident.message}
                  </div>
                </div>

                {/* State timeline steps visual */}
                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase text-slate-500 font-extrabold font-mono block">TRANSITION LIFE STATES</span>
                  <div className="grid grid-cols-6 border border-purple-950/40 divide-x divide-purple-950/30 text-[7px] text-center font-bold font-mono">
                    {LIFECYCLE_STATES.map((st) => {
                      const isActive = activeIncident.status === st
                      return (
                        <button
                          key={st}
                          onClick={() => handleUpdateIncident(st)}
                          className={`py-1.5 truncate ${isActive ? 'bg-purple-600/20 text-purple-300 font-extrabold border-purple-500/20' : 'bg-slate-950 text-slate-600 hover:text-slate-400'}`}
                        >
                          {st.substr(0, 5)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Edit forms */}
                <div className="space-y-3">
                  
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-slate-500 font-extrabold font-mono block">Owner Assignee</label>
                    <input 
                      type="text" 
                      value={ownerDraft} 
                      onChange={e => setOwnerDraft(e.target.value)}
                      className="w-full bg-slate-950 border border-purple-900/20 text-slate-200 p-2.5 rounded-none font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-slate-500 font-extrabold font-mono block">Investigator Forensic Notes</label>
                    <textarea 
                      value={notesDraft} 
                      onChange={e => setNotesDraft(e.target.value)}
                      rows={4}
                      placeholder="e.g. Shutoff compressor, replaying logs."
                      className="w-full bg-slate-950 border border-purple-900/20 text-slate-200 p-2.5 rounded-none font-sans leading-relaxed"
                    />
                  </div>

                </div>

                <Button 
                  onClick={() => handleUpdateIncident()} 
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold uppercase tracking-wider h-11 border-0"
                >
                  Commit Forensic Updates
                </Button>

              </div>

            </Card>
          ) : (
            <Card className="bg-white/[0.01] border border-purple-900/10 rounded-none flex-1 flex flex-col justify-center items-center p-6 text-center text-slate-600">
              <Sparkles className="w-10 h-10 text-purple-950 animate-pulse mb-3" />
              <h4 className="font-bold text-slate-400 text-xs">Incident Investigator Pane</h4>
              <p className="text-[10px] mt-1 text-slate-500 leading-relaxed max-w-[200px]">Select any active incident ticket to review diagnostic details, record investigation notes, or transition operational states.</p>
            </Card>
          )}

        </div>

      </div>

    </div>
  )
}
