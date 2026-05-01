"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Users, Star, Loader2, ChevronRight, MapPin, Wind, Wifi, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

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
    <div className="bg-white text-midnight">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden bg-midnight">
        <div className="absolute inset-0">
          <Image 
            src="https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=1920" 
            alt="Luxury Rooms" 
            fill 
            className="object-cover opacity-40" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-midnight/20 via-midnight/60 to-midnight" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 text-luxury uppercase tracking-[0.4em] text-xs font-bold">
              <div className="w-12 h-px bg-luxury" />
              <span>Unrivaled Comfort</span>
              <div className="w-12 h-px bg-luxury" />
            </div>
            <h1 className="text-6xl md:text-7xl font-serif font-bold text-white leading-tight">
              Our <span className="text-luxury italic">Suites</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-20 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by suite type..." 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none focus:ring-1 focus:ring-luxury transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {['all', 'Standard', 'Deluxe', 'Suite', 'Presidential'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-6 py-2 text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-all border ${
                    selectedType === type ? 'bg-midnight text-white border-midnight' : 'border-gray-200 text-gray-400 hover:border-luxury hover:text-luxury'
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
              <Loader2 className="w-10 h-10 animate-spin text-luxury" />
              <p className="text-xs uppercase tracking-widest font-bold text-gray-400">Curating our finest suites...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-serif text-gray-400">No suites match your search.</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filteredRooms.map((room) => (
                <div key={room.id} className="group">
                  <div className="relative aspect-[4/5] overflow-hidden mb-8 shadow-2xl">
                    <Image 
                      src={room.roomImages?.[0]?.url || 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=800'} 
                      alt={room.type} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                    />
                    <div className="absolute top-6 left-6">
                      <div className="bg-midnight/80 backdrop-blur-md px-4 py-2">
                        <span className="text-luxury font-serif italic text-lg">${room.price}</span>
                        <span className="text-[10px] text-white/50 uppercase tracking-tighter ml-1">/ Night</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                       <div className="flex gap-4 text-white/80 mb-4">
                          <div className="flex items-center gap-1"><Users className="w-3 h-3" /><span className="text-[10px] uppercase">{room.capacity} Guests</span></div>
                          <div className="flex items-center gap-1"><Wind className="w-3 h-3" /><span className="text-[10px] uppercase">{room.size || '45'} m²</span></div>
                       </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-serif font-bold text-midnight group-hover:text-luxury transition-colors">{room.type}</h3>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-luxury text-luxury" />)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 font-light leading-relaxed line-clamp-2">
                      {room.description || "Experience the pinnacle of luxury with bespoke services and panoramic views."}
                    </p>

                    <div className="flex items-center gap-4 pt-2">
                       <Wifi className="w-4 h-4 text-gray-300" />
                       <Coffee className="w-4 h-4 text-gray-300" />
                       <MapPin className="w-4 h-4 text-gray-300" />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Link href={`/rooms/${room.id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-midnight text-midnight rounded-none h-12 uppercase tracking-widest text-[10px] font-bold hover:bg-midnight hover:text-white transition-all">
                          Details
                        </Button>
                      </Link>
                      <Link href={`/booking?room=${room.id}`} className="flex-1">
                        <Button className="w-full bg-gold-gradient text-white rounded-none h-12 uppercase tracking-widest text-[10px] font-bold border-none shadow-luxury">
                          Reserve
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 text-center space-y-8">
           <h2 className="text-4xl lg:text-5xl font-serif font-bold text-midnight">Need Assistance?</h2>
           <p className="text-gray-500 max-w-xl mx-auto font-light">Our concierge team is available 24/7 to help you choose the perfect suite for your stay.</p>
           <Link href="/contact">
              <Button variant="outline" className="border-luxury text-luxury rounded-none px-12 h-14 uppercase tracking-widest text-xs font-bold hover:bg-luxury hover:text-white transition-all">
                Contact Concierge
              </Button>
           </Link>
        </div>
      </section>
    </div>
  )
}

