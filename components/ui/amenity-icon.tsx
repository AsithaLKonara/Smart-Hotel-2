"use client"

import { Wifi, Car, Utensils, Dumbbell, Waves, Sparkles, Coffee, Tv, Droplets, Wind } from 'lucide-react'

interface AmenityIconProps {
  amenity: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const amenityMap = {
  wifi: { icon: Wifi, label: 'Free WiFi' },
  parking: { icon: Car, label: 'Free Parking' },
  restaurant: { icon: Utensils, label: 'Restaurant' },
  gym: { icon: Dumbbell, label: 'Fitness Center' },
  pool: { icon: Waves, label: 'Swimming Pool' },
  spa: { icon: Sparkles, label: 'Spa & Wellness' },
  coffee: { icon: Coffee, label: 'Coffee Shop' },
  tv: { icon: Tv, label: 'Smart TV' },
  shower: { icon: Droplets, label: 'Rain Shower' },
  ac: { icon: Wind, label: 'Air Conditioning' },
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function AmenityIcon({ amenity, size = 'md', className = '' }: AmenityIconProps) {
  const amenityData = amenityMap[amenity.toLowerCase() as keyof typeof amenityMap] || { icon: Wifi, label: amenity }
  const Icon = amenityData.icon
  
  return (
    <div 
      className={`p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors group cursor-help ${className}`}
      title={amenityData.label}
    >
      <Icon className={`${sizeClasses[size]} text-gray-600 group-hover:text-amber-600 transition-colors`} />
    </div>
  )
}

export function AmenityIconList({ 
  amenities, 
  maxItems = 4, 
  size = 'md' 
}: { 
  amenities: string[]
  maxItems?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const visibleAmenities = amenities.slice(0, maxItems)
  const remainingCount = amenities.length - maxItems

  return (
    <div className="flex gap-2 flex-wrap">
      {visibleAmenities.map(amenity => (
        <AmenityIcon key={amenity} amenity={amenity} size={size} />
      ))}
      {remainingCount > 0 && (
        <div className="p-2 bg-gray-100 rounded-lg">
          <span className="text-xs text-gray-600 font-medium">+{remainingCount}</span>
        </div>
      )}
    </div>
  )
}

import { Wifi, Car, Utensils, Dumbbell, Waves, Sparkles, Coffee, Tv, Droplets, Wind } from 'lucide-react'

interface AmenityIconProps {
  amenity: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const amenityMap = {
  wifi: { icon: Wifi, label: 'Free WiFi' },
  parking: { icon: Car, label: 'Free Parking' },
  restaurant: { icon: Utensils, label: 'Restaurant' },
  gym: { icon: Dumbbell, label: 'Fitness Center' },
  pool: { icon: Waves, label: 'Swimming Pool' },
  spa: { icon: Sparkles, label: 'Spa & Wellness' },
  coffee: { icon: Coffee, label: 'Coffee Shop' },
  tv: { icon: Tv, label: 'Smart TV' },
  shower: { icon: Droplets, label: 'Rain Shower' },
  ac: { icon: Wind, label: 'Air Conditioning' },
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function AmenityIcon({ amenity, size = 'md', className = '' }: AmenityIconProps) {
  const amenityData = amenityMap[amenity.toLowerCase() as keyof typeof amenityMap] || { icon: Wifi, label: amenity }
  const Icon = amenityData.icon
  
  return (
    <div 
      className={`p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors group cursor-help ${className}`}
      title={amenityData.label}
    >
      <Icon className={`${sizeClasses[size]} text-gray-600 group-hover:text-amber-600 transition-colors`} />
    </div>
  )
}

export function AmenityIconList({ 
  amenities, 
  maxItems = 4, 
  size = 'md' 
}: { 
  amenities: string[]
  maxItems?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const visibleAmenities = amenities.slice(0, maxItems)
  const remainingCount = amenities.length - maxItems

  return (
    <div className="flex gap-2 flex-wrap">
      {visibleAmenities.map(amenity => (
        <AmenityIcon key={amenity} amenity={amenity} size={size} />
      ))}
      {remainingCount > 0 && (
        <div className="p-2 bg-gray-100 rounded-lg">
          <span className="text-xs text-gray-600 font-medium">+{remainingCount}</span>
        </div>
      )}
    </div>
  )
}

import { Wifi, Car, Utensils, Dumbbell, Waves, Sparkles, Coffee, Tv, Droplets, Wind } from 'lucide-react'

interface AmenityIconProps {
  amenity: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const amenityMap = {
  wifi: { icon: Wifi, label: 'Free WiFi' },
  parking: { icon: Car, label: 'Free Parking' },
  restaurant: { icon: Utensils, label: 'Restaurant' },
  gym: { icon: Dumbbell, label: 'Fitness Center' },
  pool: { icon: Waves, label: 'Swimming Pool' },
  spa: { icon: Sparkles, label: 'Spa & Wellness' },
  coffee: { icon: Coffee, label: 'Coffee Shop' },
  tv: { icon: Tv, label: 'Smart TV' },
  shower: { icon: Droplets, label: 'Rain Shower' },
  ac: { icon: Wind, label: 'Air Conditioning' },
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function AmenityIcon({ amenity, size = 'md', className = '' }: AmenityIconProps) {
  const amenityData = amenityMap[amenity.toLowerCase() as keyof typeof amenityMap] || { icon: Wifi, label: amenity }
  const Icon = amenityData.icon
  
  return (
    <div 
      className={`p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors group cursor-help ${className}`}
      title={amenityData.label}
    >
      <Icon className={`${sizeClasses[size]} text-gray-600 group-hover:text-amber-600 transition-colors`} />
    </div>
  )
}

export function AmenityIconList({ 
  amenities, 
  maxItems = 4, 
  size = 'md' 
}: { 
  amenities: string[]
  maxItems?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const visibleAmenities = amenities.slice(0, maxItems)
  const remainingCount = amenities.length - maxItems

  return (
    <div className="flex gap-2 flex-wrap">
      {visibleAmenities.map(amenity => (
        <AmenityIcon key={amenity} amenity={amenity} size={size} />
      ))}
      {remainingCount > 0 && (
        <div className="p-2 bg-gray-100 rounded-lg">
          <span className="text-xs text-gray-600 font-medium">+{remainingCount}</span>
        </div>
      )}
    </div>
  )
}
