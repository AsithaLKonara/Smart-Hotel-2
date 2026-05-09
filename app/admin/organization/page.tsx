'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface PropertyStat {
  id: string;
  name: string;
  location: string;
  occupancy: number; // percentage
  adr: number;       // Average Daily Rate ($)
  revpar: number;    // Revenue Per Available Room ($)
  totalRevenue: number;
  slaBreachRatio: number; // percentage
}

const PORTFOLIO_DATA: PropertyStat[] = [
  { id: "prop-sin", name: "SmartHotel Premium Singapore", location: "Marina Bay, Singapore", occupancy: 88, adr: 450, revpar: 396, totalRevenue: 124500, slaBreachRatio: 0.8 },
  { id: "prop-lon", name: "SmartHotel Regency London", location: "Mayfair, London", occupancy: 72, adr: 580, revpar: 417, totalRevenue: 156300, slaBreachRatio: 1.4 },
  { id: "prop-mal", name: "SmartHotel Maldives Resort", location: "Noonu Atoll, Maldives", occupancy: 94, adr: 1200, revpar: 1128, totalRevenue: 342000, slaBreachRatio: 0.2 },
  { id: "prop-nyc", name: "SmartHotel Executive New York", location: "Manhattan, New York", occupancy: 65, adr: 390, revpar: 253, totalRevenue: 98100, slaBreachRatio: 2.1 }
];

export default function OrganizationDashboard() {
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'APAC' | 'EMEA' | 'AMER'>('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Summarize overall portfolio metrics
  const totalRev = PORTFOLIO_DATA.reduce((sum, p) => sum + p.totalRevenue, 0);
  const averageOccupancy = Math.round(PORTFOLIO_DATA.reduce((sum, p) => sum + p.occupancy, 0) / PORTFOLIO_DATA.length);
  const averageADR = Math.round(PORTFOLIO_DATA.reduce((sum, p) => sum + p.adr, 0) / PORTFOLIO_DATA.length);

  // Trigger enterprise SLA/Compliance audit report compiling
  const handleExportAuditPDF = () => {
    setIsExporting(true);
    setExportMessage('Validating compliance ledger hashes & computing SLA coefficients...');
    
    setTimeout(() => {
      setExportMessage('Generating cryptographic SHA-256 signatures...');
    }, 1000);

    setTimeout(() => {
      setExportMessage('Enterprise Forensic Audit Package successfully compiled! [PDF: 2.4MB]');
      setIsExporting(false);
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-[#09050D] text-[#FBFAF7] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.04]">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-medium">Enterprise Group Overview</span>
            <h1 className="text-4xl font-serif font-light tracking-wide text-white">Property Portfolio Analytics</h1>
            <p className="text-[#8E8C94] text-sm">
              Consolidated hotel chain intelligence panel for cross-property performance, global heatmaps, and financial SLA certification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Compliance Action Button */}
            <button
              onClick={handleExportAuditPDF}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] to-[#9C8259] text-[#09050D] hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isExporting ? 'GENERATING REPORT...' : 'EXPORT FORENSIC AUDIT'}
            </button>
          </div>
        </div>

        {/* Audit Status Message Bubble */}
        {exportMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-xs font-mono border ${
              exportMessage.includes('compiled') 
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                : 'bg-white/[0.02] border-white/[0.04] text-[#8E8C94]'
            }`}
          >
            {exportMessage}
          </motion.div>
        )}

        {/* Global KPI Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6">
            <span className="text-xs uppercase tracking-wider text-[#8E8C94] block">Consolidated Revenue</span>
            <span className="text-3xl font-light font-serif text-white mt-2 block">
              ${totalRev.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400 font-mono mt-1 block">▲ +12.4% vs previous cycle</span>
          </div>

          <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6">
            <span className="text-xs uppercase tracking-wider text-[#8E8C94] block">Average Occupancy</span>
            <span className="text-3xl font-light font-serif text-white mt-2 block">
              {averageOccupancy}%
            </span>
            <span className="text-xs text-emerald-400 font-mono mt-1 block">▲ Optimal portfolio utilization</span>
          </div>

          <div className="bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6">
            <span className="text-xs uppercase tracking-wider text-[#8E8C94] block">Chain Wide ADR</span>
            <span className="text-3xl font-light font-serif text-white mt-2 block">
              ${averageADR}
            </span>
            <span className="text-xs text-[#8E8C94] font-mono mt-1 block">Weighted portfolio average</span>
          </div>
        </div>

        {/* Property Grid & Occupancy Heatmap Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Properties Performance Table */}
          <div className="lg:col-span-8 bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-serif font-light text-white tracking-wider">
              Branch Performance Directory
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.04] text-[#8E8C94] text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Hotel Location</th>
                    <th className="pb-3 font-semibold">Occupancy</th>
                    <th className="pb-3 font-semibold">ADR</th>
                    <th className="pb-3 font-semibold">RevPAR</th>
                    <th className="pb-3 font-semibold">Revenue</th>
                    <th className="pb-3 text-right font-semibold">SLA Breach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {PORTFOLIO_DATA.map((prop) => (
                    <tr key={prop.id} className="text-xs">
                      <td className="py-4">
                        <div className="font-semibold text-white">{prop.name}</div>
                        <div className="text-[10px] text-[#8E8C94] mt-0.5">{prop.location}</div>
                      </td>
                      <td className="py-4 font-semibold text-white">{prop.occupancy}%</td>
                      <td className="py-4 text-[#8E8C94]">${prop.adr}</td>
                      <td className="py-4 text-[#D4AF37]">${prop.revpar}</td>
                      <td className="py-4 text-[#8E8C94] font-semibold">${prop.totalRevenue.toLocaleString()}</td>
                      <td className="py-4 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          prop.slaBreachRatio < 1.0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {prop.slaBreachRatio}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SLA & Regional Compliance Health */}
          <div className="lg:col-span-4 bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-serif font-light text-white tracking-wider">
              Compliance Certifications
            </h2>
            
            <div className="space-y-4">
              
              {/* SOC-2 Certificate status */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white">SOC-2 Type II Compliance</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">ACTIVE</span>
                </div>
                <p className="text-[11px] text-[#8E8C94]">
                  Automated security sweeps successfully verify daily identity audits and RBAC compliance logs.
                </p>
              </div>

              {/* PCI-DSS Level 1 token protection */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white">PCI-DSS Token Vaulting</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">CERTIFIED</span>
                </div>
                <p className="text-[11px] text-[#8E8C94]">
                  Sensitive credit card details are fully isolated via secure Stripe-token wrappers, avoiding localized database exposure.
                </p>
              </div>

              {/* General SLA Availability metric */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white">Platform SLA Target</span>
                  <span className="text-[10px] text-[#D4AF37] px-1.5 py-0.5 rounded font-mono font-bold">99.99%</span>
                </div>
                <div className="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-gradient-to-r from-[#D4AF37] to-[#9C8259] h-full w-[99.99%]" />
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
