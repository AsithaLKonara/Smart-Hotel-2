"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Settings2, Webhook, Shield, Link as LinkIcon, Lock, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [apiKey, setApiKey] = useState('')

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
      
      setIntegrations(Array.isArray(intData) ? intData : [])
      setWebhooks(Array.isArray(webData) ? webData : [])

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectClick = (app: any) => {
      if (app.status === 'ACTIVE') {
          updateIntegrationStatus(app, 'INACTIVE', null);
      } else {
          setSelectedApp(app);
          setApiKey('');
      }
  }

  const handleModalSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedApp) return;
      await updateIntegrationStatus(selectedApp, 'ACTIVE', apiKey);
      setSelectedApp(null);
  }

  const updateIntegrationStatus = async (int: any, newStatus: string, key: string | null) => {
      try {
          const res = await fetch('/api/admin/settings/integrations', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: int.id, status: newStatus, apiKey: key })
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#090A0C]">
        <Loader2 className="animate-spin w-8 h-8 text-zinc-500" />
      </div>
    )
  }

  return (
    <AdminPageShell
      title="App Marketplace & Integrations"
      subtitle="Connect SmartHotel OS to external systems via certified apps, payment gateways, and automated event webhooks."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
        {/* APPS MARKETPLACE */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-emerald-400" />
            Available Integrations ({integrations.length})
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {integrations.map(app => (
              <Card key={app.id} className="bg-[#121417] border border-[#1E2227] text-white shadow-none hover:border-[#2B3037] transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-[#181A1D] border border-[#2B3037] flex items-center justify-center text-zinc-400">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs text-white font-mono">{app.appName}</h3>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{app.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {app.status === 'ACTIVE' && (
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        ACTIVE
                      </Badge>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleConnectClick(app)}
                      className={`h-7 px-3 text-xs font-mono uppercase tracking-wider ${
                        app.status === 'ACTIVE' 
                          ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' 
                          : 'bg-white hover:bg-zinc-200 text-black font-semibold'
                      }`}
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
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Webhook className="w-4 h-4 text-emerald-400" />
            Developer Webhooks
          </h2>
          
          <Card className="bg-[#121417] border border-[#1E2227] text-white shadow-none">
            <CardContent className="p-4">
              <form onSubmit={handleAddWebhook} className="flex flex-col sm:flex-row gap-2">
                <select 
                  className="bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:border-zinc-500"
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
                  className="flex-1 bg-[#181A1D] border border-[#2B3037] text-xs text-white placeholder:text-zinc-500 rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:border-zinc-500"
                  value={newWebhook.url}
                  onChange={e => setNewWebhook({...newWebhook, url: e.target.value})}
                />
                <Button 
                  type="submit" 
                  className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-8 px-3"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {webhooks.map(hook => (
              <Card key={hook.id} className="bg-[#121417] border border-[#1E2227] text-white shadow-none">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs text-emerald-400 font-semibold">{hook.event}</span>
                    <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">Live</Badge>
                  </div>
                  <div className="text-xs text-zinc-300 font-mono truncate">{hook.url}</div>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500 font-mono">
                    <Lock className="w-3 h-3" />
                    <span>Secret:</span> 
                    <span className="text-zinc-400 blur-[2px] hover:blur-none transition-all cursor-pointer select-all">{hook.secret}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {webhooks.length === 0 && (
              <div className="text-center text-zinc-500 text-xs font-mono p-8 border border-dashed border-[#1E2227] rounded-xl bg-[#121417]/30">
                No active webhooks configured
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CONFIGURATION MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121417] border border-[#1E2227] rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-[#1E2227] flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Connect {selectedApp.appName}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Please provide the required configuration details.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#181A1D] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleModalSubmit}>
              <div className="p-5 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">API Key / Secret Token</label>
                  <input 
                    type="password"
                    required
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk_test_..."
                    className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-[#1E2227] flex justify-end gap-2 bg-[#141619]">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setSelectedApp(null)}
                  className="text-xs text-zinc-400 hover:text-white font-mono h-8"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-8 px-4"
                >
                  Activate Connection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageShell>
  )
}
