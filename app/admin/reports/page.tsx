"use client"

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, PieChart, Activity, Building, LogIn, LogOut, Calendar } from 'lucide-react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function ReportsDashboard() {
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['analytics-kpi'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/kpi')
      if (!res.ok) throw new Error('Failed to fetch KPIs')
      return res.json()
    }
  })

  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ['analytics-revenue'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/revenue')
      if (!res.ok) throw new Error('Failed to fetch revenue')
      return res.json()
    }
  })

  if (kpiLoading || revLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PremiumSpinner size="lg" text="Compiling Executive Analytics..." />
      </div>
    )
  }

  // Helper colors for revenue bars
  const colors = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-blue-500'
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-serif text-slate-900 tracking-tight flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-primary" /> Executive Dashboard
          </h1>
          <p className="text-slate-500 mt-2 flex items-center">
            <Calendar className="w-4 h-4 mr-2" /> Business Date: <span className="font-mono ml-2 text-slate-700">{new Date(kpis?.businessDate).toLocaleDateString()}</span>
          </p>
        </div>
      </div>

      {/* BIG 3 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-indigo-900 flex items-center text-sm font-semibold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 mr-2 text-indigo-600" /> RevPAR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-indigo-950">
              ${(kpis?.revpar || 0).toFixed(2)}
            </div>
            <p className="text-xs text-indigo-600/70 mt-2 font-medium">Revenue Per Available Room</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-900 flex items-center text-sm font-semibold uppercase tracking-wider">
              <Activity className="w-4 h-4 mr-2 text-emerald-600" /> ADR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-emerald-950">
              ${(kpis?.adr || 0).toFixed(2)}
            </div>
            <p className="text-xs text-emerald-600/70 mt-2 font-medium">Average Daily Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-900 flex items-center text-sm font-semibold uppercase tracking-wider">
              <Building className="w-4 h-4 mr-2 text-blue-600" /> Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-blue-950">
              {(kpis?.occupancyRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-blue-600/70 mt-2 font-medium">
              {kpis?.roomsOccupied} of {kpis?.totalRooms} Rooms Occupied
            </p>
            {/* Visual Progress Bar */}
            <div className="w-full h-2 bg-blue-100 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-1000" 
                style={{ width: `${Math.min(100, kpis?.occupancyRate || 0)}%` }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Operations Card */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg flex items-center">
              Today's Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-xl border bg-emerald-50/50 border-emerald-100">
              <div className="flex justify-center mb-2 text-emerald-600"><LogIn className="w-6 h-6" /></div>
              <div className="text-3xl font-bold text-emerald-900">{kpis?.operations?.arrivals || 0}</div>
              <div className="text-xs text-emerald-700 uppercase font-semibold mt-1">Arrivals</div>
            </div>
            <div className="p-4 rounded-xl border bg-amber-50/50 border-amber-100">
              <div className="flex justify-center mb-2 text-amber-600"><LogOut className="w-6 h-6" /></div>
              <div className="text-3xl font-bold text-amber-900">{kpis?.operations?.departures || 0}</div>
              <div className="text-xs text-amber-700 uppercase font-semibold mt-1">Departures</div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-primary" /> Revenue Distribution
              </div>
              <span className="text-sm font-normal text-slate-500 bg-white px-3 py-1 rounded-full border shadow-sm">
                MTD (Month to Date)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {revenue?.breakdown?.length === 0 ? (
              <div className="text-center text-slate-500 py-4">No revenue data available for this month yet.</div>
            ) : (
              revenue?.breakdown?.map((item: any, i: number) => (
                <div key={item.department} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 capitalize">{item.department.toLowerCase()}</span>
                    <span className="font-mono font-bold text-slate-900">${item.amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[i % colors.length]}`} 
                      style={{ width: `${item.percentage}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
            
            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <span className="font-bold text-slate-800">Total Revenue MTD</span>
              <span className="text-xl font-bold font-mono text-primary">${(revenue?.totalRevenue || 0).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
