'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Activity, TrendingUp, TrendingDown, DollarSign, Calculator } from 'lucide-react'

export default function YieldManagementPage() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Simulator State
  const [simRoomTypeId, setSimRoomTypeId] = useState('')
  const [simDate, setSimDate] = useState('')
  const [simResult, setSimResult] = useState<any>(null)

  const fetchRules = () => {
    fetch('/api/admin/yield-rules')
      .then(res => res.json())
      .then(data => {
        if (data.rules) setRules(data.rules)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const toggleRule = (id: string, currentStatus: boolean) => {
    fetch('/api/admin/yield-rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !currentStatus })
    }).then(() => fetchRules())
  }

  const runSimulator = () => {
    fetch('/api/admin/yield-rules/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomTypeId: simRoomTypeId, date: simDate })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setSimResult(data)
      })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Yield Engine
          </h1>
          <p className="text-white/60 text-sm">Configure dynamic pricing rules to maximize RevPAR.</p>
        </div>
        <Button className="bg-primary text-white">Create New Rule</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white mb-2">Active Pricing Rules</h2>
          {rules.map((rule: any) => (
            <Card key={rule.id} className={`bg-[#1a1a1a] border-white/10 ${!rule.isActive ? 'opacity-50' : ''}`}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    {rule.name}
                    <Badge variant={rule.isActive ? 'default' : 'secondary'} className={rule.isActive ? 'bg-green-500/20 text-green-400' : ''}>
                      {rule.isActive ? 'ACTIVE' : 'DISABLED'}
                    </Badge>
                  </h3>
                  <p className="text-sm text-white/50 mt-1">
                    {new Date(rule.startDate).toLocaleDateString()} to {new Date(rule.endDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Adjustment</p>
                    <div className={`font-bold flex items-center gap-1 ${rule.adjustmentValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {rule.adjustmentValue > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {rule.adjustmentValue > 0 ? '+' : ''}{rule.adjustmentValue}
                      {rule.adjustmentType === 'PERCENTAGE' ? '%' : '$'}
                    </div>
                  </div>
                  <Button variant="outline" className="border-white/20 bg-transparent text-white" onClick={() => toggleRule(rule.id, rule.isActive)}>
                    {rule.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {rules.length === 0 && !loading && (
            <div className="p-8 text-center text-white/40 border-2 border-dashed border-white/10 rounded-xl">
              No yield rules configured.
            </div>
          )}
        </div>

        <div>
          <Card className="bg-[#1a1a1a] border-white/10 sticky top-6">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" /> Rate Simulator
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Room Type ID</label>
                <Input 
                  value={simRoomTypeId} 
                  onChange={e => setSimRoomTypeId(e.target.value)} 
                  placeholder="e.g. uuid-of-deluxe-room" 
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Target Date</label>
                <Input 
                  type="date"
                  value={simDate} 
                  onChange={e => setSimDate(e.target.value)} 
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <Button onClick={runSimulator} className="w-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30">
                Simulate Pricing
              </Button>

              {simResult && (
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Base Rate:</span>
                    <span>${simResult.baseRate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Rules Applied:</span>
                    <span>{simResult.appliedRules.join(', ') || 'None'}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-white mt-2 pt-2 border-t border-white/5">
                    <span>Final Rate:</span>
                    <span className="text-primary">${simResult.finalRate.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
