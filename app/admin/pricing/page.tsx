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
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'

export default function PricingOperations() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<"RATE_PLANS" | "CALENDAR">("RATE_PLANS")

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

  // Fetch Live Yield Rules
  const { data: yieldRules } = useQuery({
    queryKey: ['yield-rules'],
    queryFn: async () => {
      const res = await fetch('/api/pricing/yield-rules')
      const data = await res.json()
      return data.yieldRules || []
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
      <div className="flex items-center justify-center min-h-screen bg-[#090A0C]">
        <PremiumSpinner size="lg" text="Loading Pricing Engine..." />
      </div>
    )
  }

  // Generate 30 day lookahead for calendar view
  const today = new Date()
  const lookaheadDays = Array.from({ length: 30 }).map((_, i) => addDays(today, i))

  return (
    <AdminPageShell
      title="Pricing & Yield Engine"
      subtitle="Manage dynamic rate plans, seasonal overrides, occupancy yield rules & 30-day forecast pricing."
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#121417] border border-[#1E2227] rounded-lg p-1">
            <button
              onClick={() => setActiveTab('RATE_PLANS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                activeTab === 'RATE_PLANS'
                  ? 'bg-[#181A1D] border border-[#2B3037] text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" /> Rate Plans
            </button>
            <button
              onClick={() => setActiveTab('CALENDAR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                activeTab === 'CALENDAR'
                  ? 'bg-[#181A1D] border border-[#2B3037] text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> 30-Day Outlook
            </button>
          </div>
          {activeTab === 'RATE_PLANS' && (
            <Button
              size="sm"
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-9"
              onClick={() => {
                if (roomTypesData?.length > 0) {
                  const name = prompt('Rate Plan Name (e.g. Non-Refundable):')
                  if (!name) return
                  const multiplier = parseFloat(prompt('Base Multiplier (e.g. 0.9 for 10% discount):', '1.0') || '1.0')
                  createRatePlan.mutate({
                    name,
                    roomTypeId: roomTypesData[0].id,
                    baseMultiplier: multiplier,
                    isDefault: false
                  })
                } else {
                  toast.error("No room types found.")
                }
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Plan
            </Button>
          )}
        </div>
      }
    >
      {activeTab === 'RATE_PLANS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Rate Plans List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Active Rate Plans ({ratePlansData?.length || 0})
              </h2>
            </div>

            <div className="space-y-4">
              {ratePlansData?.length === 0 ? (
                <div className="text-center py-16 bg-[#121417] border border-[#1E2227] rounded-xl">
                  <p className="text-xs text-zinc-500 font-mono">No Rate Plans configured.</p>
                </div>
              ) : (
                ratePlansData?.map((rp: any) => (
                  <Card key={rp.id} className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-none">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-semibold text-white font-mono">{rp.name}</h3>
                            {rp.isDefault && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 font-mono">Room Type: {rp.roomType?.name || 'All Types'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block mb-0.5">Base Multiplier</span>
                          <span className="text-lg font-bold font-mono text-emerald-400">{rp.baseMultiplier}x</span>
                        </div>
                      </div>

                      {/* Seasonal Overrides nested */}
                      <div className="mt-4 pt-4 border-t border-[#1E2227]">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-[10px] font-semibold uppercase tracking-wider font-mono text-zinc-400">Seasonal Overrides</h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-zinc-300 hover:text-white hover:bg-[#181A1D] h-7 px-2 font-mono" 
                            onClick={() => {
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
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add Season
                          </Button>
                        </div>
                        {rp.seasonalRates?.length === 0 ? (
                          <p className="text-xs text-zinc-500 font-mono">No seasonal rules applied.</p>
                        ) : (
                          <div className="space-y-2">
                            {rp.seasonalRates.map((season: any) => (
                              <div key={season.id} className="flex justify-between items-center p-3 bg-[#141619] rounded-lg border border-[#1E2227]">
                                <div>
                                  <span className="font-semibold text-xs text-white block font-mono">{season.name}</span>
                                  <span className="text-[11px] text-zinc-500 font-mono">
                                    {format(new Date(season.startDate), 'MMM d')} - {format(new Date(season.endDate), 'MMM d')}
                                  </span>
                                </div>
                                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-xs">
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

          {/* Yield Settings */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 font-mono uppercase tracking-wider pb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Yield Settings
            </h2>
            <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-none">
              <CardContent className="p-5 space-y-4">
                {yieldRules?.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-mono">No active yield rules configured.</p>
                ) : (
                  yieldRules?.map((rule: any) => (
                    <div key={rule.id} className="p-4 bg-[#141619] border border-[#1E2227] rounded-xl">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-semibold text-xs text-emerald-400 font-mono">{rule.name}</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">Active</Badge>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono">
                        {rule.adjustmentType === 'FLAT' ? `Flat rate override: $${rule.adjustmentValue}` : `${rule.adjustmentValue}% adjustment`}. 
                        Valid {format(new Date(rule.startDate), 'MMM d')} - {format(new Date(rule.endDate), 'MMM d')}.
                      </p>
                    </div>
                  ))
                )}
                
                {/* Fallback baseline indicator */}
                <div className="p-4 bg-[#141619] border border-[#1E2227] rounded-xl">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-xs text-zinc-200 font-mono">Baseline Weekend Premium</span>
                    <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-mono">Default</Badge>
                  </div>
                  <p className="text-xs text-zinc-400 font-sans">Automatically applies +15% dynamic rate multiplier for Friday & Saturday stays.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'CALENDAR' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-[#141619] border border-[#1E2227] rounded-lg">
            <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-zinc-300 font-mono">Showing projected Base Rates for the default rate plan. Weekends reflect automatic +15% premium.</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 py-2 font-mono">
                {day}
              </div>
            ))}
            
            {lookaheadDays.map((date, idx) => {
              const isWeekend = date.getDay() === 5 || date.getDay() === 6
              let baseRate = 250
              
              const applicableRule = yieldRules?.find((r: any) => {
                 const d = new Date(date).getTime()
                 const start = new Date(r.startDate).getTime()
                 const end = new Date(r.endDate).getTime()
                 return d >= start && d <= end
              })

              if (applicableRule) {
                if (applicableRule.adjustmentType === 'FLAT') {
                   baseRate = parseFloat(applicableRule.adjustmentValue)
                } else if (applicableRule.adjustmentType === 'PERCENTAGE') {
                   baseRate = baseRate * (1 + (parseFloat(applicableRule.adjustmentValue) / 100))
                }
              }

              if (isWeekend) {
                 baseRate *= 1.15
              }
              
              return (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-xl border min-h-[96px] flex flex-col justify-between transition-colors ${
                    applicableRule 
                      ? 'bg-amber-500/5 border-amber-500/20' 
                      : isWeekend 
                      ? 'bg-[#181A1D] border-[#2B3037]' 
                      : 'bg-[#121417] border-[#1E2227]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-zinc-400">{format(date, 'd')}</span>
                    {applicableRule && <TrendingUp className="w-3 h-3 text-amber-400" />}
                  </div>
                  <div className="text-center my-1">
                    <span className={`text-lg font-bold font-mono ${
                      applicableRule ? 'text-amber-400' : isWeekend ? 'text-white' : 'text-zinc-200'
                    }`}>
                      ${Math.round(baseRate)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </AdminPageShell>
  )
}
