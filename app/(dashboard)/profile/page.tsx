"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Award, 
  CreditCard, 
  Bell,
  Loader2,
  Camera,
  Save,
  LogOut,
  Globe,
  ChevronRight
} from 'lucide-react'
import { GuestPageShell } from '@/components/dashboard/guest/guest-page-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [loyalty, setLoyalty] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/loyalty')
        if (res.ok) {
          const data = await res.json()
          setLoyalty(data)
        }
      } catch (err) {
        console.error("Failed to fetch profile metadata")
      } finally {
        setLoading(false)
      }
    }
    if (session?.user?.id) fetchData()
    else setLoading(false)
  }, [session])

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <GuestPageShell
      title="Personal Sanctuary"
      subtitle="Manage your elite profile, preference settings, and membership credentials in one secure location."
      firstName={session?.user?.name?.split(' ')[0]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Profile Card */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="bg-[#0c0c0c] border-white/5 p-10 rounded-[40px] text-center space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative mx-auto w-32 h-32">
              <div className="w-full h-full rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
                {(session?.user as any)?.image ? (
                  <Image 
                    src={(session?.user as any).image} 
                    alt="Avatar" 
                    width={128} 
                    height={128} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-16 h-16 text-primary" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-primary hover:text-white transition-all shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-2xl font-serif font-bold text-white">{session?.user?.name || 'Valued Guest'}</h3>
              <p className="text-xs text-white/40 uppercase tracking-widest mt-1 font-black">{session?.user?.roleName || 'Guest'}</p>
            </div>

            <div className="flex justify-center gap-3">
              <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 uppercase text-[10px] px-4 py-1">
                {loyalty?.tier || 'BRONZE'} Member
              </Badge>
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5 uppercase text-[10px] px-4 py-1">
                Verified
              </Badge>
            </div>

            <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xl font-serif font-bold text-white">{loyalty?.points || 0}</p>
                <p className="text-[10px] text-white/20 uppercase font-black tracking-tighter">Reward Points</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-serif font-bold text-white">04</p>
                <p className="text-[10px] text-white/20 uppercase font-black tracking-tighter">Total Stays</p>
              </div>
            </div>
          </Card>

          <Card className="bg-[#0c0c0c] border-white/5 p-8 rounded-[40px] space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 px-2">Account Governance</h4>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-2xl h-12">
                <Shield className="w-4 h-4 mr-3 text-primary" /> Security & Password
              </Button>
              <Button variant="ghost" className="w-full justify-start text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-2xl h-12">
                <Bell className="w-4 h-4 mr-3 text-primary" /> Notification Settings
              </Button>
              <Button variant="ghost" className="w-full justify-start text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-2xl h-12">
                <CreditCard className="w-4 h-4 mr-3 text-primary" /> Payment Methods
              </Button>
              <Button variant="ghost" className="w-full justify-start text-xs text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-2xl h-12">
                <LogOut className="w-4 h-4 mr-3" /> Sign Out All Devices
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Personal Information */}
        <div className="lg:col-span-8">
          <Card className="bg-[#0c0c0c] border-white/5 p-10 rounded-[40px] space-y-10">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-serif font-bold text-white">Guest Information</h4>
              <Button 
                onClick={() => toast.success("Changes saved successfully (Simulation).")}
                className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 h-12 text-[10px] font-black uppercase tracking-widest"
              >
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="text" 
                    defaultValue={session?.user?.name || ''}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="email" 
                    defaultValue={session?.user?.email || ''}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white/40 outline-none"
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="tel" 
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Preferred Language</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary/40">
                    <option value="en">English (US)</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="jp">Japanese</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-2">Mailing Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-4 h-4 text-white/20" />
                <textarea 
                  placeholder="Street, City, Country, Zip Code"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:ring-2 focus:ring-primary/40 h-32 resize-none"
                />
              </div>
            </div>

            <div className="p-8 bg-primary/5 border border-primary/20 rounded-[30px] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm">Two-Factor Authentication</h5>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-tight mt-1">Recommended for Elite members</p>
                </div>
              </div>
              <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10 text-[10px] font-black uppercase tracking-widest px-6 rounded-xl">
                Enable Now
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </GuestPageShell>
  )
}
