import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CmsService } from '@/lib/services/cms-service'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const galleryCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  imageUrl: z.string().url('Invalid image URL'),
  category: z.string().min(1, 'Category is required'),
  caption: z.string().nullable().optional(),
  order: z.number().int().optional().default(0),
  featured: z.boolean().optional().default(false),
  propertyId: z.string().min(1, 'Property ID is required'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId') || undefined
    const category = searchParams.get('category') || undefined
    const featuredParam = searchParams.get('featured')
    const featured = featuredParam !== null ? featuredParam === 'true' : undefined

    const items = await CmsService.getGalleries({ propertyId, category, featured })
    return NextResponse.json({ items })
  } catch (error: any) {
    console.error('Error fetching gallery items:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch gallery' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = galleryCreateSchema.safeParse(body)

    if (!parsed.success) {
      return handleZodError(parsed.error)
    }

    const created = await CmsService.createGallery(parsed.data)
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating gallery item:', error)
    return NextResponse.json({ error: error.message || 'Failed to create gallery item' }, { status: 500 })
  }
}
