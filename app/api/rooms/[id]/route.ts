import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

const roomUpdateSchema = z.object({
  number: z.string().min(1, 'Room number is required').optional(),
  type: z.enum(['STANDARD', 'DELUXE', 'SUITE', 'PRESIDENTIAL']).optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
  floor: z.number().optional(),
  size: z.number().optional(),
  status: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).roleName as string;
    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPING', 'MAINTENANCE'];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = roomUpdateSchema.parse(body)

    // Handle relational updates for images if provided (if we were in PUT, but this is PATCH)
    // Actually, let's keep it simple for PATCH
    const room = await prisma.room.update({
      where: { id: id },
      data: {
        ...validatedData,
        status: validatedData.status as any,
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Note: Room model doesn't have bookings relation defined in schema
    // Bookings would need to be fetched separately if needed
    const room = await prisma.room.findUnique({
      where: { id }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = roomUpdateSchema.parse(body)

    // Check if room number already exists (if being updated)
    if (validatedData.number) {
      const existingRoom = await prisma.room.findFirst({
        where: {
          number: validatedData.number,
          id: { not: id }
        }
      })

      if (existingRoom) {
        return NextResponse.json(
          { error: 'Room number already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: any = { ...validatedData }
    
    // Handle relational updates for images if provided
    if (validatedData.images) {
      updateData.roomImages = {
        deleteMany: {}, // Simplest approach: clear and recreation for relational images
        create: validatedData.images.map(url => ({
          imageUrl: url
        }))
      }
      delete updateData.images // Remove the flat array before sending to prisma for Room model
    }

    const room = await prisma.room.update({
      where: { id: id },
      data: updateData,
      include: {
        roomType: true,
        roomImages: true
      } as any
    })

    return NextResponse.json(room)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating room:', error)
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any).roleName !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if room has active bookings
    const activeBookings = await prisma.booking.findFirst({
      where: {
        roomId: id,
        status: {
          in: ['CONFIRMED', 'CHECKED_IN']
        }
      }
    })

    if (activeBookings) {
      return NextResponse.json(
        { error: 'Cannot delete room with active bookings' },
        { status: 400 }
      )
    }

    await prisma.room.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    )
  }
} 