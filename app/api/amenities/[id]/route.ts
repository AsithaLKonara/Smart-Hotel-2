import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
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
    const amenity = await prisma.amenity.findUnique({ where: { id } })
    
    if (!amenity) {
      return NextResponse.json({ error: 'Amenity not found' }, { status: 404 })
    }

    return NextResponse.json({ item: amenity })
  } catch (error) {
    console.error('Error fetching amenity:', error)
    return NextResponse.json({ error: 'Failed to fetch amenity' }, { status: 500 })
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

    const amenity = await prisma.amenity.update({
      where: { id },
      data
    })

    return NextResponse.json({ item: amenity })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error updating amenity:', error)
    return NextResponse.json({ error: 'Failed to update amenity' }, { status: 500 })
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
    await prisma.amenity.delete({ where: { id } })
    return NextResponse.json({ message: 'Amenity deleted successfully' })
  } catch (error) {
    console.error('Error deleting amenity:', error)
    return NextResponse.json({ error: 'Failed to delete amenity' }, { status: 500 })
  }
}

