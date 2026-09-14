'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Settings, CheckCircle2, ChevronRight, Puzzle } from 'lucide-react';

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
  slaMetric: number; // percentage
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
    <div className="min-h-screen bg-transparent text-[#FBFAF7] p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight text-white">App Marketplace</h1>
            <p className="text-[#8E8C94] text-sm max-w-xl">
              Extend your property management capabilities with verified integrations, modules, and regional service partners.
            </p>
          </div>

          <div className="flex bg-black/40 p-1 rounded-lg self-start md:self-end border border-white/5">
            <button
              onClick={() => setActiveTab('extensions')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'extensions' ? 'bg-white/10 text-white shadow-sm' : 'text-[#8E8C94] hover:text-white'
              }`}
            >
              Extensions
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'vendors' ? 'bg-white/10 text-white shadow-sm' : 'text-[#8E8C94] hover:text-white'
              }`}
            >
              Service Partners
            </button>
          </div>
        </div>

        {/* Extensions and Apps Grid Rendering */}
        {activeTab === 'extensions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {apps.map((app) => (
              <div
                key={app.id}
                className="bg-[#121118]/80 p-6 rounded-xl border border-white/5 shadow-sm hover:border-[#D4AF37]/30 hover:shadow-[#D4AF37]/5 transition-all flex flex-col justify-between min-h-[220px]"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-black/40 flex items-center justify-center border border-white/10">
                        <Puzzle className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-white">{app.title}</h3>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37]">
                          {app.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[#8E8C94] leading-relaxed mt-4">{app.description}</p>
                </div>

                <div className="flex justify-between items-center pt-5 mt-4 border-t border-white/5">
                  <span className="text-xs font-medium text-[#8E8C94] bg-black/40 px-2.5 py-1 rounded-md border border-white/5">{app.cost}</span>
                  
                  <div className="flex items-center gap-2">
                    {app.installed && app.id === 'app-ota' && (
                      <Link href="/admin/integrations/channel-manager">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 border border-white/10 rounded-lg transition-colors">
                          <Settings className="w-4 h-4" />
                          Configure
                        </button>
                      </Link>
                    )}
                    
                    <button
                      onClick={() => handleToggleInstall(app.id)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        app.installed 
                          ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20' 
                          : 'bg-[#D4AF37] text-black hover:bg-[#C3A030]'
                      }`}
                    >
                      {app.installed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Installed
                        </>
                      ) : (
                        'Install'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Local Sub-contractor Vendors Table Rendering */}
        {activeTab === 'vendors' && (
          <div className="bg-[#121118]/80 border border-white/5 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-medium text-white">External Service Providers</h2>
              <p className="text-sm text-[#8E8C94] mt-1">Manage local service contracts and track SLA performance.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-black/20 text-[#8E8C94] border-b border-white/5">
                    <th className="py-3 px-6 font-medium">Vendor Company</th>
                    <th className="py-3 px-6 font-medium">Service Domain</th>
                    <th className="py-3 px-6 font-medium">SLA Achievement</th>
                    <th className="py-3 px-6 font-medium">Status</th>
                    <th className="py-3 px-6 text-right font-medium">Payout (This Month)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vendors.map((vend) => (
                    <tr key={vend.id} className="text-sm hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-medium text-white">{vend.companyName}</td>
                      <td className="py-4 px-6 text-[#8E8C94]">{vend.serviceType}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-[#FBFAF7] w-12">{vend.slaMetric}%</span>
                          <div className="w-24 bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#D4AF37] h-full" style={{ width: `${vend.slaMetric}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                          vend.status === 'ACTIVE' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {vend.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-[#D4AF37]">${vend.lastPayout.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
