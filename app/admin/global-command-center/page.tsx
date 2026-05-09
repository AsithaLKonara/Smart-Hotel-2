'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlobalNode {
  id: string;
  name: string;
  lat: string;
  lon: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  occupancy: number;
  activeIncidents: number;
  p95LatencyMs: number;
}

export default function GlobalCommandCenter() {
  const [nodes, setNodes] = useState<GlobalNode[]>([
    { id: "node-sing", name: "Singapore Gateway Node (APAC-Core)", lat: "1.3521° N", lon: "103.8198° E", status: "ONLINE", occupancy: 88, activeIncidents: 0, p95LatencyMs: 42 },
    { id: "node-lond", name: "London Regency Node (EMEA-Core)", lat: "51.5074° N", lon: "0.1278° W", status: "ONLINE", occupancy: 72, activeIncidents: 1, p95LatencyMs: 84 },
    { id: "node-mald", name: "Maldives Satellite Node (APAC-Edge)", lat: "3.2028° N", lon: "73.2207° E", status: "DEGRADED", occupancy: 94, activeIncidents: 0, p95LatencyMs: 140 },
    { id: "node-ny", name: "New York Hub Node (AMER-Core)", lat: "40.7128° N", lon: "74.0060° W", status: "ONLINE", occupancy: 65, activeIncidents: 0, p95LatencyMs: 55 }
  ]);

  const [activeRegionFailover, setActiveRegionFailover] = useState(false);
  const [failoverLogs, setFailoverLogs] = useState<string[]>([]);

  const triggerFailoverSim = () => {
    setActiveRegionFailover(true);
    setFailoverLogs([]);
    
    // Add sequential SRE automated geo-failover simulation logs
    const addLog = (msg: string, delay: number) => {
      setTimeout(() => {
        setFailoverLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] SRE_ORCHESTRATOR: ${msg}`]);
      }, delay);
    };

    addLog("Detecting degraded satellite latency on Maldives Edge Node...", 200);
    addLog("Initiating active-active cluster diversion logic...", 600);
    addLog("Rerouting persistent client websockets to Singapore Gateway Core...", 1100);
    addLog("Securing transactional database isolation locks...", 1600);
    addLog("Maldives traffic fully failover-diversified. Latency normalized to 45ms.", 2100);
    
    setTimeout(() => {
      setNodes(prev => prev.map(n => n.id === 'node-mald' ? { ...n, status: 'ONLINE', p95LatencyMs: 45 } : n));
      setActiveRegionFailover(false);
    }, 2400);
  };

  return (
    <div className="min-h-screen bg-[#060308] text-[#FBFAF7] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.04]">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-medium">Worldwide Operational Watch</span>
            <h1 className="text-4xl font-serif font-light tracking-wide text-white">Global Command Center</h1>
            <p className="text-[#8E8C94] text-sm">
              Worldwide property directory, live cluster latencies, geo-redundancy failover switches, and real-time SLA metrics.
            </p>
          </div>

          <button
            onClick={triggerFailoverSim}
            disabled={activeRegionFailover}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] to-[#9C8259] text-[#09050D] hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {activeRegionFailover ? 'FAILOVER IN PROGRESS...' : 'TRIGGER GEOGRAPHICAL FAILOVER'}
          </button>
        </div>

        {/* Global SLA Health parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-5">
            <span className="text-xs text-[#8E8C94] uppercase tracking-wider block">Platform SLA Availability</span>
            <span className="text-2xl font-light font-serif text-[#D4AF37] mt-2 block">99.995% Target</span>
            <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden mt-3">
              <div className="bg-gradient-to-r from-[#D4AF37] to-[#9C8259] h-full w-[99.995%]" />
            </div>
          </div>

          <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-5">
            <span className="text-xs text-[#8E8C94] uppercase tracking-wider block">Financial Accounting Drift</span>
            <span className="text-2xl font-light font-serif text-emerald-400 mt-2 block">0 (Balanced)</span>
            <span className="text-[10px] text-emerald-400/80 font-mono mt-2 block">Double-Entry aligned</span>
          </div>

          <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-5">
            <span className="text-xs text-[#8E8C94] uppercase tracking-wider block">Global Median Latency</span>
            <span className="text-2xl font-light font-serif text-white mt-2 block">55ms P95</span>
            <span className="text-[10px] text-[#8E8C94] font-mono mt-2 block">Routing within limits</span>
          </div>

          <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-5">
            <span className="text-xs text-[#8E8C94] uppercase tracking-wider block">Reconciliation Replay Drift</span>
            <span className="text-2xl font-light font-serif text-emerald-400 mt-2 block">0 Out of Sync</span>
            <span className="text-[10px] text-emerald-400/80 font-mono mt-2 block">Satellite edge synced</span>
          </div>
        </div>

        {/* Console Workspace layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 1. Worldwide Node Directory Table */}
          <div className="lg:col-span-8 bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-serif font-light text-white tracking-wider">Geographic Operational Nodes</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.04] text-[#8E8C94] text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Gateway Location</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Active Occupancy</th>
                    <th className="pb-3 font-semibold">Incidents</th>
                    <th className="pb-3 text-right font-semibold">P95 Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {nodes.map((node) => (
                    <tr key={node.id} className="text-xs">
                      <td className="py-4">
                        <div className="font-semibold text-white">{node.name}</div>
                        <div className="text-[10px] text-[#8E8C94] font-mono mt-0.5">{node.lat} • {node.lon}</div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          node.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          node.status === 'DEGRADED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {node.status}
                        </span>
                      </td>
                      <td className="py-4 font-semibold text-white">{node.occupancy}%</td>
                      <td className="py-4 text-[#8E8C94] font-mono">{node.activeIncidents}</td>
                      <td className="py-4 text-right font-mono font-semibold text-[#D4AF37]">{node.p95LatencyMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Failover console output logs */}
          <div className="lg:col-span-4 bg-black/40 border border-white/[0.02] rounded-2xl p-6 min-h-[350px] flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-wider text-[#8E8C94] font-medium block border-b border-white/[0.04] pb-2">
                SRE Failover Log Stream
              </span>
              
              {failoverLogs.length > 0 ? (
                <div className="space-y-2 font-mono text-[11px] text-[#8E8C94] max-h-[220px] overflow-y-auto">
                  {failoverLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('normalized') ? 'text-emerald-400' : log.includes('Initiating') ? 'text-amber-400' : ''}>
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8E8C94] italic text-center py-12">No active failover procedures in progress. Standby secure.</p>
              )}
            </div>

            {failoverLogs.length > 0 && !activeRegionFailover && (
              <button
                onClick={() => setFailoverLogs([])}
                className="text-[10px] font-mono text-[#D4AF37] hover:underline self-start mt-4"
              >
                Flush log streams
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
