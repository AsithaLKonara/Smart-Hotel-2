"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Filter, Users, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Navigation is handled by layout.tsx

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
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch rooms from API
  useEffect(() => {
    async function fetchRooms() {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/rooms')
        const data = await response.json()
        
        // Handle different response formats
        if (!response.ok) {
          // API returned an error response
          const errorMessage = data?.message || data?.error || 'Failed to fetch rooms'
          throw new Error(errorMessage)
        }
        
        // Handle both array and object with rooms property
        if (Array.isArray(data)) {
          setRooms(data)
        } else if (data && Array.isArray(data.rooms)) {
          setRooms(data.rooms)
        } else if (data && data.error) {
          throw new Error(data.message || data.error)
        } else {
          // Empty response or unexpected format
          setRooms([])
        }
      } catch (err) {
        console.error('Error fetching rooms:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load rooms. Please try again later.'
        setError(errorMessage)
        // Fallback to empty array
        setRooms([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchRooms()
  }, [])

  const filteredRooms = rooms.filter(room => {
    const roomName = room.number || room.type || ''
    const roomDescription = room.description || ''
    const matchesSearch = roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roomDescription.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || room.type.toLowerCase() === selectedType.toLowerCase()
    const matchesPrice = room.price >= priceRange[0] && room.price <= priceRange[1]
    
    return matchesSearch && matchesType && matchesPrice
  })

  // Calculate average rating for a room
  const getAverageRating = (room: Room): number => {
    if (!room.reviews || !Array.isArray(room.reviews) || room.reviews.length === 0) {
      return 0
    }
    const sum = room.reviews.reduce((acc, review) => acc + (review.rating || 0), 0)
    return sum / room.reviews.length
  }

  // Get room image with type-specific placeholders
  const getRoomImage = (room: Room): string => {
    if (room.roomImages && room.roomImages.length > 0) {
      const mainImage = room.roomImages.find(img => img.isMain)
      if (mainImage) return mainImage.url
      return room.roomImages[0].url
    }
    if (room.images && Array.isArray(room.images) && room.images.length > 0) {
      return room.images[0]
    }
    // Use type-specific placeholder images
    const typeLower = room.type.toLowerCase()
    if (typeLower.includes('standard')) {
      return '/images/hotel/room-standard.jpg'
    } else if (typeLower.includes('deluxe')) {
      return '/images/hotel/room-deluxe.jpg'
    } else if (typeLower.includes('suite') || typeLower.includes('presidential')) {
      return '/images/hotel/room-suite.jpg'
    } else if (typeLower.includes('luxury')) {
      return '/images/hotel/room-luxury.jpg'
    }
    return '/images/room-placeholder.jpg'
  }

  // Get amenities array
  const getAmenities = (room: Room): string[] => {
    if (Array.isArray(room.amenities)) {
      return room.amenities
    }
    return []
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Our Rooms</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Discover our carefully designed rooms and suites, each offering comfort, 
            luxury, and exceptional amenities for your perfect stay.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Room Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="presidential">Presidential</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Price:</span>
              <input
                type="range"
                min="0"
                max="1000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="w-32"
              />
              <span className="text-sm font-medium">${priceRange[1]}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Rooms Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              {filteredRooms.length} Room{filteredRooms.length !== 1 ? 's' : ''} Available
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Sort by:</span>
              <select className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Name: A to Z</option>
                <option>Name: Z to A</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Loading rooms...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Error loading rooms</h3>
              <p className="text-gray-600 dark:text-gray-300">{error}</p>
            </div>
          ) : (
            <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredRooms.map((room) => {
                  const rating = getAverageRating(room)
                  const roomImage = getRoomImage(room)
                  const amenities = getAmenities(room)
                  const roomName = room.number ? `Room ${room.number}` : room.type
                  
                  return (
              <Card key={room.id} data-testid="room-card" className="overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="relative h-64">
                  <Image
                          src={roomImage}
                          alt={roomName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized={roomImage.startsWith('https://images.unsplash.com')}
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement
                      target.src = '/images/room-placeholder.jpg'
                    }}
                  />
                  <Badge className="absolute top-4 left-4 bg-luxury-600">
                    {room.type}
                  </Badge>
                        {rating > 0 && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                  </div>
                        )}
                </div>
                
                <div className="p-6">
                        <h3 className="text-xl font-bold mb-2">{roomName}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                          {room.description || 'Experience luxury and comfort in our beautifully designed accommodations.'}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{room.capacity} Guests</span>
                      </div>
                            {room.size && <span>{room.size}m²</span>}
                    </div>
                    <div className="text-2xl font-bold text-primary-600">
                      ${room.price}
                      <span className="text-sm font-normal text-gray-500">/night</span>
                    </div>
                  </div>

                        {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                            {amenities.slice(0, 3).map((amenity, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                            {amenities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                                +{amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                        )}

                  <div className="flex gap-2">
                    <Link href={`/rooms/${room.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/booking?room=${room.id}`} className="flex-1">
                      <Button className="w-full btn-primary">
                        Book Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
                  )
                })}
          </div>

              {filteredRooms.length === 0 && !isLoading && !error && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {rooms.length === 0 ? 'No rooms available' : 'No rooms match your search'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {rooms.length === 0 
                  ? 'Please check back later or contact us for availability.'
                  : 'Try adjusting your search criteria or filters'}
              </p>
            </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
