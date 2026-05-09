'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [propertyName, setPropertyName] = useState('');
  const [propertyLocation, setPropertyLocation] = useState('SG');
  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PROFESSIONAL'>('STARTER');
  const [roomsCount, setRoomsCount] = useState(10);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [loadDemoData, setLoadDemoData] = useState(true);
  const [completed, setCompleted] = useState(false);

  const handleAddEmail = () => {
    if (inviteEmail.trim() && inviteEmail.includes('@')) {
      setInvitedEmails(prev => [...prev, inviteEmail.trim()]);
      setInviteEmail('');
    }
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#09050D] text-[#FBFAF7] p-8 flex items-center justify-center font-sans">
      
      {/* Wizard container block */}
      <div className="w-full max-w-2xl bg-[#121118]/85 border border-white/[0.04] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-8 flex flex-col justify-between min-h-[550px] relative overflow-hidden">
        
        {/* Subtle Luxury background gradient overlay */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D4AF37]/5 rounded-full filter blur-[100px] pointer-events-none" />
        
        {/* Step progress indicators */}
        <div className="flex justify-between items-center relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">Quick Setup Wizard</span>
            <h1 className="text-2xl font-serif font-light text-white">Initialize Your Property</h1>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-[#8E8C94]">
            <span className={`px-2 py-0.5 rounded ${step === 1 ? 'bg-[#D4AF37] text-[#09050D] font-bold' : 'bg-white/[0.02]'}`}>1</span>
            <span>—</span>
            <span className={`px-2 py-0.5 rounded ${step === 2 ? 'bg-[#D4AF37] text-[#09050D] font-bold' : 'bg-white/[0.02]'}`}>2</span>
            <span>—</span>
            <span className={`px-2 py-0.5 rounded ${step === 3 ? 'bg-[#D4AF37] text-[#09050D] font-bold' : 'bg-white/[0.02]'}`}>3</span>
          </div>
        </div>

        {/* Dynamic Wizard Steps body */}
        <div className="flex-1 my-6 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            
            {completed ? (
              <motion.div
                key="completed"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                  <svg className="w-8 h-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-light text-white">SmartHotel OS Ready!</h3>
                  <p className="text-xs text-[#8E8C94] max-w-md mx-auto leading-relaxed">
                    We have initialized **{propertyName || 'Your Grand Guest House'}** with your configured {roomsCount} rooms. All background indices and security matrices have compiled successfully.
                  </p>
                </div>

                <div className="bg-white/[0.01] border border-white/[0.02] p-4 rounded-xl text-left max-w-md mx-auto space-y-2 text-[11px] text-[#8E8C94]">
                  <span className="font-semibold text-white uppercase tracking-wider block">First Steps Checklist:</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-emerald-400">✓</span>
                    <span>Database indexes mapped and optimized.</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-emerald-400">✓</span>
                    <span>Staff account invites dispatched via SMTP pipelines.</span>
                  </div>
                  {loadDemoData && (
                    <div className="flex gap-2 items-center">
                      <span className="text-emerald-400">✓</span>
                      <span>Demo reservations, housekeeping schedules, and reviews loaded successfully.</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-6 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] to-[#9C8259] text-[#09050D] hover:opacity-95"
                >
                  ENTER THE SYSTEM DASHBOARD
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                
                {/* STEP 1: PROPERTY DETAILS */}
                {step === 1 && (
                  <div className="space-y-5 text-left">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#8E8C94]">Property Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Grand Palms Guest House"
                        value={propertyName}
                        onChange={(e) => setPropertyName(e.target.value)}
                        className="w-full bg-black/40 border border-white/[0.04] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#8E8C94]">Jurisdiction Region</label>
                        <select
                          value={propertyLocation}
                          onChange={(e) => setPropertyLocation(e.target.value)}
                          className="w-full bg-black/40 border border-white/[0.04] rounded-xl px-4 py-3 text-xs text-[#FBFAF7] focus:outline-none focus:border-[#D4AF37]/50"
                        >
                          <option value="SG">Singapore (GST 9%)</option>
                          <option value="UK">United Kingdom (VAT 20%)</option>
                          <option value="MV">Maldives (TGST 16%)</option>
                          <option value="US">New York (Hotel Tax 14.75%)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#8E8C94]">SaaS Pricing Tier</label>
                        <select
                          value={selectedPlan}
                          onChange={(e) => setSelectedPlan(e.target.value as any)}
                          className="w-full bg-black/40 border border-white/[0.04] rounded-xl px-4 py-3 text-xs text-[#FBFAF7] focus:outline-none focus:border-[#D4AF37]/50"
                        >
                          <option value="STARTER">Starter Plan ($29/mo)</option>
                          <option value="PROFESSIONAL">Professional Plan ($89/mo)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: ROOM COMPOSITION */}
                {step === 2 && (
                  <div className="space-y-5 text-left">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#8E8C94]">Total Rooms to Import</label>
                      <div className="flex gap-4 items-center">
                        <input
                          type="range" min="1" max="100" value={roomsCount}
                          onChange={(e) => setRoomsCount(Number(e.target.value))}
                          className="flex-1 accent-[#D4AF37] bg-white/[0.05]"
                        />
                        <span className="font-mono text-white text-sm font-semibold w-12 text-center bg-black/40 px-2 py-1.5 rounded-lg border border-white/[0.04]">
                          {roomsCount}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8E8C94]">
                        Adjust the slider to bulk generate rooms automatically configured with modern aesthetic tags.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                      <span className="text-[10px] uppercase font-semibold text-[#D4AF37] tracking-wider block">Bulk Roster Profiles:</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-[#8E8C94]">
                        <div className="flex gap-2">
                          <span className="text-white">•</span>
                          <span>Standard Double Room: basic setup</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-white">•</span>
                          <span>Deluxe Ocean View: luxury aesthetic</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: STAFF INVITES & DEMO DATA */}
                {step === 3 && (
                  <div className="space-y-5 text-left">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#8E8C94]">Invite Team Members</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="colleague@smarthotel.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/[0.04] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                        />
                        <button
                          onClick={handleAddEmail}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/[0.04] text-white border border-white/[0.06] hover:bg-white/[0.08]"
                        >
                          ADD
                        </button>
                      </div>
                      
                      {invitedEmails.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {invitedEmails.map((email, idx) => (
                            <span key={idx} className="px-2 py-1 text-[10px] font-mono text-white bg-[#D4AF37]/10 rounded border border-[#D4AF37]/20">
                              {email}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <label className="flex items-start space-x-3 cursor-pointer text-xs p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                      <input
                        type="checkbox"
                        checked={loadDemoData}
                        onChange={(e) => setLoadDemoData(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#D4AF37] mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white">Import Luxury Preset Datasets</span>
                        <p className="text-[10px] text-[#8E8C94]">Populate system with test reservations, reviews, and housekeeping rosters.</p>
                      </div>
                    </label>
                  </div>
                )}

              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer Navigation Buttons */}
        {!completed && (
          <div className="flex justify-between items-center border-t border-white/[0.04] pt-6 relative z-10">
            <button
              onClick={handlePrevStep}
              disabled={step === 1}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-[#8E8C94] hover:text-white disabled:opacity-30"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] to-[#9C8259] text-[#09050D] hover:opacity-95"
            >
              {step === 3 ? 'FINALIZE SETUP' : 'NEXT STEP'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
