import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const spaces = await prisma.eventSpace.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ spaces });
  } catch (error) {
    console.error('Failed to fetch event spaces:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { name, capacity, hourlyRate, dailyRate } = data;

    const space = await prisma.eventSpace.create({
      data: { name, capacity: parseInt(capacity), hourlyRate: parseFloat(hourlyRate), dailyRate: parseFloat(dailyRate) }
    });

    return NextResponse.json({ success: true, space });
  } catch (error) {
    console.error('Failed to create event space:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
