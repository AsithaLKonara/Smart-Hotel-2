import { NextRequest, NextResponse } from 'next/server';
import { processOtaReservation } from '@/lib/ota/webhook-handler';
import { log } from '@/lib/logger';
import { enhancedRateLimit, createEnhancedRateLimitResponse } from '@/lib/rate-limit-enhanced';

/**
 * OTA Webhook Endpoint
 * Receives bookings from Channex/Beds24 middleware
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await enhancedRateLimit(req, 'api');
    if (!rateLimitResult.allowed) {
      return createEnhancedRateLimitResponse(rateLimitResult);
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('x-api-key');
    const secret = process.env.OTA_WEBHOOK_SECRET;
    
    if (!secret || authHeader !== `Bearer ${secret}` && authHeader !== secret) {
      log.warn('OTA Webhook Authorization Failed', { ip: req.headers.get('x-forwarded-for') });
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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
    log.error('Webhook Endpoint Error', error instanceof Error ? error : new Error(String(error)));
    
    // Return 200 to prevent OTA infinite retry loops on logic errors.
    // The error is logged and can be investigated asynchronously.
    return NextResponse.json({ 
      success: false, 
      error: 'Webhook processing failed — logged for review'
    }, { status: 200 });
  }
}

/**
 * GET handler for status checks
 */
export async function GET() {
  return NextResponse.json({ status: 'OTA Webhook Listener Active' });
}
