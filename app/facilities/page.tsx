import Image from 'next/image'
import Link from 'next/link'
import { 
  Waves, 
  Dumbbell, 
  Utensils, 
  Heart, 
  Wifi, 
  Car, 
  Coffee, 
  Briefcase,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FallbackImage } from '@/components/ui/fallback-image'

export const dynamic = 'force-dynamic'

const facilities = [
  {
    id: 'fitness',
    name: 'Fitness Center',
    description: 'State-of-the-art gym with premium equipment, personal trainers, and group fitness classes.',
    icon: Dumbbell,
    image: '/images/hotel/hotel-gym.jpg',
    features: ['24/7 Access', 'Personal Trainers', 'Group Classes', 'Yoga Studio'],
  },
  {
    id: 'pool',
    name: 'Rooftop Pool',
    description: 'Stunning rooftop infinity pool with panoramic city views, cabanas, and poolside service.',
    icon: Waves,
    image: '/images/hotel/hotel-pool.jpg',
    features: ['Infinity Pool', 'Cabanas', 'Poolside Bar', 'Sunning Deck'],
  },
  {
    id: 'spa',
    name: 'Spa & Wellness Center',
    description: 'Full-service spa offering massages, facials, body treatments, and wellness therapies.',
    icon: Heart,
    image: '/images/hotel/hotel-spa.jpg',
    features: ['Massage Therapy', 'Facial Treatments', 'Body Wraps', 'Steam Room'],
  },
  {
    id: 'restaurant',
    name: 'Fine Dining Restaurant',
    description: 'Award-winning restaurant featuring contemporary American cuisine with international influences.',
    icon: Utensils,
    image: '/images/hotel/hotel-restaurant.jpg',
    features: ['Breakfast', 'Lunch', 'Dinner', 'Private Dining'],
  },
  {
    id: 'business',
    name: 'Business Center',
    description: 'Fully equipped business facilities with meeting rooms, conference spaces, and modern technology.',
    icon: Briefcase,
    image: '/images/hotel/hotel-lobby.jpg',
    features: ['Meeting Rooms', 'Conference Space', 'Printing Services', 'Secretarial Services'],
  },
  {
    id: 'lobby',
    name: 'Lobby Bar',
    description: 'Elegant lobby bar serving craft cocktails, fine wines, and light refreshments.',
    icon: Coffee,
    image: '/images/hotel/hotel-bar.jpg',
    features: ['Craft Cocktails', 'Wine Selection', 'Live Music', '24/7 Service'],
  },
]

export default function FacilitiesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden bg-gradient-to-r from-amber-600 to-orange-600">
        <div className="absolute inset-0">
          <Image src="/images/hotel/hotel-pool.jpg" alt="Hotel Facilities" fill className="object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/80 to-orange-600/80" />
        </div>
        
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Our Facilities</h1>
            <p className="text-xl md:text-2xl text-gray-100">World-class amenities for your comfort and convenience</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {facilities.map(facility => {
            const Icon = facility.icon
            return (
              <div key={facility.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-64">
                  <FallbackImage
                    src={facility.image}
                    fallbackSrc="/images/hotel/hotel-lobby.jpg"
                    alt={facility.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                      <Icon className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{facility.name}</h3>
                  </div>
                  <p className="text-gray-700 mb-4">{facility.description}</p>
                  <ul className="space-y-2">
                    {facility.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-amber-600 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional Services */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Additional Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6">
              <Wifi className="w-8 h-8 text-amber-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">High-Speed WiFi</h3>
              <p className="text-gray-700">Complimentary high-speed internet throughout the hotel</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6">
              <Car className="w-8 h-8 text-amber-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Valet Parking</h3>
              <p className="text-gray-700">Secure valet parking service available</p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6">
              <UserCheck className="w-8 h-8 text-amber-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Concierge</h3>
              <p className="text-gray-700">Round-the-clock concierge service</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Experience Our World-Class Facilities</h2>
          <p className="text-xl mb-8 text-amber-50">Book your stay and enjoy access to all our luxury amenities</p>
          <div className="flex gap-4 justify-center">
            <Link href="/booking">
              <Button size="lg" className="bg-white text-amber-600 hover:bg-amber-50">
                Book Your Stay
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-amber-600">
                Contact Us
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

