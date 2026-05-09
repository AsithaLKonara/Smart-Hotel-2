'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <div className="min-h-screen bg-[#09050D] text-[#FBFAF7] p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Segment */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.04]">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-medium">Compliance & Regulatory Control</span>
            <h1 className="text-4xl font-serif font-light tracking-wide text-white">Enterprise Governance Center</h1>
            <p className="text-[#8E8C94] text-sm">
              Publish signed SOC2 / PCI evidence dossiers, execute Disaster Recovery drills, and trace cryptographically signed compliance ledgers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 1. Regulatory Certification Card Grids */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-lg font-serif font-light text-white tracking-wider">Compliance Certification Suites</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certs.map((cert) => (
                <div key={cert.id} className="p-6 rounded-2xl bg-[#121118]/85 border border-white/[0.04] flex flex-col justify-between min-h-[220px]">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-white/[0.03] text-[#8E8C94] border border-white/[0.04]">
                        {cert.standard}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        cert.status === 'CERTIFIED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {cert.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-serif text-white font-medium">{cert.title}</h3>
                  </div>

                  <div className="border-t border-white/[0.03] pt-4 mt-4 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[#8E8C94] block">Last Compiled: {cert.lastEvaluated}</span>
                      <span className="text-[9px] text-[#D4AF37] font-mono block">SHA-256: {cert.integritySignature}</span>
                    </div>
                    <button
                      onClick={() => handleCompileReport(cert.id)}
                      disabled={compilingId !== null}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/[0.03] text-white border border-white/[0.05] hover:bg-white/[0.08] transition-all disabled:opacity-40"
                    >
                      {compilingId === cert.id ? 'SIGNING...' : 'RE-COMPILE'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Deployment Sign-off Checkbox Controls */}
          <div className="lg:col-span-4 bg-[#121118]/85 border border-white/[0.04] rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-serif font-light text-white tracking-wider">Production Deploy Gates</h2>
            <p className="text-xs text-[#8E8C94]">
              Mandatory operational checklist criteria verified prior to code compilation and cluster deployment.
            </p>

            <div className="space-y-4 pt-2">
              <label className="flex items-start space-x-3 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={signOffStatus.auditApproved}
                  onChange={(e) => setSignOffStatus(prev => ({ ...prev, auditApproved: e.target.checked }))}
                  className="w-4 h-4 rounded accent-[#D4AF37] mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-white">Cryptographic Ledgers Verified</span>
                  <p className="text-[10px] text-[#8E8C94]">All balance transactions match hashes.</p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={signOffStatus.drDrillPassed}
                  onChange={(e) => setSignOffStatus(prev => ({ ...prev, drDrillPassed: e.target.checked }))}
                  className="w-4 h-4 rounded accent-[#D4AF37] mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-white">Disaster Recovery Drill Completed</span>
                  <p className="text-[10px] text-[#8E8C94]">Simulation verified multi-region replica redundancy.</p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={signOffStatus.securityHardened}
                  onChange={(e) => setSignOffStatus(prev => ({ ...prev, securityHardened: e.target.checked }))}
                  className="w-4 h-4 rounded accent-[#D4AF37] mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-white">Penetration Sweeps Clean</span>
                  <p className="text-[10px] text-[#8E8C94]">Intrusion models verified no token vulnerabilities.</p>
                </div>
              </label>
            </div>

            <div className="border-t border-white/[0.04] pt-4 mt-4">
              <button
                disabled={!(signOffStatus.auditApproved && signOffStatus.drDrillPassed && signOffStatus.securityHardened)}
                className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] to-[#9C8259] text-[#09050D] hover:opacity-95 transition-all disabled:opacity-40"
              >
                PROCEED TO PRODUCTION ROLLOUT
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
