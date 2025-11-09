"use client"

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Users, Star, MapPin, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import HeroVideoBackground from './hero-video-background'

export default function EnhancedHeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2
  })

  const slides = [
    {
      image: '/images/hotel/hotel-hero-1.jpg',
      title: 'Welcome to Grand Palace Hotel',
      subtitle: 'Experience Luxury Like Never Before',
      description: 'Indulge in world-class amenities, exceptional service, and breathtaking views in the heart of the city.',
      cta: 'Book Your Stay',
      ctaLink: '/booking'
    },
    {
      image: '/images/hotel/hotel-hero-2.jpg',
      title: 'Luxurious Accommodations',
      subtitle: 'Your Perfect Stay Awaits',
      description: 'From elegant suites to cozy rooms, find your ideal space with premium amenities and stunning city views.',
      cta: 'View Rooms',
      ctaLink: '/rooms'
    },
    {
      image: '/images/hotel/hotel-hero-3.jpg',
      title: 'Culinary Excellence',
      subtitle: 'Award-Winning Dining',
      description: 'Savor exquisite cuisine crafted by world-renowned chefs in our elegant restaurants and bars.',
      cta: 'Explore Dining',
      ctaLink: '/restaurant'
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [slides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const handleBookingSearch = () => {
    const params = new URLSearchParams({
      checkin: bookingDates.checkIn,
      checkout: bookingDates.checkOut,
      guests: bookingDates.guests.toString()
    })
    window.location.href = `/booking?${params.toString()}`
  }

  const currentSlideData = slides[currentSlide]

  return (
    <HeroVideoBackground
      fallbackImage={currentSlideData.image}
      className="relative"
    >
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-sm font-medium">5-Star Luxury Hotel</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                {currentSlideData.title}
              </h1>
              
              <h2 className="text-2xl lg:text-3xl text-amber-300 font-light">
                {currentSlideData.subtitle}
              </h2>
              
              <p className="text-xl text-gray-200 leading-relaxed max-w-2xl">
                {currentSlideData.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={currentSlideData.ctaLink}>
                <Button size="lg" className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-4 text-lg font-semibold">
                  {currentSlideData.cta}
                </Button>
              </Link>
              
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg">
                  Contact Us
                </Button>
              </Link>
            </div>

            {/* Hotel Highlights */}
            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="flex items-center space-x-3">
                <MapPin className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-sm text-gray-300">Location</p>
                  <p className="text-white font-medium">Downtown District</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-sm text-gray-300">Call Us</p>
                  <p className="text-white font-medium">+1 (555) 123-4567</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Widget */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Book Your Stay</h3>
              <p className="text-gray-600">Find the perfect room for your getaway</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hero-check-in" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Check-in
                  </label>
                  <input
                    id="hero-check-in"
                    type="date"
                    value={bookingDates.checkIn}
                    onChange={(e) => setBookingDates(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="hero-check-out" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Check-out
                  </label>
                  <input
                    id="hero-check-out"
                    type="date"
                    value={bookingDates.checkOut}
                    onChange={(e) => setBookingDates(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="hero-guests" className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Guests
                </label>
                <select
                  id="hero-guests"
                  value={bookingDates.guests}
                  onChange={(e) => setBookingDates(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleBookingSearch}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white py-4 text-lg font-semibold"
                disabled={!bookingDates.checkIn || !bookingDates.checkOut}
              >
                Search Available Rooms
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-amber-600">150+</p>
                  <p className="text-sm text-gray-600">Luxury Rooms</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">24/7</p>
                  <p className="text-sm text-gray-600">Concierge</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">5★</p>
                  <p className="text-sm text-gray-600">Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Navigation */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
          <button
            onClick={prevSlide}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          <button
            onClick={nextSlide}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </HeroVideoBackground>
  )
}
