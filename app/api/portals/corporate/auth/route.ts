import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { companyId, accessCode } = await req.json();

    const corporateAccount = await prisma.corporateAccount.findUnique({
      where: { companyName: companyId }
    });

    if (!corporateAccount || !corporateAccount.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive corporate account' }, { status: 401 });
    }

    // In a real system we'd check accessCode against a hash.
    // For demo, we just require it to be non-empty.
    if (!accessCode) {
      return NextResponse.json({ error: 'Access code required' }, { status: 401 });
    }

    // Fetch recent bookings
    const users = await prisma.user.findMany({
      where: { corporateAccountId: corporateAccount.id },
      select: { id: true, name: true }
    });
    
    const userIds = users.map((u: any) => u.id);
    const recentBookings = await prisma.booking.findMany({
      where: { primaryGuestId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { guest: true }
    });

    return NextResponse.json({
      name: corporateAccount.companyName,
      rate: corporateAccount.negotiatedRate || 0,
      recentBookings: recentBookings.map((b: any) => ({
        id: b.id,
        guestName: b.guest.name,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        totalAmount: b.totalAmount
      }))
    });
  } catch (error) {
    console.error('Corporate Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
