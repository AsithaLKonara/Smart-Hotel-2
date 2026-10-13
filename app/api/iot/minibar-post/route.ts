import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { handleZodError } from '@/lib/api-utils'

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
      where: { id: validatedData.itemId },
      include: {
        stocks: {
          where: { propertyId: room.propertyId }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found in inventory' }, { status: 404 })
    }

    const amount = item.unitPrice.toNumber() * validatedData.quantity

    // Post charge to folio
    await prisma.$transaction(async (tx) => {
      await tx.folioLineItem.create({
        data: {
          folioId,
          amount,
          description: `Minibar: ${item.name} (x${validatedData.quantity})`,
          category: 'F_AND_B'
        }
      })

      // Deplete physical stock (INV-002 Fix)
      if (item.stocks && item.stocks.length > 0) {
        const roomStock = item.stocks.find(s => s.location === `Room ${room.number}`) || item.stocks[0]
        
        await tx.inventoryStock.update({
          where: { id: roomStock.id },
          data: { quantity: { decrement: validatedData.quantity }, lastCountedAt: new Date() }
        })

        await tx.inventoryMovement.create({
          data: {
            itemId: item.id,
            propertyId: room.propertyId,
            type: 'MINIBAR_CONSUMPTION',
            quantity: -validatedData.quantity,
            notes: `Consumed from minibar in Room ${room.number}`
          }
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Minibar charge posted successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Minibar posting error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
