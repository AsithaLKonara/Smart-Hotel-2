"use client"

import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { GuestStayDetails } from './guest-stay-details'
import { GuestRoomService } from './guest-room-service'
import { GuestRequests } from './guest-requests'
import { GuestComplaints } from './guest-complaints'
import { GuestSpending } from './guest-spending'
import { GuestReviews } from './guest-reviews'
import { motion } from 'framer-motion'

interface GuestDashboardViewProps {
  session: any
}

import { GuestDiningHub } from './guest-dining-hub'

export function GuestDashboardView({ session }: GuestDashboardViewProps) {
  const guestName = session?.user?.name || "Premium Guest"
  const firstName = guestName.split(' ')[0]

  return (
    <div className="p-6 text-white pb-40">
      <DashboardHeader 
        title="Welcome Home"
        firstName={firstName}
        subtitle="Experience hospitality refined. Your personalized sanctuary for managing stay, service, and seamless comfort."
        role="Signature Elite"
      />

      <div className="mt-12 space-y-16">
        {/* Primary Stay Info */}
        <GuestStayDetails />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Operational Column */}
          <div className="lg:col-span-8 space-y-12">
            <GuestDiningHub />
            <GuestRoomService />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <GuestRequests />
              <GuestComplaints />
            </div>

            <GuestReviews />
          </div>

          {/* Financial & Profile Sidebar */}
          <div className="lg:col-span-4 space-y-12">
            <GuestSpending />

            <Card className="p-10 bg-[#0c0c0c] border-white/[0.05] rounded-[40px] space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Resort Connection</p>
                <h4 className="text-xl font-serif font-bold text-white">Your Butler</h4>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-3xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  JD
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Jeevan Perera</p>
                  <p className="text-[10px] text-white/40 uppercase font-black">Level 5 Master Sommelier</p>
                </div>
              </div>
              <Button className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                Message Concierge
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
