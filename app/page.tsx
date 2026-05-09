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
import { getHotelContactInfo } from '@/lib/settings'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import prisma from '@/lib/db'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

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

  if (isDatabaseConfigured()) {
    try {
      contact = await getHotelContactInfo()
      featuredRooms = await prisma.room.findMany({
        take: 3,
        orderBy: { price: 'desc' },
        select: { id: true, type: true, price: true, description: true, roomImages: { where: { isMain: true }, take: 1 } },
      })
    } catch (error) {
      console.error('Data fetch error:', error)
    }
  }

  return (
    <div className="bg-transparent text-foreground font-sans">
      <EnhancedHeroSection />

      {/* Our Story Section */}
      <section className="py-24 lg:py-32 overflow-hidden bg-black/30 backdrop-blur-md border-y border-white/5 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <Image 
                  src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000" 
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

              <Button variant="outline" className="border-primary/50 text-white rounded-none px-10 h-14 uppercase tracking-widest text-xs font-bold hover:bg-primary hover:border-primary hover:text-white transition-all bg-white/5 backdrop-blur-md">
                Learn More About Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Suites */}
      <section className="py-24 lg:py-32 bg-black/45 backdrop-blur-lg border-y border-white/5 text-white">
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
            {(featuredRooms.length > 0 ? featuredRooms : [1, 2, 3]).map((room, i) => (
              <div key={i} className="group cursor-pointer bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:shadow-luxury">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-6">
                  <Image 
                    src={room.roomImages?.[0]?.url || `https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=800&sig=${i}`}
                    alt={room.type || "Luxury Room"} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute top-4 left-4">
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 border border-white/10 rounded-lg">
                      <span className="text-primary font-serif italic text-lg">{formatPrice(Number(room.price || '450'))}+</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, idx) => <Star key={idx} className="w-3 h-3 fill-primary text-primary" />)}
                  </div>
                  <h3 className="text-2xl font-serif font-bold group-hover:text-primary transition-colors">{room.type || "Presidential Suite"}</h3>
                  <p className="text-white/60 text-sm font-light leading-relaxed line-clamp-2">
                    {room.description || "Experience the pinnacle of luxury with panoramic city views and bespoke services."}
                  </p>
                  <Link href={`/rooms/${room.id || '#'}`} className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-bold pt-2 group-hover:translate-x-2 transition-transform text-white/80 hover:text-primary">
                    <span>Reserve Now</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experiences Section */}
      <section className="py-24 lg:py-32 bg-black/25 backdrop-blur-md border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-20">
            <h4 className="text-primary uppercase tracking-[0.3em] text-xs font-bold">Stay Beyond Ordinary</h4>
            <h2 className="text-5xl lg:text-6xl font-serif font-bold text-white">
              Signature <span className="text-primary italic">Experiences</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Fine Dining', icon: '🍷', desc: 'Michelin-starred culinary excellence', img: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800' },
              { title: 'Royal Spa', icon: '✨', desc: 'Holistic wellness and rejuvenation', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800' },
              { title: 'Sky Lounge', icon: '🌃', desc: 'Rooftop cocktails with city views', img: 'https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&q=80&w=800' },
              { title: 'Concierge', icon: '🔑', desc: 'Bespoke 24/7 personal assistance', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
            ].map((exp, i) => (
              <div key={i} className="relative group aspect-square overflow-hidden cursor-pointer rounded-2xl border border-white/10 shadow-2xl">
                <Image src={exp.img} alt={exp.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/45 group-hover:bg-black/75 transition-all duration-500" />
                <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                  <span className="text-4xl mb-4">{exp.icon}</span>
                  <h3 className="text-2xl font-serif font-bold mb-2">{exp.title}</h3>
                  <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">{exp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 lg:py-32 bg-black/45 backdrop-blur-xl border-y border-white/5 overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <Quote className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 text-primary/5 -z-10" />
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-primary text-primary" />)}
            </div>
            <h2 className="text-3xl lg:text-5xl font-serif font-bold italic text-white leading-tight">
              "An extraordinary experience from start to finish. The attention to detail and personalized service at {contact.name} is simply world-class."
            </h2>
            <div className="space-y-2">
              <h5 className="text-white font-bold tracking-widest uppercase text-sm">Alexandra Sterling</h5>
              <p className="text-primary text-xs uppercase tracking-widest">Global Travel Critic</p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-24 lg:py-32 bg-black/30 backdrop-blur-md border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-primary uppercase tracking-[0.3em] text-xs font-bold">Perfect Location</h4>
                <h2 className="text-5xl lg:text-6xl font-serif font-bold text-white leading-tight">
                  In the Heart of <span className="text-primary italic">Everything</span>
                </h2>
              </div>
              <p className="text-lg text-white/70 leading-relaxed font-light">
                Situated in the prestigious Downtown District, our hotel offers seamless access to the city's finest galleries, boutiques, and business centers.
              </p>
              
              <div className="space-y-6 pt-4">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-bold text-white">Address</h4>
                    <p className="text-white/60 text-sm">{contact.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-bold text-white">Reservation Line</h4>
                    <p className="text-white/60 text-sm">{contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-bold text-white">Email Inquiries</h4>
                    <p className="text-white/60 text-sm">{contact.email}</p>
                  </div>
                </div>
              </div>

              <Button className="bg-primary hover:bg-primary/95 text-primary-foreground rounded-none px-10 h-14 uppercase tracking-widest text-xs font-bold transition-all">
                Get Directions
              </Button>
            </div>

            <div className="relative aspect-video lg:aspect-square bg-gray-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1449156001533-cb39c771585b?auto=format&fit=crop&q=80&w=1000" 
                alt="City Map View" 
                fill 
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
                  <div className="relative w-8 h-8 bg-primary rounded-full border-4 border-white shadow-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              <Button className="bg-gold-gradient hover:opacity-90 text-white px-12 h-16 rounded-none text-xs uppercase tracking-[0.2em] font-bold border-none shadow-luxury w-full sm:w-auto">
                Begin Reservation
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-white/30 text-white rounded-none px-12 h-16 uppercase tracking-[0.2em] text-xs font-bold hover:bg-white/10 hover:border-white transition-all w-full sm:w-auto bg-white/5 backdrop-blur-md">
                Contact Concierge
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
