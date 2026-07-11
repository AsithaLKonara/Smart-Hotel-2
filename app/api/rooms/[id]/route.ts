import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { handleZodError, toPublicRoomDTO } from '@/lib/api-utils'

const roomUpdateSchema = z.object({
  number: z.string().min(1, 'Room number is required').optional(),
  roomTypeId: z.string().optional(),
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
      return handleZodError(error)
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
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        roomType: true
      } as any
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    const session = await getServerSession(authOptions)
    
    // Strip operational fields for unauthenticated/unauthorized users
    const isAuthenticatedStaff = session && ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE'].includes((session.user as any).roleName as string)
    
    if (!isAuthenticatedStaff) {
      return NextResponse.json(toPublicRoomDTO(room))
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
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (!['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
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

    const updateData: any = {};
    if (validatedData.number) updateData.number = validatedData.number;
    if (validatedData.floor !== undefined) updateData.floor = validatedData.floor;
    if (validatedData.size !== undefined) updateData.size = validatedData.size;
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.roomTypeId) updateData.roomTypeId = validatedData.roomTypeId;

    const room = await prisma.room.update({
      where: { id: id },
      data: updateData,
      include: {
        roomType: true,
      } as any
    })

    return NextResponse.json(room)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
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
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (!['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if room has active bookings
    const activeBookings = await prisma.booking.findFirst({
      where: {
        roomAssignments: {
          some: {
            roomId: id
          }
        },
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

    await prisma.room.update({
      where: { id: id },
      data: { deletedAt: new Date() }
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