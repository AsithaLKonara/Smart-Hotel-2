import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'KITCHEN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const folios = await prisma.invoice.findMany({
      where: { bookingId },
      include: { lineItems: true },
      orderBy: { issuedAt: 'asc' }
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

    const newFolio = await prisma.invoice.create({
      data: {
        bookingId,
        invoiceNo: `FOL-${Date.now()}`,
        folioType: folioType || 'INCIDENTALS',
        status: 'OPEN',
        subtotal: 0,
        taxAmount: 0,
        grandTotal: 0
      }
    });

    return NextResponse.json({ success: true, folio: newFolio });
  } catch (error) {
    console.error('Failed to create folio:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
