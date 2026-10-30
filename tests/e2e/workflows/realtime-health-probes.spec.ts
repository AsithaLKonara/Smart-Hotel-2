import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { RealtimeEvents } from '@/lib/realtime';

test.describe('Domain 10: Real-Time Events (Pusher), Outbox & Health Probes', () => {
  test.beforeEach(async () => {
    await enforceThermalGuard(82, 72);
  });

  test.afterEach(async () => {
    await enforceThermalGuard(82, 72);
  });

  test('Liveness probe /api/health/live verifies process health and uptime', async ({ request }) => {
    const res = await request.get('/api/health/live');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('alive');
    expect(body.timestamp).toBeDefined();
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThan(0);
  });

  test('Readiness probe /api/health/ready verifies database and core subsystems', async ({ request }) => {
    const res = await request.get('/api/health/ready');
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ready');
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBe('healthy');
    expect(body.checks.users).toBe('healthy');
    expect(body.checks.bookings).toBe('healthy');
  });

  test('Real-time event publisher executes gracefully with zero unhandled exceptions', async () => {
    // 1. Test Room Status Changed Event
    await expect(
      RealtimeEvents.emitRoomStatusChanged({
        id: 'test-room-resilience',
        status: 'AVAILABLE'
      })
    ).resolves.not.toThrow();

    // 2. Test Availability Update Event
    await expect(
      RealtimeEvents.emitAvailabilityUpdate('test-room-resilience', true)
    ).resolves.not.toThrow();

    // 3. Test Task Updated Event
    await expect(
      RealtimeEvents.emitTaskUpdated({
        id: 'test-task-resilience',
        status: 'COMPLETED',
        assignedTo: null,
        propertyId: 'test-property'
      })
    ).resolves.not.toThrow();

    // 4. Test Booking Created Event
    await expect(
      RealtimeEvents.emitBookingCreated({
        id: 'test-booking-resilience',
        status: 'CONFIRMED',
        propertyId: 'test-property'
      })
    ).resolves.not.toThrow();
  });
});
