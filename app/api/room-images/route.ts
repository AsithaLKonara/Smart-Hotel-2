import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'

const roomImageSchema = z.object({
  roomId: z.string().min(1),
  imageUrl: z.string().url(),
  cloudinaryId: z.string().optional(),
  isMain: z.boolean().default(false),
  caption: z.string().optional(),
  displayOrder: z.number().int().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')

    const where: any = {}
    if (roomId) where.roomId = roomId

    const images = await prisma.roomImage.findMany({
      where,
      orderBy: [
        { isMain: 'desc' },
        { displayOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json(images)
  } catch (error: any) {
    console.error('Error fetching room images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room images', message: error.message },
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
    const validatedData = roomImageSchema.parse(body)

    // If this is set as main, unset other main images
    if (validatedData.isMain) {
      await prisma.roomImage.updateMany({
        where: {
          roomId: validatedData.roomId,
          isMain: true,
        },
        data: {
          isMain: false,
        },
      })
    }

    const image = await prisma.roomImage.create({
      data: validatedData,
    })

    return NextResponse.json(image, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating room image:', error)
    return NextResponse.json(
      { error: 'Failed to create room image', message: error.message },
      { status: 500 }
    )
  }
}

