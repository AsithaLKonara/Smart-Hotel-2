import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/db';
import { loginAs } from '../utils/auth-helpers';
import { enforceThermalGuard } from '../utils/thermal-guard';

test.describe.serial('Domain 5: Point of Sale (POS), Kitchen & Folio Cross-Posting Lifecycle', () => {
  let propertyId: string;
  let testBookingId: string;
  let testGuestFolioId: string;
  let outletId: string;
  let burgerProductId: string;

  test.beforeEach(async () => {
    // Thermal safety check: prevent CPU temperature from exceeding 85°C
    await enforceThermalGuard(82, 72);
  });

  test.beforeAll(async () => {
    // 1. Pick operational property
    const property = await prisma.property.findFirst();
    if (!property) throw new Error('No property found in database');
    propertyId = property.id;

    // 2. Fetch or create POS Outlet & Product
    let outlet = await prisma.pOSOutlet.findFirst({ where: { propertyId } });
    if (!outlet) {
      outlet = await prisma.pOSOutlet.create({
        data: {
          name: 'Azure Ocean Bistro & Bar',
          type: 'RESTAURANT',
          propertyId,
        }
      });
    }
    outletId = outlet.id;

    let product = await prisma.pOSProduct.findFirst({ where: { outletId } });
    if (!product) {
      product = await prisma.pOSProduct.create({
        data: {
          name: 'Wagyu Beachside Burger',
          category: 'MAINS',
          price: 28.00,
          outletId,
        }
      });
    }
    burgerProductId = product.id;

    // 3. Find an active confirmed/checked-in booking for Room Charge testing
    let booking = await prisma.booking.findFirst({
      where: {
        propertyId,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] }
      },
      include: { folios: true }
    });

    if (!booking) {
      // Create test booking with guest folio
      const room = await prisma.room.findFirst({ where: { propertyId } });
      const guest = await prisma.user.findFirst({ where: { roleName: 'GUEST' } });
      if (!room || !guest) throw new Error('Cannot prepare test booking: missing room or guest');

      booking = await prisma.booking.create({
        data: {
          bookingNumber: `E2E-POS-${Date.now().toString().slice(-6)}`,
          propertyId,
          roomId: room.id,
          userId: guest.id,
          status: 'CHECKED_IN',
          checkInDate: new Date(),
          checkOutDate: new Date(Date.now() + 86400000 * 2),
          totalAmount: 350.00,
          paidAmount: 350.00,
          source: 'DIRECT',
          folios: {
            create: {
              windowNumber: 1,
              type: 'GUEST',
              status: 'OPEN',
              propertyId,
            }
          }
        },
        include: { folios: true }
      });
    }

    testBookingId = booking.id;
    let primaryFolio = booking.folios?.find((f: any) => f.windowNumber === 1 && f.status === 'OPEN');
    if (!primaryFolio) {
      primaryFolio = await prisma.folio.create({
        data: {
          bookingId: testBookingId,
          windowNumber: 1,
          type: 'GUEST',
          status: 'OPEN',
          propertyId,
        }
      });
    }
    testGuestFolioId = primaryFolio.id;
  });

  test('POS Terminal UI renders catalog and active guest folio selection', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');

    await page.goto('/admin/pos', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1:has-text("Point of Sale Terminal")')).toBeVisible({ timeout: 25000 });

    // Verify Catalog search and items are present
    const catalogSearch = page.locator('input[placeholder="Search catalog items..."]');
    await expect(catalogSearch).toBeVisible();

    // Verify Active Guests list is displayed
    await expect(page.locator('text=Active Guests')).toBeVisible();
    await expect(page.locator('text=Selected Customer')).toBeVisible();
  });

  test('Restaurant POS Order with ROOM_CHARGE writes debit line item to active Guest Folio', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');
    await page.goto('/admin/receptionist', { waitUntil: 'domcontentloaded' });

    const orderPayload = {
      outletId,
      items: [
        { productId: burgerProductId, quantity: 2 }
      ],
      paymentType: 'ROOM_CHARGE',
      bookingId: testBookingId,
      specialRequests: 'Medium rare, cross-posted from E2E test'
    };

    const res = await page.request.post('/api/pos/orders', {
      timeout: 30000,
      data: orderPayload
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.order?.id).toBeDefined();

    // Verify the accounting cross-posting:
    // Subtotal = 28 * 2 = 56. Total with 10% tax/service = 61.6
    const lineItems = await prisma.folioLineItem.findMany({
      where: {
        folioId: testGuestFolioId,
        category: 'F_AND_B'
      },
      orderBy: { createdAt: 'desc' }
    });

    expect(lineItems.length).toBeGreaterThan(0);
    const latestItem = lineItems[0];
    expect(Number(latestItem.amount)).toBeCloseTo(61.60, 1);
    expect(latestItem.description).toContain('POS Charge');

    // Verify corresponding Journal Entries (Debit AR-GUEST-LEDGER, Credit REV-F_AND_B)
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        description: { contains: latestItem.description }
      }
    });

    expect(journalEntries.length).toBe(2);
    const arEntry = journalEntries.find((j: any) => j.accountId === 'AR-GUEST-LEDGER');
    const revEntry = journalEntries.find((j: any) => j.accountId === 'REV-F_AND_B');
    expect(arEntry).toBeDefined();
    expect(revEntry).toBeDefined();
    expect(Number(arEntry?.debit)).toBeCloseTo(61.60, 1);
    expect(Number(revEntry?.credit)).toBeCloseTo(61.60, 1);
  });
});
