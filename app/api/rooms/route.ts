import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured, getDatabaseErrorMessage } from '@/lib/db-helpers'
import { getEffectivePropertyId } from '@/lib/server-rbac'
import { z } from 'zod'
import { unstable_cache } from 'next/cache'
/**
 * Enterprise Room Schema
 */
const roomSchema = z.object({
  number: z.string().min(1, 'Room number is required'),
  type: z.string().min(1, 'Room Type is required'),
  floor: z.number().int().min(0).optional().default(0),
  size: z.number().int().min(0).optional().default(25),
  capacity: z.number().int().min(1).optional().default(2),
  price: z.number().min(0).optional().default(0),
  description: z.string().optional().default(''),
  amenities: z.array(z.string()).optional().default([]),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'INSPECTION_PENDING', 'MAINTENANCE', 'OUT_OF_ORDER']).default('AVAILABLE'),
  images: z.array(z.string()).optional().default([]),
})

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured', rooms: [] }, { status: 503 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const typeId = searchParams.get('roomTypeId')
    const status = searchParams.get('status')
    const availableOnly = searchParams.get('available') === 'true'
    const propertyId = await getEffectivePropertyId(request)

    const getCachedRooms = unstable_cache(
      async (tId: string | null, stat: string | null, availOnly: boolean, pId: string | null) => {
        const whereClause: any = {}
        if (tId) whereClause.roomTypeId = tId
        if (stat) whereClause.status = stat
        if (availOnly) whereClause.status = 'AVAILABLE'
        if (pId) whereClause.propertyId = pId

        return prisma.room.findMany({
          where: whereClause,
          include: {
            roomType: true,
            roomImages: true,
          } as any,
          orderBy: { number: 'asc' }
        })
      },
      ['public-rooms-list'],
      { revalidate: 60, tags: ['rooms'] }
    )

    const rooms = await getCachedRooms(typeId, status, availableOnly, propertyId)

    // Flatten for legacy frontend compatibility with strict null handling
    const serializedRooms = rooms.map((room: any) => {
      const typeInfo = room.roomType || {
        name: 'Standard',
        baseRate: 0,
        description: 'Luxury suite details arriving soon.',
        capacity: 2,
        amenities: []
      }

      const images = room.roomImages?.length > 0 
        ? room.roomImages.map((img: any) => img.imageUrl)
        : []

      return {
        ...room,
        type: typeInfo.name,
        price: typeInfo.baseRate,
        capacity: room.capacity || typeInfo.capacity, // Room overrides Type
        description: typeInfo.description,
        amenities: typeInfo.amenities,
        images: images, // Map back to flat array for frontend
      }
    })

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
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = roomSchema.parse(body)
    const propertyId = await getEffectivePropertyId(request)

    const existingRoom = await prisma.room.findFirst({
      where: { 
        number: validatedData.number,
        propertyId: propertyId 
      }
    })

    if (existingRoom) {
      return NextResponse.json({ error: 'Room number already exists' }, { status: 400 })
    }

    // Upsert the RoomType based on the provided string
    const roomType = await prisma.roomType.upsert({
      where: { name: validatedData.type },
      update: {
        baseRate: validatedData.price,
        capacity: validatedData.capacity,
        description: validatedData.description,
        amenities: validatedData.amenities,
      },
      create: {
        name: validatedData.type,
        baseRate: validatedData.price,
        capacity: validatedData.capacity,
        description: validatedData.description,
        amenities: validatedData.amenities,
      }
    })

    const room = await prisma.room.create({
      data: {
        number: validatedData.number,
        floor: validatedData.floor,
        size: validatedData.size,
        capacity: validatedData.capacity,
        status: validatedData.status as any,
        version: 1,
        ...(propertyId ? { property: { connect: { id: propertyId } } } : {}),
        roomType: {
          connect: { id: roomType.id }
        },
        roomImages: {
          create: validatedData.images.map(url => ({
            imageUrl: url
          }))
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
    return NextResponse.json({ 
      error: 'Failed to create room', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}