"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useState } from "react"
import { Heart, Star, Users, Wifi, Car, Coffee } from "lucide-react"
import { PremiumButton } from "./premium-button"
import { cn } from "@/lib/utils"
import { motionVariants } from "@/lib/design-tokens"

interface Room {
  id: string
  number: string
  type: string
  price: number
  capacity: number
  amenities: string[]
  images: string[]
  description: string | null
  floor: number | null
  status: string
}

interface BookingCardProps {
  room: Room
  onSelect: (room: Room) => void
  onFavorite?: (roomId: string) => void
  isFavorite?: boolean
  className?: string
}

const amenityIcons = {
  wifi: Wifi,
  parking: Car,
  breakfast: Coffee,
}

export function BookingCard({ 
  room, 
  onSelect, 
  onFavorite, 
  isFavorite = false, 
  className 
}: BookingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleImageChange = (direction: 'next' | 'prev') => {
    const totalImages = room.images.length
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages)
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        {room.images.length > 0 ? (
          <>
            <Image
              src={room.images[currentImageIndex]}
              alt={`${room.type} Room`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            {/* Image Navigation */}
            {room.images.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg"
                  onClick={() => handleImageChange('prev')}
                >
                  ←
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg"
                  onClick={() => handleImageChange('next')}
                >
                  →
                </motion.button>
              </>
            )}

            {/* Image Indicators */}
            {room.images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {room.images.map((_, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === currentImageIndex ? "bg-white" : "bg-white/50"
                    )}
                    animate={{
                      scale: index === currentImageIndex ? 1.2 : 1,
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <span className="text-amber-600 text-sm font-medium">No Image</span>
          </div>
        )}

        {/* Favorite Button */}
        {onFavorite && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered ? 1 : 0.7, scale: isHovered ? 1 : 0.9 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg"
            onClick={() => onFavorite(room.id)}
          >
            <Heart 
              className={cn(
                "w-4 h-4 transition-colors",
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
              )} 
            />
          </motion.button>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            room.status === 'AVAILABLE' 
              ? "bg-green-100 text-green-800" 
              : room.status === 'OCCUPIED'
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          )}>
            {room.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Room Type & Floor */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-amber-600 transition-colors">
              {room.type}
            </h3>
            <p className="text-sm text-gray-500">Floor {room.floor} • Room {room.number}</p>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium text-gray-700">4.8</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {room.description}
        </p>

        {/* Amenities */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1 text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-sm">{room.capacity} guests</span>
          </div>
          
          {room.amenities.slice(0, 3).map((amenity) => {
            const IconComponent = amenityIcons[amenity.toLowerCase() as keyof typeof amenityIcons]
            if (!IconComponent) return null
            
            return (
              <div key={amenity} className="flex items-center gap-1 text-gray-600">
                <IconComponent className="w-4 h-4" />
                <span className="text-sm capitalize">{amenity}</span>
              </div>
            )
          })}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Per night</div>
            <div className="text-xl font-bold text-gray-900">
              {formatPrice(room.price)}
            </div>
            <div className="text-xs text-gray-500">+ taxes & fees</div>
          </div>
          
          <PremiumButton
            onClick={() => onSelect(room)}
            variant="primary"
            size="md"
            className="px-6"
          >
            Select Room
          </PremiumButton>
        </div>
      </div>
    </motion.div>
  )
}

