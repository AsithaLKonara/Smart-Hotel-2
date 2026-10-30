import { Page, expect } from '@playwright/test';

export type UserRoleType = 'SUPER_ADMIN' | 'MANAGER' | 'RECEPTIONIST' | 'HOUSEKEEPING' | 'STAFF' | 'KITCHEN' | 'GUEST';

export const ROLE_CREDENTIALS: Record<UserRoleType, { email: string; pass: string; simText: string; defaultPath: string }> = {
  SUPER_ADMIN: {
    email: 'admin@smarthotel.com',
    pass: 'SmartHotel@2025!Admin',
    simText: 'Super Admin',
    defaultPath: '/admin/dashboard'
  },
  MANAGER: {
    email: 'manager.gor@smarthotel.com',
    pass: 'SmartHotel@2025!',
    simText: 'Manager (GOR)',
    defaultPath: '/admin/dashboard'
  },
  RECEPTIONIST: {
    email: 'reception.gor@smarthotel.com',
    pass: 'SmartHotel@2025!',
    simText: 'Receptionist',
    defaultPath: '/admin/receptionist'
  },
  HOUSEKEEPING: {
    email: 'housekeeping.gor@smarthotel.com',
    pass: 'SmartHotel@2025!',
    simText: 'Housekeeping',
    defaultPath: '/admin/housekeeping'
  },
  STAFF: {
    email: 'kitchen.gor@smarthotel.com',
    pass: 'SmartHotel@2025!',
    simText: 'Kitchen Lead',
    defaultPath: '/kitchen/dashboard'
  },
  KITCHEN: {
    email: 'kitchen.gor@smarthotel.com',
    pass: 'SmartHotel@2025!',
    simText: 'Kitchen Lead',
    defaultPath: '/kitchen/dashboard'
  },
  GUEST: {
    email: 'guest@example.com',
    pass: 'SmartHotel@2025!Guest',
    simText: 'Guest Demo',
    defaultPath: '/dashboard'
  }
};

/**
 * Enterprise Authentication Helper for Stealth Industrial Console
 */
export async function loginAs(page: Page, role: UserRoleType = 'SUPER_ADMIN') {
  const creds = ROLE_CREDENTIALS[role];

  // If already authenticated and not on signin page or blank
  const currentUrl = page.url();
  if (currentUrl && !currentUrl.includes('/auth/signin') && !currentUrl.includes('about:blank')) {
    return;
  }

  await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600); // Allow hydration

  // If redirected away from /auth/signin immediately due to active session
  if (!page.url().includes('/auth/signin')) {
    return;
  }

  const emailInput = page.locator('input#email').or(page.locator('input[type="email"]')).first();
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });

  // Ensure form inputs have exact credentials
  await emailInput.fill(creds.email);

  const passwordInput = page.locator('input#password').or(page.locator('input[type="password"]')).first();
  await passwordInput.fill(creds.pass);

  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.click();
  try {
    await page.waitForURL((url) => !url.pathname.includes('/auth/signin'), { timeout: 45000 });
  } catch {
    // If client-side navigation was slow to update url, wait for session cookie and force goto defaultPath
    await page.waitForTimeout(2000);
    if (page.url().includes('/auth/signin')) {
      await page.goto(creds.defaultPath, { waitUntil: 'domcontentloaded' });
    }
  }
}
