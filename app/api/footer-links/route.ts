import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { z } from 'zod'

const footerLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
  category: z.string().min(1),
  order: z.number().int().default(0),
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

    const links = await prisma.footerLink.findMany({
      where,
      orderBy: [{ category: 'asc' }, { order: 'asc' }]
    })
    
    return NextResponse.json({ items: links })
  } catch (error) {
    console.error('Error fetching footer links:', error)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const data = footerLinkSchema.parse(body)

    const link = await prisma.footerLink.create({
      data: {
        label: data.label,
        url: data.url,
        category: data.category,
        order: data.order,
        active: data.active,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({ item: link }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating footer link:', error)
    return NextResponse.json({ error: 'Failed to create footer link' }, { status: 500 })
  }
}

