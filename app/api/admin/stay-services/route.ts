import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StayExtraService } from '@/lib/services/stay-extra-service'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const extraServiceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  price: z.number().nonnegative('Price must be greater than or equal to 0'),
  priceType: z.enum(['PER_STAY', 'PER_NIGHT', 'PER_GUEST']).default('PER_STAY'),
  imageUrl: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
  propertyId: z.string().nullable().optional(),
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ items: [] })
  }

  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId') || undefined
    const activeOnly = searchParams.get('activeOnly') === 'true'

    await StayExtraService.ensureDefaultExtraServices()
    const extras = await StayExtraService.getExtraServices({ propertyId, activeOnly: activeOnly ? true : false })

    return NextResponse.json({ items: extras })
  } catch (error: any) {
    console.error('Error fetching admin stay services:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const roleName = (session?.user as any)?.roleName || ''
  
  if (!session || !['SUPER_ADMIN', 'MANAGER', 'GENERAL_MANAGER'].includes(roleName)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const validated = extraServiceSchema.parse(body)

    const created = await StayExtraService.createExtraService({
      name: validated.name,
      code: validated.code,
      description: validated.description,
      price: validated.price,
      priceType: validated.priceType,
      imageUrl: validated.imageUrl || null,
      icon: validated.icon || '✨',
      active: validated.active,
      order: validated.order,
      propertyId: validated.propertyId || null
    })

    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Error creating stay extra service:', error)
    return NextResponse.json({ error: error.message || 'Failed to create extra service' }, { status: 500 })
  }
}
