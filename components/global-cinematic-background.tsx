"use client"

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Route-to-image matching logic
 * Assigns hotel-hero-1.jpg, hotel-hero-2.jpg, and hotel-hero-3.jpg to corresponding matching pages
 */
function getBackgroundImageForPath(pathname: string | null): string {
  if (!pathname) return '/images/hotel/hotel-hero-2.jpg'
  const path = pathname.toLowerCase()

  // 1. Spa, Facilities & Serenity Routes (Wellness Theme)
  if (path.includes('/spa') || path.includes('/facilities') || path.includes('/auth')) {
    return '/images/hotel/hotel-hero-3.jpg'
  }

  // 2. Suites, Booking & About Routes (Accommodation Theme)
  if (
    path.includes('/rooms') ||
    path.includes('/booking') ||
    path.includes('/my-bookings') ||
    path.includes('/about') ||
    path.includes('/dashboard')
  ) {
    return '/images/hotel/hotel-hero-1.jpg'
  }

  // 3. Dining, Culinary, Contact & Ordering Routes (Food/Service Theme - Default)
  return '/images/hotel/hotel-hero-2.jpg'
}

/**
 * GlobalCinematicBackground
 * Always-on Prestige mode: scroll-linked camera zoom, warm gold vignette,
 * and progressive backdrop blur. No toggle, no conditionals.
 */
export default function GlobalCinematicBackground() {
  const pathname = usePathname()
  const bgImage = getBackgroundImageForPath(pathname)

  const isDashboard = pathname ? (
    pathname.toLowerCase().includes('/admin') ||
    pathname.toLowerCase().includes('/dashboard') ||
    pathname.toLowerCase().includes('/kitchen')
  ) : false

  const imageRef = useRef<HTMLImageElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const progress = Math.min(window.scrollY / (window.innerHeight || 1), 1)

      // Camera Illusion — subtle cinematic zoom + vertical parallax
      if (imageRef.current) {
        const scale = 1 + progress * 0.12        // 1.0 → 1.12
        const translateY = progress * -22         // 0px → -22px
        imageRef.current.style.transform = `scale(${scale}) translateY(${translateY}px)`
      }

      // Scene Vignette — warm amber/gold radial gradient darkening on scroll
      if (overlayRef.current) {
        const baseOpacity = isDashboard ? 0.65 : 0.4
        const maxOpacity = isDashboard ? 0.92 : 0.88
        const darkOpacity = baseOpacity + progress * (maxOpacity - baseOpacity)  // 0.65 → 0.92 or 0.4 → 0.88
        const blurAmount  = progress * 12         // 0px → 12px

        overlayRef.current.style.background = `radial-gradient(
          ellipse at center,
          rgba(20, 14, 6, ${darkOpacity - 0.15}) 0%,
          rgba(8, 5, 2, ${darkOpacity}) 100%
        )`
        overlayRef.current.style.backdropFilter = `blur(${blurAmount}px)`;
        (overlayRef.current.style as any).webkitBackdropFilter = `blur(${blurAmount}px)`
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // align on mount

    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname, isDashboard]) // Re-run effect when pathname/image changes to bind elements

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none">
      <AnimatePresence mode="popLayout">
        <motion.img
          key={bgImage}
          ref={imageRef}
          src={bgImage}
          alt="Global Background"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover origin-center"
          style={{ willChange: 'transform' }}
        />
      </AnimatePresence>

      {/* Warm prestige vignette overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{
          background: isDashboard
            ? 'radial-gradient(ellipse at center, rgba(10, 7, 3, 0.5) 0%, rgba(4, 2, 1, 0.75) 100%)'
            : 'radial-gradient(ellipse at center, rgba(20, 14, 6, 0.25) 0%, rgba(8, 5, 2, 0.5) 100%)',
          willChange: 'background, backdrop-filter',
          transition: 'all 0.4s ease-out',
        }}
      />
    </div>
  )
}

