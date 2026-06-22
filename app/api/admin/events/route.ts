import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await prisma.banquetingEvent.findMany({
      include: {
        spaceBookings: { include: { space: true } },
        groupBlocks: { include: { roomType: true } }
      },
      orderBy: { startDate: 'asc' }
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { name, type, status, startDate, endDate, expectedAttendees, organizerName, organizerEmail, spaceId } = data;

    const event = await prisma.banquetingEvent.create({
      data: {
        name,
        type,
        status: status || 'PROSPECT',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        expectedAttendees: parseInt(expectedAttendees),
        organizerName,
        organizerEmail,
        spaceBookings: spaceId ? {
            create: {
                spaceId,
                startTime: new Date(startDate),
                endTime: new Date(endDate)
            }
        } : undefined
      },
      include: { spaceBookings: { include: { space: true } } }
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
