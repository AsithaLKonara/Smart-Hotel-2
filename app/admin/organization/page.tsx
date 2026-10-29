'use client';

import React, { useState } from 'react';
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  FileDown, 
  ShieldCheck, 
  Edit, 
  Trash2,
  CheckCircle2
} from 'lucide-react';

interface PropertyStat {
  id: string;
  name: string;
  location: string;
  occupancy: number;
  adr: number;
  revpar: number;
  totalRevenue: number;
  slaBreachRatio: number;
}

const PORTFOLIO_DATA: PropertyStat[] = [
  { id: "prop-sin", name: "SmartHotel Premium Singapore", location: "Marina Bay, Singapore", occupancy: 88, adr: 450, revpar: 396, totalRevenue: 124500, slaBreachRatio: 0.8 },
  { id: "prop-lon", name: "SmartHotel Regency London", location: "Mayfair, London", occupancy: 72, adr: 580, revpar: 417, totalRevenue: 156300, slaBreachRatio: 1.4 },
  { id: "prop-mal", name: "SmartHotel Maldives Resort", location: "Noonu Atoll, Maldives", occupancy: 94, adr: 1200, revpar: 1128, totalRevenue: 342000, slaBreachRatio: 0.2 },
  { id: "prop-nyc", name: "SmartHotel Executive New York", location: "Manhattan, New York", occupancy: 65, adr: 390, revpar: 253, totalRevenue: 98100, slaBreachRatio: 2.1 }
];

export default function OrganizationDashboard() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const totalRev = PORTFOLIO_DATA.reduce((sum, p) => sum + p.totalRevenue, 0);
  const averageOccupancy = Math.round(PORTFOLIO_DATA.reduce((sum, p) => sum + p.occupancy, 0) / PORTFOLIO_DATA.length);
  const averageADR = Math.round(PORTFOLIO_DATA.reduce((sum, p) => sum + p.adr, 0) / PORTFOLIO_DATA.length);

  const handleExportAuditPDF = () => {
    setIsExporting(true);
    setExportMessage('Enterprise Forensic Audit Package successfully compiled! [PDF: 2.4MB]');
    setIsExporting(false);
  };

  return (
    <AdminPageShell
      title="Property Portfolio Analytics"
      subtitle="Consolidated hotel chain intelligence panel for cross-property performance, global occupancy & revenue tracking."
      actions={
        <Button
          onClick={handleExportAuditPDF}
          disabled={isExporting}
          className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider h-9 px-4 rounded-lg"
        >
          <FileDown className="w-3.5 h-3.5 mr-1.5" />
          {isExporting ? 'GENERATING REPORT...' : 'EXPORT AUDIT DOSSIER'}
        </Button>
      }
    >
      <div className="space-y-6">
        
        {/* Status Message */}
        {exportMessage && (
          <div className="p-3 rounded-lg text-xs font-mono border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
            {exportMessage}
          </div>
        )}

        {/* Global KPI Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-5 shadow-none">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Consolidated Revenue</span>
            <span className="text-2xl font-bold font-mono text-white mt-1.5 block">
              ${totalRev.toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-400 font-mono mt-1 block">▲ +12.4% vs previous cycle</span>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-5 shadow-none">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Average Occupancy</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1.5 block">
              {averageOccupancy}%
            </span>
            <span className="text-[11px] text-zinc-400 font-mono mt-1 block">Optimal portfolio utilization</span>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-5 shadow-none">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Chain Wide ADR</span>
            <span className="text-2xl font-bold font-mono text-white mt-1.5 block">
              ${averageADR}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono mt-1 block">Weighted portfolio average</span>
          </Card>
        </div>

        {/* Property Grid & Compliance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Properties Performance Table (8 cols) */}
          <Card className="lg:col-span-8 bg-[#121417] border border-[#1E2227] rounded-xl overflow-hidden shadow-none">
            <div className="p-5 border-b border-[#1E2227] bg-[#141619]">
              <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                Branch Performance Directory
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#141619] text-zinc-400 border-b border-[#1E2227] text-[10px] uppercase tracking-wider">
                    <th className="p-3.5 font-semibold">Hotel Location</th>
                    <th className="p-3.5 font-semibold">Occupancy</th>
                    <th className="p-3.5 font-semibold">ADR</th>
                    <th className="p-3.5 font-semibold">RevPAR</th>
                    <th className="p-3.5 font-semibold">Revenue</th>
                    <th className="p-3.5 text-right font-semibold">SLA Breach</th>
                    <th className="p-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2227]">
                  {PORTFOLIO_DATA.map((prop) => (
                    <tr key={prop.id} className="hover:bg-[#141619]/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-semibold text-white font-sans">{prop.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{prop.location}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-white">{prop.occupancy}%</td>
                      <td className="p-3.5 text-zinc-400">${prop.adr}</td>
                      <td className="p-3.5 text-emerald-400">${prop.revpar}</td>
                      <td className="p-3.5 text-zinc-200 font-semibold">${prop.totalRevenue.toLocaleString()}</td>
                      <td className="p-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          prop.slaBreachRatio < 1.0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {prop.slaBreachRatio}%
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-zinc-500 hover:text-white transition-colors" title="Edit Property">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button className="text-zinc-500 hover:text-rose-400 transition-colors" title="Delete Property">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Compliance Certifications (4 cols) */}
          <Card className="lg:col-span-4 bg-[#121417] border border-[#1E2227] rounded-xl p-5 space-y-4 shadow-none">
            <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              Compliance Certifications
            </h2>
            
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-[#141619] border border-[#1E2227] space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white font-mono">SOC-2 Type II</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">ACTIVE</Badge>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  Automated security sweeps successfully verify daily identity audits and RBAC compliance logs.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#141619] border border-[#1E2227] space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white font-mono">PCI-DSS Token Vault</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">CERTIFIED</Badge>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  Sensitive card details are fully isolated via secure token wrappers, avoiding localized database exposure.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#141619] border border-[#1E2227] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white font-mono">Platform SLA Target</span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">99.99%</span>
                </div>
                <div className="w-full bg-[#181A1D] h-1.5 rounded-full overflow-hidden border border-[#2B3037]">
                  <div className="bg-emerald-400 h-full w-[99.99%]" />
                </div>
              </div>
            </div>
          </Card>

        </div>

      </div>
    </AdminPageShell>
  );
}
