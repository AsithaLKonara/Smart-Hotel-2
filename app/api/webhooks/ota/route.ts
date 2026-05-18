import { NextRequest, NextResponse } from 'next/server';
import { processOtaReservation } from '@/lib/ota/webhook-handler';
import { log } from '@/lib/logger';

/**
 * OTA Webhook Endpoint
 * Receives bookings from Channex/Beds24 middleware
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    // 1. Log incoming request for debugging
    log.info('Received OTA Webhook Request', { 
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for')
    });

    // 2. Immediate Acknowledgment (Best practice for webhooks)
    // We process it asynchronously or before returning if it's fast enough.
    // Channex expects a 200 OK.
    
    const result = await processOtaReservation(payload);

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      result 
    }, { status: 200 });

  } catch (error: any) {
    log.error('Webhook Endpoint Error', { error: error.message });
    
    // Even on error, we might want to return 200 if we've logged it,
    // to prevent the OTA from retrying indefinitely if it's a logic error.
    // But for now, we return 500 for visibility.
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * GET handler for status checks
 */
export async function GET() {
  return NextResponse.json({ status: 'OTA Webhook Listener Active' });
}
