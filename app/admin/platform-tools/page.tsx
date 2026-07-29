'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ActiveLock {
  resource: string;
  key: string;
  acquiredAt: string;
  ttl: number; // seconds remaining
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

  const [simulatedTenant, setSimulatedTenant] = useState('standard');
  const [selfHealingLogs, setSelfHealingLogs] = useState<string[]>([]);
  const [isRunningScript, setIsRunningScript] = useState(false);

  // Trigger automated self-healing procedures (dead locks release, dead outbox retry)
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

  // Clear single lock manually
  const handleReleaseLock = (key: string) => {
    setActiveLocks(prev => prev.filter(l => l.key !== key));
    setSelfHealingLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] LOCK_MANAGER: Manually released lock on key [${key}]`]);
  };

  return (
    <div className="min-h-screen bg-[#09050D] text-[#FBFAF7] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.04] pb-6">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-medium">SRE Operational Dashboard</span>
            <h1 className="text-4xl font-serif font-light tracking-wide text-white">Platform Operations Hub</h1>
            <p className="text-[#8E8C94] text-sm">
              SRE Developer Portal for debugging active transactions, releasing deadlocked states, tracking event pipelines, and triggering self-healing runtimes.
            </p>
          </div>

          {/* Quick Stats Summary */}
          <div className="flex gap-4">
            <div className="bg-[#121118] border border-white/[0.04] rounded-xl px-4 py-3 text-center">
              <span className="text-[10px] text-[#8E8C94] uppercase tracking-wider block">Active Locks</span>
              <span className="text-xl font-bold font-mono text-[#D4AF37]">{activeLocks.length}</span>
            </div>
            <div className="bg-[#121118] border border-white/[0.04] rounded-xl px-4 py-3 text-center">
              <span className="text-[10px] text-[#8E8C94] uppercase tracking-wider block">Failed Events</span>
              <span className="text-xl font-bold font-mono text-red-500">
                {outboxEvents.filter(e => e.status === 'FAILED').length}
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Locks & Outbox Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Distributed Lock Inspector */}
            <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-serif font-light text-white tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" /> Concurrency Lock Inspector
              </h2>
              
              {activeLocks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.04] text-[#8E8C94] text-xs uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Resource</th>
                        <th className="pb-3 font-semibold">Lock Key</th>
                        <th className="pb-3 font-semibold">Acquired</th>
                        <th className="pb-3 font-semibold">TTL</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {activeLocks.map((lock) => (
                        <tr key={lock.key} className="text-xs">
                          <td className="py-3 font-semibold text-white">{lock.resource}</td>
                          <td className="py-3 font-mono text-[#8E8C94]">{lock.key}</td>
                          <td className="py-3 text-[#8E8C94]">{lock.acquiredAt}</td>
                          <td className="py-3 text-amber-400 font-mono">{lock.ttl}s</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleReleaseLock(lock.key)}
                              className="px-2 py-1 text-[11px] font-mono border border-red-500/20 text-red-400 rounded hover:bg-red-500/10 transition-colors"
                            >
                              KILL_LOCK
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[#8E8C94]">Zero active locks detected in cluster.</p>
              )}
            </div>

            {/* Outbox Event Browser */}
            <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-serif font-light text-white tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Outbox Event Broker
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-[#8E8C94] text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Event ID</th>
                      <th className="pb-3 font-semibold">Type</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Retries</th>
                      <th className="pb-3 text-right">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {outboxEvents.map((evt) => (
                      <tr key={evt.id} className="text-xs font-mono">
                        <td className="py-3 text-[#D4AF37]">{evt.id}</td>
                        <td className="py-3 text-white font-sans">{evt.type}</td>
                        <td className="py-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            evt.status === 'DISPATCHED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            evt.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {evt.status}
                          </span>
                        </td>
                        <td className="py-3 text-[#8E8C94]">{evt.retryCount}</td>
                        <td className="py-3 text-right text-[#8E8C94] truncate max-w-[150px]" title={evt.payload}>
                          {evt.payload}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* SRE Controls & Diagnostics logs Column */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Self-Healing Panel */}
            <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-serif font-light text-white tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> SRE Self-Healing Engine
              </h2>
              <p className="text-xs text-[#8E8C94]">
                Trigger automated background sweeps to reconcile transaction outboxes, flush orphaned Redis locks, and recalculate event snapshots.
              </p>
              
              <button
                onClick={handleRunSelfHealing}
                disabled={isRunningScript}
                className="w-full py-3 rounded-xl font-semibold text-xs uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] to-[#9C8259] text-[#09050D] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isRunningScript ? 'RECONCILING STREAM...' : 'EXECUTE SELF-HEALING'}
              </button>
            </div>

            {/* Diagnostic Log Output */}
            <div className="bg-black/40 border border-white/[0.02] rounded-2xl p-6 space-y-3 min-h-[250px] flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8C94] font-medium block border-b border-white/[0.04] pb-2">
                  Console Output
                </span>
                {selfHealingLogs.length > 0 ? (
                  <div className="space-y-1.5 font-mono text-[11px] text-[#8E8C94] max-h-[160px] overflow-y-auto pl-1">
                    {selfHealingLogs.map((log, idx) => (
                      <div key={idx} className={log.includes('completed') ? 'text-emerald-400' : log.includes('released') ? 'text-amber-400' : ''}>
                        {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] font-mono text-[#8E8C94] italic pl-1">Console idle. Execute self-healing sweep above to generate report details.</p>
                )}
              </div>

              {selfHealingLogs.length > 0 && (
                <button
                  onClick={() => setSelfHealingLogs([])}
                  className="text-[10px] font-mono text-[#D4AF37] hover:underline self-start mt-2"
                >
                  Clear logs
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
