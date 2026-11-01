'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Settings, CheckCircle2, ChevronRight, Puzzle, Check } from 'lucide-react';
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface MarketplaceApp {
  id: string;
  title: string;
  category: 'INTEGRATION' | 'AI_MODULE' | 'FINANCIAL' | 'MARKETING' | string;
  description: string;
  rating: number;
  installed: boolean;
  cost: string;
  setupUrl?: string;
}

export interface PartnerVendor {
  id: string;
  companyName: string;
  serviceType: string;
  slaMetric: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVIEW' | string;
  lastPayout: number;
}

export default function ClientMarketplace({ initialApps, initialVendors }: { initialApps: MarketplaceApp[], initialVendors: PartnerVendor[] }) {
  const [apps, setApps] = useState<MarketplaceApp[]>(initialApps);
  const [vendors, setVendors] = useState<PartnerVendor[]>(initialVendors);
  const [activeTab, setActiveTab] = useState<'extensions' | 'vendors'>('extensions');

  const handleToggleInstall = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, installed: !a.installed } : a));
  };

  return (
    <AdminPageShell
      title="App & Vendor Marketplace"
      subtitle="Extend property management capabilities with verified integrations, certified modules, and regional service partners."
      actions={
        <div className="flex bg-card dark:bg-[#121417] p-1 rounded-lg border border-border dark:border-[#1E2227]">
          <button
            onClick={() => setActiveTab('extensions')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              activeTab === 'extensions' ? 'bg-muted dark:bg-[#181A1D] border border-border dark:border-[#2B3037] text-foreground dark:text-white font-semibold' : 'text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white'
            }`}
          >
            Extensions
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              activeTab === 'vendors' ? 'bg-muted dark:bg-[#181A1D] border border-border dark:border-[#2B3037] text-foreground dark:text-white font-semibold' : 'text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white'
            }`}
          >
            Service Partners
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* Extensions and Apps Grid Rendering */}
        {activeTab === 'extensions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {apps.map((app) => (
              <Card
                key={app.id}
                className="bg-card dark:bg-[#121417] p-5 rounded-xl border border-border dark:border-[#1E2227] shadow-none hover:border-border/80 dark:hover:border-[#2B3037] transition-all flex flex-col justify-between min-h-[200px]"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted dark:bg-[#181A1D] flex items-center justify-center border border-border dark:border-[#2B3037]">
                        <Puzzle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground dark:text-white font-mono">{app.title}</h3>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-muted dark:bg-[#181A1D] text-muted-foreground dark:text-zinc-400 border border-border dark:border-[#2B3037]">
                          {app.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed font-sans mt-2">{app.description}</p>
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t border-border dark:border-[#1E2227]">
                  <span className="text-xs font-mono text-muted-foreground dark:text-zinc-400 bg-muted dark:bg-[#181A1D] px-2.5 py-1 rounded-md border border-border dark:border-[#2B3037]">{app.cost}</span>
                  
                  <div className="flex items-center gap-2">
                    {app.installed && app.id === 'app-ota' && (
                      <Link href="/admin/integrations/channel-manager">
                        <Button variant="outline" size="sm" className="flex items-center gap-1.5 h-8 text-xs font-mono border-border dark:border-[#1E2227] bg-muted/40 dark:bg-[#141619] hover:bg-muted dark:hover:bg-[#181A1D] text-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white">
                          <Settings className="w-3.5 h-3.5" />
                          Configure
                        </Button>
                      </Link>
                    )}
                    
                    <Button
                      onClick={() => handleToggleInstall(app.id)}
                      size="sm"
                      className={`h-8 px-3 rounded-lg text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        app.installed 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold'
                      }`}
                    >
                      {app.installed ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Installed
                        </>
                      ) : (
                        'Install'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Local Sub-contractor Vendors Table Rendering */}
        {activeTab === 'vendors' && (
          <Card className="bg-card dark:bg-[#121417] border border-border dark:border-[#1E2227] rounded-xl overflow-hidden shadow-none">
            <div className="p-5 border-b border-border dark:border-[#1E2227] bg-muted/40 dark:bg-[#141619]">
              <h2 className="text-sm font-semibold text-foreground dark:text-white font-mono uppercase tracking-wider">External Service Providers</h2>
              <p className="text-xs text-muted-foreground dark:text-zinc-500 mt-0.5 font-sans">Manage local service contracts and track SLA performance.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-muted/40 dark:bg-[#141619] text-muted-foreground dark:text-zinc-400 border-b border-border dark:border-[#1E2227] text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-5 font-semibold">Vendor Company</th>
                    <th className="py-3 px-5 font-semibold">Service Domain</th>
                    <th className="py-3 px-5 font-semibold">SLA Achievement</th>
                    <th className="py-3 px-5 font-semibold">Status</th>
                    <th className="py-3 px-5 text-right font-semibold">Payout (This Month)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-[#1E2227]">
                  {vendors.map((vend) => (
                    <tr key={vend.id} className="hover:bg-muted/30 dark:hover:bg-[#141619]/50 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-foreground dark:text-white font-sans">{vend.companyName}</td>
                      <td className="py-3.5 px-5 text-muted-foreground dark:text-zinc-400">{vend.serviceType}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground dark:text-zinc-200 w-10">{vend.slaMetric}%</span>
                          <div className="w-24 bg-muted dark:bg-[#181A1D] h-1.5 rounded-full overflow-hidden border border-border dark:border-[#2B3037]">
                            <div className="bg-emerald-500 dark:bg-emerald-400 h-full" style={{ width: `${vend.slaMetric}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${
                          vend.status === 'ACTIVE' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {vend.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-foreground dark:text-white">${vend.lastPayout.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </div>
    </AdminPageShell>
  );
}
