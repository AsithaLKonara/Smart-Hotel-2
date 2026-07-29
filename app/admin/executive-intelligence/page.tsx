'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RegionalTrend {
  region: string;
  revpar: number;
  adr: number;
  occupancy: number;
  growth: number;
}

interface AnomalyLog {
  id: string;
  source: string;
  severity: 'CRITICAL' | 'WARNING';
  description: string;
  flaggedAt: string;
}

export default function ExecutiveIntelligenceDashboard() {
  const [regionStats, setRegionStats] = useState<RegionalTrend[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/executive/olap-cube')
      .then(res => res.json())
      .then(data => {
        if (data.regionStats) setRegionStats(data.regionStats);
        if (data.anomalies) setAnomalies(data.anomalies);
      })
      .catch(err => console.error('Failed to fetch OLAP data:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleClearAnomaly = (id: string) => {
    setAnomalies(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#09050D] text-[#FBFAF7] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.04]">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-medium">OLAP Analytical Engine</span>
            <h1 className="text-4xl font-serif font-light tracking-wide text-white">Executive Business Intelligence</h1>
            <p className="text-[#8E8C94] text-sm">
              Consolidated, denormalized corporate ledger cubes, predictive room revenue models, and real-time fraud monitoring modules.
            </p>
          </div>
        </div>

        {/* Executive Stats & Elasticity Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 1. Global Occupancy & RevPAR Matrix */}
          <div className="lg:col-span-8 bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-serif font-light text-white tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" /> Global Revenue & Elasticity Matrix
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.04] text-[#8E8C94] text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Jurisdiction Region</th>
                    <th className="pb-3 font-semibold">RevPAR</th>
                    <th className="pb-3 font-semibold">ADR</th>
                    <th className="pb-3 font-semibold">Occupancy Rate</th>
                    <th className="pb-3 text-right font-semibold">Growth Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {regionStats.map((stat, idx) => (
                    <tr key={idx} className="text-xs">
                      <td className="py-4 font-semibold text-white">{stat.region}</td>
                      <td className="py-4 text-[#D4AF37] font-mono font-semibold">${stat.revpar}</td>
                      <td className="py-4 text-[#8E8C94] font-mono">${stat.adr}</td>
                      <td className="py-4">
                        <span className="font-semibold text-white">{stat.occupancy}%</span>
                        <div className="w-24 bg-white/[0.04] h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-[#D4AF37] h-full" style={{ width: `${stat.occupancy}%` }} />
                        </div>
                      </td>
                      <td className="py-4 text-right font-semibold font-mono">
                        <span className={stat.growth > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {stat.growth > 0 ? `▲ +${stat.growth}%` : `▼ ${stat.growth}%`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Fraud & Anomaly Warnings */}
          <div className="lg:col-span-4 bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-serif font-light text-white tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> AI Fraud & Anomaly Radar
            </h2>
            <p className="text-xs text-[#8E8C94]">
              Continuous ledger discrepancy audits and velocity analyzers tracking suspicious transactional outbox attempts.
            </p>
            
            <div className="space-y-3">
              {anomalies.map((anom) => (
                <div key={anom.id} className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2 relative group">
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      anom.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {anom.severity}
                    </span>
                    <button
                      onClick={() => handleClearAnomaly(anom.id)}
                      className="text-[10px] text-white/40 hover:text-white font-mono"
                    >
                      CLEAR
                    </button>
                  </div>
                  <p className="text-[11px] text-[#FBFAF7]/95 leading-relaxed font-sans">{anom.description}</p>
                  <span className="text-[9px] text-[#8E8C94] font-mono block">Flagged: {anom.flaggedAt} • ID: {anom.id}</span>
                </div>
              ))}

              {anomalies.length === 0 && (
                <p className="text-xs text-emerald-400 font-semibold text-center py-8">Zero system anomalies detected. Platform secure.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
