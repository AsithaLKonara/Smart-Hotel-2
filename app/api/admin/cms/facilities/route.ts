import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CmsService } from '@/lib/services/cms-service'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const facilityCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url('Invalid image URL').nullable().optional(),
  features: z.string().nullable().optional(),
  operatingHours: z.string().optional().default('09:00-18:00'),
  status: z.string().optional().default('ACTIVE'),
  featured: z.boolean().optional().default(false),
  order: z.number().int().optional().default(0),
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
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const featuredOnly = searchParams.get('featured') === 'true'

    const items = await CmsService.getFacilities({ propertyId, type, status, featuredOnly })
    return NextResponse.json({ items })
  } catch (error: any) {
    console.error('Error fetching facilities:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch facilities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = facilityCreateSchema.parse(body)

    const created = await CmsService.createFacility(parsed)
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Error creating facility:', error)
    return NextResponse.json({ error: error.message || 'Failed to create facility' }, { status: 500 })
  }
}
