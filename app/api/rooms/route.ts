import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { RoomStatus } from '@prisma/client'

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
      const allowedStatuses = RoomStatus ? Object.values(RoomStatus) : ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING']
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
      const rooms = await prisma.room.findMany({
        include: {
          bookings: {
            where: {
              status: {
                in: ['CONFIRMED', 'CHECKED_IN']
              }
            }
          }
        }
      })

      const availableRooms = rooms.filter(room => !room.bookings || room.bookings.length === 0)
      return NextResponse.json(availableRooms)
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: { number: 'asc' },
      include: {
        roomImages: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
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

    const body = await request.json()
    const validatedData = roomSchema.parse(body)

    const existingRoom = await prisma.room.findUnique({
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
        ...validatedData,
        floor: validatedData.floor || null,
        size: validatedData.size || null,
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