import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEffectivePropertyId } from '@/lib/server-rbac';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = await getEffectivePropertyId(req);
    const propertyWhere = propertyId && propertyId !== 'all' ? { propertyId } : {};

    const spaces = await prisma.eventSpace.findMany({
      where: propertyWhere,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ spaces });
  } catch (error) {
    console.error('Failed to fetch event spaces:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = await getEffectivePropertyId(req);
    if (!propertyId || propertyId === 'all') {
      return NextResponse.json({ error: 'Valid property context is required' }, { status: 400 });
    }

    const data = await req.json();
    const { name, capacity, hourlyRate, dailyRate } = data;

    const space = await prisma.eventSpace.create({
      data: { propertyId, name, capacity: parseInt(capacity), hourlyRate: parseFloat(hourlyRate), dailyRate: parseFloat(dailyRate) }
    });

    return NextResponse.json({ success: true, space });
  } catch (error) {
    console.error('Failed to create event space:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
