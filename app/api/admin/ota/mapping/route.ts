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
    if (!session || !['MANAGER', 'SUPER_ADMIN', 'ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    // Fetch channel room mappings
    const channelMappings = await prisma.channelRoomMapping.findMany({
      where: connectionId ? { connectionId } : undefined,
      include: {
        connection: {
          select: { id: true, provider: { select: { code: true, name: true } } }
        }
      }
    });

    // Also get rate mappings if any exist
    const rateMappings = await prisma.channelRateMapping.findMany({
      where: connectionId ? { connectionId } : undefined,
    });

    // Format for UI consumption
    const mappings = channelMappings.map((cm: any) => {
      const rm = rateMappings.find((r: any) => r.connectionId === cm.connectionId);
      return {
        id: cm.id,
        connectionId: cm.connectionId,
        localRoomTypeId: cm.localRoomTypeId,
        otaRoomTypeId: cm.externalRoomId,
        otaRatePlanId: rm?.externalRateId || '',
        syncEnabled: cm.syncAvailability
      };
    });

    const roomTypes = await prisma.roomType.findMany({
      select: { id: true, name: true, baseRate: true, totalRooms: true }
    });

    return NextResponse.json({ mappings, roomTypes });
  } catch (error: any) {
    console.error('Fetch OTA Mapping Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/ota/mapping
 * Creates or updates a channel room mapping
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getRequestSession(req);
    if (!session || !['MANAGER', 'SUPER_ADMIN', 'ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { localRoomTypeId, otaRoomTypeId, otaRatePlanId, syncEnabled, connectionId: reqConnectionId } = body;

    if (!localRoomTypeId) {
      return NextResponse.json({ error: 'Missing localRoomTypeId' }, { status: 400 });
    }

    // Determine connection to associate mapping with
    let connectionId = reqConnectionId;
    if (!connectionId) {
      const defaultConn = await prisma.channelConnection.findFirst({
        orderBy: { lastSyncAt: 'desc' }
      });
      if (!defaultConn) {
        return NextResponse.json({ error: 'No active ChannelConnection found. Please connect an OTA channel first.' }, { status: 400 });
      }
      connectionId = defaultConn.id;
    }

    // Upsert ChannelRoomMapping
    const roomMapping = await prisma.channelRoomMapping.upsert({
      where: {
        connectionId_localRoomTypeId: {
          connectionId,
          localRoomTypeId
        }
      },
      update: {
        externalRoomId: otaRoomTypeId || '',
        syncAvailability: syncEnabled ?? true
      },
      create: {
        connectionId,
        localRoomTypeId,
        externalRoomId: otaRoomTypeId || '',
        syncAvailability: syncEnabled ?? true
      }
    });

    // If otaRatePlanId is provided, also upsert rate mapping
    if (otaRatePlanId) {
      await prisma.channelRateMapping.upsert({
        where: { id: `rate-map-${connectionId}-${localRoomTypeId}` },
        update: {
          externalRateId: otaRatePlanId,
          syncRates: true
        },
        create: {
          id: `rate-map-${connectionId}-${localRoomTypeId}`,
          connectionId,
          localRatePlanId: localRoomTypeId,
          externalRateId: otaRatePlanId,
          syncRates: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      mapping: {
        id: roomMapping.id,
        connectionId,
        localRoomTypeId: roomMapping.localRoomTypeId,
        otaRoomTypeId: roomMapping.externalRoomId,
        otaRatePlanId: otaRatePlanId || '',
        syncEnabled: roomMapping.syncAvailability
      }
    });
  } catch (error: any) {
    console.error('Save OTA Mapping Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
