import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { z } from 'zod'

const navigationLinkSchema = z.object({
  name: z.string().min(1),
  href: z.string().min(1),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
})

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ items: [] })
  }

  try {
    const links = await prisma.navigationLink.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json({ items: links })
  } catch (error) {
    console.error('Error fetching navigation links:', error)
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
    const data = navigationLinkSchema.parse(body)

    const link = await prisma.navigationLink.create({
      data: {
        name: data.name,
        href: data.href,
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
    console.error('Error creating navigation link:', error)
    return NextResponse.json({ error: 'Failed to create navigation link' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected array of links' }, { status: 400 })
    }

    const updates = body.map(async (item: any) => {
      const data = navigationLinkSchema.parse(item)
      return prisma.navigationLink.update({
        where: { id: item.id },
        data: {
          name: data.name,
          href: data.href,
          order: data.order,
          active: data.active,
          updatedAt: new Date(),
        }
      })
    })

    await Promise.all(updates)
    return NextResponse.json({ message: 'Navigation links updated' })
  } catch (error) {
    console.error('Error updating navigation links:', error)
    return NextResponse.json({ error: 'Failed to update navigation links' }, { status: 500 })
  }
}

