'use client';

import React, { useState } from 'react';
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileCheck, 
  Lock, 
  Server, 
  Cpu, 
  FileText 
} from 'lucide-react';

interface CertificationSuite {
  id: string;
  title: string;
  standard: 'SOC2_TYPE2' | 'PCI_DSS' | 'GDPR_RTF' | 'DISASTER_RECOVERY';
  status: 'CERTIFIED' | 'PENDING' | 'DRILL_REQUIRED';
  lastEvaluated: string;
  integritySignature: string;
}

export default function GovernancePage() {
  const [certs, setCerts] = useState<CertificationSuite[]>([
    { id: "cert-soc", title: "System Operational Controls (SOC 2 Type II)", standard: "SOC2_TYPE2", status: "CERTIFIED", lastEvaluated: "2026-05-01", integritySignature: "0x8F92...B31D" },
    { id: "cert-pci", title: "Payment Card Industry Data Security (PCI-DSS v4.0)", standard: "PCI_DSS", status: "CERTIFIED", lastEvaluated: "2026-05-04", integritySignature: "0x4A1E...92CC" },
    { id: "cert-gdpr", title: "GDPR Compliance Privacy Pack", standard: "GDPR_RTF", status: "CERTIFIED", lastEvaluated: "2026-05-08", integritySignature: "0xD109...EE5C" },
    { id: "cert-dr", title: "Disaster Recovery Active-Active Drill", standard: "DISASTER_RECOVERY", status: "DRILL_REQUIRED", lastEvaluated: "2026-04-12", integritySignature: "0x77E1...00AB" }
  ]);

  const [compilingId, setCompilingId] = useState<string | null>(null);
  const [signOffStatus, setSignOffStatus] = useState({
    auditApproved: true,
    drDrillPassed: false,
    securityHardened: true
  });

  const handleCompileReport = (id: string) => {
    setCompilingId(id);
    setTimeout(() => {
      setCerts(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: 'CERTIFIED',
            lastEvaluated: new Date().toISOString().split('T')[0],
            integritySignature: `0x${Math.random().toString(16).substr(2, 4).toUpperCase()}E...${Math.random().toString(16).substr(2, 4).toUpperCase()}`
          };
        }
        return c;
      }));
      setCompilingId(null);
    }, 2000);
  };

  const isReadyForProduction = signOffStatus.auditApproved && signOffStatus.drDrillPassed && signOffStatus.securityHardened;

  return (
    <AdminPageShell
      title="Enterprise Governance Center"
      subtitle="Publish signed SOC2 / PCI evidence dossiers, execute Disaster Recovery drills, and trace cryptographically signed compliance ledgers."
      actions={
        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs px-3 py-1.5 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5 inline" /> Governance Active
        </Badge>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Compliance Suites (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-100 font-mono uppercase tracking-wider">
            Compliance Certification Suites
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certs.map((cert) => (
              <Card key={cert.id} className="p-5 rounded-xl bg-[#121417] border border-[#1E2227] flex flex-col justify-between shadow-none hover:border-[#2B3037] transition-all">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#181A1D] text-zinc-400 border border-[#2B3037]">
                      {cert.standard}
                    </span>
                    <Badge className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      cert.status === 'CERTIFIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {cert.status}
                    </Badge>
                  </div>
                  <h3 className="text-xs font-semibold text-white font-mono leading-relaxed">{cert.title}</h3>
                </div>

                <div className="border-t border-[#1E2227] pt-3.5 mt-4 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 font-mono block">Compiled: {cert.lastEvaluated}</span>
                    <span className="text-[10px] text-zinc-300 font-mono block">SHA-256: {cert.integritySignature}</span>
                  </div>
                  <Button
                    onClick={() => handleCompileReport(cert.id)}
                    disabled={compilingId !== null}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-[10px] font-mono uppercase tracking-wider border-[#1E2227] bg-[#141619] hover:bg-[#181A1D] text-zinc-300 hover:text-white"
                  >
                    {compilingId === cert.id ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> SIGNING...
                      </>
                    ) : (
                      'RE-COMPILE'
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Deployment Gates (4 cols) */}
        <div className="lg:col-span-4 bg-[#121417] border border-[#1E2227] rounded-xl p-5 space-y-4 shadow-none">
          <div>
            <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Production Deploy Gates</h2>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">
              Mandatory operational checklist criteria verified prior to code compilation and cluster deployment.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-start space-x-3 cursor-pointer text-xs p-2.5 rounded-lg bg-[#141619] border border-[#1E2227] hover:border-[#2B3037] transition-colors">
              <input
                type="checkbox"
                checked={signOffStatus.auditApproved}
                onChange={(e) => setSignOffStatus(prev => ({ ...prev, auditApproved: e.target.checked }))}
                className="w-4 h-4 rounded border-[#2B3037] bg-[#181A1D] accent-white mt-0.5 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-zinc-200 font-mono text-xs">Cryptographic Ledgers</span>
                <p className="text-[11px] text-zinc-500">All balance transactions match cryptographic hashes.</p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer text-xs p-2.5 rounded-lg bg-[#141619] border border-[#1E2227] hover:border-[#2B3037] transition-colors">
              <input
                type="checkbox"
                checked={signOffStatus.drDrillPassed}
                onChange={(e) => setSignOffStatus(prev => ({ ...prev, drDrillPassed: e.target.checked }))}
                className="w-4 h-4 rounded border-[#2B3037] bg-[#181A1D] accent-white mt-0.5 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-zinc-200 font-mono text-xs">DR Drill Completed</span>
                <p className="text-[11px] text-zinc-500">Simulation verified multi-region replica redundancy.</p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer text-xs p-2.5 rounded-lg bg-[#141619] border border-[#1E2227] hover:border-[#2B3037] transition-colors">
              <input
                type="checkbox"
                checked={signOffStatus.securityHardened}
                onChange={(e) => setSignOffStatus(prev => ({ ...prev, securityHardened: e.target.checked }))}
                className="w-4 h-4 rounded border-[#2B3037] bg-[#181A1D] accent-white mt-0.5 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-semibold text-zinc-200 font-mono text-xs">Penetration Sweeps</span>
                <p className="text-[11px] text-zinc-500">Intrusion models verified 0 token vulnerabilities.</p>
              </div>
            </label>
          </div>

          <div className="border-t border-[#1E2227] pt-3 mt-3">
            <Button
              disabled={!isReadyForProduction}
              className={`w-full text-xs font-mono font-semibold uppercase tracking-wider h-9 ${
                isReadyForProduction
                  ? 'bg-white hover:bg-zinc-200 text-black'
                  : 'bg-[#181A1D] text-zinc-600 border border-[#2B3037] cursor-not-allowed'
              }`}
            >
              PROCEED TO PRODUCTION ROLLOUT
            </Button>
          </div>
        </div>

      </div>
    </AdminPageShell>
  );
}
