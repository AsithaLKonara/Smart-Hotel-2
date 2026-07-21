import { NextRequest, NextResponse } from 'next/server'
import { getRequestSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const roomTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  baseRate: z.number().min(0, 'Base rate must be non-negative'),
  capacity: z.number().int().min(1).default(2),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  minLengthOfStay: z.number().int().min(1).optional().default(1),
  maxLengthOfStay: z.number().int().min(1).optional().default(30),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getRequestSession(request)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role || ''
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'RECEPTIONIST', 'STAFF']

    if (!session || !allowedRoles.includes(userRole.toUpperCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = roomTypeSchema.partial().parse(body)

    // Check name conflict
    const { id } = await params
    if (validatedData.name) {
      const existing = await prisma.roomType.findFirst({
        where: { 
          name: validatedData.name,
          id: { not: id }
        }
      })

      if (existing) {
        return NextResponse.json({ error: 'Room Type name already exists' }, { status: 400 })
      }
    }

    const roomType = await prisma.roomType.update({
      where: { id: id },
      data: validatedData
    })

    return NextResponse.json(roomType)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Error updating room type:', error)
    return NextResponse.json({ error: 'Failed to update room type' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getRequestSession(request)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role || ''
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER']

    if (!session || !allowedRoles.includes(userRole.toUpperCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const roomCount = await prisma.room.count({
      where: { roomTypeId: id }
    })

    if (roomCount > 0) {
      return NextResponse.json({ error: 'Cannot delete Room Type because physical rooms are currently assigned to it.' }, { status: 400 })
    }

    await prisma.roomType.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting room type:', error)
    return NextResponse.json({ error: 'Failed to delete room type' }, { status: 500 })
  }
}
