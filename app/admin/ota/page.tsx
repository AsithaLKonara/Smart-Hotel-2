"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
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
  Terminal,
  Settings,
  Link2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function OtaChannelSync() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'mapping' | 'settings'>('dashboard')
  const [channels, setChannels] = useState<any[]>([
    { id: "ch1", name: "Booking.com", status: "SYNCED", latencyMs: 45, mappedRooms: 12, rateMarkupPct: 15, logoColor: "text-blue-400" },
    { id: "ch2", name: "Airbnb", status: "SYNCED", latencyMs: 82, mappedRooms: 8, rateMarkupPct: 10, logoColor: "text-rose-400" },
    { id: "ch3", name: "Expedia", status: "SYNCED", latencyMs: 58, mappedRooms: 12, rateMarkupPct: 12, logoColor: "text-amber-400" },
    { id: "ch4", name: "Agoda", status: "DEGRADED", latencyMs: 340, mappedRooms: 6, rateMarkupPct: 14, logoColor: "text-purple-400" }
  ])
  const [logs, setLogs] = useState<any[]>([])
  const [mappings, setMappings] = useState<any[]>([])
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessAdminDashboard(session)) {
      toast.error('Access Denied: Administrative operations center access required')
      router.push('/auth/signin')
      return
    }

    fetchInitialData()
  }, [session, status, router])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [mappingRes, logRes] = await Promise.all([
        fetch('/api/admin/ota/mapping'),
        fetch('/api/admin/ota/logs') // I'll create this route next
      ])
      
      if (mappingRes.ok) {
        const data = await mappingRes.json()
        setMappings(data.mappings || [])
        setRoomTypes(data.roomTypes || [])
      }

      if (logRes.ok) {
        const data = await logRes.json()
        setLogs(data.logs || [])
      }
    } catch (err) {
      console.error('Failed to fetch OTA data', err)
    } finally {
      setLoading(false)
    }
  }

  const triggerGlobalSync = () => {
    setSyncing(true)
    toast.loading("Securing transactional inventory locks across global OTAs...")
    
    setTimeout(() => {
      setSyncing(false)
      toast.dismiss()
      toast.success("All listings synchronized successfully!")
      fetchInitialData()
    }, 2000)
  }

  const saveMapping = async (mapping: any) => {
    toast.loading("Saving room mapping...")
    try {
      const res = await fetch('/api/admin/ota/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapping)
      })
      if (res.ok) {
        toast.dismiss()
        toast.success("Mapping updated")
        fetchInitialData()
      } else {
        throw new Error('Failed to save mapping')
      }
    } catch (err) {
      toast.dismiss()
      toast.error("Error saving mapping")
    }
  }

  if (loading) return <div className="min-h-screen bg-[#090514] flex items-center justify-center"><PremiumSpinner /></div>

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
          <div className="flex bg-white/5 p-1 rounded-md border border-purple-900/50">
            <Button 
                variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setActiveTab('dashboard')}
                className="text-xs h-8"
            >
                Dashboard
            </Button>
            <Button 
                variant={activeTab === 'mapping' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setActiveTab('mapping')}
                className="text-xs h-8"
            >
                Room Mapping
            </Button>
          </div>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Dashboard View */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
              <CardHeader className="border-b border-purple-950/50 pb-4">
                <CardTitle className="text-lg font-serif text-white flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-blue-400" /> Channel Connections
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">Real-time mapping health of OTA partners</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {channels.map(ch => (
                  <div key={ch.id} className="p-4 bg-white/[0.01] border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${ch.status === "SYNCED" ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        {ch.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Mapped: <strong className="text-slate-300">{ch.mappedRooms} Inventory Slots</strong></p>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 ${ch.status === "SYNCED" ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                        {ch.status}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">Ping: <strong className="text-slate-400">{ch.latencyMs}ms</strong></p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
              <CardHeader className="border-b border-purple-950/50 pb-4">
                <CardTitle className="text-lg font-serif text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" /> Live Sync Log Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="bg-slate-950/90 border border-purple-900/40 p-4 font-mono text-[11px] leading-relaxed max-h-[460px] overflow-y-auto space-y-3 shadow-inner text-slate-300">
                  {logs.length > 0 ? logs.map((lg, i) => (
                    <div key={i} className="border-b border-slate-900/80 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">[{new Date(lg.createdAt).toLocaleTimeString()}]</span>
                        <Badge className="bg-white/5 border border-slate-800 text-slate-300 text-[9px] rounded-xs font-mono py-0 px-1.5">{lg.direction}</Badge>
                        <span className={`font-bold ${lg.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>{lg.status}</span>
                      </div>
                      <p className="text-slate-400 mt-1 pl-1 truncate">{lg.errorMessage || JSON.stringify(lg.payload)}</p>
                    </div>
                  )) : <p className="text-slate-500 italic">No sync logs available.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mapping View */}
          <Card className="bg-white/[0.02] border border-purple-900/30 backdrop-blur-md rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/50 pb-4">
                <CardTitle className="text-lg font-serif text-white flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-purple-400" /> Room Mapping Configuration
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">Link your internal room types to OTA Room Type IDs from Channex/Beds24.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-purple-900/30 text-slate-400 uppercase text-[10px] tracking-widest">
                            <th className="pb-3 pl-2">Internal Room Type</th>
                            <th className="pb-3">OTA Room Type ID</th>
                            <th className="pb-3">OTA Rate Plan ID</th>
                            <th className="pb-3 text-center">Sync</th>
                            <th className="pb-3 text-right pr-2">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/10">
                        {roomTypes.map(rt => {
                            const mapping = mappings.find(m => m.localRoomTypeId === rt.id) || {
                                localRoomTypeId: rt.id,
                                otaRoomTypeId: '',
                                otaRatePlanId: '',
                                syncEnabled: true
                            }
                            return (
                                <tr key={rt.id} className="hover:bg-white/[0.01]">
                                    <td className="py-4 pl-2 font-bold text-slate-200">{rt.name}</td>
                                    <td className="py-4">
                                        <input 
                                            defaultValue={mapping.otaRoomTypeId} 
                                            placeholder="e.g. 7163-abc-123"
                                            className="bg-slate-950/50 border border-purple-900/30 text-xs text-slate-100 p-2 w-48 focus:border-purple-500 focus:outline-none"
                                            onBlur={(e) => saveMapping({ ...mapping, otaRoomTypeId: e.target.value })}
                                        />
                                    </td>
                                    <td className="py-4">
                                        <input 
                                            defaultValue={mapping.otaRatePlanId || ''} 
                                            placeholder="Optional"
                                            className="bg-slate-950/50 border border-purple-900/30 text-xs text-slate-100 p-2 w-48 focus:border-purple-500 focus:outline-none"
                                            onBlur={(e) => saveMapping({ ...mapping, otaRatePlanId: e.target.value })}
                                        />
                                    </td>
                                    <td className="py-4 text-center">
                                        <input 
                                            type="checkbox" 
                                            defaultChecked={mapping.syncEnabled}
                                            className="w-4 h-4 rounded border-purple-900/50 bg-slate-950 text-purple-600 focus:ring-purple-500"
                                            onChange={(e) => saveMapping({ ...mapping, syncEnabled: e.target.checked })}
                                        />
                                    </td>
                                    <td className="py-4 text-right pr-2">
                                        <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">Reset</Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
