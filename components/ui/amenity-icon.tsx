"use client"

import { 
  Wifi, 
  Car, 
  Coffee, 
  Utensils, 
  Tv, 
  Wind, 
  Shield, 
  Dumbbell, 
  Waves, 
  Mountain,
  Sun,
  Moon,
  Heart,
  Users,
  Star,
  Lock,
  Smartphone,
  Headphones,
  Camera,
  Music,
  Gamepad2,
  Baby,
  Dog,
  Plane,
  Train,
  Bus,
  Bike
} from 'lucide-react'

interface AmenityIconProps {
  amenity: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const amenityMap: Record<string, any> = {
  // Internet & Technology
  'wifi': Wifi,
  'free-wifi': Wifi,
  'high-speed-internet': Wifi,
  'wireless-internet': Wifi,
  'internet': Wifi,
  
  // Transportation
  'parking': Car,
  'free-parking': Car,
  'valet-parking': Car,
  'airport-shuttle': Plane,
  'transit': Bus,
  'bike-rental': Bike,
  
  // Food & Beverage
  'restaurant': Utensils,
  'cafe': Coffee,
  'coffee-shop': Coffee,
  'room-service': Coffee,
  'breakfast': Coffee,
  'bar': Coffee,
  'minibar': Coffee,
  
  // Entertainment
  'tv': Tv,
  'cable-tv': Tv,
  'satellite-tv': Tv,
  'streaming': Tv,
  'entertainment': Tv,
  'music': Music,
  'gaming': Gamepad2,
  
  // Comfort & Climate
  'air-conditioning': Wind,
  'heating': Wind,
  'climate-control': Wind,
  'balcony': Sun,
  'terrace': Sun,
  'garden': Sun,
  'pool': Waves,
  'beach': Waves,
  'spa': Waves,
  'hot-tub': Waves,
  'sauna': Waves,
  
  // Fitness & Wellness
  'gym': Dumbbell,
  'fitness-center': Dumbbell,
  'workout': Dumbbell,
  'yoga': Dumbbell,
  'massage': Heart,
  'wellness': Heart,
  
  // Safety & Security
  'security': Shield,
  'safe': Lock,
  'safety-deposit-box': Lock,
  '24-hour-security': Shield,
  'cctv': Camera,
  
  // Accessibility & Family
  'accessible': Users,
  'wheelchair-accessible': Users,
  'family-friendly': Baby,
  'pet-friendly': Dog,
  'kids-club': Baby,
  'babysitting': Baby,
  
  // Business & Work
  'business-center': Smartphone,
  'meeting-rooms': Users,
  'conference': Users,
  'workspace': Smartphone,
  
  // Other
  'mountain-view': Mountain,
  'ocean-view': Waves,
  'city-view': Sun,
  'garden-view': Sun,
  'kitchen': Utensils,
  'laundry': Wind,
  'dryer': Wind,
  'iron': Wind,
  'hairdryer': Wind,
  'toiletries': Heart,
  'towels': Heart,
  'linens': Heart,
  'daily-housekeeping': Heart,
  'concierge': Users,
  'luggage-storage': Lock,
  'luggage-service': Lock,
  'tour-desk': Users,
  'airport-transfers': Plane,
  'shuttle-service': Bus,
  'car-rental': Car,
  'bicycle-rental': Bike,
  'wake-up-service': Moon,
  'newspaper': Smartphone,
  'magazines': Smartphone,
  'books': Smartphone,
  'games': Gamepad2,
  'toys': Gamepad2,
  'crib': Baby,
  'high-chair': Baby,
  'stroller': Baby,
  'baby-sitting': Baby,
  'child-care': Baby,
  'playground': Baby,
  'kids-pool': Waves,
  'children-playground': Baby,
  'nursery': Baby,
  'kids-menu': Utensils,
  'family-rooms': Users,
  'connecting-rooms': Users,
  'interconnecting-rooms': Users,
  'suite': Star,
  'penthouse': Star,
  'villa': Star,
  'apartment': Star,
  'studio': Star,
  'loft': Star,
  'duplex': Star,
  'executive': Star,
  'presidential': Star,
  'royal': Star,
  'luxury': Star,
  'premium': Star,
  'deluxe': Star,
  'superior': Star,
  'standard': Star,
  'economy': Star,
  'budget': Star,
  'basic': Star
}

export function AmenityIcon({ amenity, size = 'md', className = '' }: AmenityIconProps) {
  const normalizedAmenity = amenity.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const IconComponent = amenityMap[normalizedAmenity] || Heart
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`} title={amenity}>
      <IconComponent className={`${sizeClasses[size]} text-blue-600`} />
    </div>
  )
}
