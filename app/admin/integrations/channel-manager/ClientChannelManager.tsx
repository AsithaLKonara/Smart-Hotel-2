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
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen bg-transparent text-[#FBFAF7] font-sans p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                OTA & Distribution Hub
              </span>
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-white flex items-center gap-3">
              <Network className="w-8 h-8 text-[#D4AF37]" />
              Channel Manager Core
            </h1>
            <p className="text-[#8E8C94] text-sm max-w-xl">
              Centralized OTA connectivity for Booking.com, Airbnb, Agoda, and Expedia. Synchronize room availability, push rates, and manage 2-way mappings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-end">
            <Link 
              href="/admin/pricing"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-semibold border border-white/10 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Rate Plans & Pricing <ArrowRight className="w-3.5 h-3.5 text-white/50" />
            </Link>
            <button 
              onClick={handleForceSync}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-semibold border border-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Force Sync All'}
            </button>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="flex items-center gap-2 bg-[#D4AF37] text-black hover:bg-[#C3A030] px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Connection
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('CHANNELS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'CHANNELS'
                ? 'bg-[#D4AF37] text-black shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            Active Channels ({providers.length})
          </button>
          <button
            onClick={() => setActiveTab('MAPPING')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'MAPPING'
                ? 'bg-[#D4AF37] text-black shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Room Type Mappings
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'LOGS'
                ? 'bg-[#D4AF37] text-black shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            Sync Events {logs.length > 0 && `(${logs.length})`}
          </button>
        </div>

        {/* Tab 1: Channels */}
        {activeTab === 'CHANNELS' && (
          <div>
            {providers.length === 0 ? (
              <div className="bg-[#121118]/80 rounded-xl border border-white/5 p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Globe2 className="w-8 h-8 text-[#8E8C94]" />
                </div>
                <h3 className="text-lg font-medium text-white">No OTA Connections Configured</h3>
                <p className="text-[#8E8C94] text-sm mt-2 max-w-md mx-auto">
                  Connect your first OTA channel (Booking.com, Airbnb, Expedia) to enable automatic 2-way sync of inventory and reservations.
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)} 
                  className="mt-6 flex items-center gap-2 bg-[#D4AF37] text-black hover:bg-[#C3A030] px-5 py-2.5 rounded-lg text-xs font-bold transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" /> Connect Channel
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {providers.map((provider) => (
                  <div key={provider.id} className="bg-[#121118]/80 rounded-xl border border-white/5 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-black/60 shadow-sm flex items-center justify-center border border-[#D4AF37]/30 font-bold text-[#D4AF37] text-xl">
                          {provider.code.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-white">{provider.name}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold tracking-wider">
                              Active Integration
                            </span>
                            <span className="text-xs text-white/40">
                              {provider.connections?.length || 0} Property Linked
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleForceSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white/80 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync Now
                      </button>
                    </div>
                    
                    <div className="divide-y divide-white/5">
                      {provider.connections?.map((conn: any) => (
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
                                  {conn.status || 'CONNECTED'}
                                </span>
                                <span className="text-[10px] text-[#8E8C94] uppercase tracking-wider font-bold px-2 py-0.5 bg-black/40 border border-white/5 rounded">
                                  {conn.environment || 'PRODUCTION'}
                                </span>
                              </div>

                              <div className="flex gap-8 text-sm">
                                <div>
                                  <p className="text-[#8E8C94] text-xs uppercase tracking-wider font-semibold mb-1">Last Sync</p>
                                  <p className="font-medium text-white font-mono text-xs">
                                    {conn.lastSyncAt ? formatDistanceToNow(new Date(conn.lastSyncAt), { addSuffix: true }) : 'Just now'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[#8E8C94] text-xs uppercase tracking-wider font-semibold mb-1">Status</p>
                                  <p className="font-medium text-emerald-400 font-mono text-xs flex items-center gap-1">
                                    <Check className="w-3 h-3" /> 2-Way Live Sync Active
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 self-center">
                              <button 
                                onClick={() => setActiveTab('MAPPING')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FBFAF7] bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                              >
                                <LinkIcon className="w-3.5 h-3.5 text-[#D4AF37]" /> Map Rooms
                              </button>
                            </div>
                          </div>

                          {conn.syncEvents && conn.syncEvents.length > 0 && (
                            <div className="mt-6 border border-white/5 rounded-lg overflow-hidden">
                              <div className="bg-black/40 px-4 py-2 text-[10px] font-bold text-[#8E8C94] uppercase tracking-wider border-b border-white/5">
                                Recent Sync Events
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
                      
                      {(!provider.connections || provider.connections.length === 0) && (
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
        )}

        {/* Tab 2: Room Type Mappings */}
        {activeTab === 'MAPPING' && (
          <div className="bg-[#121118]/80 rounded-xl border border-white/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-[#D4AF37]" /> OTA Room Type Mappings
                </h2>
                <p className="text-xs text-[#8E8C94] mt-1">
                  Map each internal PMS room type to its corresponding OTA Channel Room ID and Rate Plan ID.
                </p>
              </div>
              <button
                onClick={fetchMappings}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMappings ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {loadingMappings ? (
              <div className="p-12 text-center text-white/50 text-sm">Loading room mappings...</div>
            ) : roomTypes.length === 0 ? (
              <div className="p-12 text-center text-white/50 text-sm">No room types found. Create room types first under Room Operations.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white">
                  <thead className="bg-white/5 text-white/50 text-xs uppercase border-b border-white/10">
                    <tr>
                      <th className="p-4">Internal Room Type</th>
                      <th className="p-4">OTA Room Type ID</th>
                      <th className="p-4">OTA Rate Plan ID</th>
                      <th className="p-4 text-center">Sync Enabled</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
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
          <div className="bg-[#121118]/80 rounded-xl border border-white/5 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Channel Synchronization Logs</h2>
                <p className="text-[#8E8C94] text-xs mt-1">Audit trail of inbound reservation pulls and outbound availability broadcasts.</p>
              </div>
              <button 
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
            {loadingLogs ? (
              <div className="p-12 text-center text-[#8E8C94]">Loading audit events...</div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-[#8E8C94]">No sync events recorded yet. Click &quot;Force Sync All&quot; above to initiate a sync.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white">
                  <thead className="bg-white/5 text-white/50 text-xs uppercase border-b border-white/10">
                    <tr>
                      <th className="p-4">Time</th>
                      <th className="p-4">Channel</th>
                      <th className="p-4">Event</th>
                      <th className="p-4">Direction</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Notes / Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 text-xs font-mono text-white/70">
                          {new Date(log.createdAt).toLocaleTimeString()} ({formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })})
                        </td>
                        <td className="p-4 font-semibold text-xs">{log.provider}</td>
                        <td className="p-4 font-mono text-xs text-[#D4AF37]">{log.eventType}</td>
                        <td className="p-4 text-xs">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.direction === 'INBOUND' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                            {log.direction}
                          </span>
                        </td>
                        <td className="p-4 text-xs">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            log.status === 'QUARANTINED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-white/60 font-mono max-w-xs truncate">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121118] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold font-serif text-[#D4AF37]">Connect New OTA Channel</h3>
              <p className="text-sm text-slate-400 mt-1">Configure credentials for automated 2-way distribution.</p>
            </div>
            <form onSubmit={handleAddConnection}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">OTA Provider</label>
                  <select 
                    value={formData.providerCode} 
                    onChange={e => setFormData({...formData, providerCode: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="BOOKING_COM">Booking.com</option>
                    <option value="EXPEDIA">Expedia</option>
                    <option value="AIRBNB">Airbnb</option>
                    <option value="AGODA">Agoda</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Target Property</label>
                  <select 
                    value={formData.propertyId} 
                    onChange={e => setFormData({...formData, propertyId: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {formData.providerCode === 'AGODA' ? 'Agoda Client ID' : 'Client / Machine Account ID'}
                  </label>
                  <input 
                    type="text"
                    required
                    value={formData.clientId}
                    onChange={e => setFormData({...formData, clientId: e.target.value})}
                    placeholder={formData.providerCode === 'AGODA' ? 'e.g. agoda_client_id' : 'e.g. bcom_hotel_74829'}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Environment</label>
                  <select 
                    value={formData.environment} 
                    onChange={e => setFormData({...formData, environment: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="PRODUCTION">Production (Live Inventory & Bookings)</option>
                    <option value="TEST">Sandbox / Test (Demand API Sandbox)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {formData.providerCode === 'AGODA' ? 'Agoda Hotel Code (Property ID)' : 'Affiliate / Partner ID (X-Affiliate-Id)'}
                  </label>
                  <input 
                    type="text"
                    required={formData.providerCode === 'AGODA'}
                    value={formData.affiliateId}
                    onChange={e => setFormData({...formData, affiliateId: e.target.value})}
                    placeholder={formData.providerCode === 'AGODA' ? 'e.g. 61027' : 'e.g. 3849201'}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                  <p className="text-[11px] text-slate-500">
                    {formData.providerCode === 'AGODA' 
                      ? 'Agoda Property ID registered in YCS portal' 
                      : 'Required by Booking.com Demand API v3.2 header'}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {formData.providerCode === 'AGODA' ? 'Agoda Client Secret (OAuth 2.0)' : 'API Bearer Token / Secret'}
                  </label>
                  <input 
                    type="password"
                    required
                    value={formData.clientSecret}
                    onChange={e => setFormData({...formData, clientSecret: e.target.value})}
                    placeholder="••••••••••••"
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-black/20">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 text-xs font-bold bg-[#D4AF37] text-black hover:bg-[#C3A030] rounded-lg disabled:opacity-50"
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
    <tr className="hover:bg-white/[0.02]">
      <td className="p-4">
        <p className="font-semibold text-white">{roomType.name}</p>
        <p className="text-[11px] text-white/40 font-mono">ID: {roomType.id}</p>
      </td>
      <td className="p-4">
        <input 
          value={otaRoomTypeId}
          onChange={(e) => {
            setOtaRoomTypeId(e.target.value);
            setIsDirty(true);
          }}
          placeholder="e.g. BCOM_DELUXE_01"
          className="bg-black/50 border border-white/10 rounded px-3 py-1.5 text-xs text-white font-mono w-48 focus:outline-none focus:border-[#D4AF37]"
        />
      </td>
      <td className="p-4">
        <input 
          value={otaRatePlanId}
          onChange={(e) => {
            setOtaRatePlanId(e.target.value);
            setIsDirty(true);
          }}
          placeholder="e.g. BAR_RATE"
          className="bg-black/50 border border-white/10 rounded px-3 py-1.5 text-xs text-white font-mono w-36 focus:outline-none focus:border-[#D4AF37]"
        />
      </td>
      <td className="p-4 text-center">
        <input 
          type="checkbox"
          checked={syncEnabled}
          onChange={(e) => {
            setSyncEnabled(e.target.checked);
            setIsDirty(true);
          }}
          className="w-4 h-4 rounded border-white/20 bg-black text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
        />
      </td>
      <td className="p-4 text-right">
        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 ml-auto transition-all ${
            isDirty
              ? 'bg-[#D4AF37] text-black hover:bg-[#C3A030]'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </td>
    </tr>
  );
}
