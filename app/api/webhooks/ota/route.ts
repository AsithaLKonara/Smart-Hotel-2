import { NextRequest, NextResponse } from 'next/server';
import { processOtaReservation } from '@/lib/ota/webhook-handler';
import { log } from '@/lib/logger';
import { enhancedRateLimit, createEnhancedRateLimitResponse } from '@/lib/rate-limit-enhanced';
import { Redis } from '@upstash/redis';

function getRedisClient(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return Redis.fromEnv()
    } catch {
      return null
    }
  }
  return null
}

/**
 * OTA Webhook Endpoint
 * Receives bookings from Channex/Beds24 middleware
 */
export async function POST(req: NextRequest) {
  let payload: any = null;
  
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

    payload = await req.json();
    
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
    
    const redis = getRedisClient();
    
    // Attempt to salvage the reservation by pushing it to a Redis Dead-Letter Queue
    if (redis && payload) {
      try {
        await redis.lpush('ota:webhook:dlq', JSON.stringify({
          payload,
          error: String(error),
          timestamp: new Date().toISOString()
        }));
        
        // Payload successfully saved to DLQ. We can safely return 200 OK so the OTA doesn't suspend us.
        return NextResponse.json({ 
          success: false, 
          error: 'Webhook processing failed — payload securely saved to DLQ for manual retry'
        }, { status: 200 });
      } catch (redisError) {
        log.error('Redis DLQ Failure', redisError instanceof Error ? redisError : new Error(String(redisError)));
      }
    }
    
    // CATASTROPHIC FAILURE: Both Postgres AND Redis failed, or payload couldn't be parsed.
    // We MUST return a 503 so the OTA utilizes its own retry mechanism. Dropping the payload is unacceptable.
    return NextResponse.json({ 
      success: false, 
      error: 'Service Unavailable - Payload dropped, OTA must retry'
    }, { status: 503 });
  }
}

/**
 * GET handler for status checks
 */
export async function GET() {
  return NextResponse.json({ status: 'OTA Webhook Listener Active' });
}
