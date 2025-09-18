import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Star, Users, Wifi, Car, Utensils, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import StickyHeader from '@/components/sticky-header'
import HeroSection from '@/components/hero-section'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <StickyHeader />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Quick Booking Search */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Find Your Perfect Stay</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Check In</label>
                  <input type="date" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Check Out</label>
                  <input type="date" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Guests</label>
                  <select className="input-field">
                    <option>1 Guest</option>
                    <option>2 Guests</option>
                    <option>3 Guests</option>
                    <option>4+ Guests</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Link href="/booking" className="w-full">
                    <Button className="w-full btn-primary">Search</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-serif font-bold mb-6">About SmartHotel</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Nestled in the heart of the city, SmartHotel offers a perfect blend of luxury, 
                comfort, and modern amenities. Our commitment to exceptional service ensures 
                every guest enjoys a memorable stay.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Star className="text-gold-500 w-5 h-5" />
                  <span>5-Star Luxury</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="text-primary-500 w-5 h-5" />
                  <span>Prime Location</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="text-luxury-500 w-5 h-5" />
                  <span>24/7 Service</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-gold-500 w-5 h-5" />
                  <span>Flexible Booking</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/images/hotel-lobby.jpg"
                alt="Hotel Lobby"
                width={600}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-center mb-12">Featured Rooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredRooms.map((room) => (
              <Card key={room.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-64">
                  <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    className="object-cover"
                  />
                  <Badge className="absolute top-4 right-4 bg-luxury-600">
                    {room.type}
                  </Badge>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{room.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{room.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{room.capacity} Guests</span>
                    </div>
                    <div className="text-2xl font-bold text-primary-600">
                      ${room.price}/night
                    </div>
                  </div>
                  <Link href={`/rooms/${room.id}`}>
                    <Button className="w-full btn-primary">View Details</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/rooms">
              <Button size="lg" variant="outline" className="btn-secondary">
                View All Rooms
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-center mb-12">Hotel Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {amenities.map((amenity) => (
              <div key={amenity.name} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <amenity.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-semibold mb-2">{amenity.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{amenity.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">Ready to Experience Luxury?</h2>
          <p className="text-xl mb-8 opacity-90">
            Book your stay today and enjoy our world-class amenities and service
          </p>
          <Link href="/booking">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3">
              Book Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

const featuredRooms = [
  {
    id: 1,
    name: "Deluxe Suite",
    type: "Suite",
    description: "Spacious suite with city view and premium amenities",
    price: 299,
    capacity: 4,
    image: "/images/room-deluxe.jpg"
  },
  {
    id: 2,
    name: "Executive Room",
    type: "Deluxe",
    description: "Modern room with business facilities and comfort",
    price: 199,
    capacity: 2,
    image: "/images/room-executive.jpg"
  },
  {
    id: 3,
    name: "Presidential Suite",
    type: "Luxury",
    description: "Ultimate luxury experience with panoramic views",
    price: 599,
    capacity: 6,
    image: "/images/room-presidential.jpg"
  }
]

const amenities = [
  {
    name: "Free WiFi",
    description: "High-speed internet throughout the hotel",
    icon: Wifi
  },
  {
    name: "Restaurant",
    description: "Fine dining with international cuisine",
    icon: Utensils
  },
  {
    name: "Fitness Center",
    description: "24/7 gym with modern equipment",
    icon: Dumbbell
  },
  {
    name: "Free Parking",
    description: "Secure parking for all guests",
    icon: Car
  }
] 