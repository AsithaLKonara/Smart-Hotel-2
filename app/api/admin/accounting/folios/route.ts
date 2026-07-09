import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { realtime } from '@/lib/realtime';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'KITCHEN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');
    const status = searchParams.get('status');

    let whereClause: any = {};
    if (bookingId) whereClause.bookingId = bookingId;
    if (status) whereClause.status = status;

    const folios = await prisma.folio.findMany({
      where: whereClause,
      include: { 
        lineItems: true,
        payments: true,
        booking: {
          include: {
            guest: true,
            roomAssignments: {
              include: { room: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ folios });
  } catch (error) {
    console.error('Failed to fetch folios:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'KITCHEN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { bookingId, folioType } = data;

    const newFolio = await prisma.$transaction(async (tx: any) => {
      const folios = await tx.folio.findMany({ where: { bookingId } });
      const nextWindow = folios.length > 0 ? Math.max(...folios.map((f: any) => f.windowNumber)) + 1 : 1;

      return await tx.folio.create({
        data: {
          bookingId,
          windowNumber: nextWindow,
          type: folioType || 'INCIDENTALS',
          status: 'OPEN',
        }
      });
    });

    try {
      await realtime.trigger('admin', 'folio.created', {
        folioId: newFolio.id,
        bookingId: newFolio.bookingId
      });
    } catch (e) {
      console.error('Pusher error:', e);
    }

    return NextResponse.json({ success: true, folio: newFolio });
  } catch (error) {
    console.error('Failed to create folio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
