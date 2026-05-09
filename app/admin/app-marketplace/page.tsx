'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface MarketplaceApp {
  id: string;
  title: string;
  category: 'INTEGRATION' | 'AI_MODULE' | 'FINANCIAL' | 'MARKETING';
  description: string;
  rating: number;
  installed: boolean;
  cost: string;
}

interface PartnerVendor {
  id: string;
  companyName: string;
  serviceType: string;
  slaMetric: number; // percentage
  status: 'ACTIVE' | 'SUSPENDED' | 'REVIEW';
  lastPayout: number;
}

const APPS_DATA: MarketplaceApp[] = [
  { id: "app-ota", title: "Global OTA Sync Engine", category: "INTEGRATION", description: "Real-time room availability sync with Booking.com, Expedia, and Agoda.", rating: 4.9, installed: true, cost: "1.5% commission" },
  { id: "app-ai-clean", title: "AI Cleaning Slicer", category: "AI_MODULE", description: "Dynamic staffing assigner prioritizing high-turnover rooms during peak arrivals.", rating: 4.8, installed: false, cost: "$49/mo" },
  { id: "app-vat", title: "Regional VAT Tax Complier", category: "FINANCIAL", description: "Automated municipal tourist tax and local tax filings for 120+ jurisdictions.", rating: 4.7, installed: true, cost: "$29/mo" },
  { id: "app-loyalty", title: "Loyalty Blast Campaigner", category: "MARKETING", description: "Target guest preferences with personalized promotional packages.", rating: 4.5, installed: false, cost: "$19/mo" }
];

const VENDORS_DATA: PartnerVendor[] = [
  { id: "vend-laund", companyName: "Zenith Linen Services", serviceType: "Laundry & Linen", slaMetric: 99.4, status: "ACTIVE", lastPayout: 4200 },
  { id: "vend-clean", companyName: "Apex SRE Cleaners", serviceType: "Specialized Deep Cleaning", slaMetric: 98.2, status: "ACTIVE", lastPayout: 2150 },
  { id: "vend-food", companyName: "Noonu Catering Corp", serviceType: "Kitchen & In-room Dining Support", slaMetric: 95.1, status: "REVIEW", lastPayout: 8900 }
];

export default function MarketplacePage() {
  const [apps, setApps] = useState<MarketplaceApp[]>(APPS_DATA);
  const [vendors, setVendors] = useState<PartnerVendor[]>(VENDORS_DATA);
  const [activeTab, setActiveTab] = useState<'extensions' | 'vendors'>('extensions');

  const handleToggleInstall = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, installed: !a.installed } : a));
  };

  return (
    <div className="min-h-screen bg-[#09050D] text-[#FBFAF7] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.04]">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-medium">SmartHotel Ecosystem</span>
            <h1 className="text-4xl font-serif font-light tracking-wide text-white">App & Partner Marketplace</h1>
            <p className="text-[#8E8C94] text-sm">
              Extend your hospitality operations with verified extensions, plug-and-play AI modules, and integrated regional service sub-contractors.
            </p>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/[0.03] self-start md:self-center">
            <button
              onClick={() => setActiveTab('extensions')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'extensions' ? 'bg-[#D4AF37] text-[#09050D] font-bold' : 'text-[#8E8C94] hover:text-white'
              }`}
            >
              Extensions
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'vendors' ? 'bg-[#D4AF37] text-[#09050D] font-bold' : 'text-[#8E8C94] hover:text-white'
              }`}
            >
              Partner Vendors
            </button>
          </div>
        </div>

        {/* Extensions and Apps Grid Rendering */}
        {activeTab === 'extensions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {apps.map((app) => (
              <div
                key={app.id}
                className={`p-6 rounded-2xl border transition-all duration-300 bg-[#121118]/85 flex flex-col justify-between min-h-[220px] ${
                  app.installed 
                    ? 'border-[#D4AF37]/30 shadow-[0_4px_25px_rgba(212,175,55,0.04)]' 
                    : 'border-white/[0.03] hover:border-white/[0.08]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-white/[0.03] text-[#D4AF37] border border-white/[0.04]">
                        {app.category}
                      </span>
                      <h3 className="text-base font-serif font-medium text-white mt-2">{app.title}</h3>
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-semibold text-amber-400">
                      <span>★</span>
                      <span className="font-mono">{app.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#8E8C94] leading-relaxed">{app.description}</p>
                </div>

                <div className="flex justify-between items-center border-t border-white/[0.03] pt-4 mt-4">
                  <span className="text-[11px] font-mono text-[#8E8C94]">{app.cost}</span>
                  <button
                    onClick={() => handleToggleInstall(app.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      app.installed 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                        : 'bg-white/[0.03] text-white border border-white/[0.05] hover:bg-white/[0.08]'
                    }`}
                  >
                    {app.installed ? 'UNINSTALL' : 'INSTALL APP'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Local Sub-contractor Vendors Table Rendering */}
        {activeTab === 'vendors' && (
          <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-serif font-light text-white tracking-wider">External Service Providers</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.04] text-[#8E8C94] text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Vendor Company</th>
                    <th className="pb-3 font-semibold">Service Domain</th>
                    <th className="pb-3 font-semibold">SLA Achievement</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 text-right font-semibold">Payout (This Month)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {vendors.map((vend) => (
                    <tr key={vend.id} className="text-xs">
                      <td className="py-4 font-semibold text-white">{vend.companyName}</td>
                      <td className="py-4 text-[#8E8C94]">{vend.serviceType}</td>
                      <td className="py-4">
                        <span className="font-mono text-white font-semibold">{vend.slaMetric}%</span>
                        <div className="w-24 bg-white/[0.04] h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-[#D4AF37] h-full" style={{ width: `${vend.slaMetric}%` }} />
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          vend.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {vend.status}
                        </span>
                      </td>
                      <td className="py-4 text-right font-mono text-[#D4AF37] font-semibold">${vend.lastPayout.toLocaleString()}</td>
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
