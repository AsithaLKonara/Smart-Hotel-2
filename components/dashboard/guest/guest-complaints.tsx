"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert, Plus, MessageSquare, CheckCircle2, Clock } from 'lucide-react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

export function GuestComplaints() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints')
      const data = await res.json()
      setComplaints(data)
    } catch (error) {
      console.error('Error fetching complaints:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] overflow-hidden group">
      <div className="p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-serif font-bold text-white tracking-tight">Resolution Center</h3>
            <p className="text-xs text-white/40 font-medium">Report issues and track their resolution</p>
          </div>
          <Button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl h-12 px-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <Plus className="w-4 h-4" /> Report Issue
          </Button>
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center"><PremiumSpinner /></div>
        ) : complaints.length === 0 ? (
          <div className="py-10 text-center space-y-4 bg-white/5 rounded-3xl border border-white/5">
            <ShieldAlert className="w-10 h-10 text-white/10 mx-auto" />
            <p className="text-sm text-white/30 font-light">Everything is perfect! No issues reported.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${item.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {item.status === 'RESOLVED' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{item.subject}</p>
                    <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">{item.status}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 border-white/10 text-white/40">
                  {item.category}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
