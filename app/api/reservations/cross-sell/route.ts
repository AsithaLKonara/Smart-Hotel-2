import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const prisma = new PrismaClient()

const CrossSellSchema = z.object({
  propertyId: z.string().uuid(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().min(1)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = CrossSellSchema.parse(body)

    // Check if the requested property has availability
    // (Mock availability check logic)
    const currentPropertyHasAvailability = false // Simulate fully booked
    
    if (currentPropertyHasAvailability) {
      return NextResponse.json({ success: true, message: 'Rooms available at requested property', suggestions: [] })
    }

    // If fully booked, find nearby sister properties
    const sisterProperties = await prisma.property.findMany({
      where: {
        id: { not: validated.propertyId },
        // In a real scenario, filter by geolocation distance or region
      },
      include: {
        rooms: {
          include: {
            roomType: true,
            stays: {
              where: {
                OR: [
                  { checkInTime: { lte: new Date(validated.checkOut) }, checkOutTime: { gte: new Date(validated.checkIn) } }
                ]
              }
            }
          }
        }
      }
    })

    const suggestions = sisterProperties.map(prop => {
      const availableRooms = prop.rooms.filter(r => r.stays.length === 0)
      if (availableRooms.length === 0) return null

      return {
        propertyId: prop.id,
        propertyName: prop.name,
        availableRoomCount: availableRooms.length,
        lowestRate: Math.min(...availableRooms.map(r => r.roomType.baseRate.toNumber()))
      }
    }).filter(Boolean)

    return NextResponse.json({
      success: true,
      message: 'Requested property is fully booked. Showing cross-sell suggestions.',
      suggestions
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Cross-sell API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
