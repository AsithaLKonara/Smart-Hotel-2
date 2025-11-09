import Link from 'next/link'
import Image from 'next/image'
import EnhancedHeroSection from '@/components/enhanced-hero-section'
import { 
  Star, 
  Shield, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  Wifi, 
  Car, 
  Utensils, 
  Dumbbell, 
  Waves, 
  Coffee,
  CheckCircle,
  ArrowRight,
  Calendar,
  Users,
  Clock,
} from 'lucide-react'
import prisma from '@/lib/db'
import { getHotelContactInfo } from '@/lib/settings'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [contact, featuredRooms] = await Promise.all([
    getHotelContactInfo(),
    prisma.room.findMany({
      take: 3,
      orderBy: {
        price: 'desc',
      },
    }),
  ])

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section with Video Background */}
      <EnhancedHeroSection />

      {/* Hotel Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to {contact.name}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{contact.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">5-Star Luxury</h3>
              <p className="text-gray-600">Experience world-class service and amenities in every detail.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Prime Location</h3>
              <p className="text-gray-600">Steps away from major attractions, business districts, and shopping.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Award-Winning</h3>
              <p className="text-gray-600">Recognized globally for excellence in hospitality and service.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Luxurious Accommodations</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our elegant collection of rooms and suites, each designed to provide the ultimate in comfort and luxury.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {featuredRooms.map(room => (
              <div key={room.id} className="bg-white rounded-2xl overflow-hidden shadow-lg">
                <div className="h-64 bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                  <span className="text-white text-lg font-medium">{room.type}</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{room.type}</h3>
                  <p className="text-gray-600 mb-4">{room.description || 'Spacious accommodations with premium amenities and curated experiences.'}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-amber-600">${room.price.toFixed(0)}</span>
                    <span className="text-gray-500">/night</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-8 py-4 rounded-lg font-medium transition-colors"
            >
              View All Rooms
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">World-Class Amenities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From fine dining to wellness facilities, we provide everything you need for an exceptional stay.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-2">Fine Dining</h3>
              <p className="text-gray-600 text-sm">Award-winning restaurants</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Waves className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-2">Swimming Pool</h3>
              <p className="text-gray-600 text-sm">Rooftop infinity pool</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-2">Fitness Center</h3>
              <p className="text-gray-600 text-sm">State-of-the-art gym</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-2">Business Center</h3>
              <p className="text-gray-600 text-sm">Meeting rooms & facilities</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-2">Free WiFi</h3>
              <p className="text-gray-600 text-sm">High-speed internet</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-2">Valet Parking</h3>
              <p className="text-gray-600 text-sm">Complimentary parking</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-2">24/7 Concierge</h3>
              <p className="text-gray-600 text-sm">Round-the-clock service</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-2">Security</h3>
              <p className="text-gray-600 text-sm">24/7 security & safety</p>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Culinary Excellence</h2>
              <p className="text-xl text-gray-600 mb-8">
                Indulge in world-class cuisine at our award-winning restaurants. From fine dining to casual bites, we offer an exceptional culinary journey.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-amber-600" />
                  <span className="text-gray-700">Award-winning signature restaurant</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-amber-600" />
                  <span className="text-gray-700">24/7 room service</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-amber-600" />
                  <span className="text-gray-700">Rooftop bar with city views</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-amber-600" />
                  <span className="text-gray-700">Private dining experiences</span>
                </div>
              </div>
              
              <Link
                href="/order"
                className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-8 py-4 rounded-lg font-medium transition-colors"
              >
                View Restaurant Menu
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl h-96 flex items-center justify-center">
              <span className="text-white text-2xl font-medium">Restaurant Gallery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Contact */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Perfect Location</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Located in the heart of the city, {contact.name} puts you within walking distance of major attractions, business districts, and entertainment venues.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Hotel Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-amber-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Address</h4>
                    <p className="text-gray-600">{contact.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-amber-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Phone</h4>
                    <p className="text-gray-600">{contact.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-amber-600 mt-1" />
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-gray-600">{contact.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h4 className="font-semibold mb-4">Nearby Attractions</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• City Convention Center (5 min walk)</li>
                  <li>• Central Business District (3 min walk)</li>
                  <li>• Historic Downtown (10 min walk)</li>
                  <li>• Shopping Mall (7 min walk)</li>
                  <li>• Airport (20 min drive)</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl h-96 flex items-center justify-center">
              <span className="text-white text-2xl font-medium">Interactive Map</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-600 to-orange-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Experience Luxury?</h2>
          <p className="text-xl text-white/90 mb-8">
            Book your stay at {contact.name} and discover why we're the city's premier destination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking" className="bg-white text-amber-800 border border-amber-800 hover:bg-amber-50 px-8 py-4 rounded-lg font-medium transition-colors">
              Book Now
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-amber-600 px-8 py-4 rounded-lg font-medium transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
