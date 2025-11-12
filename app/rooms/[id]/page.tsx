import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Star, Users, Wifi, Car, Utensils, Waves, Dumbbell, Shield, MapPin, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/db'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface RoomDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { id } = await params

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      roomImages: true,
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
            }
          }
        }
      }
    }
  })

  if (!room) {
    notFound()
  }

  const reviews = Array.isArray(room.reviews) ? room.reviews : []
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / reviews.length
    : 0

  const images = room.roomImages && room.roomImages.length > 0
    ? room.roomImages.map(img => img.url)
    : room.images && Array.isArray(room.images)
    ? room.images
    : ['/images/room-placeholder.jpg']

  const amenities = Array.isArray(room.amenities) ? room.amenities : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <section className="pt-20 pb-12 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4">
          <Link href="/rooms" className="inline-flex items-center gap-2 mb-6 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Rooms
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {room.type}
            </Badge>
            {avgRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-white/70">({reviews.length})</span>
              </div>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">{room.type}</h1>
          <p className="text-xl opacity-90 max-w-3xl">
            {room.description || 'Experience luxury and comfort in our beautifully designed accommodations.'}
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
                  <Image
                    src={images[0] || '/images/room-placeholder.jpg'}
                    alt={room.type}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {images.slice(1, 5).map((img, idx) => (
                      <div key={idx} className="aspect-video relative rounded overflow-hidden">
                        <Image
                          src={img}
                          alt={`${room.type} ${idx + 2}`}
                          fill
                          className="object-cover"
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
                  {room.description || 'This beautifully appointed room offers the perfect blend of comfort and luxury, designed to make your stay unforgettable.'}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <Users className="w-5 h-5" />
                      <span className="font-medium">Capacity</span>
                    </div>
                    <p className="text-lg font-semibold">{room.capacity} Guests</p>
                  </div>
                  {room.size && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <MapPin className="w-5 h-5" />
                        <span className="font-medium">Size</span>
                      </div>
                      <p className="text-lg font-semibold">{room.size}m²</p>
                    </div>
                  )}
                  {room.floor && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <span className="font-medium">Floor</span>
                      </div>
                      <p className="text-lg font-semibold">Floor {room.floor}</p>
                    </div>
                  )}
                  {room.number && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <span className="font-medium">Room Number</span>
                      </div>
                      <p className="text-lg font-semibold">{room.number}</p>
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
                    {formatPrice(room.price)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">per night</div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Capacity</span>
                    <span className="font-semibold">{room.capacity} Guests</span>
                  </div>
                  {room.size && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Size</span>
                      <span className="font-semibold">{room.size}m²</span>
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

                <Link href={`/booking?room=${room.id}`} className="block w-full">
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

