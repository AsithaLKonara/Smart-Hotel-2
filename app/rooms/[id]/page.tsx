import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Star, Users, Wifi, Car, Utensils, Waves, Dumbbell, Shield, MapPin, Home, Bath, Coffee, Tv, Wind, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import prisma from '@/lib/db'
import { formatPrice } from '@/lib/utils'
import { isDatabaseConfigured } from '@/lib/db-helpers'

export const dynamic = 'force-dynamic'

interface RoomDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: RoomDetailPageProps): Promise<Metadata> {
  const { id } = await params
  if (!isDatabaseConfigured()) return { title: 'Room Details' }
  const room = await prisma.room.findUnique({ 
    where: { id },
    include: { roomType: true }
  })
  if (!room) return { title: 'Room Not Found' }
  return {
    title: `${room.roomType.name} | SmartHotel Grand Palace`,
    description: room.roomType.description || `Book our luxurious ${room.roomType.name} starting from ${formatPrice(room.roomType.baseRate)} per night.`,
  }
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4 space-y-6">
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto">
          <Home className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-white">{title}</h1>
        <p className="text-white/50 font-light">{message}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/rooms">
            <Button className="bg-gold-gradient text-white rounded-xl px-8 h-12 uppercase tracking-widest text-xs font-bold border-none shadow-luxury">
              <ArrowLeft className="w-4 h-4 mr-2" />Browse Rooms
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="border-white/20 text-white rounded-xl px-8 h-12 uppercase tracking-widest text-xs font-bold hover:bg-white/10">
              Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  let id: string
  try {
    const p = await params
    id = p.id
  } catch {
    return <ErrorState title="Room Not Found" message="We couldn't load this room." />
  }

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return <ErrorState title="Invalid Room" message="The room ID provided is invalid." />
  }

  if (!isDatabaseConfigured()) {
    return <ErrorState title="Service Unavailable" message="We're currently experiencing technical difficulties." />
  }

  let room
  try {
    room = await prisma.room.findUnique({ 
      where: { id: id.trim() },
      include: { 
        roomType: true,
        roomImages: { orderBy: { isMain: 'desc' } }
      }
    })
  } catch {
    return <ErrorState title="Room Not Found" message="We encountered an error while loading this room." />
  }

  if (!room) {
    return <ErrorState title="Room Not Found" message="No room found with that ID." />
  }

  const serializedRoom = {
    ...room,
    capacity: Number(room.capacity),
    floor: room.floor ? Number(room.floor) : null,
    size: room.size ? Number(room.size) : null,
    type: room.roomType.name,
    price: room.roomType.baseRate,
    description: room.roomType.description,
    amenities: room.roomType.amenities,
    images: room.roomType.images,
    roomImagesUrls: room.roomImages?.map((img: any) => img.imageUrl) || [],
  }

  // Build a 5-image gallery using available images + curated fallbacks
  const roomTypeImages: Record<string, string[]> = {
    standard: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=800',
    ],
    deluxe: [
      'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=800',
    ],
    suite: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1574643156929-51fa098b0394?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800',
    ],
    presidential: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80&w=800',
    ],
  }

  const typeLower = serializedRoom.type.toLowerCase()
  const fallbackKey = Object.keys(roomTypeImages).find(k => typeLower.includes(k)) || 'deluxe'
  const fallbackImages = roomTypeImages[fallbackKey]

  const dbImages = serializedRoom.roomImagesUrls.length > 0 
    ? serializedRoom.roomImagesUrls 
    : (Array.isArray(serializedRoom.images) && serializedRoom.images.length > 0 ? serializedRoom.images as string[] : [])

  // If we have DB images, use them. Otherwise use fallbacks.
  const gallery: string[] = dbImages.length > 0 ? dbImages : fallbackImages

  const amenities = Array.isArray(serializedRoom.amenities) ? serializedRoom.amenities as string[] : []

  const amenityIconMap: Record<string, any> = {
    wifi: Wifi, parking: Car, restaurant: Utensils, pool: Waves,
    gym: Dumbbell, security: Shield, bath: Bath, coffee: Coffee,
    tv: Tv, 'air conditioning': Wind,
  }

  const policies = [
    { icon: Clock, label: 'Check-in', value: 'From 15:00' },
    { icon: Clock, label: 'Check-out', value: 'Until 11:00' },
    { icon: CheckCircle, label: 'Cancellation', value: 'Free up to 48 hours' },
    { icon: Users, label: 'Max Guests', value: `${serializedRoom.capacity} guests` },
  ]

  const included = [
    'Daily housekeeping service',
    'Complimentary high-speed WiFi',
    'Premium minibar on arrival',
    'Evening turndown service',
    '24/7 in-room dining',
    'Luxury bath amenities',
  ]

  return (
    <div className="bg-transparent text-white min-h-screen">
      {/* Hero Blur Header */}
      <section className="relative h-[35vh] min-h-[280px] overflow-hidden">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-10">
          <Link href="/rooms" className="inline-flex items-center gap-2 mb-4 text-white/50 hover:text-primary transition-colors text-sm uppercase tracking-widest font-bold">
            <ArrowLeft className="w-4 h-4" />Back to Rooms
          </Link>
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-primary uppercase tracking-[0.3em] text-xs font-bold">{serializedRoom.type}</span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">{serializedRoom.type} Suite</h1>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-3xl font-serif font-bold text-primary">{formatPrice(serializedRoom.price)}</p>
              <p className="text-white/40 text-xs uppercase tracking-widest">per night</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left: Gallery + Details */}
            <div className="lg:col-span-2 space-y-10">

              {/* 5-Image Gallery */}
              <div className="space-y-3">
                {/* Main hero image */}
                <div className="relative aspect-video overflow-hidden rounded-2xl">
                  <Image
                    src={gallery[0]}
                    alt={`${serializedRoom.type} main view`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    priority
                    unoptimized
                  />
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-primary/20">
                    <span className="text-primary font-serif italic">{formatPrice(serializedRoom.price)}</span>
                    <span className="text-white/40 text-[9px] uppercase ml-1">/ night</span>
                  </div>
                  <div className="absolute bottom-4 left-4 flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}
                  </div>
                </div>
                {/* thumbnails */}
                {gallery.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {gallery.slice(1, 5).map((img, idx) => (
                      <div key={idx} className="relative aspect-video overflow-hidden rounded-xl bg-black/20">
                        <Image
                          src={img}
                          alt={`${serializedRoom.type} view ${idx + 2}`}
                          fill
                          className="object-cover hover:scale-110 transition-transform duration-500"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* About */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-6">
                <h2 className="text-2xl font-serif font-bold text-white">About This Suite</h2>
                <p className="text-white/60 font-light leading-relaxed">
                  {serializedRoom.description || 'This beautifully appointed suite offers the perfect blend of comfort and luxury, designed to make your stay an unforgettable experience. Every detail has been curated to provide a sanctuary of refined elegance.'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                  {[
                    { label: 'Guests', value: `${serializedRoom.capacity}`, icon: Users },
                    { label: 'Size', value: serializedRoom.size ? `${serializedRoom.size} m²` : '45 m²', icon: MapPin },
                    { label: 'Floor', value: serializedRoom.floor ? `Floor ${serializedRoom.floor}` : 'Various', icon: Home },
                    { label: 'Room No.', value: serializedRoom.number || 'TBC', icon: Shield },
                  ].map((spec, i) => (
                    <div key={i} className="text-center space-y-2 p-4 bg-white/5 rounded-xl border border-white/5">
                      <spec.icon className="w-5 h-5 text-primary mx-auto" />
                      <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">{spec.label}</p>
                      <p className="text-sm font-bold text-white">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-6">
                  <h2 className="text-2xl font-serif font-bold text-white">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {amenities.map((amenity, idx) => {
                      const key = amenity.toLowerCase()
                      const Icon = Object.keys(amenityIconMap).find(k => key.includes(k))
                        ? amenityIconMap[Object.keys(amenityIconMap).find(k => key.includes(k))!]
                        : Star
                      return (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/20 transition-colors">
                          <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm text-white/70 capitalize">{amenity}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* What's Included */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-6">
                <h2 className="text-2xl font-serif font-bold text-white">What&apos;s Included</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {included.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-white/60 font-light">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-6">
                <h2 className="text-2xl font-serif font-bold text-white">Policies</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {policies.map((policy, i) => (
                    <div key={i} className="text-center space-y-2 p-4 bg-white/5 rounded-xl border border-white/5">
                      <policy.icon className="w-4 h-4 text-primary mx-auto" />
                      <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">{policy.label}</p>
                      <p className="text-xs font-medium text-white">{policy.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Sticky Booking Card */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sticky top-28 space-y-8">
                <div className="text-center space-y-1 border-b border-white/10 pb-6">
                  <p className="text-4xl font-serif font-bold text-primary">{formatPrice(serializedRoom.price)}</p>
                  <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Per Night</p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Capacity', value: `${serializedRoom.capacity} Guests` },
                    { label: 'Size', value: serializedRoom.size ? `${serializedRoom.size} m²` : '45 m²' },
                    { label: 'Floor', value: serializedRoom.floor ? `Floor ${serializedRoom.floor}` : 'Various' },
                    { label: 'Rating', value: '5.0 ★' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{item.label}</span>
                      <span className="text-sm font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>

                <Link href={`/booking?room=${serializedRoom.id}`} className="block">
                  <Button className="w-full bg-gold-gradient text-white h-14 rounded-xl uppercase tracking-[0.2em] text-xs font-bold border-none shadow-luxury hover:opacity-90 transition-opacity">
                    Reserve This Suite
                  </Button>
                </Link>

                <p className="text-center text-xs text-white/30 font-light">
                  Free cancellation up to 48 hours before arrival
                </p>

                <div className="text-center pt-2 border-t border-white/5">
                  <Link href="/contact" className="text-xs text-primary hover:underline uppercase tracking-widest font-bold">
                    Questions? Contact Concierge
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
