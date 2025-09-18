"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Filter, Users, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/navigation'

export default function RoomsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 1000])

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || room.type.toLowerCase() === selectedType
    const matchesPrice = room.price >= priceRange[0] && room.price <= priceRange[1]
    
    return matchesSearch && matchesType && matchesPrice
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRooms.map((room) => (
              <Card key={room.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
                <div className="relative h-64">
                  <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-4 left-4 bg-luxury-600">
                    {room.type}
                  </Badge>
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{room.rating}</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{room.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {room.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{room.capacity} Guests</span>
                      </div>
                      <span>{room.size}m²</span>
                    </div>
                    <div className="text-2xl font-bold text-primary-600">
                      ${room.price}
                      <span className="text-sm font-normal text-gray-500">/night</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.amenities.slice(0, 3).map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {room.amenities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{room.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>

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
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No rooms found</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Try adjusting your search criteria or filters
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

const rooms = [
  {
    id: 1,
    name: "Deluxe Suite",
    type: "Suite",
    description: "Spacious suite with panoramic city views, separate living area, and premium amenities. Perfect for families or business travelers seeking luxury and comfort.",
    price: 299,
    capacity: 4,
    size: 65,
    rating: 4.8,
    image: "/images/room-deluxe.jpg",
    amenities: ["King Bed", "City View", "Balcony", "Mini Bar", "Free WiFi", "Room Service"]
  },
  {
    id: 2,
    name: "Executive Room",
    type: "Deluxe",
    description: "Modern executive room with business facilities, ergonomic workspace, and city skyline views. Ideal for business travelers.",
    price: 199,
    capacity: 2,
    size: 45,
    rating: 4.6,
    image: "/images/room-executive.jpg",
    amenities: ["Queen Bed", "Work Desk", "City View", "Free WiFi", "Coffee Maker"]
  },
  {
    id: 3,
    name: "Presidential Suite",
    type: "Presidential",
    description: "Ultimate luxury experience with panoramic views, private terrace, and exclusive butler service. The epitome of luxury accommodation.",
    price: 599,
    capacity: 6,
    size: 120,
    rating: 4.9,
    image: "/images/room-presidential.jpg",
    amenities: ["King Bed", "Terrace", "Butler Service", "Jacuzzi", "Kitchen", "Living Room"]
  },
  {
    id: 4,
    name: "Standard Room",
    type: "Standard",
    description: "Comfortable and well-appointed room with all essential amenities. Perfect for budget-conscious travelers who don't compromise on quality.",
    price: 129,
    capacity: 2,
    size: 35,
    rating: 4.4,
    image: "/images/room-standard.jpg",
    amenities: ["Queen Bed", "Free WiFi", "TV", "Private Bathroom"]
  },
  {
    id: 5,
    name: "Family Suite",
    type: "Suite",
    description: "Spacious family suite with connecting rooms, perfect for families with children. Features a separate living area and multiple bathrooms.",
    price: 399,
    capacity: 6,
    size: 85,
    rating: 4.7,
    image: "/images/room-family.jpg",
    amenities: ["2 Bedrooms", "Living Room", "Kitchen", "Free WiFi", "Play Area"]
  },
  {
    id: 6,
    name: "Garden View Room",
    type: "Deluxe",
    description: "Peaceful room overlooking our beautiful gardens. Perfect for those seeking tranquility and natural beauty during their stay.",
    price: 179,
    capacity: 2,
    size: 40,
    rating: 4.5,
    image: "/images/room-garden.jpg",
    amenities: ["Queen Bed", "Garden View", "Balcony", "Free WiFi", "Coffee Maker"]
  }
] 