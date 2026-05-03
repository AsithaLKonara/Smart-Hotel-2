import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Star, Users, Wifi, Car, Utensils, Waves, Dumbbell, Shield, MapPin, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FallbackImage } from '@/components/ui/fallback-image'
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
  
  const room = await prisma.room.findUnique({ where: { id } })
  
  if (!room) return { title: 'Room Not Found' }
  
  return {
    title: `${room.type} | SmartHotel Grand Palace`,
    description: room.description || `Book our luxurious ${room.type} starting from ${formatPrice(room.price)} per night.`,
    openGraph: {
      title: room.type,
      description: room.description || `Experience unparalleled luxury in our ${room.type}.`,
      images: Array.isArray(room.images) && room.images[0] ? [room.images[0]] : [],
    }
  }
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  let id: string
  try {
    const paramsData = await params
    id = paramsData.id
  } catch (error) {
    console.error('Error loading room details page:', error)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn't find the room you're looking for. It may have been removed or the link is incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rooms">
              <Button className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse All Rooms
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Validate id parameter
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Invalid Room ID</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The room ID provided is invalid. Please check the link and try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rooms">
              <Button className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse All Rooms
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Check database configuration
  if (!isDatabaseConfigured()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Service Temporarily Unavailable</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We're currently experiencing technical difficulties. Please try again later or contact us for assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rooms">
              <Button className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse All Rooms
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  let room
  try {
    // Note: Room model doesn't have roomImages or reviews relations defined in schema
    room = await prisma.room.findUnique({
      where: { id: id.trim() }
    })
    
    // Reviews would need to be fetched separately if Review model exists
    // const reviews = await prisma.review.findMany({
    //   where: { roomId: id },
    //   take: 5,
    //   orderBy: { createdAt: 'desc' },
    //   include: {
    //     user: {
    //       select: {
    //         name: true,
    //       },
    //     },
    //   },
    // })
  } catch (error) {
    console.error('Error fetching room details:', error)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We encountered an error while loading the room details. Please try again later.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rooms">
              <Button className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse All Rooms
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn't find a room with that ID. It may have been removed or the link is incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rooms">
              <Button className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse All Rooms
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Convert BigInt fields to numbers for serialization
  const serializedRoom = {
    ...room,
    capacity: Number(room.capacity),
    floor: room.floor ? Number(room.floor) : null,
    size: room.size ? Number(room.size) : null,
  }

  // Note: Reviews don't exist in Room model - would need to be fetched separately if Review model exists
  const reviews: any[] = []
  const avgRating = 0 // Default rating since reviews aren't available

  // Note: roomImages relation doesn't exist - use images array from Room model
  // Use type-specific placeholder images
  const getDefaultRoomImage = (roomType: string): string => {
    const typeLower = roomType.toLowerCase()
    if (typeLower.includes('standard')) {
      return '/images/hotel/room-standard.jpg'
    } else if (typeLower.includes('deluxe')) {
      return '/images/hotel/room-deluxe.jpg'
    } else if (typeLower.includes('suite') || typeLower.includes('presidential')) {
      return '/images/hotel/room-suite.jpg'
    } else if (typeLower.includes('luxury')) {
      return '/images/hotel/room-luxury.jpg'
    }
    return '/images/room-placeholder.jpg'
  }
  
  const images = serializedRoom.images && Array.isArray(serializedRoom.images) && serializedRoom.images.length > 0
    ? serializedRoom.images
    : [getDefaultRoomImage(serializedRoom.type)]

  const amenities = Array.isArray(serializedRoom.amenities) ? serializedRoom.amenities : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HotelRoom",
            "name": serializedRoom.type,
            "description": serializedRoom.description,
            "image": images[0],
            "occupancy": {
              "@type": "QuantitativeValue",
              "value": serializedRoom.capacity
            },
            "offers": {
              "@type": "Offer",
              "price": serializedRoom.price,
              "priceCurrency": "LKR",
              "availability": "https://schema.org/InStock"
            },
            "amenityFeature": amenities.map(a => ({
              "@type": "LocationFeatureSpecification",
              "name": a,
              "value": true
            }))
          })
        }}
      />
      {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4">
          <Link href="/rooms" className="inline-flex items-center gap-2 mb-6 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Rooms
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {serializedRoom.type}
            </Badge>
            {avgRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-white/70">({reviews.length})</span>
              </div>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{serializedRoom.type}</h1>
          <p className="text-xl opacity-90 max-w-3xl">
            {serializedRoom.description || 'Experience luxury and comfort in our beautifully designed accommodations.'}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images and Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Images */}
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <div className="aspect-video relative">
                  <FallbackImage
                    src={images[0] || getDefaultRoomImage(serializedRoom.type)}
                    fallbackSrc={getDefaultRoomImage(serializedRoom.type)}
                    alt={serializedRoom.type}
                    fill
                    className="object-cover"
                    priority={true}
                    unoptimized={false}
                  />
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {images.slice(1, 5).map((img, idx) => (
                      <div key={idx} className="aspect-video relative rounded overflow-hidden">
                        <FallbackImage
                          src={img}
                          fallbackSrc={getDefaultRoomImage(serializedRoom.type)}
                          alt={`${serializedRoom.type} ${idx + 2}`}
                          fill
                          className="object-cover"
                          unoptimized={false}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">About This Room</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {serializedRoom.description || 'This beautifully appointed room offers the perfect blend of comfort and luxury, designed to make your stay unforgettable.'}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <Users className="w-5 h-5" />
                      <span className="font-medium">Capacity</span>
                    </div>
                    <p className="text-lg font-semibold">{serializedRoom.capacity} Guests</p>
                  </div>
                  {serializedRoom.size && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <MapPin className="w-5 h-5" />
                        <span className="font-medium">Size</span>
                      </div>
                      <p className="text-lg font-semibold">{serializedRoom.size}m²</p>
                    </div>
                  )}
                  {serializedRoom.floor && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <span className="font-medium">Floor</span>
                      </div>
                      <p className="text-lg font-semibold">Floor {serializedRoom.floor}</p>
                    </div>
                  )}
                  {serializedRoom.number && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <span className="font-medium">Room Number</span>
                      </div>
                      <p className="text-lg font-semibold">{serializedRoom.number}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Amenities */}
              {amenities.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {amenities.map((amenity, idx) => {
                      const iconMap: Record<string, any> = {
                        wifi: Wifi,
                        parking: Car,
                        restaurant: Utensils,
                        pool: Waves,
                        gym: Dumbbell,
                        security: Shield,
                      }
                      const Icon = iconMap[amenity.toLowerCase()] || Star
                      
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-primary-600" />
                          <span className="text-gray-700 dark:text-gray-300 capitalize">{amenity}</span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Guest Reviews</h2>
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (review.rating || 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">{review.user?.name || 'Anonymous'}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {formatPrice(serializedRoom.price)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">per night</div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Capacity</span>
                    <span className="font-semibold">{serializedRoom.capacity} Guests</span>
                  </div>
                  {serializedRoom.size && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Size</span>
                      <span className="font-semibold">{serializedRoom.size}m²</span>
                    </div>
                  )}
                  {avgRating > 0 && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <Link href={`/booking?room=${serializedRoom.id}`} className="block w-full">
                  <Button className="w-full btn-primary" size="lg">
                    Book Now
                  </Button>
                </Link>

                <div className="mt-4 text-center">
                  <Link href="/contact" className="text-sm text-primary-600 hover:underline">
                    Have questions? Contact us
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

