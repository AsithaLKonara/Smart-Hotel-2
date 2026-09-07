import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { Prisma } from '@prisma/client'
import { Redis } from '@/lib/redis-local'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

function getRedisClient(): Redis | null {
  if (process.env.REDIS_URL) {
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
  const expectedSecret = process.env.OTA_WEBHOOK_SECRET
  
  if (!expectedSecret) {
    console.error('[OTA_WEBHOOK] OTA_WEBHOOK_SECRET is missing. Failing closed.');
    return NextResponse.json({ error: 'Internal server error: Webhook not configured securely' }, { status: 500 })
  }

  if (!signature) {
    return NextResponse.json({ error: 'Unauthorized: Missing x-ota-signature header' }, { status: 401 })
  }

  const rawBody = await req.text()
  
  const hmac = crypto.createHmac('sha256', expectedSecret).update(rawBody).digest('hex')
  if (hmac !== signature) {
    return NextResponse.json({ error: 'Unauthorized: Invalid signature digest' }, { status: 401 })
  }

  // Retrieve integration instance to determine property context
  const configId = req.nextUrl.searchParams.get('configId')
  if (!configId) {
    return NextResponse.json({ error: 'Missing configId query parameter' }, { status: 400 })
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
      
      const channelConfig = await tx.channelConfig.findUnique({
        where: { id: configId }
      })

      if (!channelConfig || !channelConfig.isEnabled) {
        throw new Error('INVALID_OR_DISABLED_CHANNEL_CONFIG')
      }

      // 1. Resolve Mapping (Strictly scoped to this integration/property)
      const mapping = await tx.roomMapping.findUnique({
        where: {
          channelConfigId_otaRoomTypeId: {
            channelConfigId: channelConfig.id,
            otaRoomTypeId: otaRoomTypeId
          }
        }
      })

      if (!mapping || !mapping.syncEnabled) {
        // Send to Dead-Letter Queue atomically
        await tx.webhookDLQ.create({
          data: {
            provider: 'OTA_WEBHOOK',
            payload: payload,
            error: 'Unmapped OTA Room Type: ' + otaRoomTypeId + ' for config ' + configId
          }
        })
        throw new Error(`UNMAPPED_ROOM_TYPE:${otaRoomTypeId}`)
      }

      const propertyId = channelConfig.propertyId;

      // 2. Resolve or Create User (Guest)
      let user = await tx.user.findFirst({ where: { email: guestEmail, deletedAt: null } })
      if (!user) {
        let role = await tx.role.findFirst({ where: { name: 'GUEST' } })
        const secureRandomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
        user = await tx.user.create({
          data: {
            email: guestEmail,
            name: guestName,
            password: secureRandomPassword,
            propertyId: propertyId,
            ...(role ? { roleId: role.id } : {})
          }
        })
      }

      // 3. Create Booking scoped strictly to the mapped property
      const booking = await tx.booking.create({
        data: {
          primaryGuestId: user.id,
          propertyId: propertyId,
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
          propertyId: propertyId,
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
