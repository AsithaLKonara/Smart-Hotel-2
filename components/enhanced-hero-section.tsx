"use client"

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Users, Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const slides = [
  {
    image: '/images/hotel/hotel-hero-1.jpg',
    title: 'The Art of Luxury',
    subtitle: 'A Sanctuary of Sophistication',
    description: 'Experience unparalleled elegance in our meticulously designed suites, where every detail tells a story of refined luxury.',
  },
  {
    image: '/images/hotel/hotel-hero-2.jpg',
    title: 'Exquisite Dining',
    subtitle: 'A Culinary Odyssey',
    description: 'Indulge in a world-class gastronomic journey crafted by Michelin-starred chefs, celebrating the finest seasonal ingredients.',
  },
  {
    image: '/images/hotel/hotel-hero-3.jpg',
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
    <section className="relative min-h-screen lg:h-screen lg:min-h-[700px] w-full overflow-hidden bg-transparent flex flex-col justify-center">
      {/* Background Image Slideshow with Smooth Crossfade and Scale Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 -z-10 overflow-hidden"
        >
          <Image
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            fill
            priority
            className="object-cover origin-center"
          />
          {/* Multi-layered premium gradient overlays and vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/65" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/35" />
          <div className="absolute inset-0 backdrop-blur-[1px]" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 w-full container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Hero Content */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8 pt-10 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center space-x-3 text-luxury uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs font-semibold"
            >
              <div className="w-8 sm:w-10 h-px bg-luxury" />
              <span>{slides[currentSlide].subtitle}</span>
            </motion.div>

            <motion.h1
              key={`title-${currentSlide}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white leading-[1.1] sm:leading-tight"
            >
              {slides[currentSlide].title.split(' ').map((word, i) => (
                <span key={i} className={i === 1 ? 'text-luxury italic block sm:inline' : ''}>{word} </span>
              ))}
            </motion.h1>

            <motion.p
              key={`desc-${currentSlide}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-sm sm:text-base md:text-lg text-white/70 max-w-xl leading-relaxed font-light"
            >
              {slides[currentSlide].description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <Link href="/rooms" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-gold-gradient hover:opacity-90 text-white px-10 h-12 sm:h-14 rounded-none text-[10px] sm:text-xs uppercase tracking-widest font-bold border-none shadow-luxury">
                  Explore Rooms
                </Button>
              </Link>
              <Link href="/gallery" className="group flex items-center space-x-3 text-white hover:text-luxury transition-colors uppercase tracking-widest text-[10px] sm:text-xs font-bold pl-1 sm:pl-0">
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
            className="lg:col-span-4 bg-black/40 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-luxury rounded-[2rem] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <h3 className="text-lg sm:text-xl font-serif font-bold text-white mb-6 text-center uppercase tracking-[0.2em]">Reserve Your Suite</h3>

            <div className="space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="heroCheckIn" className="text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold ml-1">Check-In</label>
                  <input
                    id="heroCheckIn"
                    type="date"
                    value={bookingDates.checkIn}
                    onChange={(e) => setBookingDates(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-white p-3 text-sm rounded-xl focus:outline-none focus:border-primary transition-colors h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="heroCheckOut" className="text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold ml-1">Check-Out</label>
                  <input
                    id="heroCheckOut"
                    type="date"
                    value={bookingDates.checkOut}
                    onChange={(e) => setBookingDates(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-white p-3 text-sm rounded-xl focus:outline-none focus:border-primary transition-colors h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="heroGuests" className="text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold ml-1">Guests</label>
                <div className="relative">
                  <select
                    id="heroGuests"
                    value={bookingDates.guests}
                    onChange={(e) => setBookingDates(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                    className="w-full bg-white/5 border border-white/10 text-white p-3 text-sm rounded-xl focus:outline-none focus:border-primary appearance-none h-12"
                  >
                    {[1, 2, 3, 4].map(n => (
                      <option key={n} value={n} className="bg-neutral-900 text-white">{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBookingSearch}
                className="w-full bg-gold-gradient hover:opacity-90 text-white h-12 sm:h-14 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs border-none shadow-luxury transition-all"
                disabled={!bookingDates.checkIn || !bookingDates.checkOut}
              >
                Search Availability
              </Button>

              <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-white/40 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  <span>Best Price</span>
                </div>
                <span>Free Cancellation</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setCurrentSlide(i)}
            className={`h-0.5 sm:h-1 transition-all duration-500 ${i === currentSlide ? 'w-8 sm:w-12 bg-luxury' : 'w-4 sm:w-6 bg-white/20'
              }`}
          />
        ))}
      </div>
    </section>
  )
}
