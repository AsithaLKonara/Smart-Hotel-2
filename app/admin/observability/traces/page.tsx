'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function TraceExplorerPage() {
  return (
    <div className="min-h-screen bg-[#09050D] text-[#FBFAF7] p-8 font-sans flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl text-center space-y-6 bg-[#121118]/80 border border-[#D4AF37]/20 p-12 rounded-3xl"
      >
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto border border-[#D4AF37]/30 mb-6">
          <svg className="w-8 h-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-serif font-light tracking-wide text-white">Traces Migrated to Sentry</h1>
        
        <p className="text-[#8E8C94] text-sm leading-relaxed">
          The simulated OpenTelemetry trace generator has been permanently deprecated to maintain strict engineering integrity. All production telemetry, distributed tracing, and APM metrics are now securely routed to Sentry.
        </p>

        <div className="pt-6">
          <a 
            href="https://sentry.io" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#F2CD5C] transition-colors"
          >
            <span>Open Sentry APM Dashboard</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
