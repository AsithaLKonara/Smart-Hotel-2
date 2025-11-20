"use client"

import { memo, useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
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

export const EnhancedRoomCard = memo(function EnhancedRoomCard({
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

  // Memoize price calculation
  const displayPrice = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price)
  }, [price])

  const discount = useMemo(() => {
    if (!originalPrice || originalPrice <= price) return null
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }, [originalPrice, price])

  // Memoize amenities display
  const displayedAmenities = useMemo(() => {
    return amenities.slice(0, 4)
  }, [amenities])

  // Memoize callbacks
  const handleBook = useCallback(() => {
    onBook(id)
  }, [id, onBook])

  const handleFavorite = useCallback(() => {
    setIsFavorited(prev => !prev)
    onFavorite?.(id)
  }, [id, onFavorite])

  const handle360Tour = useCallback(() => {
    on360Tour?.(id)
  }, [id, on360Tour])

  const handleImageChange = useCallback((index: number) => {
    setCurrentImageIndex(index)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}
    >
      {/* Image Section */}
      <div className="relative h-64 bg-gray-200 dark:bg-gray-700">
        {images.length > 0 ? (
          <>
            <Image
              src={images[currentImageIndex]?.src}
              alt={images[currentImageIndex]?.alt || name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageChange(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image available
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {discount && (
            <Badge className="bg-red-500 text-white">
              -{discount}%
            </Badge>
          )}
          {!isAvailable && (
            <Badge variant="secondary">Unavailable</Badge>
          )}
        </div>

        {/* Favorite Button */}
        {onFavorite && (
          <button
            onClick={handleFavorite}
            className="absolute top-2 left-2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </button>
        )}

        {/* 360 Tour Button */}
        {on360Tour && (
          <button
            onClick={handle360Tour}
            className="absolute bottom-2 left-2 px-3 py-1 bg-white/90 dark:bg-gray-800/90 rounded-full text-sm font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
          >
            <Camera className="w-4 h-4" />
            360° Tour
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium">{rating}</span>
            <span className="text-sm text-gray-500">({reviews})</span>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {description}
        </p>

        {/* Amenities */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>{maxGuests}</span>
          </div>
          {displayedAmenities.map((amenity, index) => (
            <AmenityIcon key={index} amenity={amenity} size="sm" />
          ))}
        </div>

        {/* Price and Book Button */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
              {displayPrice}
            </div>
            {originalPrice && originalPrice > price && (
              <div className="text-sm text-gray-500 line-through">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(originalPrice)}
              </div>
            )}
            <div className="text-xs text-gray-500">per night</div>
          </div>
          <Button
            onClick={handleBook}
            disabled={!isAvailable}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isAvailable ? 'Book Now' : 'Unavailable'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.id === nextProps.id &&
    prevProps.price === nextProps.price &&
    prevProps.isAvailable === nextProps.isAvailable &&
    prevProps.rating === nextProps.rating &&
    prevProps.reviews === nextProps.reviews &&
    prevProps.images.length === nextProps.images.length &&
    prevProps.amenities.length === nextProps.amenities.length
  )
})

