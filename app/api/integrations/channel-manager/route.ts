import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { inboundOtaQueue } from '@/lib/channel-manager/queues';

/**
 * Generic webhook receiver for OTAs that support Push (e.g. some Channel Managers, Expedia).
 * For Booking.com, reservations are typically pulled via a cron job, but we leave this here
 * to support the "Push" pattern for other providers.
 */
export async function POST(req: NextRequest) {
  try {
    const rawPayload = await req.text();
    
    // Validate authentication (usually basic auth or API key over mutual TLS)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized OTA Request' }, { status: 401 });
    }

    const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim();
    
    // In the new architecture, we might look this up by machineAccountId or a hashed token.
    // For this route, we assume it's a legacy or push-based provider.
    const connection = await prisma.channelConnection.findFirst({
      where: { 
        accessTokenEncrypted: apiKey,
        status: { in: ['HEALTHY', 'WARNING'] }
      },
      include: { provider: true }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Unauthorized OTA Request' }, { status: 401 });
    }

    // Push the raw message to the inbound queue immediately to free up the HTTP thread
    await inboundOtaQueue.add('process-webhook', {
      operation: 'WEBHOOK_PUSH',
      connectionId: connection.id,
      providerCode: connection.provider.code,
      payload: rawPayload
    });

    return NextResponse.json({ success: true, message: 'Webhook queued' }, { status: 202 });

  } catch (error) {
    console.error('Channel Manager Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET endpoint to manually trigger a Pull for polling-based OTAs (like Booking.com)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const connectionId = searchParams.get('connectionId');

  if (!connectionId) {
    return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 });
  }

  // Enqueue a RESERVATION_PULL job
  await inboundOtaQueue.add('manual-pull', {
    operation: 'RESERVATION_PULL',
    connectionId: connectionId
  });

  return NextResponse.json({ success: true, message: 'Reservation pull triggered' });
}
