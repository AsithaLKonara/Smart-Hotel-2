import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  distance: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  displayOrder: z.number().int().optional(),
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
    const attraction = await (prisma as any).nearbyAttraction.findUnique({ where: { id } })
    
    if (!attraction) {
      return NextResponse.json({ error: 'Attraction not found' }, { status: 404 })
    }

    return NextResponse.json({ item: attraction })
  } catch (error) {
    console.error('Error fetching attraction:', error)
    return NextResponse.json({ error: 'Failed to fetch attraction' }, { status: 500 })
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

    const attraction = await (prisma as any).nearbyAttraction.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({ item: attraction })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error updating attraction:', error)
    return NextResponse.json({ error: 'Failed to update attraction' }, { status: 500 })
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
    await (prisma as any).nearbyAttraction.delete({ where: { id } })
    return NextResponse.json({ message: 'Attraction deleted successfully' })
  } catch (error) {
    console.error('Error deleting attraction:', error)
    return NextResponse.json({ error: 'Failed to delete attraction' }, { status: 500 })
  }
}

