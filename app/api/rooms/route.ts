import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured, getDatabaseErrorMessage } from '@/lib/db-helpers'
import { z } from 'zod'
import { injectChaosDelay } from '@/qa/chaos/chaos-engine'

/**
 * Enterprise Room Schema
 */
const roomSchema = z.object({
  number: z.string().min(1, 'Room number is required'),
  roomTypeId: z.string().min(1, 'Room Type is required'),
  floor: z.number().int().min(0),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'INSPECTION_PENDING', 'MAINTENANCE', 'OUT_OF_ORDER']).default('AVAILABLE'),
  images: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  // Chaos delay removed for production
  // await injectChaosDelay('DB_LATENCY')

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured', rooms: [] }, { status: 503 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const typeId = searchParams.get('roomTypeId')
    const status = searchParams.get('status')
    const availableOnly = searchParams.get('available') === 'true'

    const where: any = {}
    if (typeId) where.roomTypeId = typeId
    if (status) where.status = status
    
    // Complex availability logic would ideally use the Availability service, 
    // but for simple listing we filter by room status
    if (availableOnly) {
      where.status = 'AVAILABLE'
    }

    const rooms = await prisma.room.findMany({
      where,
      include: {
        roomType: true,
        roomImages: true,
      } as any,
      orderBy: { number: 'asc' }
    })

    // Flatten for legacy frontend compatibility if needed, but best practice is to keep structure
    const serializedRooms = rooms.map((room: any) => ({
      ...room,
      // Mapping fields for legacy UI components
      type: room.roomType.name,
      price: room.roomType.baseRate,
      capacity: room.roomType.capacity,
      description: room.roomType.description,
      amenities: room.roomType.amenities,
    }))

    return NextResponse.json({
      rooms: serializedRooms,
      count: serializedRooms.length
    })
  } catch (error: any) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms', message: getDatabaseErrorMessage(error) }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = roomSchema.parse(body)

    const existingRoom = await prisma.room.findFirst({
      where: { number: validatedData.number }
    })

    if (existingRoom) {
      return NextResponse.json({ error: 'Room number already exists' }, { status: 400 })
    }

    const room = await prisma.room.create({
      data: {
        number: validatedData.number,
        floor: validatedData.floor,
        roomTypeId: validatedData.roomTypeId,
        status: validatedData.status,
        version: 1,
        roomImages: {
          create: validatedData.images?.map(url => ({
            imageUrl: url
          })) || []
        }
      } as any,
      include: { 
        roomType: true,
        roomImages: true 
      } as any
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}