import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { handleZodError } from '@/lib/api-utils';

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  contactName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')).nullable(),
  contactPhone: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  guestCount: z.number().int().positive().optional(),
  totalAmount: z.number().min(0).optional(),
  paymentStatus: z.enum(['UNPAID', 'PARTIAL', 'PAID']).optional(),
  notes: z.string().optional().nullable(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  bookingId: z.string().uuid().optional().nullable(),
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

    const booking = await prisma.eventBooking.findUnique({
      where: { id },
      include: {
        space: true,
        event: { select: { id: true, name: true, type: true, status: true } }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ data: booking });
  } catch (error) {
    console.error('Failed to fetch booking:', error);
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
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const result = updateBookingSchema.safeParse(json);
    if (!result.success) return handleZodError(result.error);

    const existing = await prisma.eventBooking.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const { startTime, endTime, guestCount, ...rest } = result.data;

    const start = startTime ? new Date(startTime) : existing.startTime;
    const end = endTime ? new Date(endTime) : existing.endTime;

    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // If time is changing, re-check overlap
    if (startTime || endTime) {
      const overlapping = await prisma.eventBooking.findFirst({
        where: {
          spaceId: existing.spaceId,
          id: { not: id },
          status: { in: ['PENDING', 'CONFIRMED'] },
          OR: [{ startTime: { lt: end }, endTime: { gt: start } }]
        }
      });
      if (overlapping) {
        return NextResponse.json({
          error: `Time conflict with another booking (${overlapping.confirmationCode})`
        }, { status: 409 });
      }
    }

    // If posting to customer room folio
    if (result.data.bookingId && existing.totalAmount.toNumber() > 0) {
      try {
        const { postCharge } = await import('@/lib/accounting');
        const spaceName = (existing as any).space?.name || 'Hall';
        await postCharge({
          bookingId: result.data.bookingId,
          amount: existing.totalAmount.toNumber(),
          category: 'EVENTS',
          description: `Event Venue: ${spaceName} (${existing.purpose || 'Hall Booking'})`
        });
        (rest as any).paymentStatus = 'PAID';
      } catch (postErr) {
        console.error('Failed to post event charge to folio:', postErr);
      }
    }

    const booking = await prisma.eventBooking.update({
      where: { id },
      data: {
        ...rest,
        ...(startTime ? { startTime: start } : {}),
        ...(endTime ? { endTime: end } : {}),
        ...(guestCount !== undefined ? { guestCount } : {}),
      },
      include: {
        space: { select: { id: true, name: true, type: true } }
      }
    });

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error('Failed to update booking:', error);
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

    await prisma.eventBooking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    console.error('Failed to delete booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
