import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CmsService } from '@/lib/services/cms-service'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const updatePropertySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  mainImage: z.string().nullable().optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  latitude: z.preprocess((val) => (val !== null && val !== undefined && val !== '' ? parseFloat(String(val)) : null), z.number().nullable().optional()),
  longitude: z.preprocess((val) => (val !== null && val !== undefined && val !== '' ? parseFloat(String(val)) : null), z.number().nullable().optional()),
  googleMapsUrl: z.string().nullable().optional(),
  status: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const property = await CmsService.getPropertyById(id)

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    return NextResponse.json({ property })
  } catch (error: any) {
    console.error('Error fetching CMS property:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch property' }, { status: 500 })
  }
}

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
    const parsed = updatePropertySchema.safeParse(body)

    if (!parsed.success) {
      return handleZodError(parsed.error)
    }

    const updated = await CmsService.updatePropertyCms(id, parsed.data)
    return NextResponse.json({ property: updated })
  } catch (error: any) {
    console.error('Error updating CMS property:', error)
    return NextResponse.json({ error: error.message || 'Failed to update property' }, { status: 500 })
  }
}
