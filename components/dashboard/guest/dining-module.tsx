"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UtensilsCrossed, 
  CalendarDays, 
  Clock, 
  MapPin, 
  Sparkles,
  ChevronRight,
  ChefHat,
  Coffee,
  Wine
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OrderPortal } from '@/components/ordering/order-portal'
import { DiningBookingModal } from '@/components/dining/booking-modal'
import { MenuModal } from '@/components/dining/menu-modal'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const venues = [
  {
    id: 'signature',
    name: 'The Gilded Plate',
    subtitle: 'Signature Fine Dining',
    description: 'An award-winning gastronomic destination where classical techniques meet avant-garde presentation. Our Michelin-starred chefs curate a seasonal menu that celebrates the world\'s finest ingredients.',
    hours: '18:00 - 23:00',
    location: '42nd Floor',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200',
    tags: ['Michelin Star', 'Fine Dining', 'Wine Pairing'],
  },
  {
    id: 'lounge',
    name: 'Celestial Lounge',
    subtitle: 'Rooftop Mixology',
    description: 'Sip on handcrafted cocktails while suspended above the city lights. The Celestial Lounge offers an intimate atmosphere with panoramic views and live jazz.',
    hours: '17:00 - 02:00',
    location: 'Rooftop',
    image: 'https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&q=80&w=1200',
    tags: ['Cocktails', 'Live Music', 'City Views'],
  },
  {
    id: 'brasserie',
    name: 'Le Jardin Brasserie',
    subtitle: 'All-Day Artisan Dining',
    description: 'A vibrant, light-filled space offering a sophisticated take on classic brasserie fare. From organic breakfast spreads to leisurely afternoon teas.',
    hours: '06:30 - 22:00',
    location: 'Lobby Level',
    image: 'https://images.unsplash.com/photo-1550966841-396ad886756b?auto=format&fit=crop&q=80&w=1200',
    tags: ['Breakfast', 'Afternoon Tea', 'Casual Elegant'],
  },
]

interface DiningModuleProps {
  roomNumber?: string
  guestInfo?: {
    name: string
    phone: string
    bookingId: string
  }
}

export function DiningModule({ roomNumber = "101", guestInfo }: DiningModuleProps) {
  const [activeTab, setActiveTab] = useState<'room-service' | 'table-booking'>('room-service')
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleBooking = (venueName: string) => {
    setSelectedVenue(venueName)
    setIsBookingOpen(true)
  }

  const handleViewMenu = (venueName: string) => {
    setSelectedVenue(venueName)
    setIsMenuOpen(true)
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Module Navigation */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-[32px] backdrop-blur-xl">
        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('room-service')}
            className={cn(
              "flex-1 md:w-48 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3",
              activeTab === 'room-service' 
                ? "bg-primary text-white shadow-luxury" 
                : "text-white/40 hover:text-white hover:bg-white/5"
            )}
          >
            <UtensilsCrossed className="w-4 h-4" />
            In-Room Service
          </button>
          <button
            onClick={() => setActiveTab('table-booking')}
            className={cn(
              "flex-1 md:w-48 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3",
              activeTab === 'table-booking' 
                ? "bg-primary text-white shadow-luxury" 
                : "text-white/40 hover:text-white hover:bg-white/5"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Table Reservations
          </button>
        </div>

        <div className="flex items-center gap-6 px-6 py-2 border-l border-white/5 hidden md:flex">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Kitchen Status</p>
              <p className="text-[10px] font-bold text-emerald-400">Operational</p>
            </div>
          </div>
          <div className="h-8 w-px bg-white/5" />
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Clock className="w-4 h-4 text-primary" />
             </div>
             <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Current Delay</p>
                <p className="text-[10px] font-bold text-white">~15-20 Mins</p>
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'room-service' ? (
          <motion.div
            key="room-service"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5 }}
          >
            <OrderPortal roomNumber={roomNumber} guestInfo={guestInfo} />
          </motion.div>
        ) : (
          <motion.div
            key="table-booking"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {venues.map((venue) => (
              <Card key={venue.id} className="bg-[#0c0c0c] border-white/5 rounded-[40px] overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-2xl relative">
                <div className="absolute top-6 right-6 z-20">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/80">Available Today</span>
                  </div>
                </div>

                <div className="relative h-64">
                  <Image 
                    src={venue.image} 
                    alt={venue.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/40 to-transparent" />
                  <div className="absolute bottom-8 left-8 space-y-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{venue.subtitle}</p>
                    <h3 className="text-3xl font-serif font-bold text-white tracking-tight">{venue.name}</h3>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <p className="text-sm text-white/40 leading-relaxed font-medium italic">
                    "{venue.description}"
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {venue.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="border-white/5 bg-white/[0.02] text-white/40 text-[8px] uppercase tracking-widest px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-6 py-6 border-y border-white/5">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-[8px] uppercase tracking-widest text-white/20 font-black">Service Hours</p>
                        <p className="text-xs font-bold text-white">{venue.hours}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-[8px] uppercase tracking-widest text-white/20 font-black">Level</p>
                        <p className="text-xs font-bold text-white">{venue.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button 
                      onClick={() => handleBooking(venue.name)}
                      className="h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-luxury transition-all active:scale-95"
                    >
                      Reserve Table
                    </Button>
                    <Button 
                      onClick={() => handleViewMenu(venue.name)}
                      variant="outline" 
                      className="h-14 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      View Menu
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Special Collection Promotion */}
            <Card className="lg:col-span-2 bg-gradient-to-br from-primary/10 via-[#0c0c0c] to-[#0c0c0c] border-primary/20 rounded-[40px] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
               <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-1000" />
               <div className="relative z-10 space-y-4 max-w-xl text-center md:text-left">
                  <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-primary/20 rounded-full border border-primary/30">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Private Collection</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">The Sommelier's Reserve</h2>
                  <p className="text-sm text-white/40 leading-relaxed">Experience our exclusive vault of vintage selections and limited-release distillates. Personal tastings available upon request.</p>
               </div>
               <Button className="relative z-10 h-16 px-10 bg-white text-black hover:bg-white/90 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95">
                  Book Experience
               </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <DiningBookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        venueName={selectedVenue || ''}
      />

      <MenuModal 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        venueName={selectedVenue || ''}
      />
    </div>
  )
}
