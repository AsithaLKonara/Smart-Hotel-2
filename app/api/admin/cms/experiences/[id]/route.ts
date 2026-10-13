import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CmsService } from '@/lib/services/cms-service'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const experienceUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().nullable().optional(),
  description: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  icon: z.string().optional(),
  category: z.string().optional(),
  duration: z.string().nullable().optional(),
  price: z.preprocess((val) => (val !== null && val !== undefined && val !== '' ? parseFloat(String(val)) : null), z.number().nullable().optional()),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
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
    const parsed = experienceUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return handleZodError(parsed.error)
    }

    const updated = await CmsService.updateExperience(id, parsed.data)
    return NextResponse.json({ item: updated })
  } catch (error: any) {
    console.error('Error updating experience:', error)
    return NextResponse.json({ error: error.message || 'Failed to update experience' }, { status: 500 })
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
    await CmsService.deleteExperience(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting experience:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete experience' }, { status: 500 })
  }
}
