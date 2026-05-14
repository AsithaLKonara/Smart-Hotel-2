import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'

const hotelReviewSchema = z.object({
  userId: z.string().min(1),
  overallRating: z.number().int().min(1).max(5),
  serviceRating: z.number().int().min(1).max(5).optional(),
  cleanlinessRating: z.number().int().min(1).max(5).optional(),
  valueRating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  comment: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const verified = searchParams.get('verified')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (verified === 'true') where.verified = true

    const reviews = await prisma.hotelReview.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // Calculate average ratings
    const allReviews = await prisma.hotelReview.findMany({
      where: verified === 'true' ? { verified: true } : {},
      select: {
        overallRating: true,
        serviceRating: true,
        cleanlinessRating: true,
        valueRating: true,
      },
    })

    const avgOverall = allReviews.reduce((sum: number, r: any) => sum + r.overallRating, 0) / allReviews.length
    const avgService = allReviews
      .filter((r: any) => r.serviceRating)
      .reduce((sum: number, r: any) => sum + (r.serviceRating || 0), 0) / allReviews.filter((r: any) => r.serviceRating).length || 0
    const avgCleanliness = allReviews
      .filter((r: any) => r.cleanlinessRating)
      .reduce((sum: number, r: any) => sum + (r.cleanlinessRating || 0), 0) / allReviews.filter((r: any) => r.cleanlinessRating).length || 0
    const avgValue = allReviews
      .filter((r: any) => r.valueRating)
      .reduce((sum: number, r: any) => sum + (r.valueRating || 0), 0) / allReviews.filter((r: any) => r.valueRating).length || 0

    return NextResponse.json({
      reviews,
      averages: {
        overall: avgOverall || 0,
        service: avgService || 0,
        cleanliness: avgCleanliness || 0,
        value: avgValue || 0,
        total: allReviews.length,
      },
    })
  } catch (error: any) {
    console.error('Error fetching hotel reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hotel reviews', message: error.message },
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
    const validatedData = hotelReviewSchema.parse(body)

    // Users can only create reviews for themselves
    if (validatedData.userId !== session.user.id && 
        !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const review = await prisma.hotelReview.create({
      data: {
        ...validatedData,
        rating: validatedData.overallRating, // Map for legacy/base compatibility
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
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
    console.error('Error creating hotel review:', error)
    return NextResponse.json(
      { error: 'Failed to create hotel review', message: error.message },
      { status: 500 }
    )
  }
}

