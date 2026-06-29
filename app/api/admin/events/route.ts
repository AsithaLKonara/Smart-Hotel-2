import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.banquetingEvent.findMany({
        skip,
        take: limit,
        include: {
          spaceBookings: { include: { space: true } },
          groupBlocks: { include: { roomType: true } }
        },
        orderBy: { startDate: 'asc' }
      }),
      prisma.banquetingEvent.count()
    ]);

    return NextResponse.json({ 
      data: events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const createEventSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  status: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  expectedAttendees: z.number().int().positive(),
  organizerName: z.string().min(1),
  organizerEmail: z.string().email().optional().nullable(),
  spaceId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const result = createEventSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: 'Validation Error', details: result.error.format() }, { status: 400 });
    }

    const { name, type, status, startDate, endDate, expectedAttendees, organizerName, organizerEmail, spaceId } = result.data;

    const event = await prisma.banquetingEvent.create({
      data: {
        name,
        type,
        status: status || 'PROSPECT',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        expectedAttendees,
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
