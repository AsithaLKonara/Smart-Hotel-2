import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

// Use admin storage state for all operations
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('CRO Central Reservation Office Console (Feature 1.3)', () => {
  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required parameters for CRO Quick Hold endpoint', async ({ request }) => {
    const res = await request.post('/api/crs/quick-hold', {
      data: {}
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('required');
  });

  test('2. Successfully establishes an instant telephone reservation hold across properties', async ({ request }) => {
    const cch = await prisma.property.findFirst({ where: { code: 'CCH' } });
    expect(cch).toBeDefined();

    const roomType = await prisma.roomType.findFirst({ where: { propertyId: cch!.id } });
    expect(roomType).toBeDefined();

    const checkIn = '2026-12-10';
    const checkOut = '2026-12-12';
    const guestEmail = `cro-hold-${Date.now()}@caller.test`;

    const res = await request.post('/api/crs/quick-hold', {
      data: {
        propertyId: cch!.id,
        checkIn,
        checkOut,
        guestName: 'Eleanor Call Agent Vance',
        guestEmail,
        guestPhone: '+1 555 432 1000',
        roomTypeId: roomType!.id,
        holdNotes: 'Telephone booking with high-floor request'
      }
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.booking.confirmationCode).toContain('CRO-');
    expect(data.booking.propertyName).toBe(cch!.name);
    expect(data.booking.allocatedRoom).toBeDefined();

    // Verify DB records
    const booking = await prisma.booking.findUnique({
      where: { id: data.booking.id },
      include: {
        roomAssignments: true,
        folios: true,
        stayEvents: true
      }
    });
    expect(booking).toBeDefined();
    expect(booking!.source).toBe('WALK_IN');
    expect(booking!.roomAssignments.length).toBeGreaterThan(0);
    expect(booking!.folios.length).toBeGreaterThan(0);
    expect(booking!.stayEvents.some((e) => e.type === 'CRO_AGENT_HOLD')).toBe(true);

    // Clean up
    await prisma.stayEvent.deleteMany({ where: { bookingId: booking!.id } });
    await prisma.roomAssignment.deleteMany({ where: { bookingId: booking!.id } });
    await prisma.folio.deleteMany({ where: { bookingId: booking!.id } });
    await prisma.booking.delete({ where: { id: booking!.id } });
  });

  test('3. CRO Console UI renders multi-property grid with live pricing and availability', async ({ page }) => {
    await page.goto('/admin/cro', { waitUntil: 'domcontentloaded' });

    // Assert CRO title and indicators
    await expect(page.locator('h1')).toContainText('Central Reservation Office (CRO)', { timeout: 15000 });
    await expect(page.locator('text=Chain Live Sync Active')).toBeVisible();

    // Assert Search controls
    await expect(page.locator('button:has-text("Search Portfolio")')).toBeVisible();

    // Assert Multi-Property Cards render
    await expect(page.locator('h2:has-text("City Center Hotel")')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('CCH', { exact: true }).first()).toBeVisible();
    await expect(page.locator('text=Available Rooms:').first()).toBeVisible();

    // Assert Hold button opens hold modal
    const holdBtn = page.locator('button:has-text("Hold")').first();
    if (await holdBtn.isVisible()) {
      await holdBtn.click();
      await expect(page.locator('text=CRO Direct Telephone Hold')).toBeVisible();
      await expect(page.locator('button:has-text("Confirm Telephone Hold")')).toBeVisible();
    }
  });
});
