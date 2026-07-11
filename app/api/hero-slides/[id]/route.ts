import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const updateSchema = z.object({
  image: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  subtitle: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  cta: z.string().min(1).optional(),
  ctaLink: z.string().min(1).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const { id } = await params
    const slide = await prisma.heroSlide.findUnique({ where: { id } })
    
    if (!slide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
    }

    return NextResponse.json({ item: slide })
  } catch (error) {
    console.error('Error fetching hero slide:', error)
    return NextResponse.json({ error: 'Failed to fetch slide' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const data = updateSchema.parse(body)

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({ item: slide })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Error updating hero slide:', error)
    return NextResponse.json({ error: 'Failed to update slide' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const { id } = await params
    await prisma.heroSlide.delete({ where: { id } })
    return NextResponse.json({ message: 'Slide deleted successfully' })
  } catch (error) {
    console.error('Error deleting hero slide:', error)
    return NextResponse.json({ error: 'Failed to delete slide' }, { status: 500 })
  }
}

