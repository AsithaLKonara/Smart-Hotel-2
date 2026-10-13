"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, Filter, Users, Star, ChevronRight, MapPin, Wind, Wifi, Coffee, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { motion, AnimatePresence } from 'framer-motion'

interface Room {
  id: string
  number: string
  type: string
  price: number
  capacity: number
  size: number | null
  description: string | null
  amenities: string[] | any
  roomImages?: Array<{ imageUrl: string; isMain?: boolean }>
  images?: string[]
  reviews?: Array<{ rating: number }>
  property?: { id: string; name: string; city: string; code: string }
  isAvailable?: boolean
}

interface Property {
  id: string
  name: string
  code: string
  city: string
}

const FilterSection = ({ title, defaultOpen = false, children }: { title: string, defaultOpen?: boolean, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/5 py-6 first:pt-0 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between group"
      >
        <h3 className="text-[10px] uppercase tracking-widest text-white/50 font-bold group-hover:text-white transition-colors">{title}</h3>
        <ChevronRight className={`w-3 h-3 text-white/30 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const PRICE_BRACKETS = [
  { id: '0-150', label: 'Under $150' },
  { id: '150-300', label: '$150 - $300' },
  { id: '300-500', label: '$300 - $500' },
  { id: '500+', label: '$500+' }
]

export default function RoomsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [selectedPrices, setSelectedPrices] = useState<string[]>([])
  
  const [rooms, setRooms] = useState<Room[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const roomsPerPage = 6

  // On mount, check if property query param exists to pre-filter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const propertyParam = searchParams.get('property')
    if (propertyParam && propertyParam !== 'all') {
      setSelectedLocations([propertyParam])
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const [roomsRes, propsRes] = await Promise.all([
          fetch('/api/rooms', { cache: 'no-store' }),
          fetch('/api/properties')
        ])
        
        const data = await roomsRes.json()
        const propsData = await propsRes.json()

        setProperties(Array.isArray(propsData) ? propsData : [])

        let fetchedRooms = []
        if (Array.isArray(data)) fetchedRooms = data
        else if (data?.rooms) fetchedRooms = data.rooms
        
        const mappedRooms = fetchedRooms.map((r: any) => ({
          ...r,
          type: r.roomType?.name || 'Standard',
          price: r.roomType?.baseRate || 0,
          capacity: r.roomType?.capacity || 2,
          description: r.roomType?.description || r.description,
          amenities: r.roomType?.amenities || r.amenities || [],
          images: r.roomType?.images || [],
          property: r.roomType?.property || r.property || null,
          isAvailable: r.isAvailable ?? (r.status === 'AVAILABLE')
        }))
        setRooms(mappedRooms)
      } catch (err) {
        setError('Failed to load rooms')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const uniqueRoomTypes = useMemo(() => Array.from(new Set(rooms.map(r => r.type))).filter(Boolean) as string[], [rooms])
  
  const uniqueAmenities = useMemo(() => {
    const allAmenities = new Set<string>()
    rooms.forEach(r => {
      if (Array.isArray(r.amenities)) {
        r.amenities.forEach(a => typeof a === 'string' && allAmenities.add(a))
      } else if (typeof r.amenities === 'string') {
        try {
          const parsed = JSON.parse(r.amenities)
          if (Array.isArray(parsed)) parsed.forEach(a => typeof a === 'string' && allAmenities.add(a))
        } catch (e) {
          allAmenities.add(r.amenities)
        }
      }
    })
    return Array.from(allAmenities).sort()
  }, [rooms])

  const checkPrice = (price: number, brackets: string[]) => {
    if (brackets.length === 0) return true
    return brackets.some(bracket => {
      if (bracket === '0-150') return price < 150
      if (bracket === '150-300') return price >= 150 && price <= 300
      if (bracket === '300-500') return price > 300 && price <= 500
      if (bracket === '500+') return price > 500
      return false
    })
  }

  const checkAmenities = (roomAmenitiesRaw: any, selected: string[]) => {
    if (selected.length === 0) return true
    let roomAmenities: string[] = []
    if (Array.isArray(roomAmenitiesRaw)) {
      roomAmenities = roomAmenitiesRaw
    } else if (typeof roomAmenitiesRaw === 'string') {
      try {
        const parsed = JSON.parse(roomAmenitiesRaw)
        if (Array.isArray(parsed)) roomAmenities = parsed
      } catch (e) {
        roomAmenities = [roomAmenitiesRaw]
      }
    }
    return selected.every(a => roomAmenities.includes(a))
  }

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = (room.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (room.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(room.type)
      const matchesLocation = selectedLocations.length === 0 || (room.property?.id && selectedLocations.includes(room.property.id))
      const matchesPrice = checkPrice(room.price, selectedPrices)
      const matchesAmenities = checkAmenities(room.amenities, selectedAmenities)
      
      return matchesSearch && matchesType && matchesLocation && matchesPrice && matchesAmenities
    })
  }, [rooms, searchTerm, selectedTypes, selectedLocations, selectedPrices, selectedAmenities])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedTypes, selectedLocations, selectedPrices, selectedAmenities])

  const indexOfLastRoom = currentPage * roomsPerPage
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage
  const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom)
  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage)

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter(prev => prev.includes(item) ? prev.filter(t => t !== item) : [...prev, item])
  }

  return (
    <div className="bg-transparent text-white">
      {/* Contextual Hero */}
      <section className="relative min-h-[400px] flex items-center justify-center overflow-hidden border-b border-white/5">
        <Image 
          src="/images/hotel/hotel-hero-2.jpg" 
          alt="Luxury Suites" 
          fill 
          className="object-cover absolute inset-0 -z-20 scale-105 transform" 
          priority 
        />
        <div className="absolute inset-0 bg-black/60 -z-10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent -z-10" />
        
        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center pt-32 pb-16">
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-center space-x-3 text-primary uppercase tracking-[0.4em] text-xs font-bold">
              <div className="w-12 h-px bg-primary" />
              <span>Unrivaled Comfort</span>
              <div className="w-12 h-px bg-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-white leading-tight">
              Our <span className="text-primary italic">Directory</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-12 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            
            {/* Flat Sidebar */}
            <div className="lg:col-span-1 space-y-2">
              <div className="sticky top-24 pr-4 h-[calc(100vh-6rem)] overflow-y-auto scrollbar-none">
                
                <FilterSection title="Search" defaultOpen={true}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                      type="text" 
                      placeholder="Keywords..." 
                      className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 text-white placeholder:text-white/30 focus:ring-1 focus:ring-primary transition-all text-xs rounded-xl"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </FilterSection>

                {properties.length > 0 && (
                  <FilterSection title="Location" defaultOpen={true}>
                    <div className="space-y-3">
                      {properties.map(p => (
                        <label key={p.id} className="flex items-center space-x-3 cursor-pointer group">
                          <input type="checkbox" className="sr-only" checked={selectedLocations.includes(p.id)} onChange={() => toggleArrayItem(setSelectedLocations, p.id)} />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedLocations.includes(p.id) ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-primary/50'}`}>
                            {selectedLocations.includes(p.id) && <CheckCircle2 className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span className="text-xs text-white/70 group-hover:text-white transition-colors">{p.city} - {p.name}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>
                )}

                {uniqueRoomTypes.length > 0 && (
                  <FilterSection title="Suite Types" defaultOpen={true}>
                    <div className="space-y-3">
                      {uniqueRoomTypes.map((type) => (
                        <label key={type} className="flex items-center space-x-3 cursor-pointer group">
                          <input type="checkbox" className="sr-only" checked={selectedTypes.includes(type)} onChange={() => toggleArrayItem(setSelectedTypes, type)} />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedTypes.includes(type) ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-primary/50'}`}>
                            {selectedTypes.includes(type) && <CheckCircle2 className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span className="text-xs text-white/70 group-hover:text-white transition-colors">{type}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>
                )}
                
                <FilterSection title="Price Range">
                  <div className="space-y-3">
                    {PRICE_BRACKETS.map((bracket) => (
                      <label key={bracket.id} className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" className="sr-only" checked={selectedPrices.includes(bracket.id)} onChange={() => toggleArrayItem(setSelectedPrices, bracket.id)} />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedPrices.includes(bracket.id) ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-primary/50'}`}>
                          {selectedPrices.includes(bracket.id) && <CheckCircle2 className="w-2.5 h-2.5 text-black" />}
                        </div>
                        <span className="text-xs text-white/70 group-hover:text-white transition-colors">{bracket.label}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                {uniqueAmenities.length > 0 && (
                  <FilterSection title="Facilities">
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                      {uniqueAmenities.map((amenity) => (
                        <label key={amenity} className="flex items-center space-x-3 cursor-pointer group">
                          <input type="checkbox" className="sr-only" checked={selectedAmenities.includes(amenity)} onChange={() => toggleArrayItem(setSelectedAmenities, amenity)} />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedAmenities.includes(amenity) ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-primary/50'}`}>
                            {selectedAmenities.includes(amenity) && <CheckCircle2 className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span className="text-xs text-white/70 group-hover:text-white transition-colors">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>
                )}

              </div>
            </div>

            {/* Rooms Grid */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <PremiumSpinner size="lg" text="Curating our finest suites..." />
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <h3 className="text-2xl font-serif text-white/40">{error}</h3>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-20 border border-white/5 bg-black/20 rounded-3xl">
                  <h3 className="text-2xl font-serif text-white/40">No suites match your criteria.</h3>
                  <Button variant="link" onClick={() => {
                    setSearchTerm(''); setSelectedTypes([]); setSelectedLocations([]); setSelectedPrices([]); setSelectedAmenities([]);
                  }} className="text-primary mt-4">
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {currentRooms.map((room) => (
                        <motion.div 
                          key={room.id} 
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                          className="group relative flex flex-col" 
                          data-testid="room-card"
                        >
                          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl bg-black/20 border border-white/5">
                            <Image 
                              src={room.roomImages?.[0]?.imageUrl || room.images?.[0] || '/images/hotel/hotel-hero-2.jpg'} 
                              alt={room.type} 
                              fill 
                              className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                            />
                            
                            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                              <div className={`backdrop-blur-md px-3 py-1.5 rounded-lg border flex items-center gap-2 w-fit shadow-lg ${room.isAvailable ? 'bg-black/60 border-green-500/30' : 'bg-black/60 border-red-500/30'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${room.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className={`text-[9px] uppercase tracking-widest font-bold ${room.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                                  {room.isAvailable ? 'Available' : 'Taken'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-6 space-y-4">
                                <Link href={`/rooms/${room.id}`} className="w-full">
                                  <Button variant="outline" className="w-full border-white/30 text-white rounded-lg h-12 uppercase tracking-widest text-[10px] font-bold hover:bg-white/20 transition-all">
                                    Details
                                  </Button>
                                </Link>
                                <Link href={room.isAvailable ? `/booking?roomType=${room.type}&property=${room.property?.id || 'all'}` : '#'} className="w-full" onClick={(e) => !room.isAvailable && e.preventDefault()}>
                                  <Button className={`w-full rounded-lg h-12 uppercase tracking-widest text-[10px] font-bold border-none transition-all ${room.isAvailable ? 'bg-white text-black hover:bg-primary hover:text-black' : 'bg-white/10 text-white/30 cursor-not-allowed'}`} disabled={!room.isAvailable}>
                                    Reserve
                                  </Button>
                                </Link>
                            </div>
                          </div>
                          
                          <div className="pt-4 flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="text-lg font-serif font-bold text-white group-hover:text-primary transition-colors duration-300">
                                {room.type} <span className="text-xs font-sans font-normal text-white/40">- {room.number}</span>
                              </h3>
                              <div className="text-right pl-2">
                                <span className="text-white font-serif text-lg">{formatPrice(room.price)}</span>
                                <span className="text-[10px] text-white/50 uppercase tracking-tighter ml-1">/ Night</span>
                              </div>
                            </div>
                            
                            {room.property && (
                              <div className="text-xs text-white/60 mb-4 font-light">
                                {room.property.name}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-auto pt-4">
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}
                              </div>
                              
                              <div className="flex items-center gap-3 text-white/40">
                                <Wifi className="w-4 h-4" />
                                <Coffee className="w-4 h-4" />
                                <Wind className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 pt-8 border-t border-white/5 mt-8">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="border-white/10 text-white hover:bg-white/10 h-10 w-10 rounded-xl"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-black' : 'border border-white/10 text-white hover:bg-white/10'}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="border-white/10 text-white hover:bg-white/10 h-10 w-10 rounded-xl"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
