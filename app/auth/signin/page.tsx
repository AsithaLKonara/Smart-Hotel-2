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
        window.location.href = session.user.role === 'GUEST' ? '/' : '/admin'
      }
    } catch (error) {
      toast.error('Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-midnight">
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
      <div className="flex items-center justify-center p-8 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-12">
          <div className="space-y-4">
             <Link href="/" className="inline-block">
               <span className="text-2xl font-serif font-bold tracking-tighter text-midnight">SMART<span className="text-luxury">HOTEL</span></span>
             </Link>
             <h1 className="text-3xl font-serif font-bold text-midnight">Welcome Back</h1>
             <p className="text-gray-400 font-light">Please enter your details to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    className="w-full bg-gray-50 border-none px-6 py-4 text-sm focus:ring-1 focus:ring-luxury transition-all"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Password</label>
                  <Link href="/auth/forgot-password" weights="light" className="text-[10px] uppercase tracking-widest text-luxury font-bold">Forgot?</Link>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full bg-gray-50 border-none px-6 py-4 text-sm focus:ring-1 focus:ring-luxury transition-all"
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
              className="w-full bg-midnight text-white h-16 rounded-none uppercase tracking-[0.2em] text-xs font-bold hover:bg-midnight/90 group"
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="pt-8 border-t border-gray-100 flex flex-col items-center space-y-4">
             <p className="text-sm text-gray-400 font-light">
               New to our sanctuary? <Link href="/auth/signup" className="text-luxury font-bold italic">Create an account</Link>
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
 