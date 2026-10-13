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
    const propertyWhere = propertyId && propertyId !== 'all' ? { propertyId } : {};
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const active = searchParams.get('active');

    const halls = await prisma.eventSpace.findMany({
      where: {
        ...propertyWhere,
        ...(type ? { type } : {}),
        ...(active === 'true' ? { isActive: true } : {}),
      },
      include: {
        _count: { select: { bookings: true } }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ data: halls });
  } catch (error) {
    console.error('Failed to fetch halls:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const createHallSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['HALL', 'CONFERENCE_ROOM', 'BALLROOM', 'BOARDROOM', 'OUTDOOR']).default('HALL'),
  capacity: z.number().int().positive('Capacity must be positive'),
  floorNumber: z.number().int().optional().nullable(),
  hourlyRate: z.number().min(0, 'Rate must be 0 or greater'),
  dailyRate: z.number().min(0, 'Rate must be 0 or greater'),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});

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

    const json = await req.json();
    const result = createHallSchema.safeParse(json);
    if (!result.success) return handleZodError(result.error);

    const { name, description, type, capacity, floorNumber, hourlyRate, dailyRate, amenities, images } = result.data;

    const hall = await prisma.eventSpace.create({
      data: {
        propertyId,
        name,
        description,
        type,
        capacity,
        floorNumber,
        hourlyRate,
        dailyRate,
        amenities,
        images,
      }
    });

    return NextResponse.json({ success: true, data: hall }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A hall with this name already exists at this property' }, { status: 409 });
    }
    console.error('Failed to create hall:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
