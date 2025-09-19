import Link from 'next/link'
import { Calendar, MapPin, Star, Users, Wifi, Car, Utensils, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome to SmartHotel</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Experience luxury and comfort in the heart of the city. Book your perfect stay today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/booking">Book Now</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/rooms">View Rooms</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Booking Search */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Find Your Perfect Stay</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Check In</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Check Out</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Guests</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>1 Guest</option>
                    <option>2 Guests</option>
                    <option>3 Guests</option>
                    <option>4+ Guests</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full" asChild>
                    <Link href="/booking">
                      <Calendar className="w-4 h-4 mr-2" />
                      Search Rooms
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose SmartHotel?</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Experience luxury and convenience like never before with our world-class amenities and exceptional service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Wifi className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Free WiFi</h3>
              <p className="text-gray-600 dark:text-gray-400">High-speed internet throughout the hotel</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Car className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-semibold mb-2">Free Parking</h3>
              <p className="text-gray-600 dark:text-gray-400">Complimentary parking for all guests</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Utensils className="w-12 h-12 mx-auto mb-4 text-orange-600" />
              <h3 className="text-xl font-semibold mb-2">Restaurant</h3>
              <p className="text-gray-600 dark:text-gray-400">Fine dining with local and international cuisine</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Dumbbell className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-semibold mb-2">Fitness Center</h3>
              <p className="text-gray-600 dark:text-gray-400">State-of-the-art gym facilities</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Rooms</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose from our carefully designed rooms and suites, each offering comfort and luxury.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600"></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">Standard Room</h3>
                  <Badge variant="secondary">$120/night</Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comfortable room with modern amenities and city views.
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Users className="w-4 h-4 mr-1" />
                  2 Guests
                </div>
                <Button className="w-full" asChild>
                  <Link href="/booking">Book Now</Link>
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600"></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">Deluxe Room</h3>
                  <Badge variant="secondary">$180/night</Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Spacious room with premium amenities and panoramic views.
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Users className="w-4 h-4 mr-1" />
                  3 Guests
                </div>
                <Button className="w-full" asChild>
                  <Link href="/booking">Book Now</Link>
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-gold-400 to-gold-600"></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">Presidential Suite</h3>
                  <Badge variant="secondary">$350/night</Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Luxury suite with separate living area and premium services.
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Users className="w-4 h-4 mr-1" />
                  4 Guests
                </div>
                <Button className="w-full" asChild>
                  <Link href="/booking">Book Now</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Prime Location</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Located in the heart of the city, SmartHotel offers easy access to major attractions, 
                  business districts, and transportation hubs.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                    <span>5 minutes to downtown</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                    <span>10 minutes to airport</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                    <span>Walking distance to shopping</span>
                  </div>
                </div>
              </div>
              <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-700 dark:to-gray-900 rounded-lg flex items-center justify-center">
                <MapPin className="w-16 h-16 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for an Unforgettable Stay?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Book your room today and experience the perfect blend of luxury, comfort, and exceptional service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/booking">Book Now</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}