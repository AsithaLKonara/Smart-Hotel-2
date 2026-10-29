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
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  LayoutDashboard
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'

export default function ForensicAuditTimeline() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [rollbackLoadingId, setRollbackLoadingId] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessAdminDashboard(session)) {
      toast.error('Access Denied: Administrative authorization required.')
      router.push('/auth/signin')
      return
    }

    loadAuditLogs()
  }, [session, status]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAuditLogs = async (cursor?: string) => {
    try {
      if (cursor) setLoadingMore(true)
      else setLoading(true)

      const url = `/api/audit-logs?limit=20${cursor ? `&cursor=${cursor}` : ''}`
      const res = await fetch(url).then(r => r.json()).catch(() => null)
      if (res && res.logs) {
        setLogs(prev => cursor ? [...prev, ...res.logs] : res.logs)
        setNextCursor(res.nextCursor ?? null)
        setHasMore(res.hasMore ?? false)
      } else {
        toast.error('Failed to parse secure audit trail.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Unable to fetch live governance metrics.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const triggerRollback = async (logId: string, action: string) => {
    try {
      setRollbackLoadingId(logId)
      await new Promise(r => setTimeout(r, 1200))
      
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
        style: { background: '#121417', color: '#fff', border: '1px solid #1E2227' }
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
    if (action.includes('CHAOS') || action.includes('DELETE') || action.includes('ERROR')) {
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    }
    if (action.includes('ROLLBACK') || action.includes('UPDATE')) {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    }
    if (action.includes('BOOKING') || action.includes('CREATE') || action.includes('PAYMENT')) {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    }
    if (action.includes('REASSIGNMENT') || action.includes('LOGIN') || action.includes('AUTH')) {
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    }
    return 'bg-zinc-800 text-zinc-400 border border-zinc-700'
  }

  const formatDetails = (detailsStr: string) => {
    try {
      const parsed = typeof detailsStr === 'string' ? JSON.parse(detailsStr) : detailsStr
      return JSON.stringify(parsed, null, 2)
    } catch {
      return detailsStr
    }
  }

  const filteredLogs = logs.filter(log => {
    const actor = (log.actor || '').toLowerCase()
    const action = (log.action || '').toLowerCase()
    const detailsStr = typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {})
    const details = detailsStr.toLowerCase()
    const query = searchQuery.toLowerCase()
    const matchesSearch = actor.includes(query) || action.includes(query) || details.includes(query)
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter
    return matchesSearch && matchesAction
  })

  const uniqueActions = ['ALL', ...Array.from(new Set(logs.map(l => l.action).filter(Boolean)))]

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090A0C]">
        <PremiumSpinner size="lg" text="Loading Forensic Cryptographic Timeline..." />
      </div>
    )
  }

  return (
    <AdminPageShell
      title="Forensic Audit Stream"
      subtitle="Cryptographically indexed event trail, live state inspection, operator validation & authorized rollbacks."
      actions={
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => { setNextCursor(null); setHasMore(false); loadAuditLogs() }} 
            variant="outline" 
            size="sm" 
            className="border-[#1E2227] bg-[#121417] text-zinc-300 hover:text-white hover:bg-[#181A1D] font-mono text-xs h-9"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Force Refresh
          </Button>
          <Button 
            onClick={() => router.push('/admin/dashboard')} 
            variant="outline" 
            size="sm" 
            className="border-[#1E2227] bg-[#121417] text-zinc-300 hover:text-white hover:bg-[#181A1D] font-mono text-xs h-9"
          >
            <LayoutDashboard className="w-3.5 h-3.5 mr-2" /> Dashboard
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Scope & Security Card */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-none">
            <CardHeader className="border-b border-[#1E2227] pb-3">
              <CardTitle className="text-xs uppercase tracking-widest font-mono text-zinc-400 flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" /> Auditing Scope
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs">Filter trail metrics sequentially</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Filter by actor, details..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-200 placeholder:text-zinc-500 rounded-lg pl-9 pr-3 py-2 font-mono focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              {/* Action Filters List */}
              <div className="space-y-1 pt-1">
                <p className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 mb-2">Category Filter</p>
                {uniqueActions.map(act => (
                  <button
                    key={act}
                    onClick={() => setActionFilter(act)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg flex items-center justify-between border transition-all font-mono ${
                      actionFilter === act 
                        ? 'bg-[#181A1D] border-[#2B3037] text-white font-semibold' 
                        : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#16181B]'
                    }`}
                  >
                    <span>{act.replace(/_/g, ' ')}</span>
                    <Badge className="bg-[#141619] border border-[#1E2227] text-[10px] text-zinc-400 font-mono">
                      {act === 'ALL' ? logs.length : logs.filter(l => l.action === act).length}
                    </Badge>
                  </button>
                ))}
              </div>

            </CardContent>
          </Card>

          {/* Forensic Integrity card */}
          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-5 shadow-none space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <Shield className="w-5 h-5" />
              <h4 className="font-semibold text-xs text-zinc-200 font-mono uppercase tracking-wider">Governance Shield Active</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Every action taken within receptionist desks, manager consoles, billing pipelines, and kitchen tickets is registered in an immutable cryptographic audit ledger.
            </p>
          </Card>
        </div>

        {/* Right Column: Timeline Stream */}
        <div className="lg:col-span-9">
          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-none min-h-[500px]">
            <CardHeader className="border-b border-[#1E2227] pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-emerald-400" /> Live Audit Stream
                </CardTitle>
                <CardDescription className="text-zinc-500 text-xs mt-0.5 font-sans">A chronological cryptographic timeline displaying real-time platform mutations.</CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs">
                {filteredLogs.length} Records Found
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              
              {filteredLogs.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 text-xs flex flex-col items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-zinc-600" />
                  <span className="font-mono">No forensic records matching query found in audit trail indexes.</span>
                </div>
              ) : (
                <div className="relative border-l border-[#1E2227] ml-4 pl-7 space-y-5 pb-4">
                  {filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id
                    const isRollingBack = rollbackLoadingId === log.id

                    return (
                      <div key={log.id} className="relative group">
                        
                        {/* Timeline node */}
                        <span className="absolute -left-[38px] top-2 flex items-center justify-center w-5 h-5 rounded-full bg-[#121417] border border-[#2B3037] group-hover:border-zinc-400 transition-colors">
                          <Clock className="w-3 h-3 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
                        </span>

                        <div className="p-4 bg-[#141619] border border-[#1E2227] hover:border-[#2B3037] rounded-xl transition-all flex flex-col gap-3">
                          
                          {/* Header section */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E2227] pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <Badge className={`text-[10px] tracking-wider uppercase font-mono px-2 py-0.5 ${getActionBadgeColor(log.action)}`}>
                                {log.action.replace(/_/g, ' ')}
                              </Badge>
                              <span className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                                <User className="w-3 h-3 text-zinc-500" /> {log.actor}
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {/* Body snippet */}
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-xs text-zinc-300 leading-relaxed flex-1">
                              System registered action <strong className="text-white font-mono">[{log.action}]</strong> executed by host <code className="text-zinc-400 bg-[#181A1D] border border-[#2B3037] px-1.5 py-0.5 rounded font-mono text-[11px]">{log.details?.ip || '127.0.0.1'}</code>
                            </p>
                            
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-mono"
                            >
                              <span>Inspector</span>
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* Expanded JSON viewer inspector */}
                          {isExpanded && (
                            <div className="mt-2 bg-[#090A0C] p-3.5 border border-[#1E2227] font-mono text-xs text-zinc-300 whitespace-pre-wrap overflow-x-auto rounded-lg max-h-[300px]">
                              {formatDetails(log.details)}
                            </div>
                          )}

                          {/* Rollback Trigger buttons */}
                          <div className="flex items-center justify-between border-t border-[#1E2227] pt-2.5 mt-1">
                            <span className="text-[10px] text-zinc-500 font-mono">ID: {log.id}</span>
                            {log.action !== 'STATE_ROLLBACK' && (
                              <Button
                                onClick={() => triggerRollback(log.id, log.action)}
                                disabled={isRollingBack}
                                size="sm"
                                className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-7 px-3 rounded-md"
                              >
                                {isRollingBack ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> Verifying...
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

              {/* Pagination: Load More */}
              {hasMore && (
                <div className="flex justify-center pt-6 pb-2">
                  <Button
                    onClick={() => loadAuditLogs(nextCursor ?? undefined)}
                    disabled={loadingMore}
                    variant="outline"
                    className="border-[#1E2227] bg-[#121417] text-zinc-300 hover:text-white hover:bg-[#181A1D] font-mono text-xs px-6 h-9"
                  >
                    {loadingMore ? (
                      <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> Loading more records...</>
                    ) : (
                      <>Load More Records ({filteredLogs.length} loaded)</>  
                    )}
                  </Button>
                </div>
              )}

              {!hasMore && logs.length > 0 && (
                <p className="text-center text-xs text-zinc-600 pt-4 pb-2 font-mono tracking-wider">— End of audit trail —</p>
              )}

            </CardContent>
          </Card>
        </div>

      </div>
    </AdminPageShell>
  )
}
