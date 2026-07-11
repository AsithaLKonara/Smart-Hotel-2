import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const prisma = new PrismaClient()

const PosChargeSchema = z.object({
  posId: z.string(),
  roomNumber: z.string(),
  guestName: z.string(), // For verification
  amount: z.number().positive(),
  ticketNumber: z.string(),
  outletName: z.string() // e.g., 'Main Restaurant', 'Spa'
})

export async function POST(req: Request) {
  try {
    // POS Vendor API key verification
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== process.env.POS_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized POS Terminal' }, { status: 401 })
    }

    const body = await req.json()
    const validated = PosChargeSchema.parse(body)

    // Verify room and guest
    const room = await prisma.room.findFirst({
      where: { number: validated.roomNumber },
      include: {
        roomAssignments: {
          where: { status: 'CHECKED_IN' },
          include: { booking: { include: { guest: true, folios: true } } }
        }
      }
    })

    if (!room || room.roomAssignments.length === 0) {
      return NextResponse.json({ error: 'Room is not checked in' }, { status: 400 })
    }

    const currentStay = room.roomAssignments[0]
    const guest = currentStay.booking.guest

    // Simple verification (in real system, check fuzzy matching or strict ID)
    if (!guest.name.toLowerCase().includes(validated.guestName.toLowerCase())) {
      return NextResponse.json({ error: 'Guest name does not match the room' }, { status: 400 })
    }

    const folioId = currentStay.booking.folios[0]?.id
    if (!folioId) {
      return NextResponse.json({ error: 'No active folio found' }, { status: 400 })
    }

    // Post to Folio
    const lineItem = await prisma.folioLineItem.create({
      data: {
        folioId,
        amount: validated.amount,
        description: `POS Charge: ${validated.outletName} (Ticket: ${validated.ticketNumber})`,
        category: 'POS_CHARGE'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'POS charge posted to folio successfully',
      transactionId: lineItem.id
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('POS Charge error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
