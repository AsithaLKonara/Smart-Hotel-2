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
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = await getEffectivePropertyId(req);
    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get('spaceId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (spaceId) where.spaceId = spaceId;
    if (status) where.status = status;
    if (propertyId && propertyId !== 'all') {
      where.space = { propertyId };
    }

    const [bookings, total] = await Promise.all([
      prisma.eventBooking.findMany({
        where,
        include: {
          space: { select: { id: true, name: true, type: true } },
          event: { select: { id: true, name: true } }
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
      prisma.eventBooking.count({ where })
    ]);

    return NextResponse.json({
      data: bookings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Failed to fetch hall bookings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const createBookingSchema = z.object({
  spaceId: z.string().uuid('Invalid space ID'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Valid email required').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  purpose: z.string().optional(),
  guestCount: z.number().int().positive().default(1),
  notes: z.string().optional(),
  totalAmount: z.number().min(0).default(0),
  paymentStatus: z.enum(['UNPAID', 'PARTIAL', 'PAID']).default('UNPAID'),
  eventId: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const result = createBookingSchema.safeParse(json);
    if (!result.success) return handleZodError(result.error);

    const { spaceId, startTime, endTime, contactName, contactEmail, contactPhone,
            purpose, guestCount, notes, totalAmount, paymentStatus, eventId } = result.data;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Verify space exists
    const space = await prisma.eventSpace.findUnique({ where: { id: spaceId } });
    if (!space) return NextResponse.json({ error: 'Hall/Space not found' }, { status: 404 });
    if (!space.isActive) return NextResponse.json({ error: 'This hall is not currently active' }, { status: 400 });

    // Capacity check
    if (guestCount > space.capacity) {
      return NextResponse.json({
        error: `Guest count (${guestCount}) exceeds hall capacity (${space.capacity})`
      }, { status: 400 });
    }

    // Overlap check
    const overlapping = await prisma.eventBooking.findFirst({
      where: {
        spaceId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [{ startTime: { lt: end }, endTime: { gt: start } }]
      }
    });

    if (overlapping) {
      return NextResponse.json({
        error: `This hall is already booked from ${overlapping.startTime.toLocaleString()} to ${overlapping.endTime.toLocaleString()}`
      }, { status: 409 });
    }

    const booking = await prisma.eventBooking.create({
      data: {
        spaceId,
        eventId: eventId || null,
        startTime: start,
        endTime: end,
        status: 'CONFIRMED',
        contactName,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        purpose: purpose || null,
        guestCount,
        totalAmount,
        paymentStatus,
        notes: notes || null,
      },
      include: {
        space: { select: { id: true, name: true, type: true } }
      }
    });

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error('Failed to create hall booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
