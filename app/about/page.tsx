import Image from 'next/image'
import { Calendar, Users, Award, Heart, Shield, Leaf } from 'lucide-react'
import { FallbackImage } from '@/components/ui/fallback-image'
import { getHotelAboutContent, getHotelContactInfo } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const [{ story, founded, milestones, staff }, contact] = await Promise.all([
    getHotelAboutContent(),
    getHotelContactInfo(),
  ])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden bg-gradient-to-r from-amber-600 to-orange-600">
        <div className="absolute inset-0">
          <Image src="/images/hotel/hotel-exterior.jpg" alt={`${contact.name} Exterior`} fill className="object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/80 to-orange-600/80" />
        </div>
        
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">Our Story</h1>
            <p className="text-xl md:text-2xl text-gray-100">Luxury hospitality since {founded}</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Story Section */}
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">The {contact.name.split(' ')[0]} Legacy</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">{story}</p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Today, we continue to set the standard for luxury hospitality, combining timeless elegance with modern innovation. Our commitment to excellence has earned us numerous accolades and the loyalty of guests from around the world.
              </p>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/hotel/hotel-lobby.jpg" alt="Hotel Lobby" fill className="object-cover" />
            </div>
          </div>
        </section>

        {/* Milestones */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Our Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {milestones.map((milestone, index) => {
              const [year, description] = milestone.split(' - ')
              return (
              <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-l-4 border-amber-600">
                <Calendar className="w-8 h-8 text-amber-600 mb-3" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{year}</h3>
                  <p className="text-gray-700">{description ?? milestone}</p>
              </div>
              )
            })}
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Excellence</h3>
              <p className="text-gray-700">We strive for perfection in every detail, ensuring exceptional experiences for our guests.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Integrity</h3>
              <p className="text-gray-700">We conduct business with the highest ethical standards and transparency.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sustainability</h3>
              <p className="text-gray-700">We are committed to environmental responsibility and sustainable practices.</p>
            </div>
          </div>
        </section>

        {/* Awards Section */}
        <section className="mb-20 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-12 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Award className="w-12 h-12 mb-4" />
              <h2 className="text-3xl font-bold mb-4">Award-Winning Excellence</h2>
              <p className="text-lg mb-6">
                Our commitment to excellence has been recognized with numerous prestigious awards including AAA Five Diamond Award, Forbes Travel Guide Five-Star Rating, and TripAdvisor Travelers' Choice.
              </p>
            </div>
            <div>
              <Users className="w-12 h-12 mb-4" />
              <h2 className="text-3xl font-bold mb-4">Guest Satisfaction</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">98%</p>
                  <p className="text-amber-100">Guest Satisfaction Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">4.8/5</p>
                  <p className="text-amber-100">Average Rating</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section>
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {staff.map(member => (
              <div key={member.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="relative h-64 bg-gradient-to-br from-amber-100 to-orange-100">
                  <FallbackImage
                    src={`/images/hotel/staff-${(member.department || 'team').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.jpg`}
                    fallbackSrc="/images/hotel/hotel-lobby.jpg"
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-amber-600 font-medium mb-3">{member.position}</p>
                  <p className="text-gray-700">
                    Dedicated {member.department.toLowerCase()} professional committed to delivering exceptional guest experiences.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}