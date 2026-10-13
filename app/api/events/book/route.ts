import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

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

    // Fetch the event to ensure it exists and has capacity
    const event = await prisma.banquetingEvent.findUnique({ 
      where: { id: validated.eventId },
      include: { attendees: true, spaceBookings: { include: { space: true } } }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Capacity validation
    let currentAttendees = event.attendees.reduce((sum: number, a: any) => sum + a.attendees, 0);
    let maxCapacity = event.spaceBookings[0]?.space?.capacity || event.expectedAttendees;

    if (currentAttendees + validated.attendees > maxCapacity) {
      return NextResponse.json({ error: 'Event capacity exceeded' }, { status: 400 });
    }

    await prisma.eventAttendee.create({
      data: {
        eventId: validated.eventId,
        userId: validated.userId,
        attendees: validated.attendees,
        specialRequirements: validated.specialRequirements || null
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
