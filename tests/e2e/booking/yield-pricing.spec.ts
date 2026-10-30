import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/db';
import { loginAs } from '../utils/auth-helpers';

test.describe('Domain 2: Yield Pricing & Dynamic Rate Engine', () => {
  let roomTypeId: string;
  let baseRate: number;

  test.beforeAll(async () => {
    // Find a room type with a base rate
    const roomType = await prisma.roomType.findFirst({
      where: {
        propertyId: '579ecf1a-5350-42ea-af32-c10397417589',
        baseRate: { gt: 0 }
      }
    });
    if (!roomType) {
      // Fallback to any room type
      const anyRoomType = await prisma.roomType.findFirst({
        where: { baseRate: { gt: 0 } }
      });
      if (!anyRoomType) throw new Error('No room type found for yield pricing test');
      roomTypeId = anyRoomType.id;
      baseRate = anyRoomType.baseRate;
    } else {
      roomTypeId = roomType.id;
      baseRate = roomType.baseRate;
    }
  });

  test('Pricing Quote calculates standard multi-night stays and applies weekend yield premiums', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');

    // Friday to Sunday (includes Friday and Saturday nights -> weekend premium active)
    const quoteRes = await page.request.post('/api/pricing/quote', {
      data: {
        roomTypeId,
        checkIn: '2028-10-06', // Friday
        checkOut: '2028-10-08', // Sunday (2 nights: Friday + Saturday)
        guests: 2
      },
      timeout: 35000
    });

    expect(quoteRes.status()).toBe(200);
    const body = await quoteRes.json();
    expect(body.quote).toBeDefined();
    expect(body.quote.nights).toBe(2);

    const breakdown = body.quote.breakdown;
    expect(breakdown.length).toBe(2);

    // Both nights are weekend nights (Friday & Saturday) -> 15% surge
    for (const day of breakdown) {
      expect(day.weekendPremium).toBe(true);
      expect(day.rate).toBeCloseTo(Number(baseRate) * 1.15, 1);
    }

    expect(body.quote.totalAmount).toBeCloseTo((Number(baseRate) * 1.15) * 2, 1);
  });

  test('Pricing Quote on weekdays applies baseline rate without weekend surge', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');

    // Tuesday to Thursday (2 weekday nights)
    const quoteRes = await page.request.post('/api/pricing/quote', {
      data: {
        roomTypeId,
        checkIn: '2028-10-10', // Tuesday
        checkOut: '2028-10-12', // Thursday
        guests: 2
      },
      timeout: 35000
    });

    expect(quoteRes.status()).toBe(200);
    const body = await quoteRes.json();
    expect(body.quote.nights).toBe(2);

    const breakdown = body.quote.breakdown;
    for (const day of breakdown) {
      expect(day.weekendPremium).toBe(false);
      expect(day.rate).toBeCloseTo(Number(baseRate), 1);
    }

    expect(body.quote.totalAmount).toBeCloseTo(Number(baseRate) * 2, 1);
  });
});
