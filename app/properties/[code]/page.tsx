import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, ChevronRight, Star, Users, Wind, ArrowRight, Navigation, ExternalLink, Sparkles, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import prisma from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { notFound } from 'next/navigation'
import { CmsService } from '@/lib/services/cms-service'

export const dynamic = 'force-dynamic'

interface PropertyDetailPageProps {
  params: Promise<{ code: string }>
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  if (!isDatabaseConfigured()) {
    return <div className="min-h-screen flex items-center justify-center text-white">Database not configured.</div>
  }

  const { code } = await params

  const property = await prisma.property.findUnique({
    where: { code, status: 'ACTIVE' }
  })

  if (!property) return notFound()

  // Fetch featured rooms, experiences, and facilities for THIS property
  const [featuredRooms, experiences, facilities] = await Promise.all([
    prisma.room.findMany({
      where: { status: 'AVAILABLE', propertyId: property.id },
      take: 3,
      include: {
        roomType: true,
        roomImages: { orderBy: { isMain: 'desc' }, take: 1 },
        feedback: true
      },
      orderBy: { roomType: { baseRate: 'desc' } }
    }),
    CmsService.getExperiences({ propertyId: property.id, activeOnly: true }),
    CmsService.getFacilities({ propertyId: property.id, status: 'ACTIVE' })
  ])

  const mapsUrl = property.googleMapsUrl || (property.latitude && property.longitude ? `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}` : null)

  return (
    <div className="bg-transparent text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-end justify-center overflow-hidden border-b border-white/5">
        <Image 
          src={property.mainImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1920'} 
          alt={property.name} 
          fill 
          className="object-cover absolute inset-0 -z-20 scale-105 transform" 
          priority
          unoptimized={!!property.mainImage}
        />
        <div className="absolute inset-0 bg-black/50 -z-10 backdrop-blur-[1px]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0a0a0a] to-transparent -z-10" />
        
        <div className="relative z-10 container mx-auto px-4 pb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-2 text-primary uppercase tracking-widest text-xs font-bold">
                <MapPin className="w-4 h-4" />
                {property.city}, {property.country}
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
                {property.name}
              </h1>
            </div>
            
            <div className="shrink-0 flex flex-col gap-3">
              <Link href={`/booking?property=${property.id}`}>
                <Button className="w-full sm:w-auto bg-gold-gradient text-white h-14 rounded-xl px-12 uppercase tracking-widest text-[10px] font-bold border-none shadow-luxury hover:opacity-90 transition-opacity">
                  Book Your Stay
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Property Details */}
      <section className="py-20 border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 space-y-8">
              <h2 className="text-3xl font-serif font-bold text-white">About The Property</h2>
              <p className="text-white/60 font-light text-lg leading-relaxed">
                {property.description || `Welcome to ${property.name}, an exquisite sanctuary located in the heart of ${property.city}. Discover unparalleled luxury, breathtaking views, and world-class amenities designed to provide an unforgettable experience.`}
              </p>
            </div>
            
            <div className="lg:col-span-4">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                <h3 className="text-xl font-serif font-bold text-white">Contact & Location</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4 text-white/60">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">{property.address}</p>
                      <p>{property.city}, {property.country}</p>
                    </div>
                  </div>
                  {property.latitude && property.longitude && (
                    <div className="flex items-center gap-4 text-white/60">
                      <Navigation className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-primary font-mono text-xs">
                        {property.latitude.toFixed(4)}° N, {Math.abs(property.longitude).toFixed(4)}° {property.longitude >= 0 ? 'E' : 'W'}
                      </p>
                    </div>
                  )}
                  {property.phone && (
                    <div className="flex items-center gap-4 text-white/60">
                      <Phone className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-white font-medium">{property.phone}</p>
                    </div>
                  )}
                  {property.email && (
                    <div className="flex items-center gap-4 text-white/60">
                      <Mail className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-white font-medium">{property.email}</p>
                    </div>
                  )}
                </div>

                {mapsUrl && (
                  <div className="pt-2">
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/20 h-11 rounded-xl text-xs uppercase tracking-wider font-bold">
                        <Navigation className="w-3.5 h-3.5 mr-2" />
                        <span>Get Directions</span>
                        <ExternalLink className="w-3 h-3 ml-1.5" />
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Suites */}
      {featuredRooms.length > 0 && (
        <section className="py-24 bg-black/20">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div className="space-y-2 max-w-2xl">
                <span className="text-primary uppercase tracking-[0.3em] text-[10px] font-bold">Accommodations</span>
                <h2 className="text-4xl font-serif font-bold text-white">Featured Suites</h2>
              </div>
              <Link href={`/rooms?property=${property.code}`} className="hidden md:flex items-center text-primary text-[10px] uppercase tracking-widest font-bold hover:text-white transition-colors">
                View All Suites <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRooms.map((room: any) => {
                const avgRating = room.feedback && room.feedback.length > 0
                  ? room.feedback.reduce((sum: number, r: any) => sum + r.rating, 0) / room.feedback.length
                  : 5.0

                return (
                  <div key={room.id} className="group relative">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl bg-black/20">
                      <Image 
                        src={room.roomImages?.[0]?.imageUrl || room.roomType.images?.[0] || '/images/hotel/hotel-hero-2.jpg'} 
                        alt={room.roomType.name} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                        unoptimized={!!room.roomImages?.[0]?.imageUrl}
                      />
                      <div className="absolute top-4 left-4 z-10">
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-primary/20">
                          <span className="text-primary font-serif italic text-base">{formatPrice(room.roomType.baseRate)}</span>
                          <span className="text-[9px] text-white/50 uppercase tracking-tighter ml-1">/ Night</span>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 z-10 flex gap-0.5">
                        {[...Array(Math.round(avgRating))].map((_, i) => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}
                      </div>
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 flex flex-col justify-end p-6 space-y-4">
                        <div className="flex gap-4 text-white/60">
                          <div className="flex items-center gap-1"><Users className="w-3 h-3" /><span className="text-[10px] uppercase tracking-wider">{room.roomType.capacity} Guests</span></div>
                          <div className="flex items-center gap-1"><Wind className="w-3 h-3" /><span className="text-[10px] uppercase tracking-wider">{room.size || '45'} m²</span></div>
                        </div>
                        <div className="flex gap-3">
                          <Link href={`/rooms/${room.id}`} className="flex-1">
                            <Button variant="outline" className="w-full border-white/30 text-white rounded-xl h-10 uppercase tracking-widest text-[9px] font-bold hover:bg-white/20 transition-all backdrop-blur-sm">
                              Details
                            </Button>
                          </Link>
                          <Link href={`/booking?room=${room.id}`} className="flex-1">
                            <Button className="w-full bg-gold-gradient text-white rounded-xl h-10 uppercase tracking-widest text-[9px] font-bold border-none shadow-luxury">
                              Reserve
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-serif font-bold text-white group-hover:text-primary transition-colors duration-300">{room.roomType.name}</h3>
                      </div>
                      <p className="text-xs text-white/40 font-light leading-relaxed line-clamp-1">
                        {room.roomType.description || "A sanctuary of refinement and curated luxury."}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <Link href={`/rooms?property=${property.code}`} className="md:hidden mt-8 flex justify-center w-full">
              <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/10 h-12 rounded-xl uppercase tracking-widest text-[10px] font-bold">
                View All Suites
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Signature Experiences for this property */}
      {experiences.length > 0 && (
        <section className="py-24 border-t border-white/5 bg-black/10">
          <div className="container mx-auto px-4">
            <div className="space-y-3 mb-12">
              <div className="flex items-center gap-2 text-primary uppercase tracking-widest text-[10px] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Curated Resort Journeys</span>
              </div>
              <h2 className="text-4xl font-serif font-bold text-white">Signature Experiences</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {experiences.map((exp: any) => (
                <div key={exp.id} className="bg-[#121118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-primary/40 transition-all">
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                      <Image src={exp.imageUrl} alt={exp.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-black/70 border border-primary/30 flex items-center justify-center text-sm shadow-luxury">
                          {exp.icon || '✨'}
                        </span>
                        <span className="bg-black/70 text-primary text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-primary/20">
                          {exp.category}
                        </span>
                      </div>
                      {exp.price && (
                        <div className="absolute top-3 right-3 bg-black/80 border border-primary/30 px-2.5 py-1 rounded-lg text-primary font-serif italic text-xs">
                          ${exp.price}
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-2">
                      <h3 className="text-xl font-serif font-bold text-white group-hover:text-primary transition-colors">{exp.title}</h3>
                      <p className="text-xs text-white/60 font-light line-clamp-3 leading-relaxed">{exp.description}</p>
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    <Link href={`/booking?property=${property.id}&experience=${encodeURIComponent(exp.title)}`}>
                      <Button variant="outline" className="w-full border-white/10 hover:border-primary/40 text-white rounded-xl h-10 text-xs font-bold uppercase tracking-wider">
                        Reserve Experience
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Facilities for this property */}
      {facilities.length > 0 && (
        <section className="py-24 border-t border-white/5 bg-black/30">
          <div className="container mx-auto px-4">
            <div className="space-y-3 mb-12">
              <span className="text-primary uppercase tracking-widest text-[10px] font-bold block">
                World-Class Amenities
              </span>
              <h2 className="text-4xl font-serif font-bold text-white">Resort Facilities</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {facilities.map((fac: any) => (
                <div key={fac.id} className="bg-[#121118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-primary/40 transition-all">
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                      <Image src={fac.imageUrl || 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=800'} alt={fac.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/70 text-primary text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-primary/20">
                          {fac.type}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white bg-black/70 px-2.5 py-1 rounded-lg border border-white/10">
                        <Clock className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-mono">{fac.operatingHours}</span>
                      </div>
                    </div>
                    <div className="p-6 space-y-2">
                      <h3 className="text-xl font-serif font-bold text-white group-hover:text-primary transition-colors">{fac.name}</h3>
                      <p className="text-xs text-white/60 font-light line-clamp-3 leading-relaxed">{fac.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
