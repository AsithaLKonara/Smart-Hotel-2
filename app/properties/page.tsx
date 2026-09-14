import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import prisma from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  if (!isDatabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Database not configured.
      </div>
    )
  }

  const properties = await prisma.property.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' }
  })

  return (
    <div className="bg-transparent text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <Image 
          src="/images/hotel/hotel-hero-3.jpg" 
          alt="Luxury Locations" 
          fill 
          className="object-cover absolute inset-0 -z-20 scale-105 transform" 
          priority 
        />
        <div className="absolute inset-0 bg-black/70 -z-10 backdrop-blur-[2px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent -z-10" />
        
        <div className="relative z-10 container mx-auto px-4 text-center pt-32 pb-16">
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3 text-primary uppercase tracking-[0.4em] text-xs font-bold">
              <div className="w-12 h-px bg-primary" />
              <span>Global Presence</span>
              <div className="w-12 h-px bg-primary" />
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
              Our <span className="text-primary italic">Destinations</span>
            </h1>
            <p className="text-white/50 font-light text-lg max-w-xl mx-auto">
              Discover unparalleled luxury across the globe. Each of our properties offers a unique blend of local culture and world-class hospitality.
            </p>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          {properties.length === 0 ? (
            <div className="text-center py-20 text-white/40 font-serif text-2xl">No destinations found.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {properties.map((property: any, idx: number) => (
                <div 
                  key={property.id}
                  className="group flex flex-col bg-white/5 rounded-3xl overflow-hidden border border-white/10 hover:border-primary/30 transition-all duration-500"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-black/20">
                    <Image 
                      src={property.mainImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200'}
                      alt={property.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      unoptimized={!!property.mainImage}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex items-center gap-2 text-primary text-[10px] uppercase tracking-widest font-bold mb-2">
                        <MapPin className="w-3 h-3" />
                        {property.city}, {property.country}
                      </div>
                      <h3 className="text-3xl font-serif font-bold text-white">{property.name}</h3>
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                    <p className="text-white/60 font-light leading-relaxed line-clamp-3">
                      {property.description || `Experience the finest accommodation in ${property.city}. Enjoy world-class amenities and bespoke services tailored for your absolute comfort.`}
                    </p>
                    
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <div className="flex items-start gap-3 text-sm text-white/50">
                        <MapPin className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
                        <span>{property.address}, {property.city}</span>
                      </div>
                      {(property.phone || property.email) && (
                        <div className="flex flex-wrap gap-6 text-sm text-white/50">
                          {property.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-white/30" />
                              <span>{property.phone}</span>
                            </div>
                          )}
                          {property.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-white/30" />
                              <span>{property.email}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <Link href={`/properties/${property.code}`} className="flex-1">
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 h-12 rounded-xl uppercase tracking-widest text-[10px] font-bold">
                          Explore Property
                        </Button>
                      </Link>
                      <Link href={`/booking?property=${property.id}`} className="flex-1">
                        <Button className="w-full bg-gold-gradient text-white border-none shadow-luxury h-12 rounded-xl uppercase tracking-widest text-[10px] font-bold hover:opacity-90">
                          Book Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
