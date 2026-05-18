"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { 
  Flame, 
  Activity, 
  Settings, 
  Database, 
  WifiOff, 
  AlertOctagon, 
  CheckCircle2, 
  RefreshCw, 
  ShieldAlert,
  Sliders,
  Zap,
  BarChart2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function SreChaosConsole() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [scenarios, setScenarios] = useState<any[]>([])
  const [chaosLog, setChaosLog] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Simulation parameters for layout visualization
  const [simulatedLatency, setSimulatedLatency] = useState(0)
  const [simulatedLoad, setSimulatedLoad] = useState(24)

  const loadChaosState = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/chaos').then(r => r.json()).catch(() => null)
      if (res && res.scenarios) {
        setScenarios(res.scenarios)
        
        // Log active scenarios in the local log feed
        const activeList = res.scenarios.filter((s: any) => s.active).map((s: any) => s.name)
        if (activeList.length > 0) {
          addChaosLog(`[SYSTEM CHECK]: Active disruptions detected: ${activeList.join(', ')}`)
        } else {
          addChaosLog(`[SYSTEM CHECK]: All systems green. Zero injection anomalies.`)
        }
      }
    } catch (err) {
      toast.error('Failed to load Chaos engine registers.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessAdminDashboard(session)) {
      toast.error('Access Denied: SRE credentials required.')
      router.push('/auth/signin')
      return
    }

    loadChaosState()
    
    // Periodically update simulated load metrics
    const interval = setInterval(() => {
      setSimulatedLoad(Math.floor(20 + Math.random() * 15))
    }, 4000)

    return () => clearInterval(interval)
  }, [session, status, router, loadChaosState])

  const addChaosLog = (msg: string) => {
    const stamp = new Date().toLocaleTimeString()
    setChaosLog(prev => [`[${stamp}] ${msg}`, ...prev.slice(0, 30)])
  }

  // Toggle active scenario state
  const handleToggleScenario = (id: string) => {
    setScenarios(prev => prev.map(s => {
      if (s.id === id) {
        const nextState = !s.active
        addChaosLog(`[TOGGLE]: Scenario ${s.name} shifted to ${nextState ? 'ENABLED' : 'DISABLED'}`)
        return { ...s, active: nextState }
      }
      return s
    }))
  }

  // Update slider intensities
  const handleIntensityChange = (id: string, value: number) => {
    setScenarios(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, intensity: value }
      }
      return s
    }))
  }

  // Save scenarios to persistent storage
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true)
      const res = await fetch('/api/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarios })
      }).then(r => r.json())

      if (res && res.success) {
        toast.success('Chaos registers successfully committed to file-system persistent storage!', {
          icon: '🔥',
          style: { background: '#dc2626', color: '#fff' }
        })
        addChaosLog('[COMMIT]: Chaos states written to server. Live API delays registered.')
      } else {
        toast.error('Failed to commit chaos rules.')
      }
    } catch {
      toast.error('Error contacting chaos API.')
    } finally {
      setIsSaving(false)
    }
  }

  // Trigger local instant network delay test
  const runInstantNetworkSweep = async () => {
    try {
      addChaosLog('[SWEEP]: Querying rooms API to measure latency impact...')
      const start = Date.now()
      const res = await fetch('/api/rooms?limit=1').then(r => r.json()).catch(() => null)
      const delta = Date.now() - start
      setSimulatedLatency(delta)
      addChaosLog(`[SWEEP]: Rooms endpoint resolved in ${delta}ms. (Status: ${res ? 'OK' : 'FAIL'})`)
    } catch (err) {
      addChaosLog(`[SWEEP ERROR]: Rooms API unreachable or timed out.`)
    }
  }

  const getIntensityUnit = (id: string) => {
    if (id === 'DB_LATENCY') return 'ms'
    return '%'
  }

  const getScenarioIcon = (id: string) => {
    if (id === 'DB_LATENCY') return <Database className="w-5 h-5 text-amber-400" />
    if (id === 'SOCKET_DROP') return <WifiOff className="w-5 h-5 text-rose-400" />
    return <AlertOctagon className="w-5 h-5 text-indigo-400" />
  }

  const anyChaosActive = scenarios.some(s => s.active)

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <PremiumSpinner size="lg" text="Entering SRE Chaos simulation deck..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090514] text-slate-100 p-6 font-sans">
      
      {/* Chaos Title Header Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-rose-950/40 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-rose-600/10 text-rose-400 border border-rose-500/30 text-xs tracking-wider uppercase font-bold py-1 px-3">
              CHAOS PLATFORM ACTIVE
            </Badge>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mt-2">SRE Chaos Engineering Cockpit</h1>
          <p className="text-slate-400 text-sm mt-1">Inject intentional database slow-downs, simulate web-socket drops, and trigger third-party OTA provider outages.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadChaosState} variant="outline" size="sm" className="bg-white/5 border-rose-950/50 text-rose-300">
            <RefreshCw className="w-4 h-4 mr-2" /> Reload Registers
          </Button>
          <Button 
            onClick={handleSaveChanges} 
            disabled={isSaving}
            className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border-0 font-semibold shadow-lg shadow-rose-950"
          >
            {isSaving ? "Syncing..." : "Commit Chaos Rules"}
          </Button>
        </div>
      </div>

      {/* Grid: Toggles & Metrics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Chaos switches */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-white/[0.02] border border-rose-950/20 rounded-none shadow-xl">
            <CardHeader className="border-b border-rose-950/40">
              <CardTitle className="text-sm uppercase tracking-widest font-extrabold text-rose-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-400" /> Disruptive Injection Rules
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">Toggle scenarios and adjust degradation scales below.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 divide-y divide-rose-950/30">
              
              {scenarios.map((scen) => (
                <div key={scen.id} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* Scenario Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <span className="p-3 bg-white/[0.02] border border-rose-950/20 flex items-center justify-center rounded">
                      {getScenarioIcon(scen.id)}
                    </span>
                    <div>
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        {scen.name}
                        {scen.active && (
                          <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                          </span>
                        )}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-md">{scen.description}</p>
                    </div>
                  </div>

                  {/* Intensity controls */}
                  <div className="flex items-center gap-6">
                    {scen.active && (
                      <div className="w-[160px] space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                          <span>Intensity Limit:</span>
                          <span className="font-bold text-rose-400">{scen.intensity}{getIntensityUnit(scen.id)}</span>
                        </div>
                        <input 
                          type="range"
                          min={scen.id === 'DB_LATENCY' ? 1000 : 10}
                          max={scen.id === 'DB_LATENCY' ? 5000 : 100}
                          step={scen.id === 'DB_LATENCY' ? 500 : 10}
                          value={scen.intensity}
                          onChange={(e) => handleIntensityChange(scen.id, Number(e.target.value))}
                          className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                      </div>
                    )}

                    {/* Action Switch */}
                    <button
                      onClick={() => handleToggleScenario(scen.id)}
                      className={`w-14 h-7 p-1 rounded-full transition-colors flex items-center ${scen.active ? 'bg-rose-600 justify-end' : 'bg-slate-950 border border-slate-800 justify-start'}`}
                    >
                      <span className="w-5 h-5 bg-white rounded-full shadow-md" />
                    </button>
                  </div>

                </div>
              ))}

            </CardContent>
          </Card>

          {/* SRE Terminal Logger Output */}
          <Card className="bg-slate-950 border border-rose-950/20 rounded-none overflow-hidden">
            <CardHeader className="border-b border-rose-950/30 p-4 flex flex-row items-center justify-between bg-slate-950/50">
              <CardTitle className="text-[10px] font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-rose-400" /> Chaos Command Logger Console
              </CardTitle>
              <Button onClick={() => setChaosLog([])} variant="ghost" className="h-5 text-[8px] uppercase font-bold text-slate-500 hover:text-white">
                Clear Buffer
              </Button>
            </CardHeader>
            <CardContent className="p-4 font-mono text-[10px] text-rose-300/80 space-y-1 max-h-[220px] overflow-y-auto">
              {chaosLog.length === 0 ? (
                <div className="text-slate-600 text-center py-6">Console buffer completely clear. Monitoring triggers...</div>
              ) : (
                chaosLog.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap leading-relaxed border-b border-slate-900 pb-1 last:border-b-0">{log}</div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Alert indicators & metrics */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active status indicator panel */}
          <Card className={`p-6 border rounded-none ${anyChaosActive ? 'bg-rose-950/5 border-rose-500/20' : 'bg-emerald-950/5 border-emerald-500/20'}`}>
            <div className="flex items-center gap-3">
              {anyChaosActive ? (
                <Flame className="w-8 h-8 text-rose-500 animate-pulse animate-spin-slow" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
              )}
              <div>
                <h4 className="font-bold text-slate-200 text-sm">
                  {anyChaosActive ? "DISRUPTIVE STATE ACTIVE" : "STABILITY METRICS IDEAL"}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
                  {anyChaosActive ? "Anomalous injections active on api routes" : "No active artificial anomalies"}
                </p>
              </div>
            </div>
          </Card>

          {/* Alert meter stats cards */}
          <Card className="bg-white/[0.02] border border-rose-950/10 rounded-none shadow-xl">
            <CardHeader className="border-b border-rose-950/15 pb-4">
              <CardTitle className="text-xs uppercase tracking-widest font-extrabold text-slate-400 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-rose-400" /> SRE Telemetry Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>Simulated Thread Load:</span>
                  <span className="font-bold text-slate-200">{simulatedLoad}%</span>
                </div>
                <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div style={{ width: `${simulatedLoad}%` }} className="bg-rose-500 h-full transition-all duration-1000" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>Test API Latency:</span>
                  <span className="font-bold text-slate-200">{simulatedLatency}ms</span>
                </div>
                <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div style={{ width: `${Math.min(simulatedLatency / 50, 100)}%` }} className="bg-amber-500 h-full transition-all duration-300" />
                </div>
              </div>

              <Button 
                onClick={runInstantNetworkSweep}
                className="w-full bg-rose-950/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/25 h-8 text-[10px] font-bold uppercase tracking-wider rounded-none mt-2"
              >
                Launch Latency Sweep Test
              </Button>

            </CardContent>
          </Card>

          {/* Shield Governance Note */}
          <Card className="bg-gradient-to-b from-[#120a26]/10 to-transparent border border-purple-900/10 rounded-none p-5">
            <div className="flex items-center gap-2.5 text-purple-400 mb-2">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="font-bold text-slate-200 text-sm">Graceful Degradation Checks</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Our automated QA/SRE framework triggers database transactions sequentially while chaos injections are enabled, confirming that front office receptionist timelines and kitchen dashboard lists display robust retry loaders and never crash.
            </p>
          </Card>

        </div>

      </div>

    </div>
  )
}
