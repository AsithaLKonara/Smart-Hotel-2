import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { Prisma } from '@prisma/client'
import { Redis } from '@upstash/redis'
import crypto from 'crypto'

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

export async function POST(req: NextRequest) {
  // 1. AUTHENTICATION VALIDATION (HMAC Signature)
  const signature = req.headers.get('x-ota-signature')
  const expectedSecret = process.env.OTA_WEBHOOK_SECRET || 'dev_ota_secret'
  
  if (!signature) {
    return NextResponse.json({ error: 'Unauthorized: Missing x-ota-signature header' }, { status: 401 })
  }

  const rawBody = await req.text()
  
  const hmac = crypto.createHmac('sha256', expectedSecret).update(rawBody).digest('hex')
  if (hmac !== signature) {
    return NextResponse.json({ error: 'Unauthorized: Invalid signature digest' }, { status: 401 })
  }

  let payload: any = {};
  let eventKey = `ota:webhook:${Date.now()}`;
  const redis = getRedisClient();

  // Rate Limiting (100 req/min)
  if (redis) {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `rate:webhook:${ip}`;
    try {
      const requests = await redis.incr(rateLimitKey);
      if (requests === 1) await redis.expire(rateLimitKey, 60);
      if (requests > 100) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    } catch (e) {
      console.error('[OTA_WEBHOOK_ERROR] Rate limit Redis error:', e);
    }
  }

  try {
    try {
      payload = JSON.parse(rawBody)
      // Generate deterministic idempotency key if OTA provides a transaction ID, else fallback
      eventKey = `ota:webhook:${payload.otaTransactionId || payload.guestEmail || Date.now()}`
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }
    
    // 2. DISTRIBUTED IDEMPOTENCY (Redis)
    if (redis) {
      try {
        const isProcessed = await redis.set(eventKey, 'processed', { nx: true, ex: 86400 })
        if (!isProcessed) return NextResponse.json({ received: true, duplicate: true, message: 'Idempotency Hit: Ignored duplicate payload.' })
      } catch (redisError) {
        console.error('[OTA_WEBHOOK_ERROR] Redis connection failed during deduplication:', redisError)
      }
    }
    
    // Simulate OTA payload:
    // { otaRoomTypeId: 'BCOM_DLX', guestName: 'OTA Guest', guestEmail: 'guest@ota.com', checkIn: '2023-12-01', checkOut: '2023-12-03', totalAmount: 400.00 }
    
    const { otaRoomTypeId, guestName, guestEmail, checkIn, checkOut, totalAmount } = payload

    // ATOMIC TRANSACTION WRAPPER
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Resolve Mapping
      const mapping = await tx.roomMapping.findFirst({
        where: { otaRoomTypeId, syncEnabled: true }
      })

      if (!mapping) {
        // Send to Dead-Letter Queue atomically
        await tx.webhookDLQ.create({
          data: {
            provider: 'OTA_WEBHOOK',
            payload: payload,
            error: 'Unmapped OTA Room Type: ' + otaRoomTypeId
          }
        })
        throw new Error(`UNMAPPED_ROOM_TYPE:${otaRoomTypeId}`)
      }

      // 2. Resolve or Create User (Guest)
      let user = await tx.user.findFirst({ where: { email: guestEmail, deletedAt: null } })
      if (!user) {
        let role = await tx.role.findFirst({ where: { name: 'GUEST' } })
        user = await tx.user.create({
          data: {
            email: guestEmail,
            name: guestName,
            password: 'ota-placeholder-password',
            roleId: role?.id,
          }
        })
      }

      const property = await tx.property.findFirst()

      // 3. Create Booking
      const booking = await tx.booking.create({
        data: {
          userId: user.id,
          propertyId: property?.id || '',
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          guests: 2,
          totalAmount: totalAmount,
          status: 'CONFIRMED',
          confirmationCode: `OTA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        }
      })

      // 4. Create Folio
      await tx.folio.create({
        data: {
          bookingId: booking.id,
          balance: totalAmount,
          status: 'OPEN'
        }
      })

      // Log success
      await tx.auditLog.create({
        data: {
          actor: 'CHANNEL_MANAGER',
          action: 'WEBHOOK_SUCCESS',
          resource: 'Booking',
          resourceId: booking.id,
          details: { source: 'OTA', originalPayload: payload }
        }
      })
      
      return booking
    });

    return NextResponse.json({ success: true, bookingId: result.id, confirmationCode: result.confirmationCode })

  } catch (error: any) {
    if (redis && eventKey) await redis.del(eventKey) // Allow retry on systemic failure
    
    if (error.message && error.message.startsWith('UNMAPPED_ROOM_TYPE:')) {
      return NextResponse.json({ error: 'Unmapped OTA Room Type. Logged to DLQ.' }, { status: 400 })
    }

    console.error('Channel Webhook Error:', error)
    
    // Attempt to write to DLQ even on massive systemic failure
    try {
      if (typeof payload !== 'undefined' && Object.keys(payload).length > 0) {
        await prisma.webhookDLQ.create({
          data: {
            provider: 'OTA_WEBHOOK',
            payload: payload,
            error: error.message || 'Systemic failure during webhook processing'
          }
        })
      }
    } catch(e) {
      console.error('Failed to write to DLQ', e)
    }
    
    return NextResponse.json({ error: 'Failed to process OTA webhook' }, { status: 500 })
  }
}
