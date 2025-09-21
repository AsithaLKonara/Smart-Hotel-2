"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  MapPin, 
  Star, 
  Wifi, 
  Car, 
  Utensils, 
  Waves, 
  Coffee,
  Tv,
  AirVent,
  Minus,
  Plus,
  Check,
  X
} from 'lucide-react'

interface Room {
  id: string
  number: string
  type: string
  price: number
  capacity: number
  floor: number
  size: number
  description: string
  amenities: string[]
  images: string[]
  averageRating: number
  reviewCount: number
}

interface RoomComparisonProps {
  rooms: Room[]
  onSelectRoom: (room: Room) => void
  selectedRooms: Room[]
  onToggleSelection: (room: Room) => void
}

const amenityIcons: { [key: string]: any } = {
  'WiFi': Wifi,
  'Parking': Car,
  'Restaurant': Utensils,
  'Pool': Waves,
  'Coffee': Coffee,
  'TV': Tv,
  'Air Conditioning': AirVent,
}

export default function RoomComparison({ 
  rooms, 
  onSelectRoom, 
  selectedRooms, 
  onToggleSelection 
}: RoomComparisonProps) {
  const [viewMode, setViewMode] = useState('grid' as 'grid' | 'comparison')

  const getRoomTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'standard': return 'bg-blue-100 text-blue-800'
      case 'deluxe': return 'bg-purple-100 text-purple-800'
      case 'suite': return 'bg-amber-100 text-amber-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAllAmenities = () => {
    const allAmenities = new Set<string>()
    rooms.forEach(room => {
      room.amenities.forEach(amenity => allAmenities.add(amenity))
    })
    return Array.from(allAmenities)
  }

  if (viewMode === 'grid') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Available Rooms</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Compare up to 3 rooms:</span>
            <Button
              variant={(viewMode as string) === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </Button>
            <Button
              variant={(viewMode as string) === 'comparison' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('comparison')}
              disabled={selectedRooms.length < 2}
            >
              Compare ({selectedRooms.length})
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const isSelected = selectedRooms.some(r => r.id === room.id)
            const canSelect = selectedRooms.length < 3 || isSelected

            return (
              <Card key={room.id} className={`overflow-hidden transition-all ${
                isSelected ? 'ring-2 ring-amber-500' : ''
              }`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{room.type} Room</h3>
                      <p className="text-gray-600">Room {room.number}</p>
                      <Badge className={`mt-2 ${getRoomTypeColor(room.type)}`}>
                        {room.type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-600">
                        ${room.price}
                      </div>
                      <div className="text-sm text-gray-500">/night</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {room.capacity} guests
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      Floor {room.floor}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 mr-2" />
                      {room.averageRating || 'New'} ({room.reviewCount})
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 h-4 mr-2">📐</span>
                      {room.size} sq ft
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">{room.description}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {room.amenities.slice(0, 4).map((amenity) => {
                      const Icon = amenityIcons[amenity] || Utensils
                      return (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          <Icon className="w-3 h-3 mr-1" />
                          {amenity}
                        </Badge>
                      )
                    })}
                    {room.amenities.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{room.amenities.length - 4} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => onSelectRoom(room)}
                      className="flex-1"
                    >
                      Select Room
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleSelection(room)}
                      disabled={!canSelect}
                      className={`px-3 ${
                        isSelected ? 'bg-amber-100 text-amber-700' : ''
                      }`}
                    >
                      {isSelected ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Comparison view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Room Comparison</h2>
        <Button
          variant="outline"
          onClick={() => setViewMode('grid')}
        >
          Back to Grid
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="font-semibold text-gray-900">Features</div>
            {selectedRooms.map((room) => (
              <div key={room.id} className="text-center">
                <h3 className="font-semibold text-gray-900">{room.type} Room</h3>
                <p className="text-sm text-gray-600">Room {room.number}</p>
                <div className="text-lg font-bold text-amber-600 mt-1">
                  ${room.price}/night
                </div>
              </div>
            ))}
          </div>

          {/* Basic Info */}
          <Card className="p-4 mb-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="font-medium text-gray-700">Capacity</div>
              {selectedRooms.map((room) => (
                <div key={room.id} className="text-center">
                  {room.capacity} guests
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 mb-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="font-medium text-gray-700">Floor</div>
              {selectedRooms.map((room) => (
                <div key={room.id} className="text-center">
                  Floor {room.floor}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 mb-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="font-medium text-gray-700">Size</div>
              {selectedRooms.map((room) => (
                <div key={room.id} className="text-center">
                  {room.size} sq ft
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 mb-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="font-medium text-gray-700">Rating</div>
              {selectedRooms.map((room) => (
                <div key={room.id} className="text-center">
                  <div className="flex items-center justify-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    {room.averageRating || 'New'}
                  </div>
                  <div className="text-xs text-gray-500">
                    ({room.reviewCount} reviews)
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Amenities Comparison */}
          <Card className="p-4">
            <h4 className="font-medium text-gray-700 mb-4">Amenities</h4>
            <div className="space-y-3">
              {getAllAmenities().map((amenity) => {
                const Icon = amenityIcons[amenity] || Utensils
                return (
                  <div key={amenity} className="grid grid-cols-4 gap-4 items-center">
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-2 text-gray-600" />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </div>
                    {selectedRooms.map((room) => (
                      <div key={room.id} className="text-center">
                        {room.amenities.includes(amenity) ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div></div>
            {selectedRooms.map((room) => (
              <Button
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className="w-full"
              >
                Select This Room
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
