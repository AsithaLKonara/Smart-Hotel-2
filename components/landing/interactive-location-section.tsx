"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Phone, Mail, Navigation, ExternalLink, Compass, ArrowRight, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface PropertyLocationItem {
  id: string
  code: string
  name: string
  address: string
  city: string
  country: string
  phone?: string | null
  email?: string | null
  description?: string | null
  mainImage?: string | null
  latitude?: number | null
  longitude?: number | null
  googleMapsUrl?: string | null
  totalRooms?: number
}

interface InteractiveLocationSectionProps {
  properties: PropertyLocationItem[]
  defaultContact?: {
    phone: string
    email: string
  }
}

export function InteractiveLocationSection({
  properties,
  defaultContact
}: InteractiveLocationSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!properties || properties.length === 0) {
    return null
  }

  const activeProperty = properties[selectedIndex] || properties[0]

  // Calculated coordinates or fallback
  const lat = activeProperty.latitude ?? 40.7589
  const lng = activeProperty.longitude ?? -73.9851
  const mapsUrl = activeProperty.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  const phone = activeProperty.phone || defaultContact?.phone || '+1 (800) 555-HOTEL'
  const email = activeProperty.email || defaultContact?.email || 'concierge@smarthotel.com'

  return (
    <section className="py-24 lg:py-32 bg-black/40 border-y border-white/5 relative overflow-hidden text-white">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-primary uppercase tracking-[0.3em] text-xs font-bold">
              <div className="w-8 h-px bg-primary" />
              <span>Multi-Property Portfolio</span>
              <div className="w-8 h-px bg-primary" />
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">
              Curated <span className="text-primary italic">Destinations</span>
            </h2>
          </div>

          {/* Property Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {properties.map((prop, idx) => {
              const isSelected = selectedIndex === idx
              return (
                <button
                  key={prop.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-primary/20 text-primary border-primary/40 shadow-luxury'
                      : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:border-white/20'
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-primary' : 'text-white/40'}`} />
                  <span>{prop.city}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Details Panel */}
          <div className="lg:col-span-5 space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProperty.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-widest font-bold mb-2">
                    <Compass className="w-4 h-4" />
                    <span>{activeProperty.city}, {activeProperty.country}</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-serif font-bold text-white">
                    {activeProperty.name}
                  </h3>
                  <p className="text-white/60 text-sm font-light mt-3 leading-relaxed">
                    {activeProperty.description || `Experience royal hospitality and breathtaking surroundings at ${activeProperty.name}, positioned in the most prestigious quarters of ${activeProperty.city}.`}
                  </p>
                </div>

                {/* Location Specs Box */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
                  <div className="flex items-start gap-3.5 text-sm">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider">Address</h4>
                      <p className="text-white/70 text-xs mt-0.5">{activeProperty.address}</p>
                      <p className="text-white/40 text-[11px]">{activeProperty.city}, {activeProperty.country}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 text-sm pt-3 border-t border-white/5">
                    <Navigation className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider">Coordinates</h4>
                      <p className="text-primary font-mono text-xs mt-0.5">
                        {lat.toFixed(4)}° N, {Math.abs(lng).toFixed(4)}° {lng >= 0 ? 'E' : 'W'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 text-xs">
                    <div className="flex items-center gap-2 text-white/70">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate">{phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate">{email}</span>
                    </div>
                  </div>
                </div>

                {/* Action CTA Buttons */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl text-xs font-bold uppercase tracking-wider shadow-luxury">
                      <Navigation className="w-3.5 h-3.5 mr-2" />
                      Get Directions
                    </Button>
                  </a>
                  <Link href={`/properties/${activeProperty.code}`} className="flex-1">
                    <Button variant="outline" className="w-full border-white/20 hover:border-primary/40 text-white h-12 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 backdrop-blur-sm">
                      <span>Explore Suites</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Interactive Map Viewport */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[16/10] md:aspect-[16/11] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0c0c10] group">
              {/* Map Photography Canvas */}
              <Image
                src={activeProperty.mainImage || 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200'}
                alt={`${activeProperty.name} Map View`}
                fill
                className="object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000"
                unoptimized={!!activeProperty.mainImage}
              />

              {/* Luxury Cartographic Grid Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black pointer-events-none" />

              {/* Cartographic Coordinate Overlay Header */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20 pointer-events-none">
                <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-wider text-white/80 uppercase">
                    Live Satellite Telemetry
                  </span>
                </div>
                <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-primary font-bold">
                  {properties.length} Properties Pinned
                </div>
              </div>

              {/* Multi-Pin Markers on Map */}
              <div className="absolute inset-0 z-20 flex items-center justify-center p-8">
                {/* Visual coordinate canvas with pin anchors */}
                <div className="relative w-full h-full">
                  {properties.map((prop, idx) => {
                    const isSelected = selectedIndex === idx
                    
                    // Fixed distributed layout across the interactive canvas
                    const positions = [
                      { top: '35%', left: '30%' },
                      { top: '55%', left: '68%' },
                      { top: '40%', left: '80%' },
                      { top: '65%', left: '25%' },
                      { top: '25%', left: '60%' },
                    ]
                    const pos = positions[idx % positions.length]

                    return (
                      <div
                        key={prop.id}
                        style={{ top: pos.top, left: pos.left }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300"
                        onClick={() => setSelectedIndex(idx)}
                      >
                        {/* Radar Ping Animation for selected property */}
                        {isSelected && (
                          <span className="absolute -inset-3 rounded-full bg-primary/30 animate-ping pointer-events-none" />
                        )}

                        {/* Interactive Pin Badge */}
                        <div
                          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 shadow-2xl backdrop-blur-md ${
                            isSelected
                              ? 'bg-primary text-black border-primary scale-110 font-bold shadow-[0_0_25px_rgba(212,175,55,0.7)]'
                              : 'bg-black/80 text-white/80 border-white/20 hover:border-primary/60 hover:text-white hover:scale-105'
                          }`}
                        >
                          <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-primary'}`} />
                          <span className="text-[11px] uppercase tracking-wider font-semibold whitespace-nowrap">
                            {prop.city}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Bottom Interactive Property Peek Card */}
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                      <Image
                        src={activeProperty.mainImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=200'}
                        alt={activeProperty.name}
                        fill
                        className="object-cover"
                        unoptimized={!!activeProperty.mainImage}
                      />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white font-serif">{activeProperty.name}</h5>
                      <p className="text-[10px] text-white/50">{activeProperty.city}, {activeProperty.country}</p>
                    </div>
                  </div>

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                  >
                    <span>View Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
