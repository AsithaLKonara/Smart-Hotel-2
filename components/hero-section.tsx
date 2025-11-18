"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Default fallback slides
const defaultHeroSlides = [
  {
    id: '1',
    title: "Luxury Redefined",
    subtitle: "Experience unparalleled comfort and elegance",
    description: "Discover our world-class amenities and exceptional service in the heart of the city.",
    image: "/images/hotel-hero-1.jpg",
    cta: "Book Now",
    ctaLink: "/booking"
  },
  {
    id: '2',
    title: "Perfect Getaway",
    subtitle: "Your ideal destination for relaxation",
    description: "Escape to tranquility with our premium rooms and stunning city views.",
    image: "/images/hotel-hero-1.jpg",
    cta: "View Rooms",
    ctaLink: "/rooms"
  },
  {
    id: '3',
    title: "Exclusive Experience",
    subtitle: "Where luxury meets convenience",
    description: "Indulge in our signature services and create unforgettable memories.",
    image: "/images/hotel-hero-1.jpg",
    cta: "Learn More",
    ctaLink: "/about"
  }
]

export default function HeroSection() {
  const [heroSlides, setHeroSlides] = useState(defaultHeroSlides)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
    
    // Fetch hero slides from API
    async function loadSlides() {
      try {
        const response = await fetch('/api/hero-slides')
        if (!response.ok) return
        
        const data = await response.json()
        const loadedSlides = Array.isArray(data) ? data : (data.items || [])
        
        if (loadedSlides.length > 0) {
          setHeroSlides(loadedSlides.map((slide: any) => ({
            id: slide.id,
            title: slide.title,
            subtitle: slide.subtitle,
            description: slide.description,
            image: slide.image,
            cta: slide.cta,
            ctaLink: slide.ctaLink
          })))
        }
      } catch (error) {
        console.error('Failed to load hero slides:', error)
        // Keep default slides on error
      }
    }
    
    loadSlides()
  }, [])

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPlaying, heroSlides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const toggleAutoplay = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Slides */}
      {heroSlides.map((slide, index) => (
        <motion.div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: index === currentSlide ? 1 : 0 }}
          transition={{ duration: 1 }}
        >
          {/* Lazy loaded background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${slide.image})`,
              filter: 'brightness(0.7)'
            }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        </motion.div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 50 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.h1 
                className="text-5xl md:text-7xl font-serif font-bold mb-4"
                key={currentSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {heroSlides[currentSlide].title}
              </motion.h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <motion.p 
                className="text-xl md:text-2xl font-light mb-2 text-gray-200"
                key={`subtitle-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {heroSlides[currentSlide].subtitle}
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.p 
                className="text-lg md:text-xl mb-8 text-gray-300 max-w-2xl mx-auto"
                key={`description-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {heroSlides[currentSlide].description}
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.div
                key={`cta-${currentSlide}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Button 
                  size="lg" 
                  className="btn-luxury text-lg px-8 py-4"
                  asChild
                >
                  <Link href={heroSlides[currentSlide].ctaLink}>
                    {heroSlides[currentSlide].cta}
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center space-x-4">
          {/* Previous/Next buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          {/* Slide indicators */}
          <div className="flex space-x-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>

          {/* Play/Pause button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAutoplay}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>

          {/* Next button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className="text-white hover:bg-white/20"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <div className="flex flex-col items-center text-white/70">
          <span className="text-sm mb-2">Scroll to explore</span>
          <motion.div
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
          </motion.div>
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-black/20 z-20">
        <motion.div
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: isPlaying ? '100%' : '0%' }}
          transition={{ 
            duration: 5, 
            repeat: isPlaying ? Infinity : 0,
            ease: 'linear'
          }}
        />
      </div>
    </section>
  )
} 