"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { GuestStayDetails } from '@/components/dashboard/guest/guest-stay-details'
import { StayJourneyTimeline } from '@/components/dashboard/guest/stay-journey-timeline'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { motion } from 'framer-motion'
import { ChefHat, Users, User } from 'lucide-react'

import { GuestPageShell } from '@/components/dashboard/guest/guest-page-shell'

export default function DashboardOrchestrator() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeBooking, setActiveBooking] = useState<any>(null)
  const [loadingBooking, setLoadingBooking] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    const role = session?.user?.role
    if (role && role !== 'GUEST') {
      if (role === 'SUPER_ADMIN' || role === 'MANAGER') router.push('/admin/dashboard')
      else if (role === 'RECEPTIONIST') router.push('/admin/receptionist')
      else if (role === 'HOUSEKEEPING') router.push('/admin/housekeeping')
      else if (role === 'KITCHEN') router.push('/kitchen/dashboard')
      else if (role === 'MAINTENANCE') router.push('/admin/tasks')
    }

    if (session?.user?.id) fetchBooking()
  }, [status, session, router])

  const fetchBooking = async () => {
    try {
      const res = await fetch('/api/bookings?status=CONFIRMED')
      if (res.ok) {
        const data = await res.json()
        setActiveBooking(data.bookings?.[0] || null)
      }
    } finally {
      setLoadingBooking(false)
    }
  }

  const getActiveStep = () => {
    if (!activeBooking) return 0
    if (activeBooking.status === 'CONFIRMED') return 1
    if (activeBooking.status === 'CHECKED_IN') return 2
    if (activeBooking.status === 'CHECKED_OUT') return 3
    return 1
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <PremiumSpinner size="lg" text="Authenticating your session..." />
      </div>
    )
  }

  const firstName = session?.user?.name?.split(' ')[0] || "Guest"

  return (
    <GuestPageShell
      title="Welcome Home"
      subtitle="Experience hospitality refined. Your personalized sanctuary for managing stay, service, and seamless comfort."
      firstName={firstName}
    >
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Stay Column */}
        <div className="lg:col-span-8 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GuestStayDetails />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <StayJourneyTimeline activeStep={getActiveStep()} />
          </motion.div>
        </div>

        {/* Sidebar Quick Actions */}
        <div className="lg:col-span-4 space-y-12">
           <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-10 bg-[#0c0c0c] border-white/[0.05] rounded-[40px] space-y-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient opacity-20" />
              
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Resort Connection</p>
                <h4 className="text-2xl font-serif font-bold text-white">Your Concierge</h4>
              </div>
              
              <div className="flex items-center gap-6 p-6 bg-white/[0.02] rounded-3xl border border-white/5 group-hover:border-primary/20 transition-all">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                  JP
                </div>
                <div>
                  <p className="text-lg font-serif font-bold text-white">Jeevan Perera</p>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Lead Experience</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-lg shadow-primary/20">
                  Instant Message
                </Button>
                <Button variant="outline" className="w-full h-14 bg-white/5 hover:bg-white/10 border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Request Callback
                </Button>
              </div>
            </Card>
          </motion.div>

          <Card className="p-10 bg-[#0c0c0c] border-white/5 rounded-[40px] shadow-2xl space-y-6">
            <h5 className="text-[10px] font-black text-white/20 uppercase tracking-widest">Quick Service</h5>
            <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => router.push('/dashboard/dining')}
                  className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group"
               >
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-primary">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter">Dining</span>
               </button>
               <button className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter">Spa</span>
               </button>
            </div>
          </Card>
        </div>
      </div>
    </GuestPageShell>
  )
}
