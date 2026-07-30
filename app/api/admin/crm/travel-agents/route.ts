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

    const agents = await prisma.travelAgent.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Failed to fetch travel agents:', error);
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
    const { agencyName, iataNumber, contactName, contactEmail, contactPhone, commissionRate } = data;

    const agent = await prisma.travelAgent.create({
      data: {
        agencyName,
        iataNumber,
        contactName,
        contactEmail,
        contactPhone,
        commissionRate: commissionRate ? parseFloat(commissionRate) : 10.0
      }
    });

    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error('Failed to create travel agent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
