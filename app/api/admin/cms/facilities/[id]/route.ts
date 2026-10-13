import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CmsService } from '@/lib/services/cms-service'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const facilityUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  features: z.string().nullable().optional(),
  operatingHours: z.string().optional(),
  status: z.string().optional(),
  featured: z.boolean().optional(),
  order: z.number().int().optional(),
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
    const parsed = facilityUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return handleZodError(parsed.error)
    }

    const updated = await CmsService.updateFacility(id, parsed.data)
    return NextResponse.json({ item: updated })
  } catch (error: any) {
    console.error('Error updating facility:', error)
    return NextResponse.json({ error: error.message || 'Failed to update facility' }, { status: 500 })
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
    await CmsService.deleteFacility(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting facility:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete facility' }, { status: 500 })
  }
}
