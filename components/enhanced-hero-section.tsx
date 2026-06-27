"use client"

import { ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function EnhancedHeroSection() {

  return (
    <section className="relative z-0 min-h-screen lg:h-screen lg:min-h-[700px] w-full overflow-hidden bg-transparent flex flex-col justify-center">
      {/* Background Video */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-full"
        >
          <source src="/videos/snaptik_7544319300136471815_v3.mp4" type="video/mp4" />
        </video>
        {/* Multi-layered premium gradient overlays and vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/35" />
        <div className="absolute inset-0 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 w-full container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0 flex flex-col items-center justify-center text-center">
        <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center">
          {/* Subtitle with gold borders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center space-x-4 text-luxury uppercase tracking-[0.3em] text-[10px] sm:text-xs font-semibold"
          >
            <div className="w-8 sm:w-12 h-px bg-luxury" />
            <span>A Sanctuary of Sophistication</span>
            <div className="w-8 sm:w-12 h-px bg-luxury" />
          </motion.div>

          {/* Centered H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-6xl md:text-8xl font-serif font-bold text-white leading-[1.1] text-center max-w-5xl mx-auto"
          >
            The <span className="text-luxury italic block sm:inline mx-2">Art</span> of Luxury
          </motion.h1>

          {/* Centered Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed font-light text-center"
          >
            Experience unparalleled elegance in our meticulously designed suites, where every detail tells a story of refined luxury.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full pt-4"
          >
            <Link href="/booking" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-gold-gradient hover:scale-[1.02] active:scale-[0.98] text-white px-12 h-14 rounded-xl text-xs uppercase tracking-widest font-black border-none shadow-luxury transition-all">
                Check Availability
              </Button>
            </Link>
            <Link href="/rooms" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-white/20 text-white rounded-xl px-12 h-14 uppercase tracking-widest text-xs font-bold hover:bg-white/10 transition-all backdrop-blur-md">
                Explore Suites
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

    </section>
  )
}
