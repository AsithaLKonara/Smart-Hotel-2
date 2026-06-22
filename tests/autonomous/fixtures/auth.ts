import { test as base } from '@playwright/test';

export type Role = 'SUPER_ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'KITCHEN' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'GUEST' | 'UNAUTHENTICATED';

const DEMO_CREDENTIALS: Record<string, { email: string; pass: string }> = {
  SUPER_ADMIN: { email: 'admin@smarthotel.com', pass: 'SmartHotel@2025!Admin' },
  MANAGER: { email: 'manager@smarthotel.com', pass: 'SmartHotel@2025!Manager' },
  RECEPTIONIST: { email: 'receptionist@smarthotel.com', pass: 'SmartHotel@2025!Reception' },
  KITCHEN: { email: 'kitchen@smarthotel.com', pass: 'SmartHotel@2025!Kitchen' },
  HOUSEKEEPING: { email: 'housekeeping@smarthotel.com', pass: 'SmartHotel@2025!House' },
  MAINTENANCE: { email: 'maintenance@smarthotel.com', pass: 'SmartHotel@2025!Maint' },
  GUEST: { email: 'guest@example.com', pass: 'SmartHotel@2025!Guest' },
  UNAUTHENTICATED: { email: '', pass: '' }
};

const sessionCache = new Map<string, any[]>();

export const test = base.extend<{
  loginAs: (role: Role) => Promise<void>;
}>({
  loginAs: async ({ page, context }, use) => {
    await use(async (role: Role) => {
      if (role === 'UNAUTHENTICATED') {
        await context.clearCookies();
        return;
      }

      if (sessionCache.has(role)) {
        await context.clearCookies();
        await context.addCookies(sessionCache.get(role)!);
        return;
      }

      await context.clearCookies();
      await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });
      
      const { email, pass: password } = DEMO_CREDENTIALS[role];
      
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL(/.*(dashboard|admin|kitchen|tasks).*/, { timeout: 15000 }).catch(async () => {
        console.log(`Fallback: Failed to login naturally for role ${role}. Current URL: ${page.url()}`);
      });

      const cookies = await context.cookies();
      sessionCache.set(role, cookies);
    });
  },
});
