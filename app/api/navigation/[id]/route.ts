import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  href: z.string().min(1).optional(),
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
    const link = await prisma.navigationLink.findUnique({ where: { id } })
    
    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    return NextResponse.json({ item: link })
  } catch (error) {
    console.error('Error fetching navigation link:', error)
    return NextResponse.json({ error: 'Failed to fetch link' }, { status: 500 })
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

    const link = await prisma.navigationLink.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({ item: link })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Error updating navigation link:', error)
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 })
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
    await prisma.navigationLink.delete({ where: { id } })
    return NextResponse.json({ message: 'Link deleted successfully' })
  } catch (error) {
    console.error('Error deleting navigation link:', error)
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
  }
}

