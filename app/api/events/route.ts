import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'

const eventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  eventDate: z.string().datetime(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  category: z.string().optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).default('upcoming'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const upcoming = searchParams.get('upcoming') === 'true'

    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    if (upcoming) {
      where.eventDate = { gte: new Date() }
      where.status = 'upcoming'
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        eventDate: 'asc',
      },
    })

    return NextResponse.json(events)
  } catch (error: any) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = eventSchema.parse(body)

    const event = await prisma.event.create({
      data: {
        ...validatedData,
        eventDate: new Date(validatedData.eventDate),
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event', message: error.message },
      { status: 500 }
    )
  }
}

