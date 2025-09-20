import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Calendar, MapPin, Star, Users, Wifi, Car, Utensils, Dumbbell, Shield, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hotel-hero-1.jpg"
            alt="Luxury Hotel"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white max-w-4xl px-4">
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-6xl md:text-7xl font-bold mb-6"
            >
              Welcome to <span className="text-amber-400">SmartHotel</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 text-white/90"
            >
              Experience luxury and comfort in the heart of the city. 
              Book your perfect stay today.
            </motion.p>
            
            {/* Enhanced Search Overlay */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-2xl mx-auto"
            >
              <div className="bg-white/90 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Where are you going?"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                      type="date"
                      className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6" asChild>
                    <Link href="/booking">Search</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex items-center gap-8 text-white/90">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">4.8/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Secure Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span className="text-sm font-medium">Award Winning</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Why Choose SmartHotel?</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Experience luxury and convenience like never before with our world-class amenities and exceptional service.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Wifi, title: "Free WiFi", description: "High-speed internet throughout the hotel", color: "text-blue-600" },
              { icon: Car, title: "Free Parking", description: "Complimentary parking for all guests", color: "text-green-600" },
              { icon: Utensils, title: "Restaurant", description: "Fine dining with local and international cuisine", color: "text-orange-600" },
              { icon: Dumbbell, title: "Fitness Center", description: "State-of-the-art gym facilities", color: "text-purple-600" }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <feature.icon className={`w-16 h-16 mx-auto mb-6 ${feature.color} group-hover:scale-110 transition-transform duration-300`} />
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Rooms Section */}
      <section className="py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Our Luxury Rooms</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Choose from our carefully designed rooms and suites, each offering comfort and luxury.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Standard Room",
                price: 120,
                guests: 2,
                gradient: "from-blue-400 to-blue-600",
                description: "Comfortable room with modern amenities and city views.",
                isPopular: false
              },
              {
                name: "Deluxe Room",
                price: 180,
                guests: 3,
                gradient: "from-purple-400 to-purple-600",
                description: "Spacious room with premium amenities and panoramic views.",
                isPopular: true
              },
              {
                name: "Presidential Suite",
                price: 350,
                guests: 4,
                gradient: "from-amber-400 to-amber-600",
                description: "Luxury suite with separate living area and premium services.",
                isPopular: false
              }
            ].map((room, index) => (
              <motion.div
                key={room.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -8 }}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white">
                  <div className={`h-64 bg-gradient-to-br ${room.gradient} relative overflow-hidden`}>
                    {room.isPopular && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-amber-500 text-white border-0">Popular</Badge>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                    <div className="absolute bottom-4 right-4">
                      <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <MapPin className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">{room.name}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">${room.price}</div>
                        <div className="text-sm text-gray-500">per night</div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{room.description}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-6">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{room.guests} Guests</span>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                      <Link href="/booking">Book Now</Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Location Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold mb-6 text-gray-900">Prime Location</h2>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                  Located in the heart of the city, SmartHotel offers easy access to major attractions, 
                  business districts, and transportation hubs.
                </p>
                <div className="space-y-6">
                  {[
                    "5 minutes to downtown",
                    "10 minutes to airport",
                    "Walking distance to shopping"
                  ].map((location, index) => (
                    <motion.div
                      key={location}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center group"
                    >
                      <div className="p-3 bg-amber-100 rounded-full mr-4 group-hover:bg-amber-200 transition-colors duration-300">
                        <MapPin className="w-6 h-6 text-amber-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{location}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="h-96 bg-gradient-to-br from-amber-100 to-orange-200 rounded-2xl flex items-center justify-center shadow-2xl">
                  <MapPin className="w-20 h-20 text-amber-600" />
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-20" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-20" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-500 to-orange-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready for an Unforgettable Stay?</h2>
            <p className="text-amber-100 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Book your room today and experience the perfect blend of luxury, comfort, and exceptional service.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="secondary" className="bg-white text-amber-600 hover:bg-gray-100 shadow-xl" asChild>
                  <Link href="/booking">Book Now</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-amber-600 shadow-xl" asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}