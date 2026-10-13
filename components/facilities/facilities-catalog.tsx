"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Waves, 
  Dumbbell, 
  Heart, 
  Briefcase, 
  Utensils, 
  Sparkles, 
  Star, 
  Clock, 
  ChevronRight, 
  MapPin, 
  Filter 
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface FacilityItem {
  id: string
  name: string
  type: string
  subtitle?: string | null
  description?: string | null
  imageUrl?: string | null
  features?: string | null
  operatingHours?: string
  status?: string
  propertyId: string
  property?: {
    id: string
    name: string
    city: string
    code: string
  } | null
}

interface FacilitiesCatalogProps {
  initialFacilities: FacilityItem[]
  properties: Array<{ id: string; name: string; city: string; code: string }>
}

const TYPE_ICONS: Record<string, any> = {
  POOL: Waves,
  SPA: Heart,
  FITNESS: Dumbbell,
  BUSINESS: Briefcase,
  DINING: Utensils,
  RECREATION: Sparkles,
}

export function FacilitiesCatalog({
  initialFacilities,
  properties
}: FacilitiesCatalogProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const facilityTypes = ['all', 'POOL', 'SPA', 'FITNESS', 'BUSINESS', 'DINING']

  const filteredFacilities = initialFacilities.filter((fac) => {
    const matchesProperty = selectedPropertyId === 'all' || fac.propertyId === selectedPropertyId
    const matchesType = selectedType === 'all' || fac.type.toUpperCase() === selectedType.toUpperCase()
    return matchesProperty && matchesType
  })

  return (
    <div className="space-y-16">
      {/* Filters Bar */}
      <section className="sticky top-20 z-40 bg-black/60 backdrop-blur-xl border-y border-white/5 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Property Selector */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar w-full md:w-auto">
            <span className="text-xs uppercase tracking-widest text-primary font-bold mr-2 hidden sm:inline">
              Resort:
            </span>
            <button
              onClick={() => setSelectedPropertyId('all')}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                selectedPropertyId === 'all'
                  ? 'bg-primary/20 text-primary border-primary/40 shadow-luxury'
                  : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:border-white/20'
              }`}
            >
              All Resorts
            </button>
            {properties.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPropertyId(p.id)}
                className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                  selectedPropertyId === p.id
                    ? 'bg-primary/20 text-primary border-primary/40 shadow-luxury'
                    : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:border-white/20'
                }`}
              >
                <MapPin className="w-3 h-3 text-primary" />
                <span>{p.city}</span>
              </button>
            ))}
          </div>

          {/* Type Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full md:w-auto">
            {facilityTypes.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                  selectedType === t
                    ? 'bg-primary text-black border-primary'
                    : 'bg-white/5 text-white/50 border-white/5 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Amenities' : t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities Dynamic Listing */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredFacilities.length === 0 ? (
            <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10 max-w-2xl mx-auto space-y-4">
              <Sparkles className="w-10 h-10 text-primary mx-auto opacity-60" />
              <h3 className="text-2xl font-serif font-bold text-white">No Facilities Found</h3>
              <p className="text-sm text-white/50 font-light">
                There are no facilities matching your current filter selection. Try selecting "All Resorts".
              </p>
              <Button
                onClick={() => {
                  setSelectedPropertyId('all')
                  setSelectedType('all')
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-xl mt-4"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-32">
              <AnimatePresence mode="popLayout">
                {filteredFacilities.map((facility, index) => {
                  const Icon = TYPE_ICONS[facility.type.toUpperCase()] || Sparkles
                  const featuresList = facility.features
                    ? facility.features.split(',').map((f) => f.trim()).filter(Boolean)
                    : ['24/7 Access', 'Dedicated Concierge', 'Complimentary Amenities']

                  const isEven = index % 2 === 1

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-100px' }}
                      transition={{ duration: 0.6 }}
                      key={facility.id}
                      className={`grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center ${
                        isEven ? 'lg:flex-row-reverse' : ''
                      }`}
                    >
                      {/* Photo Column */}
                      <div className={`relative ${isEven ? 'lg:order-2' : ''}`}>
                        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/40 group">
                          <Image
                            src={
                              facility.imageUrl ||
                              'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=1200'
                            }
                            alt={facility.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-1000"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                          {/* Operating Hours Floating Tag */}
                          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-white">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span className="font-mono text-[11px]">{facility.operatingHours || '09:00 - 18:00'}</span>
                            </div>
                            {facility.property && (
                              <span className="text-[10px] uppercase tracking-wider text-primary font-bold bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-primary/20">
                                {facility.property.city}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-48 h-48 border-[12px] border-primary/10 -z-10 rounded-3xl pointer-events-none" />
                      </div>

                      {/* Narrative Column */}
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center text-primary shadow-luxury">
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-primary uppercase tracking-widest text-[11px] font-bold block">
                                {facility.subtitle || facility.type}
                              </span>
                              {facility.property && (
                                <span className="text-xs text-white/40 font-light">
                                  {facility.property.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <h2 className="text-3xl lg:text-5xl font-serif font-bold text-white leading-tight">
                            {facility.name}
                          </h2>
                        </div>

                        <p className="text-base lg:text-lg text-white/60 leading-relaxed font-light">
                          {facility.description ||
                            'Designed to exceed the expectations of the discerning traveler, with tailored hospitality and pristine wellness ambiance.'}
                        </p>

                        {/* Features Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                          {featuresList.map((feature, i) => (
                            <div key={i} className="flex items-center space-x-3 bg-white/5 border border-white/5 px-3.5 py-2 rounded-xl">
                              <Star className="w-3.5 h-3.5 fill-primary text-primary shrink-0" />
                              <span className="text-xs font-medium text-white/80">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 flex flex-wrap gap-4">
                          <Link href="/booking">
                            <Button className="bg-gold-gradient text-white rounded-xl px-8 h-12 uppercase tracking-widest text-xs font-bold shadow-luxury hover:opacity-90 transition-opacity">
                              <span>Reserve Facility Experience</span>
                              <ChevronRight className="w-4 h-4 ml-1.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
