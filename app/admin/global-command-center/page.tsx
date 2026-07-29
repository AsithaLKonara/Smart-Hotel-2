'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalCommandCenter() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/admin/sre/health');
      const data = await res.json();
      setHealthData(data);
    } catch (e) {
      console.error('Failed to fetch telemetry', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !healthData) {
    return <div className="min-h-screen bg-[#060308] text-[#FBFAF7] p-8 font-sans flex items-center justify-center">Loading SRE Telemetry...</div>;
  }

  const nodes = [
    { id: 'node-db', name: 'PostgreSQL Relational Core', lat: 'us-east-1 (Primary)', lon: 'Port 5432', status: healthData?.database?.status || 'OFFLINE', activeIncidents: healthData?.errors?.rate > 5 ? 1 : 0, p95LatencyMs: healthData?.database?.latency || 0 },
    { id: 'node-redis', name: 'Upstash Redis Edge Cache', lat: 'Global Distributed', lon: 'Port 6379', status: healthData?.redis?.status || 'OFFLINE', activeIncidents: 0, p95LatencyMs: healthData?.redis?.latency || 0 },
    { id: 'node-api', name: 'Next.js App Router API', lat: 'Vercel Edge Network', lon: 'Serverless', status: healthData?.api?.status || 'OFFLINE', activeIncidents: 0, p95LatencyMs: healthData?.api?.latency || 0 },
    { id: 'node-queue', name: 'Transactional Outbox Queue', lat: 'Memory Managed', lon: `Depth: ${healthData?.queue?.pending || 0}`, status: healthData?.queue?.status || 'OFFLINE', activeIncidents: healthData?.queue?.pending > 100 ? 1 : 0, p95LatencyMs: (healthData?.queue?.latencySeconds || 0) * 1000 }
  ];

  return (
    <div className="min-h-screen bg-[#060308] text-[#FBFAF7] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.04]">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-medium">Worldwide Operational Watch</span>
            <h1 className="text-4xl font-serif font-light tracking-wide text-white">Global Command Center</h1>
            <p className="text-[#8E8C94] text-sm">
              Live physical architecture latency, cache redundancy states, and queue transaction backpressure.
            </p>
          </div>
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
            <span className="text-xs text-[#8E8C94] uppercase tracking-wider block">Edge Error Rate</span>
            <span className={`text-2xl font-light font-serif mt-2 block ${healthData?.errors?.rate > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>{healthData?.errors?.rate}%</span>
            <span className="text-[10px] text-emerald-400/80 font-mono mt-2 block">Last 60 Minutes</span>
          </div>

          <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-5">
            <span className="text-xs text-[#8E8C94] uppercase tracking-wider block">API Median Latency</span>
            <span className="text-2xl font-light font-serif text-white mt-2 block">{healthData?.api?.latency}ms P95</span>
            <span className="text-[10px] text-[#8E8C94] font-mono mt-2 block">Routing within limits</span>
          </div>

          <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-5">
            <span className="text-xs text-[#8E8C94] uppercase tracking-wider block">Outbox Queue Depth</span>
            <span className={`text-2xl font-light font-serif mt-2 block ${healthData?.queue?.pending > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>{healthData?.queue?.pending} Pending</span>
            <span className="text-[10px] text-emerald-400/80 font-mono mt-2 block">Max latency: {healthData?.queue?.latencySeconds}s</span>
          </div>
        </div>

        {/* Console Workspace layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 1. Infrastructure Node Table */}
          <div className="lg:col-span-8 bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-serif font-light text-white tracking-wider">Infrastructure Node Diagnostics</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.04] text-[#8E8C94] text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Service Node</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Incidents</th>
                    <th className="pb-3 text-right font-semibold">Ping Latency</th>
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
                          node.status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          node.status === 'WARNING' || node.status === 'DEGRADED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {node.status}
                        </span>
                      </td>
                      <td className="py-4 text-[#8E8C94] font-mono">{node.activeIncidents}</td>
                      <td className="py-4 text-right font-mono font-semibold text-[#D4AF37]">{node.p95LatencyMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. SRE Live Telemetry Output */}
          <div className="lg:col-span-4 bg-black/40 border border-white/[0.02] rounded-2xl p-6 min-h-[350px] flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-wider text-[#8E8C94] font-medium block border-b border-white/[0.04] pb-2 flex justify-between">
                SRE Operations Telemetry Stream
                <span className="text-emerald-400 font-bold animate-pulse text-[8px]">LIVE</span>
              </span>
              
              {healthData?.lineage && healthData.lineage.length > 0 ? (
                <div className="space-y-3 font-mono text-[11px] text-[#8E8C94] max-h-[280px] overflow-y-auto">
                  {healthData.lineage.map((log: any, idx: number) => (
                    <div key={idx} className={`p-2 border rounded ${log.severity === 'ERROR' ? 'border-rose-500/30 bg-rose-500/5 text-rose-300' : 'border-white/[0.05] bg-white/[0.02]'}`}>
                      <div className="text-white mb-1 font-sans font-semibold text-[10px] flex items-center justify-between">
                        {log.type} <span className="text-[#8E8C94] font-mono text-[9px] font-normal">{log.time}</span>
                      </div>
                      {log.message}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8E8C94] italic text-center py-12">No active diagnostic alerts.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
