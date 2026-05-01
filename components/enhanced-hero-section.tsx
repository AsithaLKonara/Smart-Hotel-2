"use client"

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Users, Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920',
    title: 'The Art of Luxury',
    subtitle: 'A Sanctuary of Sophistication',
    description: 'Experience unparalleled elegance in our meticulously designed suites, where every detail tells a story of refined luxury.',
  },
  {
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1920',
    title: 'Exquisite Dining',
    subtitle: 'A Culinary Odyssey',
    description: 'Indulge in a world-class gastronomic journey crafted by Michelin-starred chefs, celebrating the finest seasonal ingredients.',
  },
  {
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1920',
    title: 'Serene Wellness',
    subtitle: 'Rejuvenate Your Senses',
    description: 'Discover total tranquility in our world-class spa, offering bespoke treatments designed to restore balance and harmony.',
  }
]

export default function EnhancedHeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  const handleBookingSearch = () => {
    const params = new URLSearchParams({
      checkin: bookingDates.checkIn,
      checkout: bookingDates.checkOut,
      guests: bookingDates.guests.toString()
    })
    window.location.href = `/booking?${params.toString()}`
  }

  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-midnight">
      {/* Background Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] scale-110"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-midnight/60 via-midnight/40 to-midnight/80" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full container mx-auto px-4 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Content */}
          <div className="lg:col-span-8 space-y-8 pt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center space-x-3 text-luxury uppercase tracking-[0.3em] text-xs font-semibold"
            >
              <div className="w-10 h-px bg-luxury" />
              <span>{slides[currentSlide].subtitle}</span>
            </motion.div>

            <motion.h1
              key={`title-${currentSlide}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-6xl md:text-8xl font-serif font-bold text-white leading-tight"
            >
              {slides[currentSlide].title.split(' ').map((word, i) => (
                <span key={i} className={i === 1 ? 'text-luxury italic block' : ''}>{word} </span>
              ))}
            </motion.h1>

            <motion.p
              key={`desc-${currentSlide}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-lg text-white/70 max-w-xl leading-relaxed font-light"
            >
              {slides[currentSlide].description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex items-center space-x-6"
            >
              <Link href="/rooms">
                <Button className="bg-gold-gradient hover:opacity-90 text-white px-10 h-14 rounded-none text-xs uppercase tracking-widest font-bold border-none shadow-luxury">
                  Explore Rooms
                </Button>
              </Link>
              <Link href="/gallery" className="group flex items-center space-x-3 text-white hover:text-luxury transition-colors uppercase tracking-widest text-xs font-bold">
                <span>View Gallery</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Booking Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="lg:col-span-4 bg-midnight/40 backdrop-blur-2xl border border-white/10 p-8 shadow-2xl"
          >
            <h3 className="text-xl font-serif font-bold text-white mb-6 text-center uppercase tracking-widest">Reserve Your Suite</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Check-In</label>
                  <input
                    type="date"
                    value={bookingDates.checkIn}
                    onChange={(e) => setBookingDates(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-white p-3 text-sm focus:outline-none focus:border-luxury transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Check-Out</label>
                  <input
                    type="date"
                    value={bookingDates.checkOut}
                    onChange={(e) => setBookingDates(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-white p-3 text-sm focus:outline-none focus:border-luxury transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Guests</label>
                <select
                  value={bookingDates.guests}
                  onChange={(e) => setBookingDates(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 text-white p-3 text-sm focus:outline-none focus:border-luxury appearance-none"
                >
                  {[1, 2, 3, 4].map(n => (
                    <option key={n} value={n} className="bg-midnight">{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleBookingSearch}
                className="w-full bg-luxury hover:bg-luxury/90 text-white h-14 rounded-none font-bold uppercase tracking-widest text-xs border-none"
                disabled={!bookingDates.checkIn || !bookingDates.checkOut}
              >
                Search Availability
              </Button>

              <div className="flex items-center justify-between text-[10px] uppercase tracking-tighter text-white/40 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1">
                  <Star className="w-2 h-2 fill-luxury text-luxury" />
                  <span>Best Price Guarantee</span>
                </div>
                <span>Free Cancellation</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-1 transition-all duration-500 ${
              i === currentSlide ? 'w-12 bg-luxury' : 'w-6 bg-white/20'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
