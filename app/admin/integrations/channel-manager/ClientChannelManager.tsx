'use client';

import React, { useState } from 'react';
import { Network, Plus, CheckCircle2, AlertCircle, RefreshCw, Activity, Link as LinkIcon, Settings2, Globe2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ClientChannelManager({ initialProviders, properties }: { initialProviders: any[], properties: any[] }) {
  const [providers, setProviders] = useState(initialProviders);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ providerCode: 'BOOKING_COM', propertyId: properties[0]?.id || '', clientId: '', clientSecret: '' });
  const router = useRouter();

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/integrations/channel-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("OTA Connection Established");
        setIsModalOpen(false);
        router.refresh(); // Refresh page to get latest data
        window.location.reload(); // Simple force reload since it's an admin dashboard
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add connection");
      }
    } catch (e) {
      toast.error("Error creating connection");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-[#FBFAF7] font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link href="/admin/app-marketplace" className="text-sm font-medium text-[#8E8C94] hover:text-[#FBFAF7] transition-colors">
                Marketplace
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-sm font-medium text-white">Channel Manager Core</span>
            </div>
            <h1 className="text-3xl font-medium tracking-tight text-white flex items-center gap-3">
              <Network className="w-8 h-8 text-[#D4AF37]" />
              Global Distribution
            </h1>
            <p className="text-[#8E8C94] text-sm max-w-xl">
              Manage your connections to OTAs (Booking.com, Airbnb, Expedia) and control room mapping and rate syncs from a single source of truth.
            </p>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#D4AF37] text-black hover:bg-[#C3A030] px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-colors shadow-sm self-start md:self-end">
            <Plus className="w-4 h-4" /> Add Connection
          </button>
        </div>

        {/* Dashboard Content */}
        {providers.length === 0 ? (
          <div className="bg-[#121118]/80 rounded-xl border border-white/5 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Globe2 className="w-8 h-8 text-[#8E8C94]" />
            </div>
            <h3 className="text-lg font-medium text-white">No OTA Connections</h3>
            <p className="text-[#8E8C94] text-sm mt-2 max-w-md mx-auto">
              You haven't connected any OTAs yet. Add a connection to start syncing your inventory and rates automatically.
            </p>
            <button onClick={() => setIsModalOpen(true)} className="mt-6 flex items-center gap-2 bg-white/5 text-white hover:bg-white/10 px-5 py-2.5 rounded-lg text-sm font-bold border border-white/10 transition-colors mx-auto">
              <Plus className="w-4 h-4" /> Add First Connection
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {providers.map((provider) => (
              <div key={provider.id} className="bg-[#121118]/80 rounded-xl border border-white/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-black/60 shadow-sm flex items-center justify-center border border-[#D4AF37]/30 font-bold text-[#D4AF37] text-xl">
                      {provider.code.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-white">{provider.name}</h2>
                      <span className="text-[10px] font-mono bg-white/5 text-[#8E8C94] px-2 py-0.5 rounded border border-white/10 uppercase font-bold tracking-wider">
                        {provider.connections.length} Properties Connected
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-white/5">
                  {provider.connections.map((conn: any) => (
                    <div key={conn.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                      <div className="flex flex-col lg:flex-row justify-between gap-6">
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-white">{conn.property.name}</h3>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                              conn.status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                              conn.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {conn.status === 'HEALTHY' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {conn.status === 'WARNING' && <Activity className="w-3.5 h-3.5" />}
                              {conn.status === 'ERROR' && <AlertCircle className="w-3.5 h-3.5" />}
                              {conn.status}
                            </span>
                            <span className="text-[10px] text-[#8E8C94] uppercase tracking-wider font-bold px-2 py-0.5 bg-black/40 border border-white/5 rounded">
                              {conn.environment}
                            </span>
                          </div>

                          <div className="flex gap-8 text-sm">
                            <div>
                              <p className="text-[#8E8C94] text-xs uppercase tracking-wider font-semibold mb-1">Last Sync</p>
                              <p className="font-medium text-white font-mono text-xs">
                                {conn.lastSyncAt ? formatDistanceToNow(new Date(conn.lastSyncAt), { addSuffix: true }) : 'Never'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[#8E8C94] text-xs uppercase tracking-wider font-semibold mb-1">Last Success</p>
                              <p className="font-medium text-emerald-400 font-mono text-xs">
                                {conn.lastSuccessAt ? formatDistanceToNow(new Date(conn.lastSuccessAt), { addSuffix: true }) : 'Never'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FBFAF7] bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                            <LinkIcon className="w-3.5 h-3.5 text-[#D4AF37]" /> Room Mappings
                          </button>
                          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FBFAF7] bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                            <Settings2 className="w-3.5 h-3.5 text-[#8E8C94]" /> Settings
                          </button>
                          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black bg-[#D4AF37] border border-transparent rounded-lg hover:bg-[#C3A030] transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" /> Force Sync
                          </button>
                        </div>
                      </div>

                      {conn.syncEvents && conn.syncEvents.length > 0 && (
                        <div className="mt-6 border border-white/5 rounded-lg overflow-hidden">
                          <div className="bg-black/40 px-4 py-2 text-[10px] font-bold text-[#8E8C94] uppercase tracking-wider border-b border-white/5">
                            Recent Sync Activity
                          </div>
                          <div className="divide-y divide-white/5">
                            {conn.syncEvents.map((evt: any) => (
                              <div key={evt.id} className="px-4 py-2 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    evt.status === 'SUCCESS' ? 'bg-emerald-400' :
                                    evt.status === 'FAILED' ? 'bg-red-400' : 'bg-amber-400'
                                  }`} />
                                  <span className="font-mono text-[10px] text-white">{evt.eventType}</span>
                                  <span className="text-white/20 hidden sm:inline">→</span>
                                  <span className="text-[#8E8C94] hidden sm:inline font-mono text-[10px]">{evt.entityType}</span>
                                </div>
                                <span className="text-[10px] text-[#8E8C94] font-mono">
                                  {formatDistanceToNow(new Date(evt.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                  
                  {provider.connections.length === 0 && (
                    <div className="p-8 text-center bg-black/20">
                      <p className="text-sm text-[#8E8C94]">No properties connected to {provider.name}.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121118] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold font-serif text-[#D4AF37]">New OTA Connection</h3>
              <p className="text-sm text-slate-400 mt-1">Configure a new Channel Manager connection.</p>
            </div>
            <form onSubmit={handleAddConnection}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">OTA Provider</label>
                  <select 
                    value={formData.providerCode} 
                    onChange={e => setFormData({...formData, providerCode: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="BOOKING_COM">Booking.com</option>
                    <option value="EXPEDIA">Expedia</option>
                    <option value="AIRBNB">Airbnb</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Property</label>
                  <select 
                    value={formData.propertyId} 
                    onChange={e => setFormData({...formData, propertyId: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Machine Account ID / Client ID</label>
                  <input 
                    type="text"
                    required
                    value={formData.clientId}
                    onChange={e => setFormData({...formData, clientId: e.target.value})}
                    placeholder="e.g. m_account_123"
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">API Secret Token</label>
                  <input 
                    type="password"
                    required
                    value={formData.clientSecret}
                    onChange={e => setFormData({...formData, clientSecret: e.target.value})}
                    placeholder="••••••••••••"
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/20">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-bold bg-[#D4AF37] text-black hover:bg-[#C3A030] rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Connecting...' : 'Connect OTA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
