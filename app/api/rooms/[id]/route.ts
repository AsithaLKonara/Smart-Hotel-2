import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'

const roomUpdateSchema = z.object({
  number: z.string().min(1, 'Room number is required').optional(),
  type: z.string().optional(),
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
    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE'];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = roomUpdateSchema.parse(body)

    // Restrict updates for operational staff to only status/availability
    if (!['SUPER_ADMIN', 'MANAGER'].includes(userRole)) {
      const allowedKeys = ['status', 'isAvailable'];
      const providedKeys = Object.keys(validatedData);
      const invalidKeys = providedKeys.filter(k => !allowedKeys.includes(k));
      if (invalidKeys.length > 0) {
        return NextResponse.json({ error: `Forbidden: Your role can only update ${allowedKeys.join(', ')}` }, { status: 403 });
      }
    }

    const existingRoom = await prisma.room.findUnique({ where: { id } })
    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const room = await prisma.$transaction(async (tx: any) => {
      const updatedRoom = await tx.room.update({
        where: { id: id },
        data: {
          ...validatedData,
          status: validatedData.status as any,
        }
      })

      // If status changed to DIRTY
      if (validatedData.status === 'DIRTY' && existingRoom.status !== 'DIRTY') {
        await tx.task.create({
          data: {
            title: `Clean Room ${updatedRoom.number}`,
            type: 'HOUSEKEEPING',
            status: 'PENDING',
            priority: 'HIGH',
            roomId: updatedRoom.id,
          }
        })
      }
      
      // If status changed to MAINTENANCE
      if (validatedData.status === 'MAINTENANCE' && existingRoom.status !== 'MAINTENANCE') {
        await tx.task.create({
          data: {
            title: `Maintenance required for Room ${updatedRoom.number}`,
            type: 'MAINTENANCE',
            status: 'PENDING',
            priority: 'HIGH',
            roomId: updatedRoom.id,
          }
        })
      }

      return updatedRoom
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

    // Process RoomType upsert if type is provided
    let roomTypeId: string | undefined = undefined;
    if (validatedData.type) {
      const roomType = await prisma.roomType.upsert({
        where: { name: validatedData.type },
        update: {
          ...(validatedData.price !== undefined && { baseRate: validatedData.price }),
          ...(validatedData.capacity !== undefined && { capacity: validatedData.capacity }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...(validatedData.amenities !== undefined && { amenities: validatedData.amenities }),
        },
        create: {
          name: validatedData.type,
          baseRate: validatedData.price || 0,
          capacity: validatedData.capacity || 2,
          description: validatedData.description || '',
          amenities: validatedData.amenities || [],
        }
      });
      roomTypeId = roomType.id;
    }

    const updateData: any = {};
    if (validatedData.number) updateData.number = validatedData.number;
    if (validatedData.floor !== undefined) updateData.floor = validatedData.floor;
    if (validatedData.size !== undefined) updateData.size = validatedData.size;
    if (validatedData.capacity !== undefined) updateData.capacity = validatedData.capacity;
    if (validatedData.status) updateData.status = validatedData.status;
    if (roomTypeId) updateData.roomTypeId = roomTypeId;
    
    // Handle relational updates for images if provided
    if (validatedData.images) {
      updateData.roomImages = {
        deleteMany: {}, // Simplest approach: clear and recreation for relational images
        create: validatedData.images.map(url => ({
          imageUrl: url
        }))
      }
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
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
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