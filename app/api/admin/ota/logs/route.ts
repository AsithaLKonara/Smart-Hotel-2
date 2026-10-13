import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const events = await prisma.channelSyncEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        connection: {
          select: {
            id: true,
            provider: { select: { code: true, name: true } },
            property: { select: { name: true } }
          }
        }
      }
    });

    // Format logs for standardized display
    const formattedLogs = events.map((e: any) => ({
      id: e.id,
      connectionId: e.connectionId,
      provider: e.connection?.provider?.name || 'Channel',
      eventType: e.eventType,
      entityType: e.entityType,
      direction: e.direction,
      status: e.status,
      errorMessage: e.errorMessage,
      createdAt: e.createdAt,
      completedAt: e.completedAt
    }));

    return NextResponse.json({ logs: formattedLogs });
  } catch (error: any) {
    console.error('Fetch OTA Logs Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
