"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Moon, CalendarDays, CheckCircle2, AlertCircle, Play, FileText, ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function NightAuditDashboard() {
  const queryClient = useQueryClient()
  const [result, setResult] = useState<any>(null)

  const { data: status, isLoading } = useQuery({
    queryKey: ['night-audit-status'],
    queryFn: async () => {
      const res = await fetch('/api/night-audit/run')
      return res.json()
    }
  })

  const runAudit = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/night-audit/run', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to run Night Audit')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success('Night Audit Completed Successfully!')
      setResult(data.summary)
      queryClient.invalidateQueries({ queryKey: ['night-audit-status'] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PremiumSpinner size="lg" text="Loading Audit Status..." />
      </div>
    )
  }

  const isReady = status?.pendingCheckouts === 0
  
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif text-slate-900 tracking-tight flex items-center">
            <Moon className="w-10 h-10 mr-3 text-indigo-600" /> Night Audit (EOD)
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Finalize daily revenue and advance the property business date.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Current Status & Pre-Checks */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-indigo-100 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white">
            <CardHeader>
              <CardTitle className="text-indigo-900 flex items-center">
                <CalendarDays className="w-5 h-5 mr-2 text-indigo-600" /> Current Business Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold font-mono tracking-tighter text-indigo-950">
                {status?.businessDate}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Pre-Audit Checklist</CardTitle>
              <CardDescription>All constraints must be resolved before closing the day.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg flex items-center justify-between border ${status?.pendingCheckouts === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                <div className="flex items-center">
                  {status?.pendingCheckouts === 0 ? <CheckCircle2 className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                  <span className="font-medium">Pending Departures</span>
                </div>
                <Badge variant={status?.pendingCheckouts === 0 ? 'default' : 'destructive'}>
                  {status?.pendingCheckouts} Remaining
                </Badge>
              </div>

              <div className="p-4 rounded-lg flex items-center justify-between border bg-amber-50 border-amber-100 text-amber-800">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-3" />
                  <span className="font-medium">Unresolved No-Shows</span>
                </div>
                <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-100">
                  {status?.noShowsPending} Auto-Cancel
                </Badge>
              </div>

              <div className="p-4 rounded-lg flex items-center justify-between border bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 mr-3" />
                  <span className="font-medium">In-House Guests to Post</span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                  {status?.inHouse} Rooms
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Execution */}
        <div className="space-y-6">
          <Card className="shadow-lg border-primary/20 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Moon className="w-48 h-48" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-serif">Run End of Day</CardTitle>
              <CardDescription className="text-slate-400">
                This action is irreversible and will lock all folios for {status?.businessDate}.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {!isReady && (
                <div className="mb-6 p-4 rounded-md bg-red-950/50 border border-red-900 text-red-200">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    <span>Cannot Proceed</span>
                  </div>
                  <div className="mt-1 text-sm opacity-90">
                    Resolve {status?.pendingCheckouts} pending departures before running EOD.
                  </div>
                </div>
              )}

              <Button 
                size="lg" 
                className="w-full h-16 text-lg shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all"
                disabled={!isReady || runAudit.isPending}
                onClick={() => runAudit.mutate()}
              >
                {runAudit.isPending ? (
                  <PremiumSpinner text="Processing Audit..." className="text-white" />
                ) : (
                  <>
                    <Play className="w-6 h-6 mr-3 fill-current" /> Execute Night Audit
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card className="border-emerald-100 bg-emerald-50 shadow-sm animate-in zoom-in-95">
              <CardHeader className="pb-3">
                <CardTitle className="text-emerald-800 flex items-center text-lg">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Audit Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-emerald-900 bg-white p-3 rounded-md shadow-sm border border-emerald-100">
                  <span className="font-mono text-sm text-slate-500">{result.previousDate}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-500" />
                  <span className="font-mono font-bold">{result.newDate}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>Rooms Processed:</span>
                  <span className="font-bold">{result.roomsProcessed}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-700">
                  <span>No-Shows Cancelled:</span>
                  <span className="font-bold">{result.noShowsProcessed}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-700 pt-2 border-t border-emerald-200">
                  <span>Total Revenue Posted:</span>
                  <span className="font-bold font-mono text-emerald-900">${result.totalRevenuePosted.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
