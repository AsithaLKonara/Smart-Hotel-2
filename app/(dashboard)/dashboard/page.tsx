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
    // Rely solely on middleware.ts for enterprise-grade edge protection.
    // Client-side redirects cause race conditions during Playwright E2E hydration.

    const role = session?.user?.roleName
    if (role && role !== 'GUEST') {
      if (role === 'SUPER_ADMIN' || role === 'MANAGER') router.push('/admin/dashboard')
      else if (role === 'RECEPTIONIST') router.push('/admin/receptionist')
      else if (role === 'HOUSEKEEPING') router.push('/admin/housekeeping')
      else if (role === 'KITCHEN') router.push('/kitchen/dashboard')
      else if (role === 'MAINTENANCE') router.push('/admin/tasks')
    }

    if (session?.user?.id) fetchBooking()
  }, [status, session]) // eslint-disable-line react-hooks/exhaustive-deps

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
            <Card className="p-6 bg-card border-border rounded-xl space-y-8 shadow-sm">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Resort Connection</p>
                <h4 className="text-xl font-bold">Your Concierge</h4>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border transition-all">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  JP
                </div>
                <div>
                  <p className="text-base font-bold">Jeevan Perera</p>
                  <p className="text-sm text-muted-foreground">Lead Experience</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full">
                  Instant Message
                </Button>
                <Button variant="outline" className="w-full">
                  Request Callback
                </Button>
              </div>
            </Card>
          </motion.div>

          <Card className="p-6 bg-card border-border rounded-xl shadow-sm space-y-6">
            <h5 className="text-sm font-medium text-muted-foreground">Quick Service</h5>
            <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => router.push('/dashboard/dining')}
                  className="flex flex-col items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted transition-all group"
               >
                  <div className="w-10 h-10 rounded-md bg-background border flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Dining</span>
               </button>
               <button className="flex flex-col items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted transition-all group">
                  <div className="w-10 h-10 rounded-md bg-background border flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Spa</span>
               </button>
            </div>
          </Card>
        </div>
      </div>
    </GuestPageShell>
  )
}
