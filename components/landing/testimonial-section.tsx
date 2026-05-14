"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface Testimonial {
  id: string
  name: string
  role: string
  content: string
  rating: number
  image?: string
}

const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Alexandra Sterling',
    role: 'Global Travel Critic',
    content: "An extraordinary experience from start to finish. The attention to detail and personalized service is simply world-class. Every stay feels like coming home to a palace.",
    rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: '2',
    name: 'Julian Montgomery',
    role: 'Luxury Lifestyle Architect',
    content: "The fusion of heritage architecture with cutting-edge smart technology is flawless. The Gilded Plate's tasting menu is a gastronomic journey I will never forget.",
    rating: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: '3',
    name: 'Sophia Chen',
    role: 'Elite Voyager Magazine',
    content: "Sustainability meets opulence. SmartHotel proves that luxury doesn't have to be wasteful. A truly ethical and breathtaking sanctuary in the heart of the city.",
    rating: 5,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200'
  }
]

export function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % defaultTestimonials.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const next = () => {
    setIsAutoPlaying(false)
    setActiveIndex((prev) => (prev + 1) % defaultTestimonials.length)
  }

  const prev = () => {
    setIsAutoPlaying(false)
    setActiveIndex((prev) => (prev - 1 + defaultTestimonials.length) % defaultTestimonials.length)
  }

  return (
    <section className="py-24 lg:py-32 bg-black/45 backdrop-blur-xl border-y border-white/5 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center space-y-4 mb-20">
          <h4 className="text-primary uppercase tracking-[0.3em] text-xs font-bold">Guest Voices</h4>
          <h2 className="text-5xl lg:text-6xl font-serif font-bold text-white">
            Stories of <span className="text-primary italic">Distinction</span>
          </h2>
        </div>

        <div className="max-w-5xl mx-auto relative px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center space-y-12"
            >
              <div className="flex justify-center gap-1">
                {[...Array(defaultTestimonials[activeIndex].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary drop-shadow-[0_0_8px_rgba(197,160,89,0.3)]" />
                ))}
              </div>

              <div className="relative">
                <Quote className="absolute -top-12 -left-8 w-24 h-24 text-primary/10 -z-10" />
                <h3 className="text-2xl lg:text-4xl font-serif font-bold italic text-white leading-tight lg:px-12">
                  "{defaultTestimonials[activeIndex].content}"
                </h3>
              </div>

              <div className="flex flex-col items-center space-y-6">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 p-1 bg-white/5 backdrop-blur-md">
                  <Image 
                    src={defaultTestimonials[activeIndex].image || ''} 
                    alt={defaultTestimonials[activeIndex].name}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
                <div className="space-y-1">
                  <h5 className="text-white font-bold tracking-widest uppercase text-sm">{defaultTestimonials[activeIndex].name}</h5>
                  <p className="text-primary text-[10px] uppercase tracking-[0.2em] font-black">{defaultTestimonials[activeIndex].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="absolute top-1/2 -left-4 lg:-left-12 -translate-y-1/2">
            <button 
              onClick={prev}
              className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute top-1/2 -right-4 lg:-right-12 -translate-y-1/2">
            <button 
              onClick={next}
              className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-3 mt-16">
            {defaultTestimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActiveIndex(i); setIsAutoPlaying(false); }}
                className={`h-1 transition-all duration-500 rounded-full ${activeIndex === i ? 'w-12 bg-primary' : 'w-4 bg-white/10'}`}
              />
            ))}
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-32 border-t border-white/5 pt-16">
          {[
            { label: 'Guest Rating', value: '4.9/5.0', sub: 'Verified by Trustpilot' },
            { label: 'Excellence Awards', value: '124', sub: 'Global Hospitality Index' },
            { label: 'Return Rate', value: '82%', sub: 'Loyalty Program Members' },
            { label: 'Butler SLA', value: '99.8%', sub: 'Response under 5 mins' },
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-2">
              <p className="text-3xl font-serif font-bold text-white">{stat.value}</p>
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-widest font-black text-primary">{stat.label}</p>
                <p className="text-[8px] text-white/30 font-medium">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
