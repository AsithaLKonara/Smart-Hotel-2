"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Utensils, Calendar, BookOpen, ChevronRight, Sparkles } from 'lucide-react'
import { DiningBookingModal } from '@/components/dining/booking-modal'
import { MenuModal } from '@/components/dining/menu-modal'
import Link from 'next/link'

export function GuestDiningHub() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState('Signature Grill')

  return (
    <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] overflow-hidden group relative">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        <Utensils className="w-32 h-32 text-primary" />
      </div>
      
      <div className="p-10 space-y-8 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-2">
            <Sparkles className="w-3 h-3" /> Gastronomy
          </div>
          <h3 className="text-3xl font-serif font-bold text-white tracking-tight">Culinary Experiences</h3>
          <p className="text-sm text-white/40 font-medium max-w-md">Reserve your table at our award-winning venues or explore our seasonal menus.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => setIsBookingOpen(true)}
            className="p-8 bg-white/[0.03] border border-white/5 rounded-[32px] hover:border-primary/30 hover:bg-white/[0.05] transition-all cursor-pointer group/item"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover/item:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-serif font-bold text-white mb-2">Table Reservation</h4>
            <p className="text-xs text-white/30 leading-relaxed mb-6">Secure your preferred seating at any of our signature restaurants.</p>
            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
              Book Now <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          <div 
            onClick={() => setIsMenuOpen(true)}
            className="p-8 bg-white/[0.03] border border-white/5 rounded-[32px] hover:border-primary/30 hover:bg-white/[0.05] transition-all cursor-pointer group/item"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover/item:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-serif font-bold text-white mb-2">Digital Menu</h4>
            <p className="text-xs text-white/30 leading-relaxed mb-6">Browse our latest creations, rare vintages, and sommelier selections.</p>
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              View Menu <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Available 24/7 for In-Room Dining</p>
          <Link href="/order">
            <Button variant="link" className="text-primary text-[10px] font-black uppercase tracking-widest p-0 h-auto">
              Open Room Service Portal &rarr;
            </Button>
          </Link>
        </div>
      </div>

      <DiningBookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        venueName={selectedVenue}
      />

      <MenuModal 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        venueName={selectedVenue}
      />
    </Card>
  )
}
