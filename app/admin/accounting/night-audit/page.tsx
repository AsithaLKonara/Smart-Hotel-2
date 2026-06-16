'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Moon, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function NightAuditPage() {
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)
  const { success, error: toastError } = useToast()

  const fetchLogs = () => {
    fetch('/api/admin/accounting/night-audit')
      .then(res => res.json())
      .then(data => {
        if (data.logs) setLogs(data.logs)
      })
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const runAudit = () => {
    setRunning(true)
    fetch('/api/admin/accounting/night-audit', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setRunning(false)
        if (data.success) {
          success(
            "Night Audit Completed",
            `Processed ${data.auditLog.roomsProcessed} rooms. Revenue posted: $${data.auditLog.totalRevenue.toFixed(2)}`
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Night Audit & End of Day</h1>
          <p className="text-white/60 text-sm">Post daily charges, calculate revenue, and roll the business date.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-[#1a1a1a] border-white/10 md:col-span-2 shadow-2xl">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Moon className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Ready for Night Audit</h2>
            <p className="text-white/60 max-w-md mb-8">
              Running the night audit will post room and tax charges to all currently checked-in guests, finalize the general ledger for today, and roll the system business date to tomorrow.
            </p>
            <Button 
              size="lg" 
              onClick={runAudit} 
              disabled={running}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-luxury px-12 py-6 text-lg"
            >
              {running ? 'Processing Audit...' : 'Run Night Audit'}
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="bg-[#1a1a1a] border-white/10 border-l-4 border-l-yellow-500">
            <CardContent className="p-4 flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-white text-sm">System Warning</h3>
                <p className="text-xs text-white/60 mt-1">Users may experience slow performance during the audit. It is recommended to run this after 2:00 AM.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-white/10 border-l-4 border-l-primary">
            <CardContent className="p-4 flex items-start gap-4">
              <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-white text-sm">Revenue Posting</h3>
                <p className="text-xs text-white/60 mt-1">This will lock all folios for the current business date and prevent retroactive modifications.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Recent Audit Logs</h2>
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="p-4 text-sm font-semibold text-white/70">Date Run</th>
              <th className="p-4 text-sm font-semibold text-white/70">Business Date</th>
              <th className="p-4 text-sm font-semibold text-white/70">Rooms Processed</th>
              <th className="p-4 text-sm font-semibold text-white/70">Total Posted</th>
              <th className="p-4 text-sm font-semibold text-white/70">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4 text-sm text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/40" />
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="p-4 text-sm text-white/80">{new Date(log.businessDate).toLocaleDateString()}</td>
                <td className="p-4 text-sm text-white/80">{log.roomsProcessed}</td>
                <td className="p-4 text-sm font-bold text-primary">${log.totalRevenue.toFixed(2)}</td>
                <td className="p-4 text-sm">
                  <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-white/40">No night audit logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
