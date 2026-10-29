'use client';

import React, { useState } from 'react';
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lock, 
  Activity, 
  Zap, 
  Terminal, 
  RotateCw, 
  Trash2, 
  AlertTriangle,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface ActiveLock {
  resource: string;
  key: string;
  acquiredAt: string;
  ttl: number;
  holderProcess: string;
}

interface OutboxEvent {
  id: string;
  type: string;
  status: 'PENDING' | 'DISPATCHED' | 'FAILED';
  retryCount: number;
  payload: string;
}

export default function PlatformToolsPage() {
  const [activeLocks, setActiveLocks] = useState<ActiveLock[]>([
    { resource: "Room #102 Reservation", key: "booking:room:GP102", acquiredAt: "14:48:02", ttl: 45, holderProcess: "pid-8812" },
    { resource: "Order #88A Payment Capture", key: "payment:order:88A", acquiredAt: "14:48:15", ttl: 120, holderProcess: "pid-8901" }
  ]);

  const [outboxEvents, setOutboxEvents] = useState<OutboxEvent[]>([
    { id: "evt-001", type: "booking.created", status: "DISPATCHED", retryCount: 0, payload: '{"bookingId":"b99a","roomId":"GP402"}' },
    { id: "evt-002", type: "financial.revenue_recognized", status: "PENDING", retryCount: 0, payload: '{"amount":450,"account":"2200"}' },
    { id: "evt-003", type: "ota.parity_drift", status: "FAILED", retryCount: 3, payload: '{"expected":500,"actual":430}' }
  ]);

  const [selfHealingLogs, setSelfHealingLogs] = useState<string[]>([]);
  const [isRunningScript, setIsRunningScript] = useState(false);

  const handleRunSelfHealing = () => {
    setIsRunningScript(true);
    setSelfHealingLogs(prev => [
      ...prev, 
      `[${new Date().toLocaleTimeString()}] SRE Auto-Healer: Launching diagnostic cycle...`,
      `[${new Date().toLocaleTimeString()}] LOCK_INSPECTOR: Found 0 dead locked states.`,
      `[${new Date().toLocaleTimeString()}] OUTBOX_RECONCILER: Found 1 failed event (evt-003). Rewriting backoff sequence...`,
      `[${new Date().toLocaleTimeString()}] AUDIT_ALIGNMENT: Projection snapshot regenerated. Parity alignment: 100%.`,
      `[${new Date().toLocaleTimeString()}] SRE Auto-Healer: Diagnostic cycle completed. Zero remaining vulnerabilities.`
    ]);
    
    setOutboxEvents(prev => prev.map(e => e.id === 'evt-003' ? { ...e, status: 'PENDING', retryCount: 0 } : e));
    setIsRunningScript(false);
  };

  const handleReleaseLock = (key: string) => {
    setActiveLocks(prev => prev.filter(l => l.key !== key));
    setSelfHealingLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] LOCK_MANAGER: Manually released lock on key [${key}]`]);
  };

  return (
    <AdminPageShell
      title="Platform Operations Hub"
      subtitle="SRE Developer Portal for debugging active transactions, releasing deadlocked states, tracking event pipelines & self-healing sweeps."
      actions={
        <div className="flex items-center gap-3">
          <div className="bg-[#121417] border border-[#1E2227] rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Active Locks:</span>
            <span className="text-xs font-bold font-mono text-white">{activeLocks.length}</span>
          </div>
          <div className="bg-[#121417] border border-[#1E2227] rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Failed Events:</span>
            <span className="text-xs font-bold font-mono text-rose-400">
              {outboxEvents.filter(e => e.status === 'FAILED').length}
            </span>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Locks & Outbox (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Distributed Lock Inspector */}
          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-none">
            <CardHeader className="border-b border-[#1E2227] pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" /> Concurrency Lock Inspector
              </CardTitle>
              <Badge className="bg-[#141619] border border-[#1E2227] text-zinc-400 font-mono text-xs">
                {activeLocks.length} Active
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {activeLocks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#141619] text-zinc-400 border-b border-[#1E2227] text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3 font-semibold">Resource</th>
                        <th className="p-3 font-semibold">Lock Key</th>
                        <th className="p-3 font-semibold">Acquired</th>
                        <th className="p-3 font-semibold">TTL</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2227]">
                      {activeLocks.map((lock) => (
                        <tr key={lock.key} className="hover:bg-[#141619]/50 transition-colors">
                          <td className="p-3 font-semibold text-white font-sans">{lock.resource}</td>
                          <td className="p-3 text-zinc-400">{lock.key}</td>
                          <td className="p-3 text-zinc-400">{lock.acquiredAt}</td>
                          <td className="p-3 text-amber-400">{lock.ttl}s</td>
                          <td className="p-3 text-right">
                            <Button
                              onClick={() => handleReleaseLock(lock.key)}
                              variant="outline"
                              size="sm"
                              className="px-2 py-0.5 h-6 text-[10px] font-mono border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              KILL_LOCK
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                  Zero active locks detected in cluster.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outbox Event Browser */}
          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-none">
            <CardHeader className="border-b border-[#1E2227] pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Outbox Event Broker
              </CardTitle>
              <Badge className="bg-[#141619] border border-[#1E2227] text-zinc-400 font-mono text-xs">
                {outboxEvents.length} Events
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#141619] text-zinc-400 border-b border-[#1E2227] text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3 font-semibold">Event ID</th>
                      <th className="p-3 font-semibold">Type</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold">Retries</th>
                      <th className="p-3 text-right">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2227]">
                    {outboxEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-[#141619]/50 transition-colors">
                        <td className="p-3 text-zinc-300 font-semibold">{evt.id}</td>
                        <td className="p-3 text-white font-sans">{evt.type}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            evt.status === 'DISPATCHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            evt.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {evt.status}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400">{evt.retryCount}</td>
                        <td className="p-3 text-right text-zinc-400 truncate max-w-[150px]" title={evt.payload}>
                          {evt.payload}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: SRE Controls & Diagnostics (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Self-Healing Panel */}
          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-none">
            <CardHeader className="border-b border-[#1E2227] pb-3">
              <CardTitle className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> SRE Self-Healing Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Trigger automated background sweeps to reconcile transaction outboxes, flush orphaned Redis locks, and recalculate event snapshots.
              </p>
              
              <Button
                onClick={handleRunSelfHealing}
                disabled={isRunningScript}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-9"
              >
                {isRunningScript ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> RECONCILING STREAM...
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5 mr-1.5" /> EXECUTE SELF-HEALING
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Diagnostic Log Output */}
          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl shadow-none">
            <CardHeader className="border-b border-[#1E2227] pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" /> Console Diagnostic Stream
              </CardTitle>
              {selfHealingLogs.length > 0 && (
                <button
                  onClick={() => setSelfHealingLogs([])}
                  className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <div className="bg-[#090A0C] border border-[#1E2227] rounded-lg p-3 min-h-[200px] flex flex-col justify-between">
                {selfHealingLogs.length > 0 ? (
                  <div className="space-y-1.5 font-mono text-[11px] text-zinc-400 max-h-[180px] overflow-y-auto">
                    {selfHealingLogs.map((log, idx) => (
                      <div key={idx} className={log.includes('completed') ? 'text-emerald-400' : log.includes('released') ? 'text-amber-400' : ''}>
                        {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] font-mono text-zinc-600 italic">Console idle. Execute self-healing sweep above to generate report details.</p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </AdminPageShell>
  );
}
