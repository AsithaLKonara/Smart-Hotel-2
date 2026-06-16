import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRequestSession } from '@/lib/session';

/**
 * GET /api/admin/ota/mapping
 * Fetches all room mappings and available room types
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session || !['MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mappings = await prisma.roomMapping.findMany();
    const roomTypes = await prisma.roomType.findMany({
      select: { id: true, name: true }
    });

    return NextResponse.json({ mappings, roomTypes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/ota/mapping
 * Creates or updates a room mapping
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req);
    if (!session || !['MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { localRoomTypeId, otaRoomTypeId, otaRatePlanId, syncEnabled } = body;

    const mapping = await prisma.roomMapping.upsert({
      where: { id: body.id || 'new-mapping' },
      update: {
        otaRoomTypeId,
        otaRatePlanId,
        syncEnabled
      },
      create: {
        localRoomTypeId,
        otaRoomTypeId,
        otaRatePlanId,
        syncEnabled: syncEnabled ?? true
      }
    });

    return NextResponse.json(mapping);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
