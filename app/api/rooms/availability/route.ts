import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

const MS_PER_DAY = 1000 * 60 * 60 * 24

function getNightCount(checkInDate: Date, checkOutDate: Date): number {
  const checkInUTC = Date.UTC(
    checkInDate.getFullYear(),
    checkInDate.getMonth(),
    checkInDate.getDate()
  )
  const checkOutUTC = Date.UTC(
    checkOutDate.getFullYear(),
    checkOutDate.getMonth(),
    checkOutDate.getDate()
  )

  return Math.max(0, Math.round((checkOutUTC - checkInUTC) / MS_PER_DAY))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const checkIn = searchParams.get('checkIn') ?? searchParams.get('checkin')
    const checkOut = searchParams.get('checkOut') ?? searchParams.get('checkout')
    const guests = searchParams.get('guests')
    const roomType = searchParams.get('type')

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      )
    }

    // Get all rooms
    const whereClause: Prisma.RoomWhereInput = {
      status: 'AVAILABLE'
    }

    // Filter by room type if specified
    if (roomType && roomType !== 'all') {
      whereClause.type = roomType
    }

    // Filter by capacity if specified
    if (guests) {
      whereClause.capacity = {
        gte: parseInt(guests)
      }
    }

    const allRooms = await prisma.room.findMany({
      where: whereClause,
      include: {
        roomImages: true,
        reviews: true
      }
    })

    // Check for conflicting bookings
    const conflictingBookings =
      (await prisma.booking.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'CHECKED_IN']
        },
        OR: [
          // Check-in during requested period
          {
            checkIn: {
              gte: checkInDate,
              lt: checkOutDate
            }
          },
          // Check-out during requested period
          {
            checkOut: {
              gt: checkInDate,
              lte: checkOutDate
            }
          },
          // Booking spans the entire requested period
          {
            checkIn: {
              lte: checkInDate
            },
            checkOut: {
              gte: checkOutDate
            }
          }
        ]
      },
      select: {
        roomId: true
      }
    })) ?? []

    const bookedRoomIds = new Set(conflictingBookings.map(b => b.roomId))

    // Filter available rooms
    const availableRooms = allRooms.filter(room => !bookedRoomIds.has(room.id))

    // Calculate pricing for each room
    type RoomWithRelations = Prisma.RoomGetPayload<{
      include: { roomImages: true; reviews: true }
    }>

    const roomsWithPricing = availableRooms.map((room: RoomWithRelations) => {
      const reviews = Array.isArray(room.reviews) ? room.reviews : []
      const nights = getNightCount(checkInDate, checkOutDate)
      const basePrice = room.price * nights

      // Calculate average rating
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, review) => sum + (review.rating ?? 0), 0) / reviews.length
        : 0

      return {
        ...room,
        nights,
        totalPrice: basePrice,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
        mainImage:
          room.roomImages?.find(img => img.isMain)?.url ||
          (Array.isArray(room.images) ? room.images[0] : undefined) ||
          '/images/room-placeholder.jpg'
      }
    })

    return NextResponse.json({ availability: roomsWithPricing })

  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json(
      { error: 'Failed to check room availability' },
      { status: 500 }
    )
  }
}
