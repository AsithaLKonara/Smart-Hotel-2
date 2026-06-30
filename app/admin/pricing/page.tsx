"use client"

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  CalendarDays, 
  DollarSign, 
  Percent, 
  Plus,
  Settings2,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, addDays } from 'date-fns'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function PricingOperations() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("RATE_PLANS")

  // Fetch Room Types (for contexts)
  const { data: roomTypesData } = useQuery({
    queryKey: ['room-types'],
    queryFn: async () => {
      const res = await fetch('/api/rooms/types')
      const data = await res.json()
      return data.roomTypes || []
    }
  })

  // Fetch Rate Plans
  const { data: ratePlansData, isLoading } = useQuery({
    queryKey: ['rate-plans'],
    queryFn: async () => {
      const res = await fetch('/api/pricing/rate-plans')
      const data = await res.json()
      return data.ratePlans || []
    }
  })

  // Mutations
  const createRatePlan = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/pricing/rate-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create rate plan')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-plans'] })
      toast.success('Rate Plan created.')
    }
  })

  const createSeasonalRate = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/pricing/seasonal-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create seasonal rate')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-plans'] })
      toast.success('Seasonal Override added.')
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <PremiumSpinner size="lg" text="Loading Pricing Engine..." />
      </div>
    )
  }

  // Generate 30 day lookahead for calendar view
  const today = new Date()
  const lookaheadDays = Array.from({ length: 30 }).map((_, i) => addDays(today, i))

  return (
    <div className="p-6 text-white min-h-screen bg-[#050309]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Pricing & Yield Engine</h1>
          <p className="text-slate-400 text-sm mt-1">Manage dynamic rate plans, seasonal overrides, and quoting.</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" className="bg-white/5 border-white/10 text-white" onClick={() => setActiveTab('RATE_PLANS')}>
            <Settings2 className="w-4 h-4 mr-2" /> Rate Plans
          </Button>
          <Button variant="outline" className="bg-white/5 border-white/10 text-white" onClick={() => setActiveTab('CALENDAR')}>
            <CalendarDays className="w-4 h-4 mr-2" /> 30-Day Outlook
          </Button>
        </div>
      </div>

      {activeTab === 'RATE_PLANS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Rate Plans List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center"><DollarSign className="w-5 h-5 mr-2 text-primary" /> Active Rate Plans</h2>
              <Button size="sm" className="bg-primary text-white" onClick={() => {
                if (roomTypesData?.length > 0) {
                  const name = prompt('Rate Plan Name (e.g. Non-Refundable):')
                  if (!name) return
                  const multiplier = parseFloat(prompt('Base Multiplier (e.g. 0.9 for 10% discount):', '1.0') || '1.0')
                  createRatePlan.mutate({
                    name,
                    roomTypeId: roomTypesData[0].id, // Default to first room type for demo
                    baseMultiplier: multiplier,
                    isDefault: false
                  })
                } else {
                  toast.error("No room types found.")
                }
              }}>
                <Plus className="w-4 h-4 mr-2" /> New Plan
              </Button>
            </div>

            <div className="space-y-4">
              {ratePlansData?.length === 0 ? (
                <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <p className="text-slate-400">No Rate Plans configured.</p>
                </div>
              ) : (
                ratePlansData?.map((rp: any) => (
                  <Card key={rp.id} className="bg-white/[0.02] border-white/10 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-white">{rp.name}</h3>
                            {rp.isDefault && <Badge className="bg-emerald-500/20 text-emerald-400">Default</Badge>}
                          </div>
                          <p className="text-sm text-slate-400 mt-1">Room Type: {rp.roomType?.name}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-slate-500 uppercase tracking-widest block mb-1">Base Multiplier</span>
                          <span className="text-xl font-bold text-primary">{rp.baseMultiplier}x</span>
                        </div>
                      </div>

                      {/* Seasonal Overrides nested */}
                      <div className="mt-6 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Seasonal Overrides</h4>
                          <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => {
                            const seasonName = prompt('Season Name (e.g. Summer Peak):')
                            if(!seasonName) return
                            const mult = parseFloat(prompt('Season Multiplier (e.g. 1.5):', '1.5') || '1.5')
                            createSeasonalRate.mutate({
                              ratePlanId: rp.id,
                              name: seasonName,
                              startDate: format(new Date(), 'yyyy-MM-dd'),
                              endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
                              multiplier: mult
                            })
                          }}>
                            <Plus className="w-3 h-3 mr-1" /> Add Season
                          </Button>
                        </div>
                        {rp.seasonalRates?.length === 0 ? (
                          <p className="text-xs text-slate-500">No seasonal rules applied.</p>
                        ) : (
                          <div className="space-y-2">
                            {rp.seasonalRates.map((season: any) => (
                              <div key={season.id} className="flex justify-between items-center p-3 bg-black/40 rounded-lg border border-white/5">
                                <div>
                                  <span className="font-bold text-sm text-white block">{season.name}</span>
                                  <span className="text-xs text-slate-500">{format(new Date(season.startDate), 'MMM d')} - {format(new Date(season.endDate), 'MMM d')}</span>
                                </div>
                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono">
                                  {season.baseRateOverride ? `$${season.baseRateOverride} flat` : `${season.multiplier}x mult`}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions / Yield Settings */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-emerald-500" /> Yield Settings</h2>
            <Card className="bg-[#0a0a0f] border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-emerald-400">Weekend Premium</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300">Active</Badge>
                  </div>
                  <p className="text-xs text-emerald-500/70">Fridays & Saturdays automatically yield a +15% premium across all quotes.</p>
                </div>
                
                <div className="p-4 bg-white/5 border border-white/5 rounded-xl opacity-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white">High Occupancy Yield</span>
                    <Badge className="bg-slate-500/20 text-slate-400">Inactive</Badge>
                  </div>
                  <p className="text-xs text-slate-400">Automatically increase rates by 10% when occupancy exceeds 80%.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'CALENDAR' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-500">Showing projected Base Rates for the default rate plan. Weekends reflect +15% premium.</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 py-2">
                {day}
              </div>
            ))}
            
            {lookaheadDays.map((date, idx) => {
              // Extremely simplified mock visualization logic for demo purposes
              const isWeekend = date.getDay() === 5 || date.getDay() === 6
              const isPeak = false // Mock logic
              
              return (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border ${isWeekend ? 'bg-primary/5 border-primary/20' : 'bg-white/[0.02] border-white/5'} min-h-[100px] flex flex-col justify-between`}
                >
                  <span className="text-sm font-bold text-white/70">{format(date, 'd')}</span>
                  <div className="text-center mt-2">
                    <span className={`text-xl font-black ${isWeekend ? 'text-primary' : 'text-white'}`}>
                      {/* Using mock values since we aren't quoting dynamically for every room type in UI yet */}
                      ${isWeekend ? '287' : '250'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
