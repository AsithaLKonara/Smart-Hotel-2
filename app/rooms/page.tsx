"use client"


import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Users, Star, Loader2, ChevronRight, MapPin, Wind, Wifi, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

interface Room {
  id: string
  number: string
  type: string
  price: number
  capacity: number
  size: number | null
  description: string | null
  amenities: string[] | any
  roomImages?: Array<{ url: string; isMain?: boolean }>
  images?: string[]
  reviews?: Array<{ rating: number }>
}

export default function RoomsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRooms() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/rooms', { cache: 'no-store' })
        const data = await response.json()
        if (Array.isArray(data)) setRooms(data)
        else if (data?.rooms) setRooms(data.rooms)
      } catch (err) {
        setError('Failed to load rooms')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRooms()
  }, [])

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = (room.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (room.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || room.type.toLowerCase() === selectedType.toLowerCase()
    return matchesSearch && matchesType
  })

  return (
    <div className="bg-transparent text-white pt-24">
      {/* Hero Section — Blur Glass */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        {/* Glass blur overlay — lets video show through */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" />
        {/* Subtle noise texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 text-primary uppercase tracking-[0.4em] text-xs font-bold">
              <div className="w-12 h-px bg-primary" />
              <span>Unrivaled Comfort</span>
              <div className="w-12 h-px bg-primary" />
            </div>
            <h1 className="text-6xl md:text-7xl font-serif font-bold text-white leading-tight">
              Our <span className="text-primary italic">Suites</span>
            </h1>
            <p className="text-white/50 font-light text-lg max-w-xl mx-auto">Curated accommodations where every detail speaks of luxury and refinement.</p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-20 z-40 bg-black/50 backdrop-blur-xl border-b border-white/5 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="Search by suite type..." 
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:ring-1 focus:ring-primary transition-all text-sm rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {['all', 'Standard', 'Deluxe', 'Suite', 'Presidential'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-6 py-2 text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-all border rounded-lg ${
                    selectedType === type ? 'bg-primary/20 text-primary border-primary/30' : 'border-white/10 text-white/40 hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rooms Grid */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <PremiumSpinner size="lg" text="Curating our finest suites..." />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-serif text-white/40">No suites match your search.</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRooms.map((room) => (
                <div key={room.id} className="group relative" data-testid="room-card">
                  {/* Image container */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl">
                    <Image 
                      src={room.roomImages?.[0]?.url || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=800'} 
                      alt={room.type} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                    />
                    {/* Gold price badge — top left */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-primary/20">
                        <span className="text-primary font-serif italic text-base">{formatPrice(room.price)}</span>
                        <span className="text-[9px] text-white/50 uppercase tracking-tighter ml-1">/ Night</span>
                      </div>
                    </div>
                    {/* Room type badge — top right */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                        <span className="text-[9px] uppercase tracking-widest text-white font-bold">{room.type}</span>
                      </div>
                    </div>
                    {/* Star rating — bottom left */}
                    <div className="absolute bottom-4 left-4 z-10 flex gap-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}
                    </div>
                    {/* Hover overlay — slides up */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 flex flex-col justify-end p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex gap-4 text-white/60">
                          <div className="flex items-center gap-1"><Users className="w-3 h-3" /><span className="text-[10px] uppercase tracking-wider">{room.capacity} Guests</span></div>
                          <div className="flex items-center gap-1"><Wind className="w-3 h-3" /><span className="text-[10px] uppercase tracking-wider">{room.size || '45'} m²</span></div>
                        </div>
                        <p className="text-white/70 text-xs font-light leading-relaxed line-clamp-2">
                          {room.description || "Experience the pinnacle of luxury with bespoke services and panoramic views."}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Link href={`/rooms/${room.id}`} className="flex-1">
                          <Button variant="outline" className="w-full border-white/30 text-white rounded-xl h-10 uppercase tracking-widest text-[9px] font-bold hover:bg-white/20 transition-all backdrop-blur-sm">
                            Details
                          </Button>
                        </Link>
                        <Link href={`/booking?room=${room.id}`} className="flex-1">
                          <Button className="w-full bg-gold-gradient text-white rounded-xl h-10 uppercase tracking-widest text-[9px] font-bold border-none shadow-luxury">
                            Reserve
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Below image info */}
                  <div className="pt-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-serif font-bold text-white group-hover:text-primary transition-colors duration-300">{room.type} Suite</h3>
                      <span className="text-primary font-serif italic text-sm">{formatPrice(room.price)}<span className="text-[9px] text-white/30 not-italic ml-1">/night</span></span>
                    </div>
                    <p className="text-xs text-white/40 font-light leading-relaxed line-clamp-1">
                      {room.description || "A sanctuary of refinement and curated luxury."}
                    </p>
                    <div className="flex items-center gap-4 pt-1">
                      <Wifi className="w-3.5 h-3.5 text-white/20" />
                      <Coffee className="w-3.5 h-3.5 text-white/20" />
                      <MapPin className="w-3.5 h-3.5 text-white/20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black/30 backdrop-blur-md border-t border-white/5">
        <div className="container mx-auto px-4 text-center space-y-8">
           <h2 className="text-4xl lg:text-5xl font-serif font-bold text-white">Need Assistance?</h2>
           <p className="text-white/50 max-w-xl mx-auto font-light">Our concierge team is available 24/7 to help you choose the perfect suite for your stay.</p>
           <Link href="/contact">
              <Button variant="outline" className="border-primary text-primary rounded-xl px-12 h-14 uppercase tracking-widest text-xs font-bold hover:bg-primary hover:text-white transition-all">
                Contact Concierge
              </Button>
           </Link>
        </div>
      </section>
    </div>
  )
}

