import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const DeliveryPassSchema = z.object({
  bookingId: z.string().uuid(),
  courierName: z.string(), // e.g., 'Uber Eats', 'FedEx'
  expectedArrival: z.string().datetime()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = DeliveryPassSchema.parse(body)

    const booking = await prisma.booking.findUnique({
      where: { id: validated.bookingId },
      include: {
        stay: {
          include: { room: true }
        }
      }
    })

    if (!booking || !booking.stay) {
      return NextResponse.json({ error: 'Active stay not found' }, { status: 404 })
    }

    const roomNumber = booking.stay.room.number

    // Generate a temporary access pass code for the front desk/security guard
    const passCode = `DELIV-${Math.floor(1000 + Math.random() * 9000)}`

    await prisma.auditLog.create({
      data: {
        action: 'DELIVERY_PASS_GENERATED',
        resource: 'BOOKING',
        resourceId: booking.id,
        actor: booking.primaryGuestId,
        details: {
          courierName: validated.courierName,
          expectedArrival: validated.expectedArrival,
          passCode,
          roomNumber
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Delivery pass generated for front gate security.',
      data: {
        passCode,
        roomNumber,
        instructions: 'Please present this pass code to the security desk upon arrival.'
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Delivery Pass error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
