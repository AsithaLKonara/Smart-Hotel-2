import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectivePropertyId } from '@/lib/server-rbac';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    const propertyId = await getEffectivePropertyId(req);
    const whereClause = propertyId ? { propertyId } : {};

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        skip,
        take: limit,
        where: whereClause,
        include: {
          roomType: true,
          stays: {
            where: { status: 'CHECKED_IN' },
            include: { booking: { include: { guest: true } } }
          }
        },
        orderBy: { number: 'asc' }
      }),
      prisma.room.count({ where: whereClause })
    ]);

    return NextResponse.json({ 
      data: rooms,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const updateRoomStatusSchema = z.object({
  roomId: z.string().uuid(),
  newStatus: z.enum([
    'AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 
    'INSPECTION_PENDING', 'MAINTENANCE', 'OUT_OF_ORDER'
  ]),
});

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const result = updateRoomStatusSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: 'Validation Error', details: result.error.format() }, { status: 400 });
    }

    const { roomId, newStatus } = result.data;

    const oldRoom = await prisma.room.findUnique({ where: { id: roomId } });
    if (!oldRoom) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { status: newStatus }
    });

    // Log the status change
    await prisma.roomStatusHistory.create({
      data: {
        roomId,
        oldStatus: oldRoom.status as any,
        newStatus: newStatus as any,
        actorId: (session.user as any).id,
        reason: 'Housekeeping board update'
      }
    });

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error) {
    console.error('Failed to update room status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
