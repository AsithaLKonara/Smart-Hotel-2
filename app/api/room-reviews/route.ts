import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'

const reviewSchema = z.object({
  roomId: z.string().min(1),
  userId: z.string().min(1),
  bookingId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const userId = searchParams.get('userId')
    const verified = searchParams.get('verified')

    const where: any = {}
    if (roomId) where.roomId = roomId
    if (userId) where.userId = userId
    if (verified === 'true') where.verified = true

    const reviews = await prisma.roomReview.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        room: {
          select: {
            id: true,
            number: true,
            roomTypeId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(reviews)
  } catch (error: any) {
    console.error('Error fetching room reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room reviews', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    // Verify user owns the booking if bookingId provided
    if (validatedData.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: validatedData.bookingId },
      })

      if (!booking || booking.primaryGuestId !== validatedData.userId) {
        return NextResponse.json({ error: 'Invalid booking' }, { status: 403 })
      }
    }

    const review = await prisma.roomReview.create({
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        room: {
          select: {
            id: true,
            number: true,
            roomTypeId: true,
          },
        },
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating room review:', error)
    return NextResponse.json(
      { error: 'Failed to create review', message: error.message },
      { status: 500 }
    )
  }
}

