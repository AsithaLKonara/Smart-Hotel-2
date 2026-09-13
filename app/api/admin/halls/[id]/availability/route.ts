import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    if (!fromStr || !toStr) {
      return NextResponse.json({ error: 'from and to date params are required' }, { status: 400 });
    }

    const from = new Date(fromStr);
    const to = new Date(toStr);

    // Fetch all bookings that overlap with the given range
    const bookings = await prisma.eventBooking.findMany({
      where: {
        spaceId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          { startTime: { lt: to }, endTime: { gt: from } }
        ]
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        confirmationCode: true,
        contactName: true,
        purpose: true,
        guestCount: true,
        event: { select: { name: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    return NextResponse.json({ data: bookings });
  } catch (error) {
    console.error('Failed to fetch hall availability:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
