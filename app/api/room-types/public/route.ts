import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured, getDatabaseErrorMessage } from '@/lib/db-helpers'
import { unstable_cache } from 'next/cache'

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured', rooms: [] }, { status: 503 })
  }

  try {
    const getCachedRoomTypes = unstable_cache(
      async () => {
        const types = await prisma.roomType.findMany({
          orderBy: { baseRate: 'asc' },
          include: {
            rooms: {
              where: { status: 'AVAILABLE', deletedAt: null }
            }
          }
        })

        // Map it to look similar to the Room interface for the storefront UI
        return types.map((type: any) => ({
          id: type.id,
          number: 'Multiple', // Grouped representation
          type: type.name,
          price: type.baseRate,
          capacity: type.capacity,
          size: 45, // Defaulting size if missing on RoomType
          description: type.description,
          amenities: type.amenities,
          roomImages: type.images.map((img: string, idx: number) => ({
            imageUrl: img,
            isMain: idx === 0
          })),
          availableCount: type.rooms.length
        }))
      },
      ['public-room-types-list'],
      { revalidate: 60, tags: ['room-types', 'rooms'] }
    )

    const roomTypes = await getCachedRoomTypes()

    return NextResponse.json({
      rooms: roomTypes,
      count: roomTypes.length
    })
  } catch (error: any) {
    console.error('Error fetching public room types:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms', message: getDatabaseErrorMessage(error) }, { status: 503 })
  }
}
