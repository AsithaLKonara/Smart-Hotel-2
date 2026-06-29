import { test as base } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

type TestFixtures = {
  uniqueEmail: string;
  uniqueBookingCode: string;
  generateUser: () => { name: string; email: string; password: string };
  generateDates: (daysFromNow: number, length: number) => { checkIn: Date; checkOut: Date };
};

export const test = base.extend<TestFixtures>({
  uniqueEmail: async ({}, use) => {
    const email = `test.guest.${uuidv4()}@smarthotel.local`;
    await use(email);
  },
  uniqueBookingCode: async ({}, use) => {
    const code = `BK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    await use(code);
  },
  generateUser: async ({ uniqueEmail }, use) => {
    await use(() => ({
      name: `Test User ${Date.now()}`,
      email: uniqueEmail,
      password: 'TestPassword123!',
    }));
  },
  generateDates: async ({}, use) => {
    await use((daysFromNow: number, length: number) => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + daysFromNow);
      
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + length);
      
      return { checkIn, checkOut };
    });
  },
});

export { expect } from '@playwright/test';
