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
    <Card className="bg-[#0c0c0c] border border-white/10 p-6 rounded-3xl shadow-2xl mb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5'}`}>
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Employee Time Clock</h2>
            <p className="text-sm text-white/50">
              {active 
                ? `You have been clocked in since ${new Date(active.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
                : "You are currently clocked out. Ready for your shift?"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {active ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-lg font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" /> Shift Active
              </div>
              <Button 
                onClick={() => handleClockOut(active.id)}
                disabled={actionLoading}
                className="bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)] border border-rose-500/50"
              >
                <Square className="w-4 h-4 mr-2 fill-current" /> {actionLoading ? 'Processing...' : 'Clock Out Now'}
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleClockIn}
              disabled={actionLoading}
              className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(234,179,8,0.3)] border border-primary/50 text-lg px-8 py-6 rounded-xl"
            >
              <Play className="w-5 h-5 mr-3 fill-current" /> {actionLoading ? 'Starting...' : 'Clock In for Shift'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
