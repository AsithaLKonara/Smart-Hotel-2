"use client"

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Terminal, 
  Activity, 
  Lock, 
  Server, 
  CheckCircle2, 
  Cpu
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { getDefaultDashboardUrl } from '@/lib/rbac-utils'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const DEMO_CREDENTIALS = [
    { role: 'Super Admin', email: 'admin@smarthotel.com', password: 'SmartHotel@2025!Admin', badge: 'ROOT' },
    { role: 'Manager (GOR)', email: 'manager.gor@smarthotel.com', password: 'SmartHotel@2025!', badge: 'OPS' },
    { role: 'Receptionist', email: 'reception.gor@smarthotel.com', password: 'SmartHotel@2025!', badge: 'DESK' },
    { role: 'Housekeeping', email: 'housekeeping.gor@smarthotel.com', password: 'SmartHotel@2025!', badge: 'MAINT' },
    { role: 'Kitchen Lead', email: 'kitchen.gor@smarthotel.com', password: 'SmartHotel@2025!', badge: 'POS' },
    { role: 'Guest Demo', email: 'guest@example.com', password: 'SmartHotel@2025!Guest', badge: 'GUEST' },
  ]

  const handleDemoLogin = (userEmail: string, userPass: string) => {
    setEmail(userEmail)
    setPassword(userPass)
    toast.success('Credentials mapped to console', {
      style: {
        background: '#121417',
        color: '#fff',
        border: '1px solid #2B3037',
        fontSize: '12px',
        fontFamily: 'monospace'
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        const msg = 'Access Denied: Invalid credentials or account locked.'
        setErrorMessage(msg)
        toast.error('Authentication rejected')
        setIsLoading(false)
        return
      }

      // Poll session
      let session = null
      for (let attempt = 0; attempt < 3; attempt++) {
        await new Promise(r => setTimeout(r, 400))
        session = await getSession()
        if (session) break
      }

      if (session) {
        toast.success('Session Authenticated')
        const rawUser = session.user as any
        const role = rawUser?.roleName || rawUser?.role?.name || (session as any)?.roleName || 'SUPER_ADMIN'
        const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl')
        const targetUrl = callbackUrl || getDefaultDashboardUrl(role) || '/admin/dashboard'
        window.location.href = targetUrl
      } else {
        const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl')
        window.location.href = callbackUrl || '/admin/dashboard'
      }
    } catch {
      setErrorMessage('Authentication pipeline timeout. Check cluster network.')
      toast.error('System error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#090A0C] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white flex flex-col lg:grid lg:grid-cols-2">
      
      {/* LEFT COLUMN: Stealth Brand & Live Telemetry Terminal */}
      <div className="relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#1C2025] bg-[#090A0C] overflow-hidden">
        {/* Subtle Cyber Glow Accents */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#181A1D] border border-[#2B3037] flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm">
              SH
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wider">SMARTHOTEL</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/30 uppercase tracking-wider">
                SPACE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cluster 01 Online</span>
          </div>
        </div>

        {/* Middle: Brand Pitch & Telemetry Diagnostic */}
        <div className="relative z-10 my-12 space-y-8 max-w-xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#121417] border border-[#1E2227] text-zinc-400 text-xs font-mono">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>v2.8.0 Enterprise Orchestrator</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.08]">
              Stealth Industrial <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-white">
                Hospitality Engine.
              </span>
            </h1>

            <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
              Low-glare dark control deck for multi-property hospitality governance, real-time inventory telemetry, and mission-critical folio tracking.
            </p>
          </div>

          {/* Telemetry Status Console Box */}
          <div className="p-4 rounded-xl bg-[#121417] border border-[#1E2227] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1C2025] pb-2 text-[10px] text-zinc-500 uppercase tracking-wider">
              <span>Host Node Diagnostics</span>
              <span className="text-emerald-400">Nominal 100%</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-zinc-500 block">Encryption:</span>
                <span className="text-zinc-300 font-semibold">TLS 1.3 / AES-256</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Gateway Latency:</span>
                <span className="text-emerald-400 font-semibold">12.4ms (Direct)</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Cluster Region:</span>
                <span className="text-zinc-300 font-semibold">AWS-AP-South-1</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Active Ledger:</span>
                <span className="text-blue-400 font-semibold">Postgres / Redis Sync</span>
              </div>
            </div>
          </div>

          {/* Quick Access Simulator Profiles */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              <span>Quick Simulator Authentication</span>
              <span>Click to auto-populate</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => handleDemoLogin(cred.email, cred.password)}
                  className="p-2.5 rounded-lg bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] hover:border-zinc-500 text-left transition-colors group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[11px] font-semibold text-zinc-200 group-hover:text-white transition-colors">
                      {cred.role}
                    </span>
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#181A1D] text-zinc-400 border border-[#2B3037]">
                      {cred.badge}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500 truncate block">
                    {cred.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 flex items-center justify-between pt-6 border-t border-[#1C2025] text-[11px] text-zinc-500 font-mono">
          <span>SmartHotel Architecture</span>
          <span>Zero-Latency Command Deck</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Cardless Stealth Authentication Console */}
      <div className="relative flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-[#090A0C]">
        <div className="w-full max-w-sm space-y-6">
          
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Console Authorization
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Enter verified credentials to initiate operator session.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-start gap-2.5 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cardless Form */}
          <form action="javascript:void(0)" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="email"
                className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono"
              >
                Operator Identity / Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@smarthotel.com"
                className="w-full h-10 px-3.5 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors font-mono"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="password"
                  className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider font-mono"
                >
                  Secret Key / Password
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  AES Verified
                </span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 pl-3.5 pr-10 rounded-lg bg-[#181A1D] border border-[#2B3037] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember & Security Flag */}
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  defaultChecked
                  className="rounded bg-[#181A1D] border-[#2B3037] text-blue-500 focus:ring-0" 
                />
                <span>Preserve session ticket</span>
              </label>
              <span className="text-zinc-500">Tier-1 Auth</span>
            </div>

            {/* Primary Submit Button (Section 6.B) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Authorizing Session...</span>
                  </>
                ) : (
                  <>
                    <span>Initialize Session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Notice & Micro-Anatomy Footer */}
          <div className="pt-6 border-t border-[#1C2025] space-y-3">
            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Trust Architecture • Hardware-Protected Session</span>
            </div>
            
            <p className="text-[10px] text-zinc-600 font-mono text-center leading-normal">
              Internal system access is actively monitored and cryptographically audited. Unauthorized access attempts are quarantined.
            </p>
          </div>

        </div>
      </div>

    </div>
  )
}