"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, TrendingUp, DollarSign, Users, Activity, BarChart3, PieChart } from 'lucide-react'

export default function EnterpriseBIDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics/bi')
      .then(res => res.json())
      .then(resData => {
        setData(resData)
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  if (loading || !data) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-white" /></div>

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="p-6 text-white max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Enterprise BI
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Global Data Warehouse Aggregation. Last synced: {new Date(data.lastSync).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <TrendingUp className="w-5 h-5" />
            <span>+{data.revenue.yoyGrowth}% YOY</span>
        </div>
      </div>

      {/* KPI Row 1: Revenue & Finance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-blue-500/30 backdrop-blur-md">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-blue-400 text-sm font-bold tracking-wider uppercase mb-1">Total Rooms Rev</p>
                        <h2 className="text-3xl font-black text-white">{formatCurrency(data.revenue.totalRoomsRevenue)}</h2>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-xl"><DollarSign className="w-5 h-5 text-blue-400" /></div>
                </div>
            </CardContent>
        </Card>
        
        <Card className="bg-black/40 border-orange-500/30 backdrop-blur-md">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-orange-400 text-sm font-bold tracking-wider uppercase mb-1">F&B / POS Rev</p>
                        <h2 className="text-3xl font-black text-white">{formatCurrency(data.revenue.totalPOSRevenue)}</h2>
                    </div>
                    <div className="p-3 bg-orange-500/20 rounded-xl"><PieChart className="w-5 h-5 text-orange-400" /></div>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-black/40 border-emerald-500/30 backdrop-blur-md">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-emerald-400 text-sm font-bold tracking-wider uppercase mb-1">MICE & Events</p>
                        <h2 className="text-3xl font-black text-white">{formatCurrency(data.revenue.totalEventsRevenue)}</h2>
                    </div>
                    <div className="p-3 bg-emerald-500/20 rounded-xl"><BarChart3 className="w-5 h-5 text-emerald-400" /></div>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-black/40 border-purple-500/30 backdrop-blur-md">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-purple-400 text-sm font-bold tracking-wider uppercase mb-1">Points Liability</p>
                        <h2 className="text-3xl font-black text-white">{formatCurrency(data.loyalty.pointsLiabilityValue)}</h2>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-xl"><Activity className="w-5 h-5 text-purple-400" /></div>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue Trend Chart (Simulated with simple CSS bars for UI impact) */}
          <Card className="lg:col-span-2 bg-[#1a1a1a] border-white/10">
              <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      6-Month Revenue Trend (USD Thousands)
                  </h3>
                  <div className="h-64 flex items-end gap-4">
                      {data.trends.revenue.map((val: number, i: number) => {
                          const max = Math.max(...data.trends.revenue);
                          const heightPct = (val / max) * 100;
                          return (
                              <div key={i} className="flex-1 flex flex-col justify-end items-center group">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white mb-2 bg-black px-2 py-1 rounded">
                                      ${val}k
                                  </div>
                                  <div 
                                    className="w-full bg-gradient-to-t from-blue-900 to-blue-500 rounded-t-sm transition-all duration-500" 
                                    style={{ height: `${heightPct}%` }}
                                  ></div>
                                  <div className="text-xs text-slate-400 mt-3">{data.trends.labels[i]}</div>
                              </div>
                          )
                      })}
                  </div>
              </CardContent>
          </Card>

          {/* Operational Metrics */}
          <Card className="bg-[#1a1a1a] border-white/10">
              <CardContent className="p-6 h-full flex flex-col">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      Operations Overview
                  </h3>
                  
                  <div className="space-y-6 flex-1">
                      <div>
                          <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-400">Guest Satisfaction</span>
                              <span className="text-emerald-400 font-bold">{data.loyalty.guestSatisfactionScore}%</span>
                          </div>
                          <div className="w-full bg-black rounded-full h-2">
                              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${data.loyalty.guestSatisfactionScore}%` }}></div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                          <div>
                              <div className="text-3xl font-black text-white">{data.operations.activeEmployees}</div>
                              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Active Staff</div>
                          </div>
                          <div>
                              <div className="text-3xl font-black text-white">{data.operations.openMaintenanceTickets}</div>
                              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Open Tickets</div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                          <div>
                              <div className="text-3xl font-black text-white">{data.operations.avgHousekeepingTurnaroundMins}<span className="text-sm">m</span></div>
                              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Avg Turnaround</div>
                          </div>
                          <div>
                              <div className="text-3xl font-black text-white">{data.loyalty.platinumCount}</div>
                              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Platinum VIPs</div>
                          </div>
                      </div>
                  </div>
              </CardContent>
          </Card>

      </div>
    </div>
  )
}
