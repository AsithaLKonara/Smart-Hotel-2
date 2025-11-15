"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FallbackImage } from '@/components/ui/fallback-image'
// Navigation is handled by layout.tsx

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedImage, setSelectedImage] = useState<any>(null)

  const filteredImages = selectedCategory === 'all' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory)

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'rooms', name: 'Rooms' },
    { id: 'lobby', name: 'Lobby' },
    { id: 'restaurant', name: 'Restaurant' },
    { id: 'pool', name: 'Pool & Spa' },
    { id: 'events', name: 'Events' },
    { id: 'exterior', name: 'Exterior' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Hotel Gallery</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Explore our beautiful spaces, luxurious rooms, and world-class amenities 
            through our curated collection of images.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter by:</span>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="text-sm"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-lg cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => setSelectedImage(image)}
              >
                <FallbackImage
                  src={image.url}
                  fallbackSrc={image.fallback || "/images/hotel/hotel-lobby.jpg"}
                  alt={image.title}
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-end">
                  <div className="p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-semibold text-lg">{image.title}</h3>
                    <p className="text-sm opacity-90">{image.description}</p>
                    <Badge className="mt-2 bg-white/20 text-white border-white/30">
                      {image.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Filter className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No images found</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Try selecting a different category
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </Button>
            <FallbackImage
              src={selectedImage.url}
              fallbackSrc={selectedImage.fallback || "/images/hotel/hotel-lobby.jpg"}
              alt={selectedImage.title}
              width={800}
              height={600}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h3 className="text-xl font-semibold mb-2">{selectedImage.title}</h3>
              <p className="text-sm opacity-90">{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const galleryImages = [
  {
    id: 1,
    title: "Luxury Suite",
    description: "Spacious suite with panoramic city views",
    category: "rooms",
    url: "/images/hotel/room-suite.jpg",
    fallback: "/images/hotel/room-luxury.jpg"
  },
  {
    id: 2,
    title: "Hotel Lobby",
    description: "Elegant lobby with modern design",
    category: "lobby",
    url: "/images/hotel/hotel-lobby.jpg",
    fallback: "/images/hotel/hotel-exterior.jpg"
  },
  {
    id: 3,
    title: "Fine Dining Restaurant",
    description: "World-class dining experience",
    category: "restaurant",
    url: "/images/hotel/hotel-restaurant.jpg",
    fallback: "/images/hotel/hotel-bar.jpg"
  },
  {
    id: 4,
    title: "Infinity Pool",
    description: "Relaxing pool with city skyline",
    category: "pool",
    url: "/images/hotel/hotel-pool.jpg",
    fallback: "/images/hotel/hotel-spa.jpg"
  },
  {
    id: 5,
    title: "Wedding Venue",
    description: "Perfect setting for special events",
    category: "events",
    url: "/images/hotel/hotel-view.jpg",
    fallback: "/images/hotel/hotel-garden.jpg"
  },
  {
    id: 6,
    title: "Hotel Exterior",
    description: "Stunning architectural design",
    category: "exterior",
    url: "/images/hotel/hotel-exterior.jpg",
    fallback: "/images/hotel/hotel-lobby.jpg"
  },
  {
    id: 7,
    title: "Deluxe Room",
    description: "Comfortable and modern room design",
    category: "rooms",
    url: "/images/hotel/room-deluxe.jpg",
    fallback: "/images/hotel/room-standard.jpg"
  },
  {
    id: 8,
    title: "Spa Center",
    description: "Relaxation and wellness facilities",
    category: "pool",
    url: "/images/hotel/hotel-spa.jpg",
    fallback: "/images/hotel/hotel-pool.jpg"
  },
  {
    id: 9,
    title: "Conference Room",
    description: "Professional meeting spaces",
    category: "events",
    url: "/images/hotel/hotel-view.jpg",
    fallback: "/images/hotel/hotel-lobby.jpg"
  },
  {
    id: 10,
    title: "Garden View",
    description: "Peaceful garden surroundings",
    category: "exterior",
    url: "/images/hotel/hotel-garden.jpg",
    fallback: "/images/hotel/hotel-exterior.jpg"
  },
  {
    id: 11,
    title: "Executive Lounge",
    description: "Exclusive lounge area for guests",
    category: "lobby",
    url: "/images/hotel/hotel-lobby.jpg",
    fallback: "/images/hotel/hotel-bar.jpg"
  },
  {
    id: 12,
    title: "Wine Bar",
    description: "Sophisticated wine and cocktail bar",
    category: "restaurant",
    url: "/images/hotel/hotel-bar.jpg",
    fallback: "/images/hotel/hotel-restaurant.jpg"
  }
] 