import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import { handleZodError } from '@/lib/api-utils'

const galleryUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  category: z.enum(['ROOM', 'AMENITY', 'EVENT', 'FOOD', 'EXTERIOR']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id: id }
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ item: gallery })
  } catch (error) {
    console.error('Error fetching gallery item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = galleryUpdateSchema.parse(body)

    const gallery = await prisma.gallery.update({
      where: { id: id },
      data: validatedData
    })

    // Log the action
    await logAction(
      request,
      session.user.id,
      AUDIT_ACTIONS.GALLERY_UPDATE,
      'Gallery',
      gallery.id,
      validatedData
    )

    return NextResponse.json(gallery)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }

    console.error('Error updating gallery item:', error)
    return NextResponse.json(
      { error: 'Failed to update gallery item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const gallery = await prisma.gallery.delete({
      where: { id: id }
    })

    // Log the action
    await logAction(
      request,
      session.user.id,
      AUDIT_ACTIONS.GALLERY_DELETE,
      'Gallery',
      gallery.id,
      { title: gallery.title }
    )

    return NextResponse.json({ message: 'Gallery item deleted successfully' })
  } catch (error) {
    console.error('Error deleting gallery item:', error)
    return NextResponse.json(
      { error: 'Failed to delete gallery item' },
      { status: 500 }
    )
  }
}
