"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import { signIn, getSession } from 'next-auth/react'
import { Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'
import { getDefaultDashboardUrl } from '@/lib/rbac-utils'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const DEMO_CREDENTIALS = [
    { role: 'Super Admin', email: 'admin@smarthotel.com', password: 'SmartHotel@2025!Admin', color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-200' },
    { role: 'Manager', email: 'manager@smarthotel.com', password: 'SmartHotel@2025!Manager', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-200' },
    { role: 'Receptionist', email: 'receptionist@smarthotel.com', password: 'SmartHotel@2025!Reception', color: 'from-sky-500/20 to-blue-500/20 border-sky-500/30 text-sky-200' },
    { role: 'Housekeeping', email: 'housekeeping@smarthotel.com', password: 'SmartHotel@2025!House', color: 'from-amber-400/20 to-yellow-500/20 border-amber-400/30 text-amber-200' },
    { role: 'Maintenance', email: 'maintenance@smarthotel.com', password: 'SmartHotel@2025!Maint', color: 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-200' },
    { role: 'Kitchen & F&B', email: 'kitchen@smarthotel.com', password: 'SmartHotel@2025!Kitchen', color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-200' },
    { role: 'Guest', email: 'guest@example.com', password: 'SmartHotel@2025!Guest', color: 'from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-200' },
    { role: 'Guest B', email: 'guestb@example.com', password: 'SmartHotel@2025!GuestB', color: 'from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-200' }
  ]

  const handleDemoLogin = (email: string, pass: string) => {
    setEmail(email)
    setPassword(pass)
    toast.success('Credentials filled')
  }

  const handleSocialSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: '/' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        const msg = 'Invalid email or password. Please try again.'
        setErrorMessage(msg)
        toast.error('Invalid credentials')
        setIsLoading(false)
        return
      }
      // Poll for session with retries to handle JWT cookie write race condition
      let session = null
      for (let attempt = 0; attempt < 3; attempt++) {
        await new Promise(r => setTimeout(r, 500))
        session = await getSession()
        if (session) break
      }
      
      if (session) {
        toast.success('Welcome back to the sanctuary')
        
        const rawUser = session.user as any;
        const role = rawUser?.roleName || rawUser?.role?.name || (session as any)?.roleName || 'GUEST';
        
        const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
        
        // Import dynamically if needed, but since it's client-side, we should just use the same logic
        // Wait, since we are in a client component, we should import getDefaultDashboardUrl at the top of the file.
        // For now, let's just assume we've imported it. I will add the import to the top of the file next.
        let targetUrl = callbackUrl || getDefaultDashboardUrl(role);
        
        window.location.href = targetUrl;
      } else {
        // If session is null right after signin due to cache, just fallback to redirect and let middleware route it.
        const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
        window.location.href = callbackUrl || '/dashboard';
      }

    } catch (error) {
      const msg = 'Authentication failed. Please try again.'
      setErrorMessage(msg)
      toast.error('Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative font-sans selection:bg-primary/30 selection:text-white">
      {/* Background Image Layer */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/signin-bg.png"
          alt="Luxury Hotel Backdrop"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 pt-32 pb-16 lg:p-8 lg:pt-40">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-6xl bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[48px] overflow-hidden shadow-[0_32px_120px_-15px_rgba(0,0,0,0.9)] flex flex-col lg:flex-row"
        >
          {/* Left Side: Brand & Demo Access */}
          <div className="lg:w-5/12 p-10 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-primary/10 to-transparent">
            <div className="space-y-8 relative z-10">
              <Link href="/" className="inline-block group">
                <span className="text-3xl font-serif font-bold tracking-tighter text-white uppercase flex items-center">
                  SMART<span className="text-primary italic">HOTEL</span>
                  <Sparkles className="w-5 h-5 ml-2 text-primary group-hover:rotate-12 transition-transform" />
                </span>
              </Link>

              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-serif font-bold text-white leading-[1.1]">
                  Operational <br />
                  <span className="text-primary italic">Intelligence.</span>
                </h1>
                <p className="text-white/50 text-lg font-light leading-relaxed max-w-md">
                  Welcome to the command center of SmartHotel. Access the multi-tenant orchestration layer and manage luxury at scale.
                </p>
              </div>

              {/* Demo Credentials Section */}
              <div className="space-y-6 pt-8">
                <div className="flex items-center space-x-3">
                  <div className="h-[1px] w-12 bg-primary/30"></div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary/60">Simulator Access</span>
                </div>
                <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                  {DEMO_CREDENTIALS.map((cred) => (
                    <button
                      key={cred.role}
                      onClick={() => handleDemoLogin(cred.email, cred.password)}
                      className={`group relative px-4 py-3 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-br ${cred.color} overflow-hidden`}
                    >
                      <div className="relative z-10 flex flex-col items-start">
                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Role</span>
                        <span className="text-sm font-bold">{cred.role}</span>
                      </div>
                      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="mt-12 lg:mt-0 flex items-center space-x-4 text-white/20">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Encrypted Quantum Layer Access</span>
            </div>
          </div>

          {/* Right Side: Authentication Form */}
          <div className="lg:w-7/12 p-10 lg:p-16 bg-white/[0.02] backdrop-blur-xl border-l border-white/5">
            <div className="max-w-md mx-auto space-y-10">
              <div className="space-y-2">
                <h2 className="text-3xl font-serif font-bold text-white">Sign In</h2>
                <p className="text-white/40 text-sm">Enter your sanctuary credentials or use social access.</p>
              </div>

              {/* Social Logins */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleSocialSignIn('google')}
                  className="flex items-center justify-center space-x-3 py-4 px-4 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all hover:border-white/20 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 1.2-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-sm font-bold text-white/70">Google</span>
                </button>
                <button 
                  onClick={() => handleSocialSignIn('facebook')}
                  className="flex items-center justify-center space-x-3 py-4 px-4 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all hover:border-white/20 group"
                >
                  <svg className="w-5 h-5 text-[#1877F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-sm font-bold text-white/70">Facebook</span>
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-transparent px-4 text-white/20 font-bold">Universal Security Gate</span></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="group space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-2 group-focus-within:text-primary transition-colors">Staff Email</label>
                    <input 
                      type="email" 
                      required
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-6 py-5 rounded-2xl text-sm focus:ring-1 focus:ring-primary focus:bg-white/10 transition-all outline-none"
                      placeholder="name@smarthotel.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="group space-y-1">
                    <div className="flex justify-between items-center px-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/30 group-focus-within:text-primary transition-colors">Access Key</label>
                      <Link href="/auth/forgot-password" virtual-link="true" className="text-[10px] uppercase tracking-widest text-primary/60 font-bold hover:text-primary transition-colors">Reset Key?</Link>
                    </div>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 px-6 py-5 rounded-2xl text-sm focus:ring-1 focus:ring-primary focus:bg-white/10 transition-all outline-none"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline error message (visible to test automation & screen readers) */}
                {errorMessage && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium"
                  >
                    {errorMessage}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-16 rounded-2xl uppercase tracking-[0.3em] text-[10px] font-bold group transition-all shadow-[0_10px_30px_-10px_rgba(var(--primary-rgb),0.5)]"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Initialize Session
                      <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-2 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-white/30 font-light">
                Not part of the sanctuary yet? <a href="#" onClick={(e) => { e.preventDefault(); const cb = new URLSearchParams(window.location.search).get('callbackUrl'); window.location.href = cb ? `/auth/signup?callbackUrl=${encodeURIComponent(cb)}` : '/auth/signup'; }} className="text-primary font-bold hover:underline">Apply for Access</a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}