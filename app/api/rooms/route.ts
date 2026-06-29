import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured, getDatabaseErrorMessage } from '@/lib/db-helpers'
import { z } from 'zod'
import { unstable_cache } from 'next/cache'
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

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured', rooms: [] }, { status: 503 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const typeId = searchParams.get('roomTypeId')
    const status = searchParams.get('status')
    const availableOnly = searchParams.get('available') === 'true'

    const getCachedRooms = unstable_cache(
      async (tId: string | null, stat: string | null, availOnly: boolean) => {
        const whereClause: any = {}
        if (tId) whereClause.roomTypeId = tId
        if (stat) whereClause.status = stat
        if (availOnly) whereClause.status = 'AVAILABLE'

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
      { revalidate: 60 }
    )

    const rooms = await getCachedRooms(typeId, status, availableOnly)

    // Flatten for legacy frontend compatibility with strict null handling
    const serializedRooms = rooms.map((room: any) => {
      const typeInfo = room.roomType || {
        name: 'Standard',
        baseRate: 0,
        description: 'Luxury suite details arriving soon.',
        capacity: 2,
        amenities: []
      }

      // Ensure at least one image exists for hydration stability
      const images = room.roomImages?.length > 0 
        ? room.roomImages 
        : [{ imageUrl: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&q=80&w=800' }]

      return {
        ...room,
        type: typeInfo.name,
        price: typeInfo.baseRate,
        capacity: typeInfo.capacity,
        description: typeInfo.description,
        amenities: typeInfo.amenities,
        roomImages: images, // Standardized for the Image component
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