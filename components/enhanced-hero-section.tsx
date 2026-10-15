"use client"

import { useState, useEffect } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

export interface HeroSlideItem {
  id: string
  image: string
  title: string
  subtitle: string
  description: string
  cta: string
  ctaLink: string
  order?: number
  active?: boolean
}

export default function EnhancedHeroSection({ slides: initialSlides = [] }: { slides?: HeroSlideItem[] }) {
  const [slides, setSlides] = useState<HeroSlideItem[]>(initialSlides)
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    if (initialSlides.length > 0) {
      setSlides(initialSlides)
      return
    }

    fetch('/api/hero-slides')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data.filter((s: any) => s.active !== false))
        }
      })
      .catch(err => console.error('Failed to load hero slides', err))
  }, [initialSlides])

  // Auto-advance if multiple slides
  useEffect(() => {
    if (slides.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % slides.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [slides.length])

  const activeSlide = slides[currentIdx] || null

  return (
    <section className="relative z-0 min-h-screen lg:h-screen lg:min-h-[700px] w-full overflow-hidden bg-transparent flex flex-col justify-center">
      {/* Background Layer: Dynamic Image or Fallback Video */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeSlide?.image ? (
            <motion.div
              key={activeSlide.id || currentIdx}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <Image
                src={activeSlide.image}
                alt={activeSlide.title || "Luxury Hotel Hero"}
                fill
                priority
                className="object-cover"
                unoptimized
              />
            </motion.div>
          ) : (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="object-cover w-full h-full"
            >
              <source src="/videos/snaptik_7544319300136471815_v3.mp4" type="video/mp4" />
            </video>
          )}
        </AnimatePresence>

        {/* Multi-layered premium gradient overlays and vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/50" />
        <div className="absolute inset-0 backdrop-blur-[0.5px]" />
      </div>

      <div className="relative z-10 w-full container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 flex flex-col items-center justify-center text-center">
        <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide ? activeSlide.id : 'default-hero'}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 flex flex-col items-center"
            >
              {/* Subtitle with gold borders */}
              <div className="flex items-center justify-center space-x-4 text-luxury uppercase tracking-[0.3em] text-[10px] sm:text-xs font-semibold">
                <div className="w-8 sm:w-12 h-px bg-luxury" />
                <span>{activeSlide?.subtitle || "A Sanctuary of Sophistication"}</span>
                <div className="w-8 sm:w-12 h-px bg-luxury" />
              </div>

              {/* Centered H1 */}
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif font-bold text-white leading-[1.1] text-center max-w-5xl mx-auto">
                {activeSlide?.title ? (
                  <span>{activeSlide.title}</span>
                ) : (
                  <>The <span className="text-luxury italic block sm:inline mx-2">Art</span> of Luxury</>
                )}
              </h1>

              {/* Centered Description */}
              <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed font-light text-center">
                {activeSlide?.description || "Experience unparalleled elegance in our meticulously designed suites, where every detail tells a story of refined luxury."}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full pt-4">
                <Link href={activeSlide?.ctaLink || "/booking"} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-gold-gradient hover:scale-[1.02] active:scale-[0.98] text-white px-12 h-14 rounded-xl text-xs uppercase tracking-widest font-black border-none shadow-luxury transition-all">
                    {activeSlide?.cta || "Check Availability"}
                  </Button>
                </Link>
                <Link href="/rooms" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto border-white/20 text-white rounded-xl px-12 h-14 uppercase tracking-widest text-xs font-bold hover:bg-white/10 transition-all backdrop-blur-md">
                    Explore Suites
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Slide Navigation Dots */}
          {slides.length > 1 && (
            <div className="flex items-center gap-2 pt-8 z-20">
              <button
                onClick={() => setCurrentIdx(prev => (prev - 1 + slides.length) % slides.length)}
                className="w-8 h-8 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIdx ? 'bg-primary w-8 shadow-luxury' : 'bg-white/20 w-2 hover:bg-white/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
              <button
                onClick={() => setCurrentIdx(prev => (prev + 1) % slides.length)}
                className="w-8 h-8 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
