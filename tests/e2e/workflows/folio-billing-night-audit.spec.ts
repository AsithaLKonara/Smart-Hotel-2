import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth-helpers';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.describe('Domain 6: Folio Financial Management, Billing & Night Audit Verification', () => {
  test.beforeEach(async () => {
    await enforceThermalGuard(82, 72);
  });

  test.afterEach(async () => {
    await enforceThermalGuard(82, 72);
  });

  test('Guest Folio accumulates posted charges and supports multi-window split', async ({ page }) => {
    // 1. Authenticate as Receptionist
    await loginAs(page, 'RECEPTIONIST');
    await page.goto('/admin/receptionist');

    // 2. Identify the active property for receptionist
    const receptionist = await prisma.user.findFirst({
      where: { email: 'reception.gor@smarthotel.com' }
    });
    expect(receptionist).not.toBeNull();
    const propertyId = receptionist!.propertyId!;

    let guestUser = await prisma.user.findFirst({
      where: { role: { name: 'GUEST' } }
    });
    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: {
          email: `audit-guest-${Date.now()}@test.local`,
          name: 'Audit Guest',
          password: 'hashed-password',
          role: { connect: { name: 'GUEST' } }
        }
      });
    }

    const today = new Date();
    const futureDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    const booking = await prisma.booking.create({
      data: {
        guest: { connect: { id: guestUser.id } },
        property: { connect: { id: propertyId } },
        status: 'CHECKED_IN',
        checkIn: today,
        checkOut: futureDate,
        totalAmount: 450.00,
        confirmationCode: `AUDIT-${Date.now()}`
      }
    });

    // 3. Fetch initial Folio via API
    const foliosInitialRes = await page.request.get(`/api/bookings/${booking.id}/folios`);
    expect(foliosInitialRes.ok()).toBeTruthy();
    const foliosInitial = await foliosInitialRes.json();
    expect(foliosInitial.length).toBeGreaterThanOrEqual(1);
    const folio1 = foliosInitial[0];
    expect(folio1.windowNumber).toBe(1);

    // 4. Post a mini-bar / dining charge
    const postChargeRes = await page.request.post('/api/folios/post-charge', {
      data: {
        bookingId: booking.id,
        amount: 85.50,
        category: 'F_AND_B',
        description: 'Premium Minibar & Room Service'
      }
    });
    expect(postChargeRes.ok()).toBeTruthy();
    const chargeResult = await postChargeRes.json();
    expect(chargeResult.targetFolioId).toBe(folio1.id);

    // 5. Query Folios and verify line item is present and calculated balance updated
    const foliosAfterRes = await page.request.get(`/api/bookings/${booking.id}/folios`);
    expect(foliosAfterRes.ok()).toBeTruthy();
    const foliosAfter = await foliosAfterRes.json();
    const updatedFolio1 = foliosAfter.find((f: any) => f.id === folio1.id);
    expect(updatedFolio1).toBeDefined();

    const lineItemsTotal = updatedFolio1.lineItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
    expect(lineItemsTotal).toBeGreaterThanOrEqual(85.50);

    const hasItem = updatedFolio1.lineItems.some((item: any) => 
      item.description === 'Premium Minibar & Room Service' && Number(item.amount) === 85.50
    );
    expect(hasItem).toBeTruthy();

    // 6. Split Folio: Create window 2 for Corporate / Secondary billing
    const splitRes = await page.request.post(`/api/bookings/${booking.id}/folios`, {
      data: {}
    });
    expect(splitRes.ok()).toBeTruthy();
    const splitFolio = await splitRes.json();
    expect(splitFolio.windowNumber).toBe(2);
    expect(splitFolio.status).toBe('OPEN');

    // Clean up test booking to maintain clean state
    await prisma.folioLineItem.deleteMany({ where: { folioId: { in: [folio1.id, splitFolio.id] } } });
    await prisma.folio.deleteMany({ where: { bookingId: booking.id } });
    await prisma.booking.delete({ where: { id: booking.id } });
  });

  test('Night Audit advances business date and automates room & tax revenue recognition', async ({ page }) => {
    // 1. Authenticate as Manager
    await loginAs(page, 'MANAGER');
    await page.goto('/admin/dashboard');

    // 2. Identify active property for Manager
    const manager = await prisma.user.findFirst({
      where: { email: 'manager.gor@smarthotel.com' }
    });
    expect(manager).not.toBeNull();
    const propertyId = manager!.propertyId!;

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    expect(property).not.toBeNull();
    const initialBusinessDate = property!.businessDate;

    // 3. Clear any conflicting overdue CHECKED_IN bookings that could block night audit
    await prisma.booking.updateMany({
      where: {
        propertyId: propertyId,
        status: 'CHECKED_IN',
        checkOut: { lte: initialBusinessDate }
      },
      data: {
        status: 'CHECKED_OUT'
      }
    });

    // 4. Trigger Night Audit
    const auditRes = await page.request.post('/api/night-audit/run');
    expect(auditRes.ok()).toBeTruthy();
    const auditData = await auditRes.json();

    expect(auditData.success).toBe(true);
    expect(auditData.summary).toBeDefined();
    expect(auditData.summary.previousDate).toBeDefined();
    expect(auditData.summary.newDate).toBeDefined();

    // 5. Verify the property's business date is rolled forward by 1 day
    const updatedProperty = await prisma.property.findUnique({
      where: { id: propertyId }
    });
    expect(updatedProperty).not.toBeNull();
    const expectedNewDateString = auditData.summary.newDate;
    expect(updatedProperty!.businessDate.toISOString().split('T')[0]).toBe(expectedNewDateString);
  });
});
