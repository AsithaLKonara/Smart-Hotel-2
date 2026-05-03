import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured, getDatabaseErrorMessage } from '@/lib/db-helpers'
import { z } from 'zod'
// Note: RoomStatus enum doesn't exist in Prisma schema - Room.status is a String field
type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING' | 'RESERVED'

const roomSchema = z.object({
  number: z.string().min(1, 'Room number is required'),
  type: z.enum(['STANDARD', 'DELUXE', 'SUITE', 'PRESIDENTIAL']),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  price: z.number().min(0, 'Price must be non-negative'),
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  floor: z.number().optional(),
  size: z.number().optional(),
})

export async function GET(request: NextRequest) {
  // Check database configuration first
  if (!isDatabaseConfigured()) {
    try {
      const { MOCK_ROOMS } = await import('@/lib/mock-rooms')
      return NextResponse.json({
        rooms: MOCK_ROOMS,
        count: MOCK_ROOMS.length,
        isMock: true,
        message: 'Database not configured. Using mock data for preview.'
      })
    } catch (e) {
      return NextResponse.json(
        {
          error: 'Database not configured',
          message: 'DATABASE_URL environment variable is not set',
          rooms: []
        },
        { status: 503 }
      )
    }
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const available = searchParams.get('available')
    const status = searchParams.get('status')

    const where: any = {}

    if (type && type !== 'all') {
      where.type = {
        equals: type,
        mode: 'insensitive',
      }
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) {
        const parsedMin = Number(minPrice)
        if (Number.isNaN(parsedMin)) {
          return NextResponse.json(
            { error: 'minPrice must be a valid number' },
            { status: 400 }
          )
        }
        where.price.gte = parsedMin
      }
      if (maxPrice) {
        const parsedMax = Number(maxPrice)
        if (Number.isNaN(parsedMax)) {
          return NextResponse.json(
            { error: 'maxPrice must be a valid number' },
            { status: 400 }
          )
        }
        where.price.lte = parsedMax
      }
      if (where.price.gte !== undefined && where.price.lte !== undefined && where.price.gte > where.price.lte) {
        return NextResponse.json(
          { error: 'minPrice cannot be greater than maxPrice' },
          { status: 400 }
        )
      }
    }

    if (status) {
      const allowedStatuses: RoomStatus[] = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING', 'RESERVED']
      const normalizedStatus = status.toUpperCase()
      if (!allowedStatuses.includes(normalizedStatus as RoomStatus)) {
        return NextResponse.json(
          { error: 'Invalid status filter' },
          { status: 400 }
        )
      }
      where.status = normalizedStatus
    }

    if (available === 'true') {
      // Note: Room model doesn't have bookings relation defined in schema
      // Fetch bookings separately to check availability
      const rooms = await prisma.room.findMany()
      const bookings = await prisma.booking.findMany({
            where: {
              status: {
                in: ['CONFIRMED', 'CHECKED_IN']
              }
        },
        select: {
          roomId: true
        }
      })
      const bookedRoomIds = new Set(bookings.map(b => b.roomId))
      const availableRooms = rooms.filter(room => !bookedRoomIds.has(room.id))
      // Convert BigInt fields to Number for JSON serialization
      const serializedRooms = availableRooms.map(room => ({
        ...room,
        capacity: Number(room.capacity),
        floor: Number(room.floor),
        size: Number(room.size),
      }))
      return NextResponse.json({
        rooms: serializedRooms,
        count: serializedRooms.length
      })
    }

    // Note: Room model doesn't have roomImages or reviews relations defined in schema
    const rooms = await prisma.room.findMany({
      where,
      orderBy: { number: 'asc' }
    })

    // Convert BigInt fields to Number for JSON serialization
    const serializedRooms = rooms.map(room => ({
      ...room,
      capacity: Number(room.capacity),
      floor: Number(room.floor),
      size: Number(room.size),
    }))

    return NextResponse.json({
      rooms: serializedRooms,
      count: serializedRooms.length
    })
  } catch (error: any) {
    console.error('Error fetching rooms:', error)
    
    // Fallback to mock data on error instead of 503
    try {
      const { MOCK_ROOMS } = await import('@/lib/mock-rooms')
      return NextResponse.json({
        rooms: MOCK_ROOMS,
        count: MOCK_ROOMS.length,
        isMock: true,
        message: 'Using fallback data: ' + getDatabaseErrorMessage(error)
      })
    } catch (fallbackError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch rooms',
          message: getDatabaseErrorMessage(error),
          rooms: []
        },
        { status: 503 }
      )
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { 
          error: 'Database not configured',
          message: 'Room creation is disabled in preview mode without a database.'
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const validatedData = roomSchema.parse(body)

    // Note: number is not a unique field, use findFirst instead
    const existingRoom = await prisma.room.findFirst({
      where: { number: validatedData.number }
    })

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Room number already exists' },
        { status: 400 }
      )
    }

    const room = await prisma.room.create({
      data: {
        number: validatedData.number,
        type: validatedData.type,
        capacity: BigInt(validatedData.capacity),
        price: validatedData.price,
        description: validatedData.description || '',
        amenities: validatedData.amenities || [],
        images: validatedData.images || [],
        floor: validatedData.floor ? BigInt(validatedData.floor) : BigInt(1), // Default floor 1
        size: validatedData.size ? BigInt(validatedData.size) : BigInt(200), // Default size 200
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
} 