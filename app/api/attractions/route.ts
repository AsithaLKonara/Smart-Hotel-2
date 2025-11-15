import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { z } from 'zod'

const attractionSchema = z.object({
  name: z.string().min(1),
  distance: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  displayOrder: z.number().int().default(0),
  active: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ items: [] })
  }

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const where: any = {}
    if (category) where.category = category
    if (activeOnly) where.active = true

    const attractions = await prisma.nearbyAttraction.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }]
    })
    
    return NextResponse.json({ items: attractions })
  } catch (error) {
    console.error('Error fetching attractions:', error)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const data = attractionSchema.parse(body)

    const attraction = await prisma.nearbyAttraction.create({
      data: {
        name: data.name,
        distance: data.distance,
        description: data.description,
        category: data.category,
        displayOrder: data.displayOrder,
        active: data.active,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({ item: attraction }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating attraction:', error)
    return NextResponse.json({ error: 'Failed to create attraction' }, { status: 500 })
  }
}

