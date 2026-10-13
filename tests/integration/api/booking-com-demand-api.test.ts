import { BookingDemandClient } from '@/lib/channel-manager/clients/booking-demand-client';
import { BookingComAdapter } from '@/lib/channel-manager/adapters/booking-com';
import { prisma } from '@/lib/db';

describe('Booking.com Demand API v3.2 & Channel Manager Integration', () => {
  const mockAffiliateId = '987654';
  const mockToken = 'mock_jwt_token_demand_api_v32';
  let testProperty: any;
  let testRoomType: any;
  let testConnection: any;

  beforeAll(async () => {
    // 1. Setup test property
    testProperty = await prisma.property.findFirst();
    if (!testProperty) {
      testProperty = await prisma.property.create({
        data: {
          name: 'Demand API Test Resort',
          code: `DAT-${Date.now().toString().slice(-4)}`,
          address: 'Beach Road',
          city: 'Galle',
          country: 'LK',
        }
      });
    }

    // 2. Setup test room type
    testRoomType = await prisma.roomType.findFirst({
      where: { propertyId: testProperty.id }
    });
    if (!testRoomType) {
      testRoomType = await prisma.roomType.create({
        data: {
          name: 'Deluxe Ocean Suite',
          code: `DOS-${Date.now().toString().slice(-4)}`,
          baseRate: 250.00,
          totalRooms: 5,
          propertyId: testProperty.id
        }
      });
    }

    // 3. Ensure Booking.com Provider exists
    let provider = await prisma.channelProvider.findUnique({
      where: { code: 'BOOKING_COM' }
    });
    if (!provider) {
      provider = await prisma.channelProvider.create({
        data: {
          code: 'BOOKING_COM',
          name: 'Booking.com'
        }
      });
    }

    // 4. Setup Channel Connection with affiliateId
    testConnection = await prisma.channelConnection.create({
      data: {
        providerId: provider.id,
        propertyId: testProperty.id,
        affiliateId: mockAffiliateId,
        clientId: 'client_bcom_test',
        clientSecretEncrypted: mockToken,
        environment: 'TEST',
        status: 'DISCONNECTED'
      }
    });

    // 5. Create Channel Room Mapping
    await prisma.channelRoomMapping.create({
      data: {
        connectionId: testConnection.id,
        localRoomTypeId: testRoomType.id,
        externalRoomId: 'EXT_SUITE_101',
        syncAvailability: true
      }
    });
  });

  afterAll(async () => {
    // Cleanup created test records
    if (testConnection) {
      await prisma.channelSyncEvent.deleteMany({ where: { connectionId: testConnection.id } });
      await prisma.channelReservation.deleteMany({ where: { connectionId: testConnection.id } });
      await prisma.channelRoomMapping.deleteMany({ where: { connectionId: testConnection.id } });
      await prisma.channelConnection.delete({ where: { id: testConnection.id } }).catch(() => {});
    }
  });

  describe('1. BookingDemandClient Specifications', () => {
    it('initializes client with mandatory affiliateId and Bearer token', () => {
      const client = new BookingDemandClient({
        affiliateId: mockAffiliateId,
        token: mockToken,
        environment: 'TEST'
      });
      expect(client).toBeDefined();
    });

    it('returns healthy status on ping in sandbox test mode', async () => {
      const client = new BookingDemandClient({
        affiliateId: mockAffiliateId,
        token: mockToken,
        environment: 'TEST'
      });
      const res = await client.ping();
      expect(res.healthy).toBe(true);
    });

    it('retrieves order updates and details conforming to Demand API v3.2 schema', async () => {
      const client = new BookingDemandClient({
        affiliateId: mockAffiliateId,
        token: mockToken,
        environment: 'TEST'
      });

      const updates = await client.getOrderUpdates({
        from: new Date(Date.now() - 86400000 * 2).toISOString(),
        to: new Date().toISOString(),
        currency: 'USD'
      });

      expect(Array.isArray(updates)).toBe(true);
      expect(updates.length).toBeGreaterThan(0);

      const orderId = updates[0].order_id;
      const details = await client.getAccommodationDetails([orderId], 'USD');
      expect(details.length).toBe(1);

      const order = details[0];
      expect(order.order_id).toBe(orderId);
      expect(order.booker).toBeDefined();
      expect(order.booker.first_name).toBeDefined();
      expect(order.booker.email).toContain('@');
      expect(order.checkin).toBeDefined();
      expect(order.checkout).toBeDefined();
      expect(order.total_price).toBeGreaterThan(0);
    });

    it('handles order date modifications and cancellations via Demand API endpoints', async () => {
      const client = new BookingDemandClient({
        affiliateId: mockAffiliateId,
        token: mockToken,
        environment: 'TEST'
      });

      const modifyResult = await client.modifyOrder('ORDER_100', 'RES_100', '2026-08-01', '2026-08-05');
      expect(modifyResult).toBe(true);

      const cancelResult = await client.cancelOrder('RES_100', 'Guest cancelled');
      expect(cancelResult).toBe(true);
    });
  });

  describe('2. BookingComAdapter Channel Lifecycle', () => {
    it('connects and updates connection status to HEALTHY in the database', async () => {
      const adapter = new BookingComAdapter();
      const connected = await adapter.connect(testConnection.id);
      expect(connected).toBe(true);

      const updated = await prisma.channelConnection.findUnique({
        where: { id: testConnection.id }
      });
      expect(updated?.status).toBe('HEALTHY');
      expect(updated?.affiliateId).toBe(mockAffiliateId);
    });

    it('pulls reservations and logs sync events', async () => {
      const adapter = new BookingComAdapter();
      const reservations = await adapter.pullReservations(testConnection.id);

      expect(Array.isArray(reservations)).toBe(true);
      expect(reservations.length).toBeGreaterThan(0);

      const res = reservations[0];
      const ackResult = await adapter.acknowledgeReservation(testConnection.id, res.reservation_id);
      expect(ackResult).toBe(true);

      // Verify sync event was created in ChannelSyncEvent table
      const syncEvent = await prisma.channelSyncEvent.findFirst({
        where: {
          connectionId: testConnection.id,
          entityId: res.reservation_id,
          direction: 'INBOUND'
        }
      });
      expect(syncEvent).toBeDefined();
      expect(syncEvent?.status).toBe('SUCCESS');
    });

    it('pushes availability timeline and logs outbound sync event', async () => {
      const adapter = new BookingComAdapter();
      const timeline = { '2026-08-01': 3, '2026-08-02': 3 };
      const success = await adapter.pushAvailability(testConnection.id, 'EXT_SUITE_101', timeline);
      expect(success).toBe(true);

      const outboundEvent = await prisma.channelSyncEvent.findFirst({
        where: {
          connectionId: testConnection.id,
          direction: 'OUTBOUND',
          eventType: 'AVAILABILITY_PUSH'
        }
      });
      expect(outboundEvent).toBeDefined();
      expect(outboundEvent?.status).toBe('SUCCESS');
    });
  });

  describe('3. Database Relations & Idempotency Constraints', () => {
    it('enforces 1-to-1 optional relation between Booking and ChannelReservation', async () => {
      const testExternalId = `TEST-RES-${Date.now()}`;

      // Create a test Booking
      const guest = await prisma.user.create({
        data: {
          email: `test-ota-${Date.now()}@example.com`,
          name: 'OTA Test Guest',
          password: 'mock_password',
          propertyId: testProperty.id
        }
      });

      const booking = await prisma.booking.create({
        data: {
          confirmationCode: `OTA-BKG-${Date.now()}`,
          checkIn: new Date(),
          checkOut: new Date(Date.now() + 86400000 * 3),
          totalAmount: 500,
          propertyId: testProperty.id,
          primaryGuestId: guest.id,
          source: 'BOOKING_COM',
          otaReference: testExternalId
        }
      });

      // Create ChannelReservation linked to this booking
      const channelRes = await prisma.channelReservation.create({
        data: {
          connectionId: testConnection.id,
          externalReservationId: testExternalId,
          status: 'CONFIRMED',
          payload: { test: true },
          bookingId: booking.id
        }
      });

      expect(channelRes.bookingId).toBe(booking.id);

      // Verify relation from Booking side
      const fetchedBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { channelReservation: true }
      });
      expect(fetchedBooking?.channelReservation?.id).toBe(channelRes.id);

      // Cleanup
      await prisma.channelReservation.delete({ where: { id: channelRes.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.user.delete({ where: { id: guest.id } });
    });
  });
});
