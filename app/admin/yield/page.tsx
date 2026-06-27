'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Activity, TrendingUp, TrendingDown, DollarSign, Calculator, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function YieldManagementPage() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const [newRule, setNewRule] = useState({
    name: '',
    description: 'Dynamic Tier Rule',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    adjustmentType: 'DYNAMIC_TIER',
    adjustmentValue: 15,
    minOccupancy: 0.80,
    maxOccupancy: 1.0,
    competitorPrice: ''
  })
  
  // Simulator State
  const [simRoomTypeId, setSimRoomTypeId] = useState('')
  const [simDate, setSimDate] = useState('')
  const [simOccupancy, setSimOccupancy] = useState(0.85)
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

  const handleCreateRule = () => {
    fetch('/api/admin/yield-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newRule,
        competitorPrice: newRule.competitorPrice ? parseFloat(newRule.competitorPrice) : null
      })
    }).then(() => {
      setIsDialogOpen(false)
      fetchRules()
    })
  }

  const runSimulator = () => {
    fetch('/api/admin/yield-rules/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        roomTypeId: simRoomTypeId, 
        date: simDate,
        simulatedOccupancy: simOccupancy
      })
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
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="bg-primary text-white flex items-center gap-2 px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium">
            <Plus className="w-4 h-4" /> Create Dynamic Rule
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>New Occupancy Tier Rule</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Rule Name</label>
                <Input value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="bg-white/5 border-white/10" placeholder="e.g. 80%+ Compression Surge" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-white/60 mb-1 block">Min Occupancy (0.0-1.0)</label>
                  <Input type="number" step="0.05" value={newRule.minOccupancy} onChange={e => setNewRule({...newRule, minOccupancy: parseFloat(e.target.value)})} className="bg-white/5 border-white/10" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/60 mb-1 block">Max Occupancy (0.0-1.0)</label>
                  <Input type="number" step="0.05" value={newRule.maxOccupancy} onChange={e => setNewRule({...newRule, maxOccupancy: parseFloat(e.target.value)})} className="bg-white/5 border-white/10" />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Adjustment Percentage (%)</label>
                <Input type="number" value={newRule.adjustmentValue} onChange={e => setNewRule({...newRule, adjustmentValue: parseFloat(e.target.value)})} className="bg-white/5 border-white/10" placeholder="e.g. 15 for +15%" />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Competitor Parity Cap ($)</label>
                <Input type="number" value={newRule.competitorPrice} onChange={e => setNewRule({...newRule, competitorPrice: e.target.value})} className="bg-white/5 border-white/10" placeholder="e.g. 250 (Optional)" />
              </div>
              <Button onClick={handleCreateRule} className="bg-primary text-white mt-4">Save Rule</Button>
            </div>
          </DialogContent>
        </Dialog>
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
                    {rule.adjustmentType === 'DYNAMIC_TIER' && (
                      <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 ml-2">DYNAMIC TIER</Badge>
                    )}
                  </h3>
                  <p className="text-sm text-white/50 mt-1">
                    {new Date(rule.startDate).toLocaleDateString()} to {new Date(rule.endDate).toLocaleDateString()}
                  </p>
                  {rule.adjustmentType === 'DYNAMIC_TIER' && (
                    <p className="text-xs text-white/40 mt-1">
                      Trigger: {rule.minOccupancy ? (rule.minOccupancy * 100).toFixed(0) + '%' : '0%'} to {rule.maxOccupancy ? (rule.maxOccupancy * 100).toFixed(0) + '%' : '100%'} occupancy
                      {rule.competitorPrice && ` | Parity Cap: $${rule.competitorPrice}`}
                    </p>
                  )}
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
              <div>
                <label className="text-xs text-white/60 mb-1 block">Simulated Occupancy (0.0-1.0)</label>
                <Input 
                  type="number"
                  step="0.05"
                  value={simOccupancy} 
                  onChange={e => setSimOccupancy(parseFloat(e.target.value))} 
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
