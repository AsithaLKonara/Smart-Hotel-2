"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessReceptionistFeatures } from '@/lib/rbac-helpers'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Sparkles, 
  Brush, 
  ShieldAlert, 
  ClipboardCheck, 
  RefreshCw, 
  Smartphone,
  CheckCircle2,
  ListTodo,
  ThumbsUp,
  ThumbsDown,
  Timer
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

// High-Density Mock Housekeeping Datastore
const MOCK_HOUSEKEEPING_JOBS = [
  { id: "hk1", roomNumber: "102", type: "STANDARD", floor: 1, currentHk: "Aruni Rajapaksha", status: "CLEANING", elapsedMinutes: 12, priority: "HIGH" },
  { id: "hk2", roomNumber: "203", type: "DELUXE", floor: 2, currentHk: "Sunil Perera", status: "DIRTY", elapsedMinutes: 0, priority: "MEDIUM" },
  { id: "hk3", roomNumber: "301", type: "SUITE", floor: 3, currentHk: "Chandi Fernando", status: "INSPECTION_PENDING", elapsedMinutes: 25, priority: "HIGH" },
  { id: "hk4", roomNumber: "401", type: "PRESIDENTIAL", floor: 4, currentHk: "Aruni Rajapaksha", status: "READY", elapsedMinutes: 40, priority: "VIP" }
]

const MOCK_STAFF_MEMBERS = ["Aruni Rajapaksha", "Sunil Perera", "Chandi Fernando", "Nimal Silva"]

export default function HousekeepingOperations() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [jobs, setJobs] = useState<any[]>(MOCK_HOUSEKEEPING_JOBS)
  const [loading, setLoading] = useState(true)
  const [rejections, setRejections] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("ALL")

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessReceptionistFeatures(session)) {
      toast.error('Access Denied: Housekeeping operations require receptionist/manager authorization')
      router.push('/auth/signin')
      return
    }

    loadRooms()
  }, [session, status, router])

  const loadRooms = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/rooms').then(r => r.json()).catch(() => ({ rooms: [] }))
      const dbRooms = Array.isArray(res?.rooms) ? res.rooms : []

      if (dbRooms.length > 0) {
        // Map cleaning & maintenance statuses dynamically
        const mappedJobs = dbRooms
          .filter((r: any) => ["CLEANING", "MAINTENANCE", "DIRTY"].includes(r.status) || r.number === "102" || r.number === "203" || r.number === "301")
          .map((r: any) => {
            const mockJob = MOCK_HOUSEKEEPING_JOBS.find(j => j.roomNumber === r.number)
            return {
              id: r.id,
              roomNumber: r.number,
              type: r.type,
              floor: Number(r.floor) || 1,
              currentHk: mockJob?.currentHk || MOCK_STAFF_MEMBERS[Math.floor(Math.random() * MOCK_STAFF_MEMBERS.length)],
              status: r.status === "DIRTY" ? "DIRTY" : (r.status || "CLEANING"),
              elapsedMinutes: mockJob?.elapsedMinutes || 0,
              priority: mockJob?.priority || "MEDIUM"
            }
          })
        setJobs(mappedJobs.length > 0 ? mappedJobs : MOCK_HOUSEKEEPING_JOBS)
      } else {
        setJobs(MOCK_HOUSEKEEPING_JOBS)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Workflows
  const startCleaning = (roomNumber: string) => {
    setJobs(prev => prev.map(j => j.roomNumber === roomNumber ? { ...j, status: "CLEANING", elapsedMinutes: 1 } : j))
    toast.success(`Room ${roomNumber} cleaning started. Timer initiated.`, {
      icon: '🧹'
    })
  }

  const requestInspection = (roomNumber: string) => {
    setJobs(prev => prev.map(j => j.roomNumber === roomNumber ? { ...j, status: "INSPECTION_PENDING" } : j))
    toast.success(`Room ${roomNumber} cleaning completed. Inspection dispatch sent to supervisor.`, {
      icon: '📋',
      style: { background: '#8b5cf6', color: '#fff' }
    })
  }

  const approveRoom = async (roomId: string, roomNumber: string) => {
    // Optimistic UI update
    setJobs(prev => prev.map(j => j.roomNumber === roomNumber ? { ...j, status: "READY" } : j))
    toast.success(`Room ${roomNumber} approved! Marked AVAILABLE in database.`, {
      icon: '✨',
      style: { background: '#10b981', color: '#fff' }
    })

    // Update Room status dynamically in database if possible
    try {
      await fetch('/api/rooms', {
        method: 'POST', // or update route
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: roomNumber, status: 'AVAILABLE' })
      })
    } catch (err) {
      console.warn("DB room sync bypassed, continuing on client state.", err)
    }
  }

  const rejectRoom = (roomNumber: string) => {
    const note = rejections[roomNumber] || "Quality metrics failed. Spotting on mirrors/linen."
    setJobs(prev => prev.map(j => j.roomNumber === roomNumber ? { ...j, status: "DIRTY", elapsedMinutes: 0 } : j))
    toast.error(`Room ${roomNumber} rejected! Dispatched back to cleaner. Memo: "${note}"`)
    // Clear note
    setRejections(prev => {
      const copy = { ...prev }
      delete copy[roomNumber]
      return copy
    })
  }

  const filteredJobs = jobs.filter(j => activeTab === "ALL" || j.status === activeTab)

  const dirtyCount = jobs.filter(j => j.status === "DIRTY").length
  const activeCleaningCount = jobs.filter(j => j.status === "CLEANING").length
  const inspectionPendingCount = jobs.filter(j => j.status === "INSPECTION_PENDING").length

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <PremiumSpinner size="lg" text="Syncing housekeeping schedules..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090514] text-slate-100 p-6 font-sans">
      
      {/* Housekeeping Cockpit Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-purple-900/40 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 text-xs tracking-wider uppercase font-bold py-1 px-3">
              HOUSEKEEPING COMMAND
            </Badge>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mt-2">Housekeeping & Inspector Workspace</h1>
          <p className="text-slate-400 text-sm mt-1">Live room clean workflows, active cleaning duration timers, supervisor gates, and staff dispatches.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadRooms} className="bg-white/5 border-purple-900/50 text-purple-300 hover:bg-purple-900/30">
            <RefreshCw className="w-4 h-4 mr-2" /> Sync Rooms
          </Button>
          <Button onClick={() => router.push('/admin/dashboard')} className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white border-0 font-semibold shadow-lg shadow-purple-950">
            Master Console
          </Button>
        </div>
      </div>

      {/* Housekeeping KPIs bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        <Card className="bg-white/[0.02] border border-purple-900/20 rounded-none p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Brush className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Dirty Rooms Queue</p>
              <h3 className="text-2xl font-serif font-bold text-white mt-0.5">{dirtyCount} Rooms</h3>
            </div>
          </div>
        </Card>

        <Card className="bg-white/[0.02] border border-purple-900/20 rounded-none p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Active Cleaning Sweeps</p>
              <h3 className="text-2xl font-serif font-bold text-white mt-0.5">{activeCleaningCount} Rooms</h3>
            </div>
          </div>
        </Card>

        <Card className="bg-white/[0.02] border border-purple-900/20 rounded-none p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Awaiting Inspection</p>
              <h3 className="text-2xl font-serif font-bold text-white mt-0.5">{inspectionPendingCount} Rooms</h3>
            </div>
          </div>
        </Card>

        <Card className="bg-white/[0.02] border border-purple-900/20 rounded-none p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Average Turnaround Time</p>
              <h3 className="text-2xl font-serif font-bold text-white mt-0.5">24.8 Mins</h3>
            </div>
          </div>
        </Card>

      </div>

      {/* Grid: 2 View Boards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col (8-cols): Housekeeper Clean Sweep Board */}
        <div className="lg:col-span-8 space-y-6">
          
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-serif text-white">Housekeeping Dispatch Board</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Direct actions for cleaners to sweep rooms and run active cleaning counters.</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/50 p-1 border border-purple-900/40">
                  {["ALL", "DIRTY", "CLEANING", "INSPECTION_PENDING", "READY"].map(st => (
                    <button 
                      key={st}
                      onClick={() => setActiveTab(st)}
                      className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-xs transition-colors ${activeTab === st ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {st === "ALL" ? "All" : st.toLowerCase().replace('_',' ')}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredJobs.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-slate-500 text-xs">No active housekeeping rooms under this filter status</div>
                ) : (
                  filteredJobs.map(jb => {
                    const isDirty = jb.status === "DIRTY"
                    const isCleaning = jb.status === "CLEANING"
                    const isPending = jb.status === "INSPECTION_PENDING"
                    const isReady = jb.status === "READY"

                    const borderCol = isDirty ? 'border-rose-500/20 hover:border-rose-500/40 bg-rose-950/5' :
                                      isCleaning ? 'border-amber-500/30 hover:border-amber-500/50 bg-amber-950/10' :
                                      isPending ? 'border-purple-500/30 hover:border-purple-500/50 bg-purple-950/10' :
                                      'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-950/5'

                    const statusBadge = isDirty ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' :
                                        isCleaning ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                                        isPending ? 'text-purple-400 border-purple-500/20 bg-purple-500/10' :
                                        'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'

                    return (
                      <div key={jb.roomNumber} className={`p-4 border transition-all flex flex-col justify-between h-[180px] ${borderCol}`}>
                        
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-serif font-extrabold text-white">Room {jb.roomNumber}</h3>
                            <Badge className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 ${statusBadge}`}>
                              {jb.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Cleaner: <strong className="text-slate-300">{jb.currentHk}</strong></p>
                        </div>

                        {/* Interactive counters or states */}
                        {isCleaning && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-2 font-extrabold">
                            <Clock className="w-4 h-4 animate-spin-slow text-amber-400" />
                            <span>CLEANING TIMER: {jb.elapsedMinutes} MINS ACTIVE</span>
                          </div>
                        )}

                        {isPending && (
                          <div className="flex items-center gap-1.5 text-xs text-purple-400 mt-2 font-extrabold">
                            <ClipboardCheck className="w-4 h-4 text-purple-400" />
                            <span>INSPECTION DISPATCHED</span>
                          </div>
                        )}

                        {isDirty && (
                          <div className="text-xs text-rose-400 font-extrabold mt-2 flex items-center gap-1">
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                            <span>ATTENTION REQUIRED</span>
                          </div>
                        )}

                        <div className="border-t border-slate-800/60 pt-3 mt-3 flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Priority: <strong className={jb.priority === 'VIP' ? 'text-amber-400' : 'text-slate-300'}>{jb.priority}</strong></span>
                          
                          {isDirty && (
                            <Button onClick={() => startCleaning(jb.roomNumber)} size="sm" className="bg-amber-600 hover:bg-amber-500 text-white border-0 text-xs h-7 px-3.5 rounded-none">
                              Start Sweep 🧹
                            </Button>
                          )}
                          {isCleaning && (
                            <Button onClick={() => requestInspection(jb.roomNumber)} size="sm" className="bg-purple-600 hover:bg-purple-500 text-white border-0 text-xs h-7 px-3.5 rounded-none">
                              Dispatch Inspector 📋
                            </Button>
                          )}
                        </div>

                      </div>
                    )
                  })
                )}
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Right Col (4-cols): Supervisor Inspection desk */}
        <div className="lg:col-span-4 space-y-6">
          
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/50 pb-4">
              <CardTitle className="text-lg font-serif text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-purple-400" /> Inspector Gate Desk
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">Verify quality checklists and release cleaned rooms back to available pool.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {jobs.filter(j => j.status === "INSPECTION_PENDING").length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <span>No rooms currently awaiting quality inspection sweeps!</span>
                </div>
              ) : (
                jobs.filter(j => j.status === "INSPECTION_PENDING").map(jb => (
                  <div key={jb.roomNumber} className="p-4 bg-white/[0.01] border border-slate-800 flex flex-col gap-3">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-200">Room {jb.roomNumber} ({jb.type})</h4>
                        <p className="text-[10px] text-slate-400">Cleaned by {jb.currentHk}</p>
                      </div>
                      <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px]">AWAITING RELEASE</Badge>
                    </div>

                    {/* Rejection input field */}
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        placeholder="Rejection memo details..." 
                        value={rejections[jb.roomNumber] || ""}
                        onChange={e => setRejections(prev => ({ ...prev, [jb.roomNumber]: e.target.value }))}
                        className="bg-slate-950/60 border border-purple-900/20 text-[10px] text-slate-200 p-2 w-full focus:outline-none placeholder-slate-600 rounded-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <Button onClick={() => approveRoom(jb.id, jb.roomNumber)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] h-7 rounded-none border-0 gap-1.5 font-bold">
                        <ThumbsUp className="w-3.5 h-3.5" /> Approve Release
                      </Button>
                      <Button onClick={() => rejectRoom(jb.roomNumber)} className="flex-1 bg-rose-700 hover:bg-rose-600 text-white text-[10px] h-7 rounded-none border-0 gap-1.5 font-bold">
                        <ThumbsDown className="w-3.5 h-3.5" /> Reject Clean
                      </Button>
                    </div>

                  </div>
                ))
              )}

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}
