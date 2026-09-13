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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [blocks, total] = await Promise.all([
      prisma.groupBlock.findMany({
        skip,
        take: limit,
        include: { roomType: true, event: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.groupBlock.count()
    ]);

    return NextResponse.json({ 
      data: blocks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch group blocks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const createBlockSchema = z.object({
  eventId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  blockedCount: z.number().int().positive(),
  contractedRate: z.number().positive(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const result = createBlockSchema.safeParse(json);
    if (!result.success) {
      return handleZodError(result.error);
    }

    const { eventId, roomTypeId, blockedCount, contractedRate } = result.data;
    
    const propertyId = await getEffectivePropertyId(req);
    if (!propertyId || propertyId === 'all') {
      return NextResponse.json({ error: 'Valid property context is required' }, { status: 400 });
    }

    // Verify property isolation
    const [event, roomType] = await Promise.all([
      prisma.banquetingEvent.findUnique({ where: { id: eventId } }),
      prisma.roomType.findUnique({ where: { id: roomTypeId } })
    ]);

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    if (!roomType) return NextResponse.json({ error: 'Room type not found' }, { status: 404 });

    if (event.propertyId !== propertyId || roomType.propertyId !== propertyId) {
      return NextResponse.json({ error: 'Event and Room Type must belong to the active property' }, { status: 400 });
    }

    const block = await prisma.groupBlock.create({
      data: {
        eventId,
        roomTypeId,
        blockedCount,
        contractedRate,
      },
      include: { roomType: true }
    });

    return NextResponse.json({ success: true, block });
  } catch (error) {
    console.error('Failed to create group block:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
