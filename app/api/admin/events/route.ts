import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { handleZodError } from '@/lib/api-utils';
import { getEffectivePropertyId } from '@/lib/server-rbac';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'KITCHEN', 'HOUSEKEEPING', 'MAINTENANCE'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    const propertyId = await getEffectivePropertyId(req);
    const propertyWhere = propertyId && propertyId !== 'all' ? { propertyId } : {};

    const [events, total] = await Promise.all([
      prisma.banquetingEvent.findMany({
        skip,
        take: limit,
        where: propertyWhere,
        include: {
          spaceBookings: { include: { space: true } },
          groupBlocks: { include: { roomType: true } }
        },
        orderBy: { startDate: 'asc' }
      }),
      prisma.banquetingEvent.count({ where: propertyWhere })
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
  organizerEmail: z.union([z.string().email(), z.literal('')]).optional().nullable(),
  spaceId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const result = createEventSchema.safeParse(json);

    if (!result.success) {
      console.log('Event POST Zod Error:', result.error.format());
      return handleZodError(result.error);
    }

    const { name, type, status, startDate, endDate, expectedAttendees, organizerName, organizerEmail, spaceId } = result.data;

    const propertyId = await getEffectivePropertyId(req);
    console.log('Event POST - Extracted propertyId:', propertyId);
    console.log('Event POST - Header x-property-id:', req.headers.get('x-property-id'));
    
    if (!propertyId || propertyId === 'all') {
      return NextResponse.json({ error: `Valid property context is required. Received: ${propertyId}` }, { status: 400 });
    }

    if (spaceId) {
      const space = await prisma.eventSpace.findUnique({ where: { id: spaceId } });
      if (!space) {
        return NextResponse.json({ error: 'Event space not found' }, { status: 404 });
      }
      if (space.propertyId !== propertyId) {
        return NextResponse.json({ error: 'Event space does not belong to the active property' }, { status: 400 });
      }
      if (expectedAttendees > space.capacity) {
        return NextResponse.json({ error: `Expected attendees (${expectedAttendees}) exceeds space capacity (${space.capacity})` }, { status: 400 });
      }

      // Check for overlapping bookings
      const overlapping = await prisma.eventBooking.findFirst({
        where: {
          spaceId,
          OR: [
            { startTime: { lt: new Date(endDate) }, endTime: { gt: new Date(startDate) } }
          ]
        }
      });

      if (overlapping) {
        return NextResponse.json({ error: 'Event space is already booked for the selected time' }, { status: 400 });
      }
    }

    const event = await prisma.banquetingEvent.create({
      data: {
        propertyId,
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
