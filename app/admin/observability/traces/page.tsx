'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TraceSpan {
  id: string;
  name: string;
  service: string;
  durationMs: number;
  status: 'success' | 'warning' | 'error';
  dbQueries?: string[];
  logs?: string[];
}

interface TraceRoute {
  id: string;
  action: string;
  timestamp: string;
  durationMs: number;
  correlationId: string;
  causationId: string;
  spans: TraceSpan[];
}

export default function TraceExplorerPage() {
  const [traces, setTraces] = useState<TraceRoute[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<TraceRoute | null>(null);

  useEffect(() => {
    fetch('/api/admin/observability/traces')
      .then(res => res.json())
      .then(data => {
        if (data.traces && data.traces.length > 0) {
          setTraces(data.traces);
          setSelectedTrace(data.traces[0]);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#09050D] text-[#FBFAF7] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-medium">SRE Forensic Suite</span>
          <h1 className="text-4xl font-serif font-light tracking-wide text-white">Distributed Trace Explorer</h1>
          <p className="text-[#8E8C94] max-w-2xl text-sm">
            Monitor distributed transactions across routes, tracing span lifetimes, database queries, and parent-child correlation streams for transactional diagnostics.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Traces Sidebar List */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#8E8C94] font-medium px-1">Transaction Stream</h3>
            <div className="space-y-3">
              {traces.length === 0 ? (
                <div className="text-sm text-[#8E8C94] p-4 text-center">No trace data available.</div>
              ) : traces.map((trace) => (
                <div
                  key={trace.id}
                  onClick={() => setSelectedTrace(trace)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 flex flex-col space-y-3 ${
                    selectedTrace?.id === trace.id
                      ? 'bg-gradient-to-r from-[#1B1922] to-[#121118] border-[#D4AF37]/35 shadow-[0_4px_20px_rgba(212,175,55,0.06)]'
                      : 'bg-[#121118]/80 border-white/[0.04] hover:border-white/[0.1] hover:bg-[#121118]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-[#D4AF37]">{trace.id}</span>
                    <span className="text-[11px] text-[#8E8C94]">
                      {new Date(trace.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{trace.action}</h4>
                      <p className="text-xs text-[#8E8C94] font-mono mt-1">corr: {trace.correlationId.slice(5)}</p>
                    </div>
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white/[0.03] text-[#FBFAF7]/80 border border-white/[0.05]">
                      {trace.durationMs}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trace Detail Node Graph */}
          <div className="lg:col-span-7 bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6 min-h-[500px]">
            <AnimatePresence mode="wait">
              {selectedTrace ? (
                <motion.div
                  key={selectedTrace.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Detailed Summary Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/[0.04] pb-4 gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E8C94]">Selected Trace</span>
                      <h2 className="text-lg font-semibold text-white mt-0.5">{selectedTrace.action}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <span className="px-2 py-1 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/15">
                        Corr: {selectedTrace.correlationId}
                      </span>
                      <span className="px-2 py-1 rounded bg-white/[0.03] text-[#8E8C94] border border-white/[0.05]">
                        Cause: {selectedTrace.causationId}
                      </span>
                    </div>
                  </div>

                  {/* Visual Node Chain/Flowchart */}
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-[0.2em] text-[#8E8C94] font-medium">Distributed Causation Spans</h3>
                    <div className="relative pl-6 border-l border-[#D4AF37]/15 space-y-6 py-2">
                      {selectedTrace.spans.map((span, idx) => (
                        <div key={span.id} className="relative group">
                          {/* Left node dot indicator */}
                          <div className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 bg-[#09050D] flex items-center justify-center transition-all duration-300 ${
                            span.status === 'success' ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' :
                            span.status === 'warning' ? 'border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)]' :
                            'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                          }`} />

                          {/* Span Info */}
                          <div className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.03] hover:border-white/[0.06] rounded-xl p-4 transition-all duration-300 space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs uppercase font-mono font-bold text-white/[0.5] bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.04]">
                                  {span.service}
                                </span>
                                <h4 className="text-sm font-semibold text-white">{span.name}</h4>
                              </div>
                              <span className="text-xs font-mono text-[#8E8C94]">{span.durationMs}ms</span>
                            </div>

                            {/* Database Queries Executed */}
                            {span.dbQueries && span.dbQueries.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] uppercase tracking-[0.15em] text-[#8E8C94]">DB Queries:</span>
                                <div className="space-y-1">
                                  {span.dbQueries.map((query, qidx) => (
                                    <pre key={qidx} className="bg-black/40 p-2 rounded text-[11px] font-mono text-emerald-400 border border-white/[0.02] overflow-x-auto">
                                      {query}
                                    </pre>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Internal Trace Logs */}
                            {span.logs && span.logs.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-[0.15em] text-[#8E8C94]">Spans logs:</span>
                                <ul className="list-disc list-inside text-xs text-[#8E8C94] space-y-0.5 pl-1">
                                  {span.logs.map((log, lidx) => (
                                    <li key={lidx}>{log}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-[#8E8C94]">
                  <p>Select a transaction to inspect trace diagnostics.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
