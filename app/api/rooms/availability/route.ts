import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured, getDatabaseErrorMessage } from '@/lib/db-helpers'

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
  const { searchParams } = new URL(request.url)

  // Check database configuration first
  if (!isDatabaseConfigured()) {
    try {
      const { MOCK_ROOMS } = await import('@/lib/mock-rooms')
      const availableRooms = MOCK_ROOMS.filter(r => r.status === 'AVAILABLE').map(r => ({
        ...r,
        nights: 1,
        totalPrice: r.price,
        averageRating: 4.8,
        reviewCount: 12,
        mainImage: r.images[0]
      }))
      return NextResponse.json({
        availableRooms,
        totalAvailable: availableRooms.length,
        checkIn: searchParams.get('checkIn'),
        checkOut: searchParams.get('checkOut'),
        isMock: true,
        message: 'Database not configured. Using mock availability for preview.'
      })
    } catch (e) {
      return NextResponse.json(
        {
          error: 'Database not configured',
          message: 'DATABASE_URL environment variable is not set',
          availableRooms: [],
          totalAvailable: 0
        },
        { status: 503 }
      )
    }
  }

  try {
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

    // Note: Room model doesn't have roomImages or reviews relations defined in schema
    const allRooms = await prisma.room.findMany({
      where: whereClause
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

    const bookedRoomIds = new Set(conflictingBookings.map((b: any) => b.roomId))

    // Filter available rooms
    const availableRooms = allRooms.filter((room: any) => !bookedRoomIds.has(room.id))

    // Calculate pricing for each room
    // Note: Room model doesn't have roomImages or reviews relations defined in schema
    const roomsWithPricing = availableRooms.map((room: any) => {
      const reviews: any[] = [] // Reviews would need to be fetched separately if Review model exists
      const nights = getNightCount(checkInDate, checkOutDate)
      const basePrice = room.price * nights

      // Calculate average rating
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, review) => sum + (review.rating ?? 0), 0) / reviews.length
        : 0

      // Convert BigInt fields to Number for JSON serialization
      return {
        ...room,
        capacity: Number(room.capacity),
        floor: Number(room.floor),
        size: Number(room.size),
        nights,
        totalPrice: basePrice,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
        mainImage:
          (Array.isArray(room.images) && room.images.length > 0 ? room.images[0] : undefined) ||
          '/images/room-placeholder.jpg'
      }
    })

    return NextResponse.json({ 
      availableRooms: roomsWithPricing,
      totalAvailable: roomsWithPricing.length,
      checkIn,
      checkOut
    })

  } catch (error: any) {
    console.error('Availability check error:', error)
    const message = getDatabaseErrorMessage(error)
    return NextResponse.json(
      {
        error: 'Failed to check room availability',
        message,
        availableRooms: [],
        totalAvailable: 0
      },
      { status: 503 }
    )
  }
}
