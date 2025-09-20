"use client"

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Heart, Users, Wifi, Car, Coffee, Utensils, Camera, Star } from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'
import { AmenityIcon } from './amenity-icon'

interface RoomImage {
  src: string
  alt: string
}

interface EnhancedRoomCardProps {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  images: RoomImage[]
  amenities: string[]
  maxGuests: number
  rating: number
  reviews: number
  isAvailable: boolean
  onBook: (roomId: string) => void
  onFavorite?: (roomId: string) => void
  on360Tour?: (roomId: string) => void
  className?: string
}

export function EnhancedRoomCard({
  id,
  name,
  description,
  price,
  originalPrice,
  images,
  amenities,
  maxGuests,
  rating,
  reviews,
  isAvailable,
  onBook,
  onFavorite,
  on360Tour,
  className = ''
}: EnhancedRoomCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleFavorite = () => {
    setIsFavorited(!isFavorited)
    onFavorite?.(id)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden">
        <motion.img
          key={currentImageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          src={images[currentImageIndex]?.src}
          alt={images[currentImageIndex]?.alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Discount Badge */}
        {discount > 0 && (
          <Badge className="absolute top-3 left-3 bg-red-500 text-white">
            -{discount}%
          </Badge>
        )}

        {/* Favorite Button */}
        <motion.button
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${
              isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`} 
          />
        </motion.button>

        {/* Image Navigation */}
        {images.length > 1 && (
          <div className={`absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && isHovered && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
            >
              ←
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
            >
              →
            </button>
          </>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {rating} ({reviews} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {amenities.slice(0, 4).map((amenity, index) => (
            <AmenityIcon key={index} amenity={amenity} size="sm" />
          ))}
          {amenities.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              +{amenities.length - 4} more
            </Badge>
          )}
        </div>

        {/* Guest Info */}
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
          <Users className="w-4 h-4" />
          <span>Up to {maxGuests} guests</span>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">
                ${price.toLocaleString()}
              </span>
              {originalPrice && (
                <span className="text-lg text-gray-500 line-through">
                  ${originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-600">per night</span>
          </div>
          
          <div className="flex gap-2">
            {on360Tour && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => on360Tour(id)}
                className="flex items-center gap-1"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">360°</span>
              </Button>
            )}
            <Button
              onClick={() => onBook(id)}
              disabled={!isAvailable}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isAvailable ? 'Book Now' : 'Unavailable'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
