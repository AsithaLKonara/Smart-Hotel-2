'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Moon, Clock, TrendingUp, AlertTriangle, SkipForward, Activity, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useProperty } from '@/contexts/property-context'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'

export default function NightAuditPage() {
  const { activePropertyId } = useProperty()
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)
  const [rollingForward, setRollingForward] = useState(false)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const { success, error: toastError } = useToast()

  const fetchLogs = () => {
    fetch('/api/admin/accounting/night-audit', {
      headers: { 'x-property-id': activePropertyId || 'all' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.logs) setLogs(data.logs)
      })
  }

  useEffect(() => {
    fetchLogs()
  }, [activePropertyId])

  const runAudit = () => {
    setRunning(true)
    fetch('/api/admin/accounting/night-audit', { 
      method: 'POST',
      headers: { 'x-property-id': activePropertyId || 'all' }
    })
      .then(res => res.json())
      .then(data => {
        setRunning(false)
        if (data.success) {
          success(
            "Night Audit Completed",
            `Processed ${data.auditLog?.roomsProcessed || 0} rooms. Revenue posted: $${Number(data.auditLog?.totalRevenue || 0).toFixed(2)}`
          )
          fetchLogs()
        } else {
          toastError("Audit Failed", data.error)
        }
      })
      .catch(() => {
        setRunning(false)
        toastError("Error", "Failed to run audit")
      })
  }

  return (
    <AdminPageShell
      title="Night Audit & End of Day"
      subtitle="Post daily room & tax charges, compute revenue reconciliation, lock general ledgers, and roll the operational business date."
      onRefresh={fetchLogs}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Execution Cockpit */}
          <div className="lg:col-span-8">
            <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-[#181A1D] border border-[#2B3037] rounded-2xl flex items-center justify-center mb-5 text-zinc-100 shadow-inner">
                <Moon className="w-8 h-8 text-zinc-300" />
              </div>
              <h2 className="text-xl font-mono font-bold text-zinc-100 mb-2">Automated End-Of-Day Audit</h2>
              <p className="text-xs text-zinc-400 font-mono max-w-lg mb-6 leading-relaxed">
                Initiating the night audit will calculate and post room, tax, and package charges to all active guest folios, balance general ledger debits and credits, generate daily financial summaries, and roll the system business date.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button 
                  onClick={runAudit} 
                  disabled={running}
                  className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg h-10 px-8 shadow-sm transition-all"
                >
                  {running ? 'Processing Pipeline...' : 'Run Night Audit'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={rollingForward}
                  onClick={runAudit}
                  className="bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-amber-400 text-xs font-mono font-semibold h-10 px-4 rounded-lg"
                >
                  <SkipForward className="w-3.5 h-3.5 mr-1.5" />
                  {rollingForward ? 'Rolling...' : 'Force Date Roll-Forward'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const res = await fetch('/api/debug')
                    const data = await res.json()
                    setHealthStatus(data)
                  }}
                  className="bg-[#181A1D] hover:bg-[#20242A] border border-[#2B3037] text-blue-400 text-xs font-mono font-semibold h-10 px-4 rounded-lg"
                >
                  <Activity className="w-3.5 h-3.5 mr-1.5" /> Diagnostic Check
                </Button>
              </div>

              {healthStatus && (
                <div className="mt-6 w-full text-left bg-[#181A1D] border border-[#1E2227] rounded-xl p-4 text-xs font-mono">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#1E2227]">
                    <span className={`w-2 h-2 rounded-full ${healthStatus.status === 'healthy' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span className={`font-bold uppercase tracking-wider ${healthStatus.status === 'healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      System State: {healthStatus.status}
                    </span>
                    <span className="text-zinc-500 ml-auto text-[10px]">{healthStatus.timestamp}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-zinc-400">
                    <span>Database:</span>
                    <span className={healthStatus.checks?.databaseConnection?.connected ? 'text-emerald-400' : 'text-rose-400'}>
                      {healthStatus.checks?.databaseConnection?.connected ? `ONLINE (${healthStatus.checks.databaseConnection.userCount} users)` : 'DISCONNECTED'}
                    </span>
                    <span>Active Environment:</span>
                    <span className="text-zinc-200">{healthStatus.environment}</span>
                    <span>Operational Checks:</span>
                    <span className="text-zinc-200">{healthStatus.summary?.passedChecks}/{healthStatus.summary?.totalChecks} passed</span>
                  </div>
                  {healthStatus.errors?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#1E2227]">
                      {healthStatus.errors.map((e: string, i: number) => (
                        <p key={i} className="text-rose-400">{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Instructions and Safeguards */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-[#121417] border border-[#1E2227] border-l-2 border-l-amber-500 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider">Operational Window</h3>
              </div>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                Execute after late arrivals are checked in and daily food & beverage outlets are closed (ideally 02:00 - 04:00 AM).
              </p>
            </Card>

            <Card className="bg-[#121417] border border-[#1E2227] border-l-2 border-l-blue-500 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider">General Ledger Lock</h3>
              </div>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                Night audit serializes and seals today's journal batches. Postings after audit require managerial override.
              </p>
            </Card>

            <Card className="bg-[#121417] border border-[#1E2227] border-l-2 border-l-emerald-500 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider">Channel Sync</h3>
              </div>
              <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                Following closure, room inventories and stop-sell limits are automatically synchronized with connected OTA channels.
              </p>
            </Card>
          </div>
        </div>

        {/* Recent Audit Logs Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">Historical Audit Execution Logs</h2>
          <div className="bg-[#121417] border border-[#1E2227] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141619] border-b border-[#1E2227] text-zinc-400 text-[11px] font-mono uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Execution Timestamp</th>
                    <th className="p-3.5">Business Date</th>
                    <th className="p-3.5">Rooms Processed</th>
                    <th className="p-3.5">Total Revenue Posted</th>
                    <th className="p-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2227]">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-[#16181B] transition-colors">
                      <td className="p-3.5 text-zinc-300 font-mono flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono text-zinc-200">{new Date(log.businessDate).toLocaleDateString()}</td>
                      <td className="p-3.5 font-mono text-zinc-300">{log.roomsProcessed}</td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">${Number(log.totalRevenue || 0).toFixed(2)}</td>
                      <td className="p-3.5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-500 font-mono">No night audit execution logs on record.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminPageShell>
  )
}
