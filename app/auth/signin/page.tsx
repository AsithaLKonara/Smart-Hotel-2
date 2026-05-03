"use client"
import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Building2, ShieldCheck, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)


  const DEMO_CREDENTIALS = [
    { role: 'Admin', email: 'admin@smarthotel.com', password: 'SmartHotel@2025!Admin', color: 'border-red-200 text-red-600 bg-red-50' },
    { role: 'Manager', email: 'manager@smarthotel.com', password: 'SmartHotel@2025!Manager', color: 'border-blue-200 text-blue-600 bg-blue-50' },
    { role: 'Guest', email: 'guest@example.com', password: 'SmartHotel@2025!Guest', color: 'border-emerald-200 text-emerald-600 bg-emerald-50' }
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
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        toast.error('Invalid credentials')
        setIsLoading(false)
        return
      }
      let session = await getSession()
      if (session?.user?.role) {
        toast.success('Welcome back')
        window.location.href = '/dashboard'
      }
    } catch (error) {
      toast.error('Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-midnight font-sans">
      {/* Visual Side */}
      <div className="hidden lg:block relative overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200" 
          alt="Luxury Lobby" 
          fill 
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
        <div className="absolute bottom-20 left-20 right-20 space-y-6">
          <div className="flex items-center space-x-3 text-luxury uppercase tracking-[0.4em] text-[10px] font-bold">
            <div className="w-10 h-px bg-luxury" />
            <span>Member Access</span>
          </div>
          <h2 className="text-5xl font-serif font-bold text-white leading-tight">
            Elevate Your <span className="text-luxury italic">Experience</span>
          </h2>
          <p className="text-white/50 font-light text-lg leading-relaxed max-w-md">
            Enter your sanctuary. Access bespoke services, manage your reservations, and unlock exclusive member benefits.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-6 lg:p-24 bg-white relative overflow-y-auto">
        <div className="w-full max-w-md space-y-10 py-10">
          <div className="space-y-4">
             <Link href="/" className="inline-block">
               <span className="text-2xl font-serif font-bold tracking-tighter text-midnight uppercase">SMART<span className="text-luxury">HOTEL</span></span>
             </Link>
             <h1 className="text-3xl font-serif font-bold text-midnight">Welcome Back</h1>
             <p className="text-gray-400 font-light text-sm">Please enter your details to access your sanctuary.</p>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleSocialSignIn('google')}
              className="flex items-center justify-center space-x-2 py-3 px-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 1.2-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-sm font-medium text-gray-600">Google</span>
            </button>
            <button 
              onClick={() => handleSocialSignIn('facebook')}
              className="flex items-center justify-center space-x-2 py-3 px-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <svg className="w-5 h-5 text-[#1877F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">Facebook</span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400 tracking-widest">Or continue with</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 ml-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-gray-50 border-none px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-luxury/20 transition-all placeholder:text-gray-300"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Password</label>
                  <Link href="/auth/forgot-password" className="text-[10px] uppercase tracking-widest text-luxury font-bold hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-gray-50 border-none px-5 py-4 rounded-xl text-sm focus:ring-2 focus:ring-luxury/20 transition-all placeholder:text-gray-300"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-luxury transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-midnight text-white h-14 rounded-xl uppercase tracking-[0.2em] text-xs font-bold hover:bg-midnight/90 group transition-all shadow-lg shadow-midnight/10"
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center space-x-2">
              <div className="h-px flex-1 bg-gray-100"></div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-300">Quick Demo Access</span>
              <div className="h-px flex-1 bg-gray-100"></div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  onClick={() => handleDemoLogin(cred.email, cred.password)}
                  className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold border rounded-full transition-all hover:scale-105 active:scale-95 ${cred.color}`}
                >
                  {cred.role}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 flex flex-col items-center space-y-4">
             <p className="text-sm text-gray-400 font-light">
               New to our sanctuary? <Link href="/auth/signup" className="text-luxury font-bold italic hover:underline">Create an account</Link>
             </p>
             <div className="flex items-center space-x-2 text-[10px] text-gray-300 uppercase tracking-widest font-bold">
               <ShieldCheck className="w-3 h-3" />
               <span>Secure Member Access</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}