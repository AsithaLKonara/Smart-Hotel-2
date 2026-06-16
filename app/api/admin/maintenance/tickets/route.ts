import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tickets = await prisma.maintenanceRequest.findMany({
      include: { room: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Failed to fetch maintenance tickets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const { roomId, title, description, category, priority } = data;

    const ticket = await prisma.maintenanceRequest.create({
      data: {
        roomId,
        userId: session.user.id,
        title,
        description,
        category: category || 'General',
        priority: priority || 'medium',
        status: 'pending'
      }
    });

    // If linked to a room, optionally update room status to MAINTENANCE
    if (roomId && priority === 'urgent') {
        const room = await prisma.room.findUnique({ where: { id: roomId } })
        if (room) {
            await prisma.room.update({ where: { id: roomId }, data: { status: 'MAINTENANCE' } })
            await prisma.roomStatusHistory.create({
                data: {
                    roomId,
                    oldStatus: room.status as any,
                    newStatus: 'MAINTENANCE',
                    actorId: session.user.id,
                    reason: 'Urgent Maintenance Request Created'
                }
            })
        }
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Failed to create maintenance ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
    try {
      const session = await getServerSession(authOptions);
      if (!session || !['SUPER_ADMIN', 'MANAGER', 'MAINTENANCE'].includes((session.user as any).roleName as string)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const data = await req.json();
      const { id, status } = data;
  
      const ticket = await prisma.maintenanceRequest.update({
        where: { id },
        data: { status }
      });
  
      // If resolved, put room back to available (or dirty)
      if (status === 'resolved' && ticket.roomId) {
        const room = await prisma.room.findUnique({ where: { id: ticket.roomId } })
        if (room && room.status === 'MAINTENANCE') {
            await prisma.room.update({ where: { id: ticket.roomId }, data: { status: 'DIRTY' } })
            await prisma.roomStatusHistory.create({
                data: {
                    roomId: ticket.roomId,
                    oldStatus: 'MAINTENANCE',
                    newStatus: 'DIRTY',
                    actorId: session.user.id,
                    reason: 'Maintenance Resolved'
                }
            })
        }
      }
  
      return NextResponse.json({ success: true, ticket });
    } catch (error) {
      console.error('Failed to update maintenance ticket:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
