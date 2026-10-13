import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CmsService } from '@/lib/services/cms-service'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const experienceCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().nullable().optional(),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().url('Invalid image URL'),
  icon: z.string().optional().default('✨'),
  category: z.string().optional().default('LUXURY'),
  duration: z.string().nullable().optional(),
  price: z.preprocess((val) => (val !== null && val !== undefined && val !== '' ? parseFloat(String(val)) : null), z.number().nullable().optional()),
  order: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
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
    const activeParam = searchParams.get('activeOnly')
    const activeOnly = activeParam !== null ? activeParam === 'true' : false

    const items = await CmsService.getExperiences({ propertyId, category, activeOnly })
    return NextResponse.json({ items })
  } catch (error: any) {
    console.error('Error fetching experiences:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch experiences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = experienceCreateSchema.safeParse(body)

    if (!parsed.success) {
      return handleZodError(parsed.error)
    }

    const created = await CmsService.createExperience(parsed.data)
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating experience:', error)
    return NextResponse.json({ error: error.message || 'Failed to create experience' }, { status: 500 })
  }
}
