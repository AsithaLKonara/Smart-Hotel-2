import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const prisma = new PrismaClient()

const EventBookingSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  attendees: z.number().positive(),
  specialRequirements: z.string().optional()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = EventBookingSchema.parse(body)

    // For this mock, we assume there's an Event model. Since it might not exist in the current schema,
    // we will record this in the AuditLog and simulate success.
    // In a real system, we would create an EventRegistration record.

    await prisma.auditLog.create({
      data: {
        action: 'EVENT_SPACE_BOOKED',
        resource: 'EVENT',
        resourceId: validated.eventId,
        actor: validated.userId,
        details: {
          attendees: validated.attendees,
          requirements: validated.specialRequirements || 'None'
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Event space booking confirmed.',
      bookingReference: `EVT-${Buffer.from(Date.now().toString()).toString('hex').substring(0, 8).toUpperCase()}`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Event booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
