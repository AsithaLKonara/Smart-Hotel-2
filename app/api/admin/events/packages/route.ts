import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { handleZodError } from '@/lib/api-utils';
import { getEffectivePropertyId } from '@/lib/server-rbac';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = await getEffectivePropertyId(req);
    const propertyWhere = propertyId && propertyId !== 'all' ? { propertyId } : {};

    const packages = await prisma.eventPackage.findMany({
      where: propertyWhere,
      include: {
        space: true,
        roomType: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ data: packages });
  } catch (error) {
    console.error('Failed to fetch event packages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const createPackageSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  pricePerPax: z.number().min(0),
  flatFee: z.number().min(0),
  includesSpaceId: z.string().uuid().optional(),
  includesRoomId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
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
    const result = createPackageSchema.safeParse(json);

    if (!result.success) {
      return handleZodError(result.error);
    }

    const { name, description, pricePerPax, flatFee, includesSpaceId, includesRoomId } = result.data;

    const eventPackage = await prisma.eventPackage.create({
      data: {
        propertyId,
        name,
        description,
        pricePerPax,
        flatFee,
        includesSpaceId: includesSpaceId || null,
        includesRoomId: includesRoomId || null,
      },
      include: { space: true, roomType: true }
    });

    return NextResponse.json({ success: true, data: eventPackage });
  } catch (error) {
    console.error('Failed to create event package:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
