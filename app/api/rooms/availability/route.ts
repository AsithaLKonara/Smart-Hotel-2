import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const checkIn = searchParams.get('checkin')
    const checkOut = searchParams.get('checkout')
    const guests = searchParams.get('guests')
    const roomType = searchParams.get('type')

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Check-in and check-out dates are required' },
        { status: 400 }
      )
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      )
    }

    if (checkInDate < new Date()) {
      return NextResponse.json(
        { error: 'Check-in date cannot be in the past' },
        { status: 400 }
      )
    }

    // Get all rooms
    let whereClause: any = {
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
    const conflictingBookings = await prisma.booking.findMany({
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
    })

    const bookedRoomIds = new Set(conflictingBookings.map(b => b.roomId))

    // Filter available rooms
    const availableRooms = allRooms.filter(room => !bookedRoomIds.has(room.id))

    // Calculate pricing for each room
    const roomsWithPricing = availableRooms.map(room => {
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      const basePrice = room.price * nights

      // Calculate average rating
      const avgRating = room.reviews.length > 0 
        ? room.reviews.reduce((sum, review) => sum + review.rating, 0) / room.reviews.length
        : 0

      return {
        ...room,
        nights,
        totalPrice: basePrice,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: room.reviews.length,
        mainImage: room.roomImages.find(img => img.isMain)?.url || room.images[0] || '/images/room-placeholder.jpg'
      }
    })

    return NextResponse.json({
      availableRooms: roomsWithPricing,
      searchCriteria: {
        checkIn,
        checkOut,
        guests: guests ? parseInt(guests) : null,
        roomType
      },
      totalResults: roomsWithPricing.length
    })

  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json(
      { error: 'Failed to check room availability' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
