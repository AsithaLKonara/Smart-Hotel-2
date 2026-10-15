import Link from 'next/link'
import Image from 'next/image'
import EnhancedHeroSection from '@/components/enhanced-hero-section'
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowRight,
  ChevronRight,
  Quote,
} from 'lucide-react'
import { getHotelContactInfo, getHotelAboutContent } from '@/lib/settings'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import prisma from '@/lib/db'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import dynamic from 'next/dynamic'

const TestimonialSection = dynamic(
  () => import('@/components/landing/testimonial-section').then(mod => mod.TestimonialSection),
  { ssr: true }
)

import { InteractiveLocationSection } from '@/components/landing/interactive-location-section'
import { SignatureExperiencesSection } from '@/components/landing/signature-experiences-section'
import { CmsService } from '@/lib/services/cms-service'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SmartHotel OS — Luxury 5-Star Hotel Accommodations & Booking',
  description: 'Experience unparalleled luxury at SmartHotel Grand Palace. Book direct for signature suites, world-class dining, royal spa, and bespoke guest experiences.',
}

export const revalidate = 60

const defaultContact = {
  name: 'SmartHotel Grand Palace',
  tagline: 'Luxury 5-Star Accommodation',
  description: 'Experience unparalleled luxury where timeless elegance meets modern hospitality.',
  email: 'info@smarthotel.com',
  phone: '+1 (800) 555-HOTEL',
  address: '123 Grand Boulevard, City Center, Metropolitan Area, ST 10001',
  checkIn: '15:00',
  checkOut: '11:00',
  coordinates: {
    lat: 40.7589,
    lng: -73.9851,
  },
}

export default async function HomePage() {
  let contact = defaultContact
  let featuredRooms: any[] = []
  let properties: any[] = []
  let experiences: any[] = []
  let heroSlides: any[] = []
  let aboutContent: any = { story: '', founded: '', milestones: [], staff: [] }

  try {
    if (isDatabaseConfigured()) {
      await CmsService.ensureDefaultCmsContent()
      contact = await getHotelContactInfo()
      heroSlides = await CmsService.getHeroSlides({ activeOnly: true })
      featuredRooms = await prisma.room.findMany({
        where: { status: 'AVAILABLE' },
        take: 3,
        include: {
          roomType: true,
          roomImages: { orderBy: { isMain: 'desc' }, take: 1 },
          feedback: true
        },
        orderBy: { roomType: { baseRate: 'desc' } },
      })
      properties = await prisma.property.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' }
      })
      experiences = await CmsService.getExperiences({ activeOnly: true })
      aboutContent = await getHotelAboutContent()
    }
  } catch (error: any) {
    console.warn('CRITICAL: Failed to fetch homepage data. Falling back to defaults.', error?.message || String(error))
  }

  return (
    <div className="bg-transparent text-foreground font-sans">
      {/* Visually-hidden H1 for SEO and accessibility — present in initial server-rendered HTML */}
      <h1 className="sr-only">{contact.name} — {contact.tagline}</h1>
      <EnhancedHeroSection />


      {/* Our Story Section */}
      <section className="py-24 lg:py-32 overflow-hidden bg-black/10 backdrop-blur-sm border-y border-white/5 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <Image 
                  src={aboutContent?.storyImage || properties[0]?.mainImage || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000"} 
                  alt="Hotel Interior" 
                  fill 
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 border-[20px] border-primary/10 -z-10 rounded-2xl" />
              <div className="absolute top-1/2 -left-20 transform -translate-y-1/2 hidden xl:block">
                <span className="text-[12rem] font-serif text-primary/5 font-bold leading-none select-none">EST. 1924</span>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-primary uppercase tracking-[0.3em] text-xs font-bold">Discover Our Heritage</h4>
                <h2 className="text-5xl lg:text-6xl font-serif font-bold text-white leading-tight">
                  A Century of <span className="text-primary italic">Excellence</span>
                </h2>
              </div>
              
              <p className="text-lg text-white/70 leading-relaxed font-light">
                Since 1924, {contact.name} has been the cornerstone of luxury hospitality. What began as a grand vision for elegance has evolved into a world-renowned sanctuary for the discerning traveler.
              </p>
              
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div>
                  <h3 className="text-4xl font-serif font-bold text-primary">100+</h3>
                  <p className="text-xs uppercase tracking-widest text-white/40 font-bold mt-1">Years of Service</p>
                </div>
                <div>
                  <h3 className="text-4xl font-serif font-bold text-primary">500k+</h3>
                  <p className="text-xs uppercase tracking-widest text-white/40 font-bold mt-1">Happy Guests</p>
                </div>
              </div>

              <Button variant="outline" className="border-primary/50 text-white rounded-xl px-10 h-14 uppercase tracking-widest text-xs font-bold hover:bg-primary hover:border-primary hover:text-white transition-all bg-white/5 backdrop-blur-md">
                Learn More About Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations Section */}
      {properties.length > 0 && (
        <section className="py-24 lg:py-32 bg-transparent border-y border-white/5 text-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
              <div className="space-y-4">
                <h4 className="text-primary uppercase tracking-[0.3em] text-xs font-bold">Global Presence</h4>
                <h2 className="text-5xl lg:text-6xl font-serif font-bold leading-tight">
                  Our <span className="text-primary italic">Destinations</span>
                </h2>
              </div>
              <Link href="/properties" className="group flex items-center space-x-3 text-primary uppercase tracking-widest text-xs font-bold">
                <span>View All Properties</span>
                <div className="w-10 h-px bg-primary group-hover:w-16 transition-all" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {properties.map((property) => (
                <Link key={property.id} href={`/properties/${property.code}`} className="group relative aspect-[3/4] overflow-hidden rounded-2xl block border border-white/10 hover:border-primary/40 transition-all duration-500 hover:shadow-luxury">
                  <Image 
                    src={property.mainImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000'}
                    alt={property.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    unoptimized={!!property.mainImage}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 flex flex-col justify-end space-y-2">
                    <div className="flex items-center gap-2 text-primary text-[10px] uppercase tracking-widest font-bold">
                      <MapPin className="w-3 h-3" />
                      {property.city}, {property.country}
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white group-hover:text-primary transition-colors">{property.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Suites */}
      <section className="py-24 lg:py-32 bg-transparent border-y border-white/5 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4">
              <h4 className="text-primary uppercase tracking-[0.3em] text-xs font-bold">Unrivaled Comfort</h4>
              <h2 className="text-5xl lg:text-6xl font-serif font-bold leading-tight">
                Signature <span className="text-primary italic">Suites</span>
              </h2>
            </div>
            <Link href="/rooms" className="group flex items-center space-x-3 text-primary uppercase tracking-widest text-xs font-bold">
              <span>View All Accommodations</span>
              <div className="w-10 h-px bg-primary group-hover:w-16 transition-all" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {featuredRooms.length > 0 ? (
              featuredRooms.map((room, i) => (
                <div key={room.id || i} className="group cursor-pointer bg-black/40 border border-white/10 p-5 rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:shadow-luxury">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-6 bg-black/20">
                    <Image 
                      src={room.roomImages?.[0]?.imageUrl || room.roomType?.images?.[0] || '/images/hotel/hotel-hero-2.jpg'}
                      alt={room.roomType?.name || "Luxury Room"} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute top-4 left-4">
                      <div className="bg-black/85 px-4 py-2 border border-white/10 rounded-xl">
                        <span className="text-primary font-serif italic text-lg">{formatPrice(Number(room.roomType?.baseRate || '450'))}+</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, idx) => <Star key={idx} className="w-3 h-3 fill-primary text-primary" />)}
                    </div>
                    <h3 className="text-2xl font-serif font-bold group-hover:text-primary transition-colors">{room.roomType?.name || "Presidential Suite"}</h3>
                    <p className="text-white/60 text-sm font-light leading-relaxed line-clamp-2">
                      {room.roomType?.description || "Experience the pinnacle of luxury with panoramic city views and bespoke services."}
                    </p>
                    <Link href={`/rooms/${room.id || '#'}`} className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-bold pt-2 group-hover:translate-x-2 transition-transform text-white/80 hover:text-primary">
                      <span>Reserve Now</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-3 text-center py-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                <p className="text-white/60 font-light text-xl">Our luxury suites are currently being prepared for online booking.</p>
                <p className="text-white/40 font-light text-md mt-2">Please check back soon.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Experiences Section */}
      <SignatureExperiencesSection experiences={experiences} />

      {/* Testimonial Section */}
      <TestimonialSection />

      {/* Location Section */}
      <InteractiveLocationSection 
        properties={properties} 
        defaultContact={{ phone: contact.phone, email: contact.email }} 
      />

      {/* CTA Footer Section */}
      <section className="relative py-24 bg-black/60 backdrop-blur-xl border-t border-white/10 overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <Image src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920" alt="Background" fill className="object-cover" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center space-y-10">
          <h2 className="text-4xl lg:text-6xl font-serif font-bold text-white leading-tight">
            Ready to Experience <span className="text-primary italic">Pure Luxury?</span>
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/booking">
              <Button className="bg-gold-gradient hover:opacity-90 text-white px-12 h-16 rounded-xl text-xs uppercase tracking-[0.2em] font-bold border-none shadow-luxury w-full sm:w-auto">
                Begin Reservation
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-white/30 text-white rounded-xl px-12 h-16 uppercase tracking-[0.2em] text-xs font-bold hover:bg-white/10 hover:border-white transition-all w-full sm:w-auto bg-white/5 backdrop-blur-md">
                Contact Concierge
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
