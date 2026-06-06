"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Settings2, Webhook, Shield, Link as LinkIcon, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [newWebhook, setNewWebhook] = useState({ url: '', event: 'GUEST_CHECKIN' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [intRes, webRes] = await Promise.all([
          fetch('/api/admin/settings/integrations'),
          fetch('/api/admin/settings/webhooks')
      ])
      
      const intData = await intRes.json()
      const webData = await webRes.json()
      
      setIntegrations(intData)
      setWebhooks(webData)
      
      // If none exist, prepopulate the UI with some mock "available" integrations
      if (intData.length === 0) {
          await fetch('/api/admin/settings/integrations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ appName: 'QuickBooks Online', provider: 'QUICKBOOKS', status: 'INACTIVE' })
          })
          await fetch('/api/admin/settings/integrations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ appName: 'Stripe Payments', provider: 'STRIPE', status: 'INACTIVE' })
          })
          await fetch('/api/admin/settings/integrations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ appName: 'Assa Abloy Keycards', provider: 'ASSA_ABLOY', status: 'INACTIVE' })
          })
          
          // Re-fetch
          const newIntRes = await fetch('/api/admin/settings/integrations')
          setIntegrations(await newIntRes.json())
      }

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleIntegration = async (int: any) => {
      try {
          const newStatus = int.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
          const res = await fetch('/api/admin/settings/integrations', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: int.id, status: newStatus })
          })
          if (res.ok) {
              toast.success(`${int.appName} is now ${newStatus}`)
              fetchData()
          }
      } catch (e) {
          toast.error("Failed to update integration")
      }
  }

  const handleAddWebhook = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newWebhook.url) return
      
      try {
          const res = await fetch('/api/admin/settings/webhooks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...newWebhook, secret: 'whsec_' + Math.random().toString(36).substring(2, 15) })
          })
          if (res.ok) {
              toast.success("Webhook endpoint added")
              setNewWebhook({ url: '', event: 'GUEST_CHECKIN' })
              fetchData()
          }
      } catch (e) {
          toast.error("Failed to add webhook")
      }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-white" /></div>

  return (
    <div className="p-6 text-white max-w-7xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif mb-2">App Marketplace & Integrations</h1>
        <p className="text-slate-400">Connect SmartHotel OS to external systems via Apps and Webhooks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* APPS MARKETPLACE */}
          <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-blue-400" />
                  Available Integrations
              </h2>
              <div className="grid grid-cols-1 gap-4">
                  {integrations.map(app => (
                      <Card key={app.id} className="bg-[#1a1a1a] border-white/10 text-white">
                          <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10">
                                      <LinkIcon className="w-6 h-6 text-slate-400" />
                                  </div>
                                  <div>
                                      <h3 className="font-bold">{app.appName}</h3>
                                      <p className="text-xs text-slate-400 uppercase tracking-wider">{app.provider}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                  {app.status === 'ACTIVE' && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold">ACTIVE</span>}
                                  <Button 
                                    variant="outline" 
                                    onClick={() => toggleIntegration(app)}
                                    className={app.status === 'ACTIVE' ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' : 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'}
                                  >
                                      {app.status === 'ACTIVE' ? 'Disconnect' : 'Connect'}
                                  </Button>
                              </div>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          </div>

          {/* DEVELOPER WEBHOOKS */}
          <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-purple-400" />
                  Developer Webhooks
              </h2>
              <Card className="bg-[#1a1a1a] border-white/10 text-white mb-6">
                  <CardContent className="p-4">
                      <form onSubmit={handleAddWebhook} className="flex gap-2">
                          <select 
                              className="bg-black border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-white/30"
                              value={newWebhook.event}
                              onChange={e => setNewWebhook({...newWebhook, event: e.target.value})}
                          >
                              <option value="GUEST_CHECKIN">guest.checkin</option>
                              <option value="GUEST_CHECKOUT">guest.checkout</option>
                              <option value="PAYMENT_SUCCESS">payment.success</option>
                              <option value="MAINTENANCE_CREATED">maintenance.created</option>
                          </select>
                          <input 
                              type="url"
                              required
                              placeholder="https://your-server.com/webhook"
                              className="flex-1 bg-black border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-white/30"
                              value={newWebhook.url}
                              onChange={e => setNewWebhook({...newWebhook, url: e.target.value})}
                          />
                          <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Add Endpoint</Button>
                      </form>
                  </CardContent>
              </Card>

              <div className="space-y-3">
                  {webhooks.map(hook => (
                      <Card key={hook.id} className="bg-black/50 border-white/5 border-l-4 border-l-purple-500 text-white">
                          <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                  <div className="font-mono text-sm text-purple-400">{hook.event}</div>
                                  <div className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Live</div>
                              </div>
                              <div className="text-sm text-slate-300 truncate">{hook.url}</div>
                              <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                                  <Lock className="w-3 h-3" />
                                  Secret: <span className="font-mono text-slate-400 blur-[2px] hover:blur-none transition-all cursor-pointer">{hook.secret}</span>
                              </div>
                          </CardContent>
                      </Card>
                  ))}
                  {webhooks.length === 0 && (
                      <div className="text-center text-slate-500 p-4 border border-dashed border-white/10 rounded-lg">
                          No webhooks configured
                      </div>
                  )}
              </div>
          </div>

      </div>

    </div>
  )
}
