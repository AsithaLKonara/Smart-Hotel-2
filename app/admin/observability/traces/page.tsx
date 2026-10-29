'use client';

import React from 'react';
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Activity, ArrowUpRight } from 'lucide-react';

export default function TraceExplorerPage() {
  return (
    <AdminPageShell
      title="Distributed Tracing & APM"
      subtitle="Production telemetry, distributed span waterfalls, and exception profiling."
    >
      <div className="flex items-center justify-center py-16">
        <Card className="max-w-xl text-center p-8 bg-[#121417] border border-[#1E2227] rounded-2xl shadow-none space-y-5">
          <div className="w-12 h-12 rounded-xl bg-[#181A1D] border border-[#2B3037] flex items-center justify-center mx-auto text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-white font-mono uppercase tracking-wider">
              Telemetry Migrated to Sentry APM
            </h2>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-md mx-auto">
              Simulated telemetry generators have been permanently deprecated. All distributed tracing, span waterfalls, and live performance metrics are routed to the central Sentry APM infrastructure.
            </p>
          </div>

          <div className="pt-2">
            <Button
              asChild
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-9 px-5 rounded-lg"
            >
              <a 
                href="https://sentry.io" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2"
              >
                <span>Launch Sentry Console</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </Card>
      </div>
    </AdminPageShell>
  );
}
