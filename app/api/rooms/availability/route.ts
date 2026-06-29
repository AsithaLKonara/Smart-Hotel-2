import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured, getDatabaseErrorMessage } from '@/lib/db-helpers'

const MS_PER_DAY = 1000 * 60 * 60 * 24

function getNightCount(checkInDate: Date, checkOutDate: Date): number {
  const checkInUTC = Date.UTC(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate())
  const checkOutUTC = Date.UTC(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate())
  return Math.max(1, Math.round((checkOutUTC - checkInUTC) / MS_PER_DAY))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const checkIn = searchParams.get('checkIn') ?? searchParams.get('checkin')
  const checkOut = searchParams.get('checkOut') ?? searchParams.get('checkout')
  const guests = parseInt(searchParams.get('guests') || '1')
  const typeName = searchParams.get('type')

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured', availableRooms: [] }, { status: 503 })
  }

  try {
    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing check-in or check-out dates' }, { status: 400 })
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkInDate >= checkOutDate) {
      return NextResponse.json({ error: 'Invalid stay dates' }, { status: 400 })
    }

    // 1. Get all potential rooms matching basic criteria (Type/Capacity)
    const whereClause: Prisma.RoomWhereInput = {
      status: { notIn: ['MAINTENANCE', 'OUT_OF_ORDER'] },
      roomType: {
        capacity: { gte: guests }
      }
    }

    if (typeName && typeName !== 'all') {
      whereClause.roomType = {
        name: { equals: typeName, mode: 'insensitive' },
        capacity: { gte: guests }
      }
    }

    const candidateRooms = await prisma.room.findMany({
      where: whereClause,
      include: {
        roomType: true,
        roomImages: true,
        feedback: true
      }
    })

    // 2. Identify conflicting bookings in the requested period
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        OR: [
          { checkIn: { gte: checkInDate, lt: checkOutDate } },
          { checkOut: { gt: checkInDate, lte: checkOutDate } },
          { checkIn: { lte: checkInDate }, checkOut: { gte: checkOutDate } }
        ]
      },
      select: { 
        roomAssignments: {
          select: { roomId: true }
        }
      }
    })

    const bookedRoomIds = new Set(
      conflictingBookings.flatMap((b: any) => b.roomAssignments.map((ra: any) => ra.roomId))
    )

    // 3. Filter and enrich available rooms
    const nights = getNightCount(checkInDate, checkOutDate)
    const availableRooms = candidateRooms
      .filter((room: any) => !bookedRoomIds.has(room.id))
      .map((room: any) => {
        const avgRating = room.reviews.length > 0
          ? room.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / room.reviews.length
          : 0

        return {
          id: room.id,
          number: room.number,
          floor: room.floor,
          type: room.roomType.name,
          capacity: room.roomType.capacity,
          description: room.roomType.description,
          amenities: room.roomType.amenities,
          baseRate: room.roomType.baseRate,
          totalPrice: room.roomType.baseRate * nights,
          nights,
          averageRating: Math.round(avgRating * 10) / 10,
          reviewCount: room.reviews.length,
          roomImages: room.roomImages,
          mainImage: room.roomImages[0]?.imageUrl || room.roomType.images[0] || '/images/placeholder.jpg'
        }
      })

    return NextResponse.json({
      availableRooms,
      totalAvailable: availableRooms.length,
      checkIn,
      checkOut,
      nights
    })

  } catch (error: any) {
    console.error('Availability Engine Error:', error)
    return NextResponse.json({ error: 'Availability engine failure', message: getDatabaseErrorMessage(error) }, { status: 503 })
  }
}
