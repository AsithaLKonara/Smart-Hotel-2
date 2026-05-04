"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }),
      })

      if (response.ok) {
        toast.success('Sanctuary account created')
        router.push('/auth/signin')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Registration failed')
      }
    } catch (error) {
      toast.error('Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-midnight">
      {/* Visual Side */}
      <div className="hidden lg:block relative overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1200" 
          alt="Luxury Resort" 
          fill 
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
        <div className="absolute bottom-20 left-20 right-20 space-y-6">
          <div className="flex items-center space-x-3 text-luxury uppercase tracking-[0.4em] text-[10px] font-bold">
            <div className="w-10 h-px bg-luxury" />
            <span>Join Our Legacy</span>
          </div>
          <h2 className="text-5xl font-serif font-bold text-white leading-tight">
            A Sanctuary <span className="text-luxury italic">Awaits</span>
          </h2>
          <p className="text-white/50 font-light text-lg leading-relaxed max-w-md">
            Create your account to unlock curated experiences, seamless reservations, and a world of refined luxury.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-10 my-12">
          <div className="space-y-4">
             <Link href="/" className="inline-block">
               <span className="text-2xl font-serif font-bold tracking-tighter text-midnight">SMART<span className="text-luxury">HOTEL</span></span>
             </Link>
             <h1 className="text-3xl font-serif font-bold text-midnight">Begin Your Journey</h1>
             <p className="text-gray-400 font-light">Join the SmartHotel inner circle today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  className="w-full bg-gray-50 border-none px-6 py-4 text-sm focus:ring-1 focus:ring-luxury transition-all"
                  placeholder="Your illustrious name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  className="w-full bg-gray-50 border-none px-6 py-4 text-sm focus:ring-1 focus:ring-luxury transition-all"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full bg-gray-50 border-none px-6 py-4 text-sm focus:ring-1 focus:ring-luxury transition-all"
                  placeholder="+1 (000) 000-0000"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Password</label>
                  <input 
                    type="password" 
                    name="password"
                    required
                    className="w-full bg-gray-50 border-none px-6 py-4 text-sm focus:ring-1 focus:ring-luxury transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Confirm</label>
                  <input 
                    type="password" 
                    required
                    className="w-full bg-gray-50 border-none px-6 py-4 text-sm focus:ring-1 focus:ring-luxury transition-all"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-midnight text-white h-16 rounded-none uppercase tracking-[0.2em] text-xs font-bold hover:bg-midnight/90 group"
            >
              {isLoading ? 'Creating Account...' : 'Join The Circle'}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="pt-8 border-t border-gray-100 flex flex-col items-center space-y-4">
             <p className="text-sm text-gray-400 font-light">
               Already a member? <Link href="/auth/signin" className="text-luxury font-bold italic">Sign in</Link>
             </p>
             <div className="flex items-center space-x-2 text-[10px] text-gray-300 uppercase tracking-widest font-bold">
               <ShieldCheck className="w-3 h-3" />
               <span>Privacy Guaranteed</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
 