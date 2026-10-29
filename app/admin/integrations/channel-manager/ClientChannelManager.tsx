'use client';

import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Activity, 
  Link as LinkIcon, 
  Settings2, 
  Globe2, 
  ArrowRight, 
  TrendingUp, 
  Save, 
  Check, 
  ShieldCheck, 
  Layers, 
  X 
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ClientChannelManager({ 
  initialProviders, 
  properties 
}: { 
  initialProviders: any[], 
  properties: any[] 
}) {
  const [providers, setProviders] = useState(initialProviders);
  const [activeTab, setActiveTab] = useState<'CHANNELS' | 'MAPPING' | 'LOGS'>('CHANNELS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState({ 
    providerCode: 'BOOKING_COM', 
    propertyId: properties[0]?.id || '', 
    clientId: '', 
    affiliateId: '', 
    clientSecret: '', 
    environment: 'PRODUCTION' 
  });
  
  // Sync Logs audit state
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Room Mapping state
  const [mappings, setMappings] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [savingMappingId, setSavingMappingId] = useState<string | null>(null);

  const router = useRouter();

  // Load Room Mappings when tab changes to MAPPING
  useEffect(() => {
    if (activeTab === 'MAPPING' && mappings.length === 0) {
      fetchMappings();
    }
    if (activeTab === 'LOGS') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch('/api/admin/ota/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      toast.error('Failed to load sync audit logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchMappings = async () => {
    try {
      setLoadingMappings(true);
      const res = await fetch('/api/admin/ota/mapping');
      if (res.ok) {
        const data = await res.json();
        setMappings(data.mappings || []);
        setRoomTypes(data.roomTypes || []);
      }
    } catch (e) {
      toast.error('Failed to load room mappings');
    } finally {
      setLoadingMappings(false);
    }
  };

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
        router.refresh();
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add connection");
      }
    } catch (e) {
      toast.error("Error creating connection");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    toast.loading("Synchronizing availability and pulling reservations...", { id: 'ota-sync' });
    try {
      const res = await fetch('/api/integrations/booking-com/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Sync complete! ${data.reservations_synced || 0} reservations pulled, ${data.room_types_updated || 0} room types broadcasted.`, { id: 'ota-sync' });
        router.refresh();
      } else {
        toast.error(data.error || "Synchronization error", { id: 'ota-sync' });
      }
    } catch (err: any) {
      toast.error("Network error during sync", { id: 'ota-sync' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveMapping = async (mapping: any) => {
    setSavingMappingId(mapping.localRoomTypeId);
    try {
      const res = await fetch('/api/admin/ota/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapping)
      });
      if (res.ok) {
        toast.success("Mapping updated");
        fetchMappings();
      } else {
        toast.error("Failed to save mapping");
      }
    } catch (e) {
      toast.error("Error saving mapping");
    } finally {
      setSavingMappingId(null);
    }
  };

  return (
    <AdminPageShell
      title="Channel Manager Core"
      subtitle="Centralized OTA connectivity for Booking.com, Airbnb, Agoda, and Expedia. 2-way inventory, rate broadcast & reservation sync."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link 
            href="/admin/pricing"
            className="flex items-center gap-1.5 border border-[#1E2227] bg-[#121417] text-zinc-300 hover:text-white hover:bg-[#181A1D] px-3 py-2 rounded-lg text-xs font-mono transition-colors h-9"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Rate Plans & Pricing <ArrowRight className="w-3 h-3 text-zinc-500" />
          </Link>
          <Button 
            onClick={handleForceSync}
            disabled={isSyncing}
            variant="outline"
            className="border-[#1E2227] bg-[#121417] text-zinc-300 hover:text-white hover:bg-[#181A1D] text-xs font-mono h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Force Sync All'}
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-9"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Connection
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1E2227] pb-3">
          <button
            onClick={() => setActiveTab('CHANNELS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
              activeTab === 'CHANNELS'
                ? 'bg-[#181A1D] border border-[#2B3037] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#141619]'
            }`}
          >
            <Globe2 className="w-4 h-4 text-zinc-400" />
            Active Channels ({providers.length})
          </button>
          <button
            onClick={() => setActiveTab('MAPPING')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
              activeTab === 'MAPPING'
                ? 'bg-[#181A1D] border border-[#2B3037] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#141619]'
            }`}
          >
            <LinkIcon className="w-4 h-4 text-zinc-400" />
            Room Type Mappings
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
              activeTab === 'LOGS'
                ? 'bg-[#181A1D] border border-[#2B3037] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#141619]'
            }`}
          >
            <Activity className="w-4 h-4 text-zinc-400" />
            Sync Events {logs.length > 0 && `(${logs.length})`}
          </button>
        </div>

        {/* Tab 1: Channels */}
        {activeTab === 'CHANNELS' && (
          <div>
            {providers.length === 0 ? (
              <div className="bg-[#121417] rounded-xl border border-[#1E2227] p-12 text-center">
                <div className="w-12 h-12 bg-[#181A1D] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#2B3037]">
                  <Globe2 className="w-6 h-6 text-zinc-500" />
                </div>
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">No OTA Connections Configured</h3>
                <p className="text-zinc-400 text-xs mt-1.5 max-w-md mx-auto">
                  Connect your first OTA channel (Booking.com, Airbnb, Expedia) to enable automatic 2-way sync of inventory and reservations.
                </p>
                <Button 
                  onClick={() => setIsModalOpen(true)} 
                  className="mt-5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Connect Channel
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {providers.map((provider) => (
                  <div key={provider.id} className="bg-[#121417] rounded-xl border border-[#1E2227] overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-[#1E2227] flex items-center justify-between bg-[#141619]">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-lg bg-[#181A1D] border border-[#2B3037] flex items-center justify-center font-bold font-mono text-white text-base">
                          {provider.code.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-white font-mono">{provider.name}</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-semibold">
                              Active Integration
                            </span>
                            <span className="text-xs text-zinc-500 font-mono">
                              {provider.connections?.length || 0} Property Linked
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleForceSync}
                        disabled={isSyncing}
                        variant="outline"
                        size="sm"
                        className="border-[#1E2227] bg-[#121417] text-zinc-300 hover:text-white hover:bg-[#181A1D] text-xs font-mono h-8"
                      >
                        <RefreshCw className={`w-3 h-3 mr-1.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync Now
                      </Button>
                    </div>
                    
                    <div className="divide-y divide-[#1E2227]">
                      {provider.connections?.map((conn: any) => (
                        <div key={conn.id} className="p-5 hover:bg-[#141619]/50 transition-colors">
                          <div className="flex flex-col lg:flex-row justify-between gap-4">
                            
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2.5">
                                <h3 className="font-semibold text-xs text-white font-mono">{conn.property.name}</h3>
                                <Badge className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border ${
                                  conn.status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                  conn.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  {conn.status === 'HEALTHY' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                                  {conn.status === 'WARNING' && <Activity className="w-3 h-3 mr-1 inline" />}
                                  {conn.status === 'ERROR' && <AlertCircle className="w-3 h-3 mr-1 inline" />}
                                  {conn.status || 'CONNECTED'}
                                </Badge>
                                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono px-2 py-0.5 bg-[#181A1D] border border-[#2B3037] rounded">
                                  {conn.environment || 'PRODUCTION'}
                                </span>
                              </div>

                              <div className="flex gap-6 text-xs">
                                <div>
                                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-mono mb-0.5">Last Sync</p>
                                  <p className="font-semibold text-zinc-200 font-mono text-xs">
                                    {conn.lastSyncAt ? formatDistanceToNow(new Date(conn.lastSyncAt), { addSuffix: true }) : 'Just now'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-mono mb-0.5">Status</p>
                                  <p className="font-semibold text-emerald-400 font-mono text-xs flex items-center gap-1">
                                    <Check className="w-3 h-3" /> 2-Way Live Sync Active
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start lg:self-center">
                              <Button 
                                onClick={() => setActiveTab('MAPPING')}
                                variant="outline"
                                size="sm"
                                className="border-[#1E2227] bg-[#141619] text-zinc-300 hover:text-white hover:bg-[#181A1D] text-xs font-mono h-8"
                              >
                                <LinkIcon className="w-3 h-3 mr-1.5 text-zinc-400" /> Map Rooms
                              </Button>
                            </div>
                          </div>

                          {conn.syncEvents && conn.syncEvents.length > 0 && (
                            <div className="mt-4 border border-[#1E2227] rounded-lg overflow-hidden bg-[#090A0C]">
                              <div className="bg-[#141619] px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-[#1E2227]">
                                Recent Sync Events
                              </div>
                              <div className="divide-y divide-[#1E2227]">
                                {conn.syncEvents.map((evt: any) => (
                                  <div key={evt.id} className="px-3 py-1.5 flex items-center justify-between text-xs font-mono">
                                    <div className="flex items-center gap-2.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        evt.status === 'SUCCESS' ? 'bg-emerald-400' :
                                        evt.status === 'FAILED' ? 'bg-rose-400' : 'bg-amber-400'
                                      }`} />
                                      <span className="text-[11px] text-zinc-200">{evt.eventType}</span>
                                      <span className="text-zinc-600 hidden sm:inline">→</span>
                                      <span className="text-zinc-400 hidden sm:inline text-[11px]">{evt.entityType}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500">
                                      {formatDistanceToNow(new Date(evt.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      ))}
                      
                      {(!provider.connections || provider.connections.length === 0) && (
                        <div className="p-6 text-center bg-[#141619]/30">
                          <p className="text-xs text-zinc-500 font-mono">No properties connected to {provider.name}.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Room Type Mappings */}
        {activeTab === 'MAPPING' && (
          <div className="bg-[#121417] rounded-xl border border-[#1E2227] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#1E2227] flex items-center justify-between bg-[#141619]">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                  <LinkIcon className="w-4 h-4 text-zinc-400" /> OTA Room Type Mappings
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Map internal PMS room types to OTA Channel Room IDs and Rate Plan IDs.
                </p>
              </div>
              <Button
                onClick={fetchMappings}
                variant="outline"
                size="sm"
                className="border-[#1E2227] bg-[#121417] text-zinc-300 hover:text-white hover:bg-[#181A1D] text-xs font-mono h-8"
              >
                <RefreshCw className={`w-3 h-3 mr-1.5 ${loadingMappings ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>

            {loadingMappings ? (
              <div className="p-12 text-center text-zinc-500 text-xs font-mono">Loading room mappings...</div>
            ) : roomTypes.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs font-mono">No room types found. Create room types first under Room Operations.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-200">
                  <thead className="bg-[#141619] text-zinc-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1E2227]">
                    <tr>
                      <th className="p-3.5">Internal Room Type</th>
                      <th className="p-3.5">OTA Room Type ID</th>
                      <th className="p-3.5">OTA Rate Plan ID</th>
                      <th className="p-3.5 text-center">Sync Enabled</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2227]">
                    {roomTypes.map(rt => {
                      const mapping = mappings.find(m => m.localRoomTypeId === rt.id) || {
                        localRoomTypeId: rt.id,
                        otaRoomTypeId: '',
                        otaRatePlanId: '',
                        syncEnabled: true
                      };
                      return (
                        <RoomMappingRow 
                          key={rt.id} 
                          roomType={rt} 
                          initialMapping={mapping}
                          isSaving={savingMappingId === rt.id}
                          onSave={handleSaveMapping}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Sync Events */}
        {activeTab === 'LOGS' && (
          <div className="bg-[#121417] rounded-xl border border-[#1E2227] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#1E2227] flex items-center justify-between bg-[#141619]">
              <div>
                <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Channel Synchronization Logs</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Audit trail of inbound reservation pulls and outbound availability broadcasts.</p>
              </div>
              <Button 
                onClick={fetchLogs}
                disabled={loadingLogs}
                variant="outline"
                size="sm"
                className="border-[#1E2227] bg-[#121417] text-zinc-300 hover:text-white hover:bg-[#181A1D] text-xs font-mono h-8"
              >
                <RefreshCw className={`w-3 h-3 mr-1.5 ${loadingLogs ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
            {loadingLogs ? (
              <div className="p-12 text-center text-zinc-500 text-xs font-mono">Loading audit events...</div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs font-mono">No sync events recorded yet. Click &quot;Force Sync All&quot; above to initiate a sync.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-200 font-mono">
                  <thead className="bg-[#141619] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#1E2227]">
                    <tr>
                      <th className="p-3.5">Time</th>
                      <th className="p-3.5">Channel</th>
                      <th className="p-3.5">Event</th>
                      <th className="p-3.5">Direction</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Notes / Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2227]">
                    {logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-[#141619]/50 transition-colors">
                        <td className="p-3.5 text-zinc-400 text-[11px]">
                          {new Date(log.createdAt).toLocaleTimeString()} ({formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })})
                        </td>
                        <td className="p-3.5 font-semibold text-white">{log.provider}</td>
                        <td className="p-3.5 text-zinc-300">{log.eventType}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            log.direction === 'INBOUND' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {log.direction}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            log.status === 'QUARANTINED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-400 max-w-xs truncate text-[11px]">
                          {log.errorMessage || 'Completed successfully'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* New Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#121417] border border-[#1E2227] rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden my-auto">
            <div className="p-5 border-b border-[#1E2227] flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Connect New OTA Channel</h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-sans">Configure credentials for automated 2-way distribution.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#181A1D] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddConnection} className="flex flex-col flex-1">
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">OTA Provider</label>
                  <select 
                    value={formData.providerCode} 
                    onChange={e => setFormData({...formData, providerCode: e.target.value})}
                    className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg p-2.5 text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
                  >
                    <option value="BOOKING_COM">Booking.com</option>
                    <option value="EXPEDIA">Expedia</option>
                    <option value="AIRBNB">Airbnb</option>
                    <option value="AGODA">Agoda</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Target Property</label>
                  <select 
                    value={formData.propertyId} 
                    onChange={e => setFormData({...formData, propertyId: e.target.value})}
                    className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg p-2.5 text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    {formData.providerCode === 'AGODA' ? 'Agoda Client ID' : 'Client / Machine Account ID'}
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={formData.clientId} 
                    onChange={e => setFormData({...formData, clientId: e.target.value})} 
                    placeholder={formData.providerCode === 'AGODA' ? 'e.g. agoda_client_id' : 'e.g. bcom_hotel_74829'} 
                    className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg p-2.5 text-white text-xs font-mono focus:outline-none focus:border-zinc-500" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Environment</label>
                  <select 
                    value={formData.environment} 
                    onChange={e => setFormData({...formData, environment: e.target.value})} 
                    className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg p-2.5 text-white text-xs font-mono focus:outline-none focus:border-zinc-500" 
                  >
                    <option value="PRODUCTION">Production (Live Inventory & Bookings)</option>
                    <option value="TEST">Sandbox / Test (Demand API Sandbox)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    {formData.providerCode === 'AGODA' ? 'Agoda Hotel Code (Property ID)' : 'Affiliate / Partner ID (X-Affiliate-Id)'}
                  </label>
                  <input 
                    type="text" 
                    required={formData.providerCode === 'AGODA'} 
                    value={formData.affiliateId} 
                    onChange={e => setFormData({...formData, affiliateId: e.target.value})} 
                    placeholder={formData.providerCode === 'AGODA' ? 'e.g. 61027' : 'e.g. 3849201'} 
                    className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg p-2.5 text-white text-xs font-mono focus:outline-none focus:border-zinc-500" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    {formData.providerCode === 'AGODA' ? 'Agoda Client Secret (OAuth 2.0)' : 'API Bearer Token / Secret'}
                  </label>
                  <input 
                    type="password" 
                    required 
                    value={formData.clientSecret} 
                    onChange={e => setFormData({...formData, clientSecret: e.target.value})} 
                    placeholder="••••••••••••" 
                    className="w-full bg-[#181A1D] border border-[#2B3037] rounded-lg p-2.5 text-white text-xs font-mono focus:outline-none focus:border-zinc-500" 
                  />
                </div>
              </div>
              <div className="p-4 border-t border-[#1E2227] flex justify-end gap-2 bg-[#141619]">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-xs text-zinc-400 hover:text-white font-mono h-8" 
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-8" 
                >
                  {isSubmitting ? 'Connecting...' : 'Connect OTA'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminPageShell>
  );
}

function RoomMappingRow({ 
  roomType, 
  initialMapping, 
  isSaving, 
  onSave 
}: { 
  roomType: any; 
  initialMapping: any; 
  isSaving: boolean; 
  onSave: (m: any) => void; 
}) {
  const [otaRoomTypeId, setOtaRoomTypeId] = useState(initialMapping.otaRoomTypeId || '');
  const [otaRatePlanId, setOtaRatePlanId] = useState(initialMapping.otaRatePlanId || '');
  const [syncEnabled, setSyncEnabled] = useState(initialMapping.syncEnabled ?? true);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = () => {
    onSave({
      ...initialMapping,
      localRoomTypeId: roomType.id,
      otaRoomTypeId,
      otaRatePlanId,
      syncEnabled
    });
    setIsDirty(false);
  };

  return (
    <tr className="hover:bg-[#141619]/50 transition-colors">
      <td className="p-3.5">
        <p className="font-semibold text-white font-mono text-xs">{roomType.name}</p>
        <p className="text-[10px] text-zinc-500 font-mono">ID: {roomType.id}</p>
      </td>
      <td className="p-3.5">
        <input 
          value={otaRoomTypeId} 
          onChange={(e) => {
            setOtaRoomTypeId(e.target.value);
            setIsDirty(true);
          }} 
          placeholder="e.g. BCOM_DELUXE_01" 
          className="bg-[#181A1D] border border-[#2B3037] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono w-44 focus:outline-none focus:border-zinc-500" 
        />
      </td>
      <td className="p-3.5">
        <input 
          value={otaRatePlanId} 
          onChange={(e) => {
            setOtaRatePlanId(e.target.value);
            setIsDirty(true);
          }} 
          placeholder="e.g. BAR_RATE" 
          className="bg-[#181A1D] border border-[#2B3037] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono w-36 focus:outline-none focus:border-zinc-500" 
        />
      </td>
      <td className="p-3.5 text-center">
        <input 
          type="checkbox" 
          checked={syncEnabled} 
          onChange={(e) => {
            setSyncEnabled(e.target.checked);
            setIsDirty(true);
          }} 
          className="w-4 h-4 rounded border-[#2B3037] bg-[#181A1D] text-white accent-white cursor-pointer" 
        />
      </td>
      <td className="p-3.5 text-right">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !isDirty} 
          size="sm" 
          className={`h-7 px-2.5 text-xs font-mono uppercase tracking-wider transition-all ${
            isDirty 
              ? 'bg-white hover:bg-zinc-200 text-black font-semibold' 
              : 'bg-[#181A1D] text-zinc-600 border border-[#2B3037] cursor-not-allowed'
          }`} 
        >
          <Save className="w-3 h-3 mr-1" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </td>
    </tr>
  );
}
