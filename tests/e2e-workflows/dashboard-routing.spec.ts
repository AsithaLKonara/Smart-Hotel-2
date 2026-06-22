import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';

test.describe('Dashboard Routing & RBAC Workflow', () => {
  test('A Guest cannot access the Receptionist Dashboard and is redirected', async ({ page, context }) => {
    // 1. Generate NextAuth JWT for a GUEST
    const token = await encode({
      token: {
        name: 'Guest User',
        email: 'guest@example.com',
        role: 'GUEST',
        roleName: '', id: 'mock-id', permissions: []},
      secret: process.env.NEXTAUTH_SECRET || 'mxLaNRprXaCmHkscIkzA3OfPNl5JZgPYgHjFPrwIP5c='
    });

    await context.addCookies([{
      name: 'next-auth.session-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false
    }]);

    // 2. Intercept session endpoint
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        json: {
          user: { name: 'Guest User', email: 'guest@example.com', role: 'GUEST', roleName: '', id: 'mock-id', permissions: []},
          expires: new Date(Date.now() + 86400000).toISOString()
        }
      });
    });

    // 3. Guest attempts to access a protected Admin route
    await page.goto('/admin/receptionist');

    // 4. Verify Edge Middleware RBAC redirect
    // The middleware redirects unauthorized GUESTs to '/'
    await expect(page).toHaveURL(/.*\/$/);
    
    // Verify the home page is visible
    await expect(page.getByRole('heading', { name: /Luxury 5-Star Accommodation/i })).toBeVisible();
  });

  test('A Receptionist can access the Receptionist Dashboard', async ({ page, context }) => {
    // 1. Generate NextAuth JWT for a RECEPTIONIST
    const token = await encode({
      token: {
        name: 'Front Desk',
        email: 'desk@smarthotel.com',
        role: 'RECEPTIONIST',
        roleName: '', id: 'mock-id', permissions: []},
      secret: process.env.NEXTAUTH_SECRET || 'mxLaNRprXaCmHkscIkzA3OfPNl5JZgPYgHjFPrwIP5c='
    });

    await context.addCookies([{
      name: 'next-auth.session-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false
    }]);

    // 2. Intercept session endpoint
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        json: {
          user: { name: 'Front Desk', email: 'desk@smarthotel.com', role: 'RECEPTIONIST', roleName: '', id: 'mock-id', permissions: []},
          expires: new Date(Date.now() + 86400000).toISOString()
        }
      });
    });

    // Mock API dependency to prevent page crash
    await page.route('**/api/rooms*', async route => {
      await route.fulfill({ json: { rooms: [] } });
    });
    await page.route('**/api/bookings*', async route => {
      await route.fulfill({ json: { bookings: [] } });
    });

    // 3. Receptionist attempts to access a protected Admin route
    await page.goto('/admin/receptionist');

    // 4. Verify access is granted (no redirect)
    await expect(page).toHaveURL(/.*\/admin\/receptionist/);
    await expect(page.getByRole('heading', { name: /Reception Desk/i })).toBeVisible();
  });
});
