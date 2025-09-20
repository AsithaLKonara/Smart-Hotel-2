"use client"

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star, Heart, Eye, Wifi, Car, Utensils, Dumbbell, Waves, Sparkles, Users } from 'lucide-react'
import { PremiumButton } from './premium-button'

interface EnhancedRoomCardProps {
  room: {
    id: string
    name: string
    type: string
    price: number
    rating: number
    images: string[]
    amenities: string[]
    capacity: number
    description?: string
    isPopular?: boolean
    limitedOffer?: boolean
  }
  onSelect: (room: any) => void
  onFavorite?: (roomId: string) => void
}

const amenityIcons = {
  wifi: Wifi,
  parking: Car,
  restaurant: Utensils,
  gym: Dumbbell,
  pool: Waves,
  spa: Sparkles,
}

export function EnhancedRoomCard({ room, onSelect, onFavorite }: EnhancedRoomCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -8 }}
      className="group bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
    >
      {/* Image with Hover Effects */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src={room.images[0] || '/images/room-placeholder.jpg'}
          alt={room.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {room.isPopular && (
            <span className="px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full shadow-lg">
              Popular
            </span>
          )}
          {room.limitedOffer && (
            <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full shadow-lg">
              Limited Offer
            </span>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onFavorite?.(room.id)}
            className="p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
          >
            <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
          </button>
        </div>
        
        {/* 360° Tour Button */}
        <div className="absolute bottom-4 right-4">
          <button className="px-3 py-1 bg-black/50 text-white text-sm rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm">
            <Eye className="w-4 h-4 inline mr-1" />
            360° Tour
          </button>
        </div>
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold group-hover:text-amber-600 transition-colors">
            {room.name}
          </h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{room.rating || 4.8}</span>
          </div>
        </div>
        
        {/* Description */}
        {room.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {room.description}
          </p>
        )}
        
        {/* Amenities */}
        <div className="flex gap-2 mb-4">
          {room.amenities.slice(0, 4).map(amenity => {
            const Icon = amenityIcons[amenity as keyof typeof amenityIcons] || Wifi
            return (
              <div 
                key={amenity} 
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors group/amenity"
                title={amenity}
              >
                <Icon className="w-4 h-4 text-gray-600 group-hover/amenity:text-amber-600 transition-colors" />
              </div>
            )
          })}
          {room.amenities.length > 4 && (
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-xs text-gray-600">+{room.amenities.length - 4}</span>
            </div>
          )}
        </div>
        
        {/* Capacity */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Users className="w-4 h-4 mr-2" />
          <span>{room.capacity} Guest{room.capacity > 1 ? 's' : ''}</span>
        </div>
        
        {/* Pricing */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              ${room.price}
            </span>
            <span className="text-gray-600">/night</span>
          </div>
          <PremiumButton 
            variant="primary" 
            size="sm"
            onClick={() => onSelect(room)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            Book Now
          </PremiumButton>
        </div>
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star, Heart, Eye, Wifi, Car, Utensils, Dumbbell, Waves, Sparkles, Users } from 'lucide-react'
import { PremiumButton } from './premium-button'

interface EnhancedRoomCardProps {
  room: {
    id: string
    name: string
    type: string
    price: number
    rating: number
    images: string[]
    amenities: string[]
    capacity: number
    description?: string
    isPopular?: boolean
    limitedOffer?: boolean
  }
  onSelect: (room: any) => void
  onFavorite?: (roomId: string) => void
}

const amenityIcons = {
  wifi: Wifi,
  parking: Car,
  restaurant: Utensils,
  gym: Dumbbell,
  pool: Waves,
  spa: Sparkles,
}

export function EnhancedRoomCard({ room, onSelect, onFavorite }: EnhancedRoomCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -8 }}
      className="group bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
    >
      {/* Image with Hover Effects */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src={room.images[0] || '/images/room-placeholder.jpg'}
          alt={room.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {room.isPopular && (
            <span className="px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full shadow-lg">
              Popular
            </span>
          )}
          {room.limitedOffer && (
            <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full shadow-lg">
              Limited Offer
            </span>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onFavorite?.(room.id)}
            className="p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
          >
            <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
          </button>
        </div>
        
        {/* 360° Tour Button */}
        <div className="absolute bottom-4 right-4">
          <button className="px-3 py-1 bg-black/50 text-white text-sm rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm">
            <Eye className="w-4 h-4 inline mr-1" />
            360° Tour
          </button>
        </div>
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold group-hover:text-amber-600 transition-colors">
            {room.name}
          </h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{room.rating || 4.8}</span>
          </div>
        </div>
        
        {/* Description */}
        {room.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {room.description}
          </p>
        )}
        
        {/* Amenities */}
        <div className="flex gap-2 mb-4">
          {room.amenities.slice(0, 4).map(amenity => {
            const Icon = amenityIcons[amenity as keyof typeof amenityIcons] || Wifi
            return (
              <div 
                key={amenity} 
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors group/amenity"
                title={amenity}
              >
                <Icon className="w-4 h-4 text-gray-600 group-hover/amenity:text-amber-600 transition-colors" />
              </div>
            )
          })}
          {room.amenities.length > 4 && (
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-xs text-gray-600">+{room.amenities.length - 4}</span>
            </div>
          )}
        </div>
        
        {/* Capacity */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Users className="w-4 h-4 mr-2" />
          <span>{room.capacity} Guest{room.capacity > 1 ? 's' : ''}</span>
        </div>
        
        {/* Pricing */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              ${room.price}
            </span>
            <span className="text-gray-600">/night</span>
          </div>
          <PremiumButton 
            variant="primary" 
            size="sm"
            onClick={() => onSelect(room)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            Book Now
          </PremiumButton>
        </div>
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star, Heart, Eye, Wifi, Car, Utensils, Dumbbell, Waves, Sparkles, Users } from 'lucide-react'
import { PremiumButton } from './premium-button'

interface EnhancedRoomCardProps {
  room: {
    id: string
    name: string
    type: string
    price: number
    rating: number
    images: string[]
    amenities: string[]
    capacity: number
    description?: string
    isPopular?: boolean
    limitedOffer?: boolean
  }
  onSelect: (room: any) => void
  onFavorite?: (roomId: string) => void
}

const amenityIcons = {
  wifi: Wifi,
  parking: Car,
  restaurant: Utensils,
  gym: Dumbbell,
  pool: Waves,
  spa: Sparkles,
}

export function EnhancedRoomCard({ room, onSelect, onFavorite }: EnhancedRoomCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -8 }}
      className="group bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
    >
      {/* Image with Hover Effects */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src={room.images[0] || '/images/room-placeholder.jpg'}
          alt={room.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {room.isPopular && (
            <span className="px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full shadow-lg">
              Popular
            </span>
          )}
          {room.limitedOffer && (
            <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full shadow-lg">
              Limited Offer
            </span>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onFavorite?.(room.id)}
            className="p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
          >
            <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
          </button>
        </div>
        
        {/* 360° Tour Button */}
        <div className="absolute bottom-4 right-4">
          <button className="px-3 py-1 bg-black/50 text-white text-sm rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm">
            <Eye className="w-4 h-4 inline mr-1" />
            360° Tour
          </button>
        </div>
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold group-hover:text-amber-600 transition-colors">
            {room.name}
          </h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{room.rating || 4.8}</span>
          </div>
        </div>
        
        {/* Description */}
        {room.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {room.description}
          </p>
        )}
        
        {/* Amenities */}
        <div className="flex gap-2 mb-4">
          {room.amenities.slice(0, 4).map(amenity => {
            const Icon = amenityIcons[amenity as keyof typeof amenityIcons] || Wifi
            return (
              <div 
                key={amenity} 
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors group/amenity"
                title={amenity}
              >
                <Icon className="w-4 h-4 text-gray-600 group-hover/amenity:text-amber-600 transition-colors" />
              </div>
            )
          })}
          {room.amenities.length > 4 && (
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-xs text-gray-600">+{room.amenities.length - 4}</span>
            </div>
          )}
        </div>
        
        {/* Capacity */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Users className="w-4 h-4 mr-2" />
          <span>{room.capacity} Guest{room.capacity > 1 ? 's' : ''}</span>
        </div>
        
        {/* Pricing */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              ${room.price}
            </span>
            <span className="text-gray-600">/night</span>
          </div>
          <PremiumButton 
            variant="primary" 
            size="sm"
            onClick={() => onSelect(room)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            Book Now
          </PremiumButton>
        </div>
      </div>
    </motion.div>
  )
}
