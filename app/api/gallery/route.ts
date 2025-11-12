import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'

const gallerySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  imageUrl: z.string().url('Invalid image URL'),
  category: z.enum(['ROOM', 'AMENITY', 'EVENT', 'FOOD', 'EXTERIOR']),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let whereClause: any = {}

    if (category && category !== 'all') {
      whereClause.category = category
    }

    const gallery = await prisma.gallery.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ items: gallery })
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = gallerySchema.parse(body)

    const gallery = await prisma.gallery.create({
      data: {
        title: validatedData.title,
        imageUrl: validatedData.imageUrl,
        category: validatedData.category,
      }
    })

    // Log the action
    await logAction(
      request,
      session.user.id,
      AUDIT_ACTIONS.GALLERY_CREATE,
      'Gallery',
      gallery.id,
      {
        title: validatedData.title,
        category: validatedData.category,
      }
    )

    return NextResponse.json({ item: gallery }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating gallery item:', error)
    return NextResponse.json(
      { error: 'Failed to create gallery item' },
      { status: 500 }
    )
  }
}
