import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StayExtraService } from '@/lib/services/stay-extra-service'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative().optional(),
  pricingModel: z.enum(['PER_STAY', 'PER_NIGHT', 'PER_GUEST']).optional(),
  category: z.string().min(1).optional(),
  imageUrl: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
  propertyId: z.string().nullable().optional(),
})

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const item = await StayExtraService.getExtraServiceById(id)
    if (!item) {
      return NextResponse.json({ error: 'Extra service not found' }, { status: 404 })
    }
    return NextResponse.json({ item })
  } catch (error: any) {
    console.error('Error fetching extra service:', error)
    return NextResponse.json({ error: 'Failed to fetch extra service' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions)
  const roleName = (session?.user as any)?.roleName || ''
  
  if (!session || !['SUPER_ADMIN', 'MANAGER', 'GENERAL_MANAGER'].includes(roleName)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
  }

  try {
    const { id } = await context.params
    const body = await request.json()
    const validated = updateSchema.parse(body)

    const updated = await StayExtraService.updateExtraService(id, validated)
    return NextResponse.json({ item: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Error updating extra service:', error)
    return NextResponse.json({ error: error.message || 'Failed to update extra service' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions)
  const roleName = (session?.user as any)?.roleName || ''
  
  if (!session || !['SUPER_ADMIN', 'MANAGER', 'GENERAL_MANAGER'].includes(roleName)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
  }

  try {
    const { id } = await context.params
    await StayExtraService.deleteExtraService(id)
    return NextResponse.json({ success: true, message: 'Extra service deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting extra service:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete extra service' }, { status: 500 })
  }
}
