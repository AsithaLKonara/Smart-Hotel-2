'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuestMobileSuperApp() {
  const [lang, setLang] = useState<'EN' | 'FR' | 'ZH' | 'JP'>('EN');
  const [checkedIn, setCheckedIn] = useState(false);
  const [nfcPaired, setNfcPaired] = useState(false);
  const [climate, setClimate] = useState(21);
  const [lights, setLights] = useState(70);
  const [selectedTab, setSelectedTab] = useState<'key' | 'dining' | 'valet' | 'delivery'>('key');
  const [courier, setCourier] = useState('Uber Eats');
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passCode, setPassCode] = useState<string | null>(null);

  const requestDeliveryPass = async () => {
    setDeliveryStatus('loading');
    try {
      // Mock booking ID for the demo UI. In reality, this comes from the authenticated guest session.
      const mockBookingId = '123e4567-e89b-12d3-a456-426614174000';
      const res = await fetch('/api/security/delivery-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: mockBookingId,
          courierName: courier,
          expectedArrival: new Date(Date.now() + 15 * 60000).toISOString()
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setPassCode(data.data.passCode);
        setDeliveryStatus('success');
      } else {
        // Fallback for demo when booking is not found
        setPassCode(`DELIV-${Math.floor(1000 + Math.random() * 9000)}`);
        setDeliveryStatus('success');
      }
    } catch (e) {
      setDeliveryStatus('error');
    }
  };

  // Multi-lingual dictionary
  const dict = {
    EN: {
      welcome: "Welcome, Elite Guest",
      room: "Penthouse Suite GP402",
      checkin: "Mobile Check-In",
      checkout: "Express Check-Out",
      nfcReady: "Digital Room Key: Ready to tap",
      nfcNotReady: "Pair digital room key via NFC",
      tapKey: "TAP TO UNLOCK ROOM",
      paired: "Digital Key Active",
      lights: "Ambience Lights",
      temp: "Climate Control",
      dining: "In-Room Dining",
      valet: "Valet Tracker",
      orderSuccess: "Order dispatched to gourmet kitchen!",
      valetActive: "Your Tesla is being brought to the main entrance. ETA: 4m."
    },
    FR: {
      welcome: "Bienvenue, Client Élite",
      room: "Penthouse Suite GP402",
      checkin: "Enregistrement Mobile",
      checkout: "Départ Express",
      nfcReady: "Clé Numérique: Prête à scanner",
      nfcNotReady: "Associer la clé par NFC",
      tapKey: "APPUYER POUR DÉVERROUILLER",
      paired: "Clé Numérique Active",
      lights: "Éclairage Ambiant",
      temp: "Contrôle Climat",
      dining: "Dîner en Chambre",
      valet: "Suivi Voiturier",
      orderSuccess: "Commande envoyée en cuisine gastronomique!",
      valetActive: "Votre Tesla est acheminée à l'entrée principale. ETA: 4m."
    },
    ZH: {
      welcome: "欢迎, 尊贵贵宾",
      room: "总统套房 GP402",
      checkin: "手机登记入住",
      checkout: "自助退房",
      nfcReady: "数码房卡：可以感应",
      nfcNotReady: "通过 NFC 绑定数码房卡",
      tapKey: "点击解锁房间",
      paired: "数码卡已激活",
      lights: "环境照明",
      temp: "智能温控",
      dining: "客房送餐",
      valet: "代客泊车追踪",
      orderSuccess: "订单已派发至行政厨房！",
      valetActive: "您的特斯拉正在开往正门。预计等待：4分钟。"
    },
    JP: {
      welcome: "ようこそ、エリートゲスト様",
      room: "ペントハウススイート GP402",
      checkin: "モバイルチェックイン",
      checkout: "エクスプレスチェックアウト",
      nfcReady: "デジタルルームキー：タップ可能",
      nfcNotReady: "NFCでデジタルキーをペアリング",
      tapKey: "タップしてドアを解錠",
      paired: "デジタルキー有効",
      lights: "照明設定",
      temp: "エアコン制御",
      dining: "ルームサービス",
      valet: "バレー追跡",
      orderSuccess: "ご注文が厨房に送信されました！",
      valetActive: "テスラが正面玄関に到着します。到着予定：4分。"
    }
  };

  const t = dict[lang];

  // Room Service Cart simulated triggers
  const [diningOrdered, setDiningOrdered] = useState(false);
  const [valetRequested, setValetRequested] = useState(false);

  return (
    <div className="min-h-screen bg-[#060308] text-[#FBFAF7] p-4 flex items-center justify-center font-sans">
      
      {/* simulated mobile device wrapper */}
      <div className="w-full max-w-[400px] h-[820px] bg-[#121118] border-8 border-[#1B1922] rounded-[45px] shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between relative">
        
        {/* Mobile Status Bar Segment */}
        <div className="bg-[#121118] px-6 pt-3 pb-2 flex justify-between items-center text-xs text-[#8E8C94] border-b border-white/[0.02]">
          <span className="font-semibold font-mono">15:04</span>
          {/* simulated speaker slit */}
          <div className="w-16 h-3.5 bg-[#060308] rounded-full flex items-center justify-center border border-white/[0.04]">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37]/80" />
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="font-mono text-[10px]">5G</span>
            <div className="w-5 h-2.5 border border-[#8E8C94]/60 rounded-sm p-0.5 flex items-center">
              <div className="h-full w-4 bg-emerald-400 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Guest Application Space */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 flex flex-col justify-between">
          
          {/* Header & Language selector */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">{t.welcome}</span>
                <h2 className="text-lg font-serif font-light text-white mt-0.5">{t.room}</h2>
              </div>
              
              {/* Language Switcher */}
              <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/[0.03]">
                {(['EN', 'FR', 'ZH', 'JP'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                      lang === l ? 'bg-[#D4AF37] text-[#09050D]' : 'text-[#8E8C94] hover:text-white'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick check-in action bar */}
            <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl flex justify-between items-center">
              <span className="text-xs text-[#8E8C94] font-medium">Reservation Status</span>
              <button
                onClick={() => setCheckedIn(!checkedIn)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  checkedIn 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-[#D4AF37] text-[#09050D] hover:opacity-90'
                }`}
              >
                {checkedIn ? t.checkout : t.checkin}
              </button>
            </div>
          </div>

          {/* Dynamic Action Tabs Container */}
          <div className="flex-1 my-4 flex flex-col justify-start space-y-4">
            
            {/* Nav Tab Selectors */}
            <div className="grid grid-cols-4 gap-1 bg-black/30 p-1 rounded-xl border border-white/[0.02]">
              <button
                onClick={() => setSelectedTab('key')}
                className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                  selectedTab === 'key' ? 'bg-white/[0.04] text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#8E8C94]'
                }`}
              >
                Key
              </button>
              <button
                onClick={() => setSelectedTab('dining')}
                className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                  selectedTab === 'dining' ? 'bg-white/[0.04] text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#8E8C94]'
                }`}
              >
                Dining
              </button>
              <button
                onClick={() => setSelectedTab('valet')}
                className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                  selectedTab === 'valet' ? 'bg-white/[0.04] text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#8E8C94]'
                }`}
              >
                Valet
              </button>
              <button
                onClick={() => setSelectedTab('delivery')}
                className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                  selectedTab === 'delivery' ? 'bg-white/[0.04] text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-[#8E8C94]'
                }`}
              >
                Delivery
              </button>
            </div>

            {/* Tab Body Renderings */}
            <div className="flex-1 bg-white/[0.01] border border-white/[0.02] p-4 rounded-2xl flex flex-col justify-center min-h-[320px]">
              <AnimatePresence mode="wait">
                
                {/* 1. ROOM KEY TAB */}
                {selectedTab === 'key' && (
                  <motion.div
                    key="key"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-6 text-center flex flex-col items-center justify-center"
                  >
                    <p className="text-xs text-[#8E8C94] font-medium">
                      {nfcPaired ? t.nfcReady : t.nfcNotReady}
                    </p>

                    {/* Interactive Animated NFC Key Cylinder */}
                    <div
                      onClick={() => setNfcPaired(!nfcPaired)}
                      className={`w-32 h-32 rounded-full flex items-center justify-center cursor-pointer border-2 transition-all duration-500 relative group ${
                        nfcPaired 
                          ? 'border-[#D4AF37] bg-gradient-to-tr from-[#1B1922] to-[#25222E] shadow-[0_0_25px_rgba(212,175,55,0.25)]' 
                          : 'border-white/[0.08] bg-[#121118]/40 hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <motion.div
                        animate={nfcPaired ? { scale: [1, 1.08, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`w-24 h-24 rounded-full flex items-center justify-center ${
                          nfcPaired ? 'bg-[#D4AF37]/5' : 'bg-white/[0.02]'
                        }`}
                      >
                        {/* simulated lock icon */}
                        <svg className={`w-10 h-10 transition-all duration-500 ${nfcPaired ? 'text-[#D4AF37]' : 'text-[#8E8C94]/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {nfcPaired ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          )}
                        </svg>
                      </motion.div>
                    </div>

                    <button
                      onClick={() => setNfcPaired(!nfcPaired)}
                      className="text-[11px] font-bold tracking-wider text-[#D4AF37] uppercase bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-4 py-2 rounded-xl"
                    >
                      {nfcPaired ? t.paired : t.tapKey}
                    </button>

                    {/* Ambience adjustments */}
                    <div className="w-full text-left space-y-3 border-t border-white/[0.04] pt-4 mt-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#8E8C94]">{t.temp}</span>
                          <span className="font-mono text-white">{climate}°C</span>
                        </div>
                        <input
                          type="range" min="16" max="28" value={climate}
                          onChange={(e) => setClimate(Number(e.target.value))}
                          className="w-full accent-[#D4AF37] bg-white/[0.05]"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#8E8C94]">{t.lights}</span>
                          <span className="font-mono text-white">{lights}%</span>
                        </div>
                        <input
                          type="range" min="0" max="100" value={lights}
                          onChange={(e) => setLights(Number(e.target.value))}
                          className="w-full accent-[#D4AF37] bg-white/[0.05]"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. IN-ROOM DINING TAB */}
                {selectedTab === 'dining' && (
                  <motion.div
                    key="dining"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-[#8E8C94] font-medium block">Gastronomy Roster</span>
                    
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[0.03]">
                        <div>
                          <h4 className="text-xs font-semibold text-white">Pan-Seared Wagyu Filet</h4>
                          <span className="text-[10px] text-[#8E8C94]">Truffle glaze, baby marrow</span>
                        </div>
                        <span className="font-mono text-xs text-[#D4AF37] font-semibold">$55</span>
                      </div>
                      <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[0.03]">
                        <div>
                          <h4 className="text-xs font-semibold text-white">Premium Caviar Platter</h4>
                          <span className="text-[10px] text-[#8E8C94]">Blinis, traditional garnishes</span>
                        </div>
                        <span className="font-mono text-xs text-[#D4AF37] font-semibold">$120</span>
                      </div>
                    </div>

                    {diningOrdered ? (
                      <p className="text-xs text-emerald-400 font-mono text-center p-3 border border-emerald-500/10 rounded-xl bg-emerald-500/5">
                        {t.orderSuccess}
                      </p>
                    ) : (
                      <button
                        onClick={() => setDiningOrdered(true)}
                        className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] to-[#9C8259] text-[#09050D]"
                      >
                        Place Dinner Order
                      </button>
                    )}
                  </motion.div>
                )}

                {/* 3. VALET TRACKER TAB */}
                {selectedTab === 'valet' && (
                  <motion.div
                    key="valet"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4 text-center flex flex-col justify-center min-h-[220px]"
                  >
                    {valetRequested ? (
                      <div className="space-y-4">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#D4AF37] flex items-center justify-center animate-spin mx-auto">
                          <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-xs text-[#FBFAF7] leading-relaxed font-sans px-2">
                          {t.valetActive}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <svg className="w-16 h-16 text-[#8E8C94]/50 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <button
                          onClick={() => setValetRequested(true)}
                          className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] to-[#9C8259] text-[#09050D]"
                        >
                          Request Vehicle Arrival
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 4. DELIVERY PASS TAB */}
                {selectedTab === 'delivery' && (
                  <motion.div
                    key="delivery"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4 flex flex-col justify-center min-h-[220px]"
                  >
                    <div className="text-center">
                      <span className="text-[10px] uppercase tracking-wider text-[#8E8C94] font-medium block">Front Gate Access</span>
                      <h3 className="text-sm text-white font-medium mt-1">Delivery Pass</h3>
                    </div>
                    
                    {deliveryStatus === 'success' ? (
                      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4 text-center space-y-2">
                        <span className="text-xs text-[#D4AF37] block">Give this code to the driver:</span>
                        <div className="text-2xl font-mono tracking-widest font-bold text-white bg-black/40 py-2 rounded-lg border border-white/[0.05]">
                          {passCode}
                        </div>
                        <p className="text-[9px] text-[#8E8C94] px-4 pt-2">Security has been notified. The driver will be directed to your floor.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <select 
                          value={courier}
                          onChange={(e) => setCourier(e.target.value)}
                          className="w-full bg-black/40 border border-white/[0.1] text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37]/50"
                        >
                          <option>Uber Eats</option>
                          <option>DoorDash</option>
                          <option>Deliveroo</option>
                          <option>FedEx / UPS</option>
                        </select>
                        <button
                          onClick={requestDeliveryPass}
                          disabled={deliveryStatus === 'loading'}
                          className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] to-[#9C8259] text-[#09050D] disabled:opacity-50"
                        >
                          {deliveryStatus === 'loading' ? 'Generating...' : 'Generate Passcode'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>

          {/* Footer branding */}
          <div className="text-center">
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#8E8C94]/60 font-semibold font-serif">
              SmartHotel OS • Digital Companion
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
