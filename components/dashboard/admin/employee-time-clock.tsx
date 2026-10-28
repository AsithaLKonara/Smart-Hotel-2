"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle2, Play, Square } from 'lucide-react'
import toast from 'react-hot-toast'
import { useProperty } from '@/contexts/property-context'

export function EmployeeTimeClock() {
  const { activePropertyId } = useProperty()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/staff/attendance', {
        headers: { 'x-property-id': activePropertyId || '' }
      })
      if (res.ok) {
        setData(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch attendance status', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [activePropertyId])

  const handleClockIn = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/staff/attendance', { method: 'POST' })
      if (res.ok) {
        toast.success('Successfully clocked in!')
        fetchStatus()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to clock in')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleClockOut = async (attendanceId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/staff/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceId })
      })
      if (res.ok) {
        toast.success('Successfully clocked out!')
        fetchStatus()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to clock out')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || !data?.isEmployee) {
    return null // Only show for verified employees
  }

  const active = data.activeAttendance

  return (
    <div className="bg-[#121417] border border-[#1E2227] p-5 sm:p-6 rounded-2xl mb-8 relative overflow-hidden group hover:border-zinc-700 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
            active 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-[#181A1D] border-[#2B3037] text-zinc-400'
          }`}>
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Employee Telemetry Clock</h2>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1C2025] text-zinc-400 border border-[#2B3037] uppercase">
                v2.4
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              {active 
                ? `Active shift recorded since ${new Date(active.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
                : "Operational shift currently logged off. Ready to initialize session?"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {active ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Shift Active</span>
              </div>
              <button 
                onClick={() => handleClockOut(active.id)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> {actionLoading ? 'Logging off...' : 'Clock Out Now'}
              </button>
            </div>
          ) : (
            <button 
              onClick={handleClockIn}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> {actionLoading ? 'Initializing...' : 'Clock In for Shift'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
