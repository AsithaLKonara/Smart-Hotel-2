import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MinibarEventSchema = z.object({
  sensorId: z.string(),
  roomId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.number().int().min(1),
  timestamp: z.string().datetime()
})

export async function POST(req: Request) {
  try {
    // Validate API key from IoT vendor
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== process.env.IOT_MINIBAR_API_KEY) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = MinibarEventSchema.parse(body)

    // Find the currently checked-in guest for this room
    const room = await prisma.room.findUnique({
      where: { id: validatedData.roomId },
      include: {
        stays: {
          where: { status: 'CHECKED_IN' },
          include: { 
            booking: {
              include: { folios: true }
            } 
          }
        }
      }
    })

    if (!room || room.stays.length === 0) {
      // If room is unoccupied, alert security/housekeeping
      await prisma.auditLog.create({
        data: {
          action: 'MINIBAR_UNAUTHORIZED_ACCESS',
          resource: 'ROOM',
          resourceId: validatedData.roomId,
          actor: 'IOT_SENSOR',
          details: validatedData
        }
      })
      return NextResponse.json({ success: true, message: 'Event logged as unauthorized access' })
    }

    const currentStay = room.stays[0]
    const folioId = currentStay.booking.folios[0]?.id

    if (!folioId) {
      return NextResponse.json({ error: 'Active folio not found for booking' }, { status: 400 })
    }

    // Lookup item price
    const item = await prisma.inventoryItem.findUnique({
      where: { id: validatedData.itemId }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found in inventory' }, { status: 404 })
    }

    const amount = item.unitPrice * validatedData.quantity

    // Post charge to folio
    await prisma.folioLineItem.create({
      data: {
        folioId,
        amount,
        description: `Minibar: ${item.name} (x${validatedData.quantity})`,
        category: 'F_AND_B'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Minibar charge posted successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Minibar posting error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
