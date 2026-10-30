import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth-helpers';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.describe('Domain 8: CRM, Corporate Accounts & Loyalty Program Verification', () => {
  let testGuestUserId: string;
  let testLoyaltyAccountId: string;
  let testBookingId: string;
  let testFolioId: string;

  test.beforeEach(async () => {
    await enforceThermalGuard(82, 72);
  });

  test.afterEach(async () => {
    await enforceThermalGuard(82, 72);
  });

  test.beforeAll(async () => {
    // 1. Identify active property from Receptionist
    const receptionist = await prisma.user.findFirst({
      where: { email: 'reception.gor@smarthotel.com' }
    });
    expect(receptionist).not.toBeNull();
    const propertyId = receptionist!.propertyId!;

    // 2. Create or find test guest
    let guestRole = await prisma.role.findFirst({ where: { name: 'GUEST' } });
    const guestEmail = `crm-guest-${Date.now()}@test.local`;
    const guestUser = await prisma.user.create({
      data: {
        email: guestEmail,
        name: 'Alexander Hamilton',
        phone: '+15551234567',
        password: 'hashed-password',
        roleId: guestRole?.id,
        propertyId: propertyId,
        vipStatus: 'VIP'
      }
    });
    testGuestUserId = guestUser.id;

    // 3. Create initial LoyaltyPoint account
    const loyalty = await prisma.loyaltyPoint.create({
      data: {
        userId: guestUser.id,
        points: 5000,
        tier: 'SILVER',
        totalEarned: 5000,
        totalSpent: 0
      }
    });
    testLoyaltyAccountId = loyalty.id;

    // 4. Create booking and folio for redemption test
    const today = new Date();
    const future = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const booking = await prisma.booking.create({
      data: {
        primaryGuestId: guestUser.id,
        propertyId: propertyId,
        status: 'CHECKED_IN',
        checkIn: today,
        checkOut: future,
        totalAmount: 300.00,
        confirmationCode: `CRM-${Date.now()}`
      }
    });
    testBookingId = booking.id;

    const folio = await prisma.folio.create({
      data: {
        bookingId: booking.id,
        propertyId: propertyId,
        windowNumber: 1,
        type: 'GUEST',
        status: 'OPEN'
      }
    });
    testFolioId = folio.id;
  });

  test.afterAll(async () => {
    // Clean up created entities
    if (testFolioId) {
      await prisma.payment.deleteMany({ where: { folioId: testFolioId } });
      await prisma.folioLineItem.deleteMany({ where: { folioId: testFolioId } });
      await prisma.folio.deleteMany({ where: { id: testFolioId } });
    }
    if (testBookingId) {
      await prisma.booking.deleteMany({ where: { id: testBookingId } });
    }
    if (testLoyaltyAccountId) {
      await prisma.loyaltyTransaction.deleteMany({ where: { loyaltyPointId: testLoyaltyAccountId } });
      await prisma.loyaltyPoint.deleteMany({ where: { id: testLoyaltyAccountId } });
    }
    if (testGuestUserId) {
      await prisma.user.deleteMany({ where: { id: testGuestUserId } });
    }
  });

  test('Receptionist queries CRM directory and fetches comprehensive guest dossier', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');
    await page.goto('/admin/receptionist');

    // 1. Fetch CRM guest directory
    const crmRes = await page.request.get('/api/crm/guests');
    expect(crmRes.ok()).toBeTruthy();
    const guests = await crmRes.json();
    expect(Array.isArray(guests)).toBe(true);

    const testGuestEntry = guests.find((g: any) => g.id === testGuestUserId);
    expect(testGuestEntry).toBeDefined();
    expect(testGuestEntry.name).toBe('Alexander Hamilton');
    expect(testGuestEntry.vipStatus).toBe('VIP');

    // 2. Fetch specific guest profile dossier
    const profileRes = await page.request.get(`/api/crm/guests/${testGuestUserId}`);
    expect(profileRes.ok()).toBeTruthy();
    const profile = await profileRes.json();
    expect(profile.id).toBe(testGuestUserId);
    expect(profile.email).toBeDefined();
  });

  test('Manager awards loyalty points which dynamically promotes member tier', async ({ page }) => {
    await loginAs(page, 'MANAGER');
    await page.goto('/admin/dashboard');

    // 1. Fetch loyalty directory
    const accountsRes = await page.request.get('/api/admin/corporate/loyalty');
    expect(accountsRes.ok()).toBeTruthy();
    const accounts = await accountsRes.json();
    expect(Array.isArray(accounts)).toBe(true);

    // 2. Award 15,000 points with CSRF headers to push totalEarned over 10,000 (qualifying for GOLD)
    const awardRes = await page.request.post('/api/admin/corporate/loyalty', {
      headers: {
        'origin': 'http://localhost:3000',
        'sec-fetch-site': 'same-origin'
      },
      data: {
        accountId: testLoyaltyAccountId,
        points: 15000,
        description: 'Elite Executive Stays Milestone Bonus'
      }
    });
    console.log('[DEBUG LOYALTY] awardRes status:', awardRes.status(), await awardRes.text());
    expect(awardRes.ok()).toBeTruthy();
    const txData = await awardRes.json();
    expect(txData.points).toBe(15000);
    expect(txData.type).toBe('earned');

    // 3. Verify loyalty account reflects new tier and point total
    const updatedAccount = await prisma.loyaltyPoint.findUnique({
      where: { id: testLoyaltyAccountId }
    });
    expect(updatedAccount).not.toBeNull();
    expect(updatedAccount!.tier).toBe('GOLD');
    expect(updatedAccount!.points).toBe(20000);
  });

  test('Loyalty points redemption burns points and credits guest folio', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');
    await page.goto('/admin/receptionist');

    // Redeem 1,000 points for a $10.00 credit towards folio
    const redeemRes = await page.request.post('/api/loyalty/redeem', {
      data: {
        userId: testGuestUserId,
        folioId: testFolioId,
        pointsToRedeem: 1000
      }
    });
    console.log('[DEBUG REDEEM] redeemRes status:', redeemRes.status(), await redeemRes.text());
    expect(redeemRes.ok()).toBeTruthy();
    const result = await redeemRes.json();
    expect(result.success).toBe(true);
    expect(result.creditAmount).toBe(10.00);

    // Verify points balance decreased in DB
    const account = await prisma.loyaltyPoint.findUnique({
      where: { id: testLoyaltyAccountId }
    });
    expect(account!.points).toBe(19000);

    // Verify payment credit was created for folio
    const payments = await prisma.payment.findMany({
      where: { folioId: testFolioId }
    });
    expect(payments.length).toBeGreaterThanOrEqual(1);
    expect(Number(payments[0].amount)).toBe(10.00);
  });
});
