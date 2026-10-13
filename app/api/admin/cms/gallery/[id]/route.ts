import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CmsService } from '@/lib/services/cms-service'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const galleryUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().min(1).optional(),
  caption: z.string().nullable().optional(),
  order: z.number().int().optional(),
  featured: z.boolean().optional(),
  propertyId: z.string().min(1).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = galleryUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return handleZodError(parsed.error)
    }

    const updated = await CmsService.updateGallery(id, parsed.data)
    return NextResponse.json({ item: updated })
  } catch (error: any) {
    console.error('Error updating gallery item:', error)
    return NextResponse.json({ error: error.message || 'Failed to update gallery item' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await CmsService.deleteGallery(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting gallery item:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete gallery item' }, { status: 500 })
  }
}
