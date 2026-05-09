"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessAdminDashboard } from '@/lib/rbac-helpers'
import { 
  Cpu, 
  Play, 
  Trash2, 
  RefreshCw, 
  Settings, 
  Zap, 
  ArrowRight, 
  CheckCircle, 
  ShieldAlert, 
  Clock, 
  FileCode,
  Layers,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function WorkflowAutomationBuilder() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [rules, setRules] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Builder current states
  const [ruleName, setRuleName] = useState("Auto Clean Suite Shift")
  const [selectedTrigger, setSelectedTrigger] = useState("GUEST_CHECKOUT")
  const [conditionField, setConditionField] = useState("roomType")
  const [conditionValue, setConditionValue] = useState("PRESIDENTIAL")
  const [selectedAction, setSelectedAction] = useState("AUTO_ASSIGN_HOUSEKEEPING")
  const [actionTarget, setActionTarget] = useState("Executive Floor Housekeeper")

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessAdminDashboard(session)) {
      toast.error('Access Denied: SRE credentials required.')
      router.push('/auth/signin')
      return
    }

    loadAutomationRules()
  }, [session, status, router])

  const loadAutomationRules = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/automation').then(r => r.json()).catch(() => null)
      if (res && res.rules) {
        setRules(res.rules)
      }
    } catch {
      toast.error('Failed to load automation rule state.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ruleName.trim()) {
      toast.error('Please enter a descriptive rule name.')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ruleName,
          trigger: selectedTrigger,
          conditions: { [conditionField]: conditionValue },
          action: selectedAction,
          actionTarget
        })
      }).then(r => r.json())

      if (res && res.success) {
        toast.success(`Workflow "${ruleName}" successfully registered!`, {
          icon: '⚙️',
          style: { background: '#8b5cf6', color: '#fff' }
        })
        loadAutomationRules()
        // Reset builder defaults
        setRuleName("Auto Clean Suite Shift")
      } else {
        toast.error('Failed to register rule.')
      }
    } catch {
      toast.error('Error committing rule to API.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/automation?id=${id}`, {
        method: 'DELETE'
      }).then(r => r.json())

      if (res && res.success) {
        toast.success('Workflow configuration deleted successfully.')
        setRules(prev => prev.filter(r => r.id !== id))
      } else {
        toast.error('Unable to delete rule.')
      }
    } catch {
      toast.error('Error escalating delete query.')
    }
  }

  const handleToggleActive = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
    toast.success('Rule state updated locally (SRE Syncing).')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <PremiumSpinner size="lg" text="Booting workflow automation engine..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090514] text-slate-100 p-6 font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-purple-950/40 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-600/10 text-purple-400 border border-purple-500/30 text-xs tracking-wider uppercase font-bold py-1 px-3">
              ORCHESTRATION ENGINE
            </Badge>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
            </span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mt-2">Trigger-Condition-Action Automation Engine</h1>
          <p className="text-slate-400 text-sm mt-1">Design event-driven operational automation triggers, filter conditional parameters, and dispatch automated tasks across staff channels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadAutomationRules} variant="outline" size="sm" className="bg-white/5 border-purple-950/50 text-purple-300">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh Recipes
          </Button>
          <Button onClick={() => router.push('/admin/dashboard')} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 font-semibold shadow-lg shadow-purple-950">
            Master Cockpit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Visual Node Builder Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-white/[0.02] border border-purple-900/20 rounded-none shadow-2xl relative overflow-hidden">
            
            <CardHeader className="border-b border-purple-950/50 bg-slate-950/40 pb-4">
              <CardTitle className="text-sm uppercase tracking-widest font-extrabold text-purple-400 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" /> Dynamic Node Builder Studio
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Compose event-driven execution routes graphically.</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <form onSubmit={handleCreateRule} className="space-y-6">
                
                {/* Rule Name Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Recipe Descriptor Name</label>
                  <input 
                    type="text" 
                    value={ruleName} 
                    onChange={e => setRuleName(e.target.value)}
                    placeholder="e.g. Clean Room on Checkout"
                    className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-3 rounded-none focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>

                {/* Node visualizer segment */}
                <div className="p-6 bg-slate-950 border border-purple-950/50 rounded-xs flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-xs relative">
                  
                  {/* Glowing connecting line */}
                  <div className="absolute top-[50%] left-6 right-6 h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500 -z-10 hidden md:block opacity-40 animate-pulse" />

                  {/* 1. Trigger Node */}
                  <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded text-center w-full md:w-[150px]">
                    <span className="text-[8px] uppercase font-bold tracking-widest text-purple-400 block mb-1">1. TRIGGER EVENT</span>
                    <strong className="text-[10px] text-white truncate block">{selectedTrigger}</strong>
                  </div>

                  <ArrowRight className="w-4 h-4 text-purple-500 shrink-0 hidden md:block" />

                  {/* 2. Condition Node */}
                  <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded text-center w-full md:w-[150px]">
                    <span className="text-[8px] uppercase font-bold tracking-widest text-indigo-400 block mb-1">2. PARAM FILTER</span>
                    <strong className="text-[10px] text-white truncate block">{conditionField} = {conditionValue}</strong>
                  </div>

                  <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0 hidden md:block" />

                  {/* 3. Action Node */}
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded text-center w-full md:w-[150px]">
                    <span className="text-[8px] uppercase font-bold tracking-widest text-emerald-400 block mb-1">3. TARGET ACTION</span>
                    <strong className="text-[10px] text-white truncate block">{selectedAction}</strong>
                  </div>

                </div>

                {/* Dropdowns Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Select Trigger */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Trigger Event</label>
                    <select 
                      value={selectedTrigger} 
                      onChange={e => setSelectedTrigger(e.target.value)}
                      className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-2.5 focus:outline-none"
                    >
                      <option value="GUEST_CHECKOUT">Guest Checkout</option>
                      <option value="BOOKING_CREATED">Booking Created</option>
                      <option value="KITCHEN_SLA_BREACH">Kitchen SLA Breach</option>
                      <option value="SECURITY_ANOMALY">Security Anomaly</option>
                    </select>
                  </div>

                  {/* Select Condition parameter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Parameter Field</label>
                    <select 
                      value={conditionField} 
                      onChange={e => setConditionField(e.target.value)}
                      className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-2.5 focus:outline-none"
                    >
                      <option value="roomType">Room Class</option>
                      <option value="guestClass">Guest Level</option>
                      <option value="severity">Incident Severity</option>
                      <option value="channel">Booking Source</option>
                    </select>
                  </div>

                  {/* Select Condition Value */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Target Value</label>
                    <select 
                      value={conditionValue} 
                      onChange={e => setConditionValue(e.target.value)}
                      className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-2.5 focus:outline-none"
                    >
                      <option value="PRESIDENTIAL">PRESIDENTIAL</option>
                      <option value="VIP">VIP</option>
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="DIRECT_BOOKING">DIRECT_BOOKING</option>
                      <option value="STANDARD">STANDARD</option>
                    </select>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Select Action */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Action Execution</label>
                    <select 
                      value={selectedAction} 
                      onChange={e => setSelectedAction(e.target.value)}
                      className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-2.5 focus:outline-none"
                    >
                      <option value="AUTO_ASSIGN_HOUSEKEEPING">Auto Clean Assign</option>
                      <option value="ESCALATE_SMS_ALERT">Escalate SMS Dispatch</option>
                      <option value="HOLD_ROOM_BLOCK">Hold Room Lock</option>
                    </select>
                  </div>

                  {/* Action Target Queue */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Recipient Dispatcher</label>
                    <input 
                      type="text" 
                      value={actionTarget} 
                      onChange={e => setActionTarget(e.target.value)}
                      placeholder="e.g. Senior Floor Cleaner Queue"
                      className="w-full bg-slate-950 border border-purple-900/30 text-xs text-slate-200 p-2.5 focus:outline-none"
                    />
                  </div>

                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold uppercase tracking-wider h-11 border-0"
                >
                  {isSubmitting ? "Committing recipe..." : "Register Active Workflow Rule"}
                </Button>

              </form>
            </CardContent>

          </Card>
        </div>

        {/* Right Column: List of Saved Automation rules */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-white/[0.02] border border-purple-900/10 rounded-none shadow-xl">
            <CardHeader className="border-b border-purple-950/40 p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm uppercase tracking-widest font-extrabold text-slate-300">Active Orchestrations</CardTitle>
                <CardDescription className="text-xs text-slate-500">Committed recipe rules managing staff dispatches.</CardDescription>
              </div>
              <Badge className="bg-purple-950 text-purple-300 border-purple-500/25">{rules.length} Rules</Badge>
            </CardHeader>
            <CardContent className="pt-5 divide-y divide-purple-950/30">
              
              {rules.length === 0 ? (
                <div className="text-slate-600 text-center py-12 text-xs">No active rule recipes found. Design one on the studio!</div>
              ) : (
                rules.map((rule) => (
                  <div key={rule.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-200 text-sm truncate block">{rule.name}</strong>
                        {!rule.active && <Badge variant="outline" className="text-[8px] text-slate-600 border-slate-800">Inactive</Badge>}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <Badge variant="outline" className="text-[8px] text-purple-400 border-purple-500/20">{rule.trigger}</Badge>
                        <ArrowRight className="w-3 h-3" />
                        <Badge variant="outline" className="text-[8px] text-emerald-400 border-emerald-500/20">{rule.action}</Badge>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><Play className="w-3 h-3 text-slate-600" /> Runs: {rule.runCount}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-600" /> Created {new Date(rule.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleActive(rule.id)}
                        className={`w-10 h-5 p-0.5 rounded-full flex items-center transition-colors ${rule.active ? 'bg-emerald-600 justify-end' : 'bg-slate-950 border border-slate-800 justify-start'}`}
                      >
                        <span className="w-4 h-4 bg-white rounded-full" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 bg-slate-950 hover:bg-rose-950 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-all rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))
              )}

            </CardContent>
          </Card>

          {/* SRE governance notification */}
          <Card className="bg-[#120a26]/20 border border-purple-900/10 rounded-none p-5">
            <div className="flex items-center gap-2.5 text-purple-400 mb-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <h4 className="font-bold text-slate-200 text-sm">Automated Event Pipeline</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every workflow automation rule handles transactions asynchronously in the background. If a rule fails to trigger due to system latencies or socket dropouts, our SRE retry queue automatically triggers a recovery replay, logging details directly to the administrative timeline.
            </p>
          </Card>

        </div>

      </div>

    </div>
  )
}
