import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const heroSlideSchema = z.object({
  image: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  cta: z.string().min(1),
  ctaLink: z.string().min(1),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
})

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ items: [] })
  }

  try {
    const slides = await prisma.heroSlide.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json({ items: slides })
  } catch (error) {
    console.error('Error fetching hero slides:', error)
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
    const data = heroSlideSchema.parse(body)

    const slide = await prisma.heroSlide.create({
      data: {
        image: data.image,
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        cta: data.cta,
        ctaLink: data.ctaLink,
        order: data.order,
        active: data.active,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({ item: slide }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Error creating hero slide:', error)
    return NextResponse.json({ error: 'Failed to create hero slide' }, { status: 500 })
  }
}

