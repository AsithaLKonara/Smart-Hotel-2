import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await prisma.room.findMany({
      include: {
        roomType: true,
        bookings: {
          where: { status: 'CHECKED_IN' },
          include: { guest: true }
        }
      },
      orderBy: { number: 'asc' }
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { roomId, newStatus } = data;

    if (!roomId || !newStatus) {
      return NextResponse.json({ error: 'Missing roomId or newStatus' }, { status: 400 });
    }

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
        actorId: session.user.id,
        reason: 'Housekeeping board update'
      }
    });

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error) {
    console.error('Failed to update room status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
