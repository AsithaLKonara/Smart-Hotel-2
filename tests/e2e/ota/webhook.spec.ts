import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { enforceThermalGuard } from '../utils/thermal-guard';

test.describe('Domain 7: Channel Manager & OTA Webhook Resilience Integration', () => {
  const otaSecret = process.env.OTA_WEBHOOK_SECRET || 'smarthotel_ota_webhook_secret_production_ready_2025';
  let testConnectionId: string;
  let testApiKey: string;

  test.beforeAll(async () => {
    // 1. Ensure a property exists
    let property = await prisma.property.findFirst();
    if (!property) {
      throw new Error('No property found in database for OTA tests');
    }

    // 2. Ensure ChannelProvider exists
    let provider = await prisma.channelProvider.findUnique({
      where: { code: 'BOOKING_COM' }
    });
    if (!provider) {
      provider = await prisma.channelProvider.create({
        data: {
          code: 'BOOKING_COM',
          name: 'Booking.com Global'
        }
      });
    }

    // 3. Ensure a test ChannelConnection exists
    testApiKey = `ota-bearer-key-${Date.now()}`;
    const connection = await prisma.channelConnection.create({
      data: {
        providerId: provider.id,
        propertyId: property.id,
        status: 'HEALTHY',
        environment: 'PRODUCTION',
        accessTokenEncrypted: testApiKey
      }
    });

    testConnectionId = connection.id;
  });

  test.afterAll(async () => {
    if (testConnectionId) {
      await prisma.channelConnection.delete({
        where: { id: testConnectionId }
      }).catch(() => {});
    }
  });

  test.beforeEach(async () => {
    await enforceThermalGuard(82, 72);
  });

  test.afterEach(async () => {
    await enforceThermalGuard(82, 72);
  });

  test('Missing x-ota-signature header is strictly rejected with 401 Unauthorized', async ({ request }) => {
    const rawPayload = JSON.stringify({
      channel: 'BOOKING_COM',
      reservationId: 'BKG-998877',
      status: 'NEW_RESERVATION'
    });

    const res = await request.post('/api/channels/webhook', {
      data: rawPayload,
      headers: {
        'content-type': 'application/json'
      }
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Missing x-ota-signature header');
  });

  test('Invalid HMAC signature digest is strictly rejected with 401 Unauthorized', async ({ request }) => {
    const rawPayload = JSON.stringify({
      channel: 'BOOKING_COM',
      reservationId: 'BKG-MALICIOUS',
      status: 'NEW_RESERVATION'
    });

    const res = await request.post('/api/channels/webhook', {
      data: rawPayload,
      headers: {
        'content-type': 'application/json',
        'x-ota-signature': 'malicious-forged-hmac-digest-9999'
      }
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid signature digest');
  });

  test('Valid HMAC signature without configId query param returns 400 Bad Request', async ({ request }) => {
    const rawPayload = JSON.stringify({
      channel: 'BOOKING_COM',
      reservationId: 'BKG-12345',
      status: 'NEW_RESERVATION'
    });

    const validHmac = crypto.createHmac('sha256', otaSecret).update(rawPayload).digest('hex');

    const res = await request.post('/api/channels/webhook', {
      data: rawPayload,
      headers: {
        'content-type': 'application/json',
        'x-ota-signature': validHmac
      }
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing configId query parameter');
  });

  test('Valid HMAC signature with valid configId accepts payload and enqueues task with 202 Accepted', async ({ request }) => {
    const rawPayload = JSON.stringify({
      channel: 'BOOKING_COM',
      reservationId: `BKG-${Date.now()}`,
      status: 'NEW_RESERVATION',
      guestDetails: { name: 'John Doe', email: 'john@example.com' },
      checkIn: '2026-11-15',
      checkOut: '2026-11-20',
      totalPrice: 850.00
    });

    const validHmac = crypto.createHmac('sha256', otaSecret).update(rawPayload).digest('hex');

    const res = await request.post(`/api/channels/webhook?configId=${testConnectionId}`, {
      data: rawPayload,
      headers: {
        'content-type': 'application/json',
        'x-ota-signature': validHmac
      }
    });

    expect(res.status()).toBe(202);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Webhook queued');
  });

  test('Generic OTA Channel Manager route rejects unauthenticated requests with 401 Unauthorized', async ({ request }) => {
    const res = await request.post('/api/integrations/channel-manager', {
      data: JSON.stringify({ action: 'SYNC' }),
      headers: { 'content-type': 'application/json' }
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized OTA Request');
  });

  test('Generic OTA Channel Manager route accepts valid Bearer API key and returns 202 Accepted', async ({ request }) => {
    const rawPayload = JSON.stringify({
      event: 'INVENTORY_PUSH',
      propertyCode: 'GOR',
      timestamp: new Date().toISOString()
    });

    const res = await request.post('/api/integrations/channel-manager', {
      data: rawPayload,
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${testApiKey}`
      }
    });

    expect(res.status()).toBe(202);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Webhook queued');
  });

  test('Manual reservation pull endpoint validates connectionId and enqueues pull job', async ({ request }) => {
    // 1. Missing connectionId returns 400
    const errRes = await request.get('/api/integrations/channel-manager');
    expect(errRes.status()).toBe(400);

    // 2. Valid connectionId enqueues job with 200 OK
    const okRes = await request.get(`/api/integrations/channel-manager?connectionId=${testConnectionId}`);
    expect(okRes.status()).toBe(200);
    const body = await okRes.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Reservation pull triggered');
  });
});
