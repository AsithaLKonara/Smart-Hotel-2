'use client';

import React, { useState } from 'react';
import { CreditCard, Eye, EyeOff, ShieldCheck, AlertTriangle, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export interface VccData {
  isVcc: boolean;
  provider?: string;
  cardCode?: string;
  cardHolderName?: string;
  maskedCardNumber?: string;
  fullCardNumber?: string;
  expireDate?: string;
  secureInd?: string;
  effectiveDate?: string;
  isChargeableNow?: boolean;
  currentBalance?: number;
  futureBalance?: number;
  currencyCode?: string;
  expirationDate?: string;
  otaReference?: string;
}

export function AgodaVccViewer({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VccData | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const fetchVcc = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/bookings/${bookingId}/vcc`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setOpen(true);
      } else {
        toast.error('Failed to load virtual credit card');
      }
    } catch {
      toast.error('Network error loading card data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <>
      <button
        onClick={fetchVcc}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold transition-all"
      >
        <CreditCard className="w-4 h-4" />
        {loading ? 'Checking VCC...' : 'Agoda VCC Details'}
      </button>

      {open && data && data.isVcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#12141A] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Agoda Virtual Credit Card</h3>
                  <p className="text-[11px] text-slate-400">OTA Reference: {data.otaReference}</p>
                </div>
              </div>
              <button 
                onClick={() => { setOpen(false); setRevealed(false); }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Card Visual */}
            <div className="p-5 space-y-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-5 text-white relative shadow-inner">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Card Issuer</span>
                    <p className="font-bold text-sm tracking-wide">{data.cardCode === 'VI' ? 'VISA' : (data.cardCode || 'CREDIT CARD')}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                    VIRTUAL CARD
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg tracking-widest text-white">
                      {revealed ? data.fullCardNumber : data.maskedCardNumber}
                    </span>
                    <button
                      onClick={() => setRevealed(!revealed)}
                      className="text-slate-400 hover:text-white p-1"
                      title={revealed ? "Mask Card" : "Reveal Card"}
                    >
                      {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Expires</span>
                    <span className="font-mono font-medium">{data.expireDate || 'MM/YY'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">CVV / CVC</span>
                    <span className="font-mono font-medium">{revealed ? data.secureInd : '•••'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Balance</span>
                    <span className="font-mono font-bold text-[#D4AF37]">
                      {data.currencyCode} {data.futureBalance || data.currentBalance}
                    </span>
                  </div>
                </div>
              </div>

              {/* Charging Rules & Warning */}
              {data.effectiveDate && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  data.isChargeableNow 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  {data.isChargeableNow ? (
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {data.isChargeableNow ? 'Ready for Charge' : 'Charge Restricted until Activation Date'}
                    </p>
                    <p className="opacity-80 text-[11px] mt-0.5">
                      Activation Date: <strong>{data.effectiveDate}</strong>. 
                      {!data.isChargeableNow && ' Charging before this date will be declined by Agoda payment gateway.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Copy Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => data.fullCardNumber && copyToClipboard(data.fullCardNumber, 'Card Number')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-200"
                >
                  {copiedField === 'Card Number' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Card Number
                </button>
                <button
                  onClick={() => data.secureInd && copyToClipboard(data.secureInd, 'CVV')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-200"
                >
                  {copiedField === 'CVV' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy CVV
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end">
              <button
                onClick={() => { setOpen(false); setRevealed(false); }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
