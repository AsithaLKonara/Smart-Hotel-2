import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireRoles } from '@/lib/auth-utils'

export async function GET() {
  try {
    const { errorResponse, session } = await requireRoles(['SUPER_ADMIN', 'MANAGER', 'ADMIN']);
    if (errorResponse) return errorResponse;

    const connections = await prisma.channelConnection.findMany({
      where: session.user.roleName !== 'SUPER_ADMIN' && session.user.propertyId 
        ? { propertyId: session.user.propertyId } 
        : undefined,
      include: {
        provider: true
      }
    });

    const roomMappings = await prisma.channelRoomMapping.findMany({
      include: {
        roomType: {
          select: { id: true, name: true }
        }
      }
    });

    const enrichedMappings = roomMappings.map((m: any) => ({
      id: m.id,
      connectionId: m.connectionId,
      localRoomTypeId: m.localRoomTypeId,
      externalRoomId: m.externalRoomId,
      syncAvailability: m.syncAvailability,
      localRoomName: m.roomType?.name || 'Unknown Room'
    }));

    const safeChannels = connections.map((c: any) => ({
      id: c.id,
      provider: c.provider.code,
      providerName: c.provider.name,
      propertyId: c.propertyId,
      isEnabled: c.status === 'HEALTHY',
      status: c.status,
      configured: !!(c.clientId && c.clientSecretEncrypted)
    }));

    return NextResponse.json({ channels: safeChannels, mappings: enrichedMappings });
  } catch (error: any) {
    console.error('Fetch Channel Config Error:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}
