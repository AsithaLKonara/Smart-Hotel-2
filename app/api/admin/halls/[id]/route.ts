import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { handleZodError } from '@/lib/api-utils';

const updateHallSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(['HALL', 'CONFERENCE_ROOM', 'BALLROOM', 'BOARDROOM', 'OUTDOOR']).optional(),
  capacity: z.number().int().positive().optional(),
  floorNumber: z.number().int().optional().nullable(),
  hourlyRate: z.number().min(0).optional(),
  dailyRate: z.number().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hall = await prisma.eventSpace.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { startTime: 'desc' },
          take: 20,
        },
        _count: { select: { bookings: true } }
      }
    });

    if (!hall) {
      return NextResponse.json({ error: 'Hall not found' }, { status: 404 });
    }

    return NextResponse.json({ data: hall });
  } catch (error) {
    console.error('Failed to fetch hall:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const result = updateHallSchema.safeParse(json);
    if (!result.success) return handleZodError(result.error);

    const hall = await prisma.eventSpace.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ success: true, data: hall });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Hall not found' }, { status: 404 });
    }
    console.error('Failed to update hall:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for future confirmed bookings
    const futureBookings = await prisma.eventBooking.count({
      where: {
        spaceId: id,
        status: { in: ['CONFIRMED', 'PENDING'] },
        startTime: { gt: new Date() }
      }
    });

    if (futureBookings > 0) {
      return NextResponse.json(
        { error: `Cannot delete hall: ${futureBookings} future booking(s) exist. Cancel them first.` },
        { status: 409 }
      );
    }

    await prisma.eventSpace.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Hall not found' }, { status: 404 });
    }
    console.error('Failed to delete hall:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
