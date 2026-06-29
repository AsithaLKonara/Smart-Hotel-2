import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { iata } = await req.json();

    const travelAgent = await prisma.travelAgent.findFirst({
      where: { iataNumber: iata }
    });

    if (!travelAgent || !travelAgent.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive travel agent' }, { status: 401 });
    }

    // Calculate unpaid commissions. 
    // In a real system, you'd find bookings tracked under this travel agent that are paid and calculate commission.
    const agentUsers = await prisma.user.findMany({
      where: { travelAgentId: travelAgent.id },
      select: { id: true }
    });
    
    const userIds = agentUsers.map((u: any) => u.id);
    const bookings = await prisma.booking.findMany({
      where: { primaryGuestId: { in: userIds }, paymentStatus: 'completed' }
    });

    let unpaidCommissions = 0;
    for (const b of bookings) {
      unpaidCommissions += b.totalAmount * (travelAgent.commissionRate / 100);
    }

    return NextResponse.json({
      name: travelAgent.agencyName,
      iata: travelAgent.iataNumber,
      commission: travelAgent.commissionRate || 10,
      unpaidCommissions
    });
  } catch (error) {
    console.error('Travel Agent Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
