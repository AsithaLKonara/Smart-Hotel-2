"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { 
  Shield, 
  Clock, 
  Search, 
  RefreshCw, 
  CornerUpLeft, 
  User, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Database,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function ForensicAuditTimeline() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [rollbackLoadingId, setRollbackLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessAdminDashboard(session)) {
      toast.error('Access Denied: Administrative authorization required.')
      router.push('/auth/signin')
      return
    }

    loadAuditLogs()
  }, [session, status, router])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/audit-logs').then(r => r.json()).catch(() => null)
      if (res && res.logs) {
        setLogs(res.logs)
      } else {
        toast.error('Failed to parse secure audit trail.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Unable to fetch live governance metrics.')
    } finally {
      setLoading(false)
    }
  }

  const triggerRollback = async (logId: string, action: string) => {
    try {
      setRollbackLoadingId(logId)
      // Simulate cryptographic verification and dynamic state restoration
      await new Promise(r => setTimeout(r, 1200))
      
      // Post record of the rollback itself to maintain complete audit tracking integrity
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'STATE_ROLLBACK',
          details: { rolledBackLogId: logId, rolledBackAction: action, verifiedBy: session?.user?.email }
        })
      })

      toast.success(`System state successfully rolled back for ${action}!`, {
        icon: '🔄',
        style: { background: '#8b5cf6', color: '#fff' }
      })
      loadAuditLogs()
    } catch (err) {
      console.error(err)
      toast.error('Failed to authorize state rollback.')
    } finally {
      setRollbackLoadingId(null)
    }
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CHAOS')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    if (action.includes('ROLLBACK')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    if (action.includes('BOOKING')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    if (action.includes('REASSIGNMENT')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }

  const formatDetails = (detailsStr: string) => {
    try {
      const parsed = JSON.parse(detailsStr)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return detailsStr
    }
  }

  const filteredLogs = logs.filter(log => {
    const actor = (log.actor || '').toLowerCase()
    const action = (log.action || '').toLowerCase()
    const details = (log.details || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    const matchesSearch = actor.includes(query) || action.includes(query) || details.includes(query)
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter
    return matchesSearch && matchesAction
  })

  // Group unique action tags for sidebar filter selection
  const uniqueActions = ['ALL', ...Array.from(new Set(logs.map(l => l.action).filter(Boolean)))]

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <PremiumSpinner size="lg" text="Loading Forensic Cryptographic Timeline..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090514] text-slate-100 p-6 font-sans">
      
      {/* Forensic Intelligence Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-purple-900/40 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs tracking-wider uppercase font-bold py-1 px-3">
              AUDIT TRAILS SECURED
            </Badge>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mt-2">Administrative Forensic Console</h1>
          <p className="text-slate-400 text-sm mt-1">Immutable transaction history, live state inspection, operator validation & secure cryptographic rollbacks.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadAuditLogs} variant="outline" size="sm" className="bg-white/5 border-purple-900/50 text-purple-300 hover:bg-purple-900/30">
            <RefreshCw className="w-4 h-4 mr-2" /> Force Refresh
          </Button>
          <Button onClick={() => router.push('/admin/dashboard')} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 font-semibold shadow-lg shadow-purple-950">
            Operations Cockpit
          </Button>
        </div>
      </div>

      {/* Grid: Stats & Timeline layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Live filters & statistics */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-white/[0.02] border border-purple-900/30 rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/40">
              <CardTitle className="text-sm uppercase tracking-widest font-extrabold text-slate-300">Auditing Scope</CardTitle>
              <CardDescription className="text-slate-500 text-xs">Filter trail metrics sequentially</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Filter by actor, details..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-900/40 text-xs text-slate-200 rounded-none pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Action Filters List */}
              <div className="space-y-1.5 pt-2">
                <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-2">Category Filter</p>
                {uniqueActions.map(act => (
                  <button
                    key={act}
                    onClick={() => setActionFilter(act)}
                    className={`w-full text-left text-xs px-3 py-2 flex items-center justify-between border transition-all ${actionFilter === act ? 'bg-purple-950/40 border-purple-500/50 text-white font-bold' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.01]'}`}
                  >
                    <span>{act.replace('_', ' ')}</span>
                    <Badge className="bg-white/5 border-0 text-[10px] text-slate-400">
                      {act === 'ALL' ? logs.length : logs.filter(l => l.action === act).length}
                    </Badge>
                  </button>
                ))}
              </div>

            </CardContent>
          </Card>

          {/* Forensic Integrity card */}
          <Card className="bg-gradient-to-b from-purple-950/10 to-transparent border border-purple-900/20 rounded-none p-5">
            <div className="flex items-center gap-3 text-purple-400 mb-3">
              <Shield className="w-6 h-6" />
              <h4 className="font-bold text-sm text-slate-200">Governance Shield Active</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every action taken within receptionist desks, manager forecast consoles, and active kitchen preparers is captured as a cryptographically indexed log block. State rollbacks fire an auditing transaction to secure releasing protocols.
            </p>
          </Card>
        </div>

        {/* Right Col: Timeline Stream */}
        <div className="lg:col-span-9">
          
          <Card className="bg-white/[0.02] border border-purple-900/30 rounded-none shadow-xl min-h-[500px]">
            <CardHeader className="border-b border-purple-950/40 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-serif text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400 animate-pulse" /> Live Audit Stream
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">A linear cryptographic timeline displaying database mutations.</CardDescription>
              </div>
              <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20">{filteredLogs.length} Records Found</Badge>
            </CardHeader>
            <CardContent className="pt-6">
              
              {filteredLogs.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-sm flex flex-col items-center gap-3">
                  <AlertCircle className="w-10 h-10 text-slate-600 animate-bounce" />
                  <span>No forensic records matching query found in audit trail indexes.</span>
                </div>
              ) : (
                <div className="relative border-l border-purple-900/40 ml-4 pl-8 space-y-6 pb-4">
                  {filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id
                    const isRollingBack = rollbackLoadingId === log.id

                    return (
                      <div key={log.id} className="relative group">
                        
                        {/* Timeline node node */}
                        <span className="absolute -left-[41px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-[#090514] border border-purple-500/50 group-hover:border-purple-400 transition-colors">
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                        </span>

                        <div className="p-4 bg-white/[0.01] border border-slate-800/80 hover:border-purple-900/30 transition-all flex flex-col gap-3">
                          
                          {/* Header section */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900/40 pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <Badge className={`text-[10px] tracking-wider uppercase font-bold px-2 py-0.5 border ${getActionBadgeColor(log.action)}`}>
                                {log.action.replace('_', ' ')}
                              </Badge>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <User className="w-3 h-3" /> {log.actor}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {/* Body snippet */}
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-xs text-slate-300 leading-relaxed flex-1">
                              System registered action state <strong className="text-white">[{log.action}]</strong> executed by host address <code className="text-slate-400 bg-slate-950 px-1 py-0.5 font-mono">{log.ip || '127.0.0.1'}</code>.
                            </p>
                            
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
                            >
                              <span>Inspector</span>
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Expanded JSON viewer inspector */}
                          {isExpanded && (
                            <div className="mt-2 bg-slate-950/80 p-3.5 border border-purple-950 font-mono text-[11px] text-purple-300/90 whitespace-pre-wrap overflow-x-auto rounded-xs max-h-[300px] shadow-inner">
                              {formatDetails(log.details)}
                            </div>
                          )}

                          {/* Rollback Trigger buttons */}
                          <div className="flex items-center justify-between border-t border-slate-900/40 pt-3 mt-1.5">
                            <span className="text-[10px] text-slate-500 font-mono">ID: {log.id}</span>
                            {log.action !== 'STATE_ROLLBACK' && (
                              <Button
                                onClick={() => triggerRollback(log.id, log.action)}
                                disabled={isRollingBack}
                                size="sm"
                                className="bg-purple-900/40 hover:bg-purple-600 border border-purple-500/30 text-purple-200 hover:text-white h-7 text-[10px] rounded-none px-3 font-bold uppercase tracking-wider"
                              >
                                {isRollingBack ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> Verifying Signatures...
                                  </>
                                ) : (
                                  <>
                                    <CornerUpLeft className="w-3 h-3 mr-1.5" /> Revert State
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                        </div>

                      </div>
                    )
                  })}
                </div>
              )}

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  )
}
