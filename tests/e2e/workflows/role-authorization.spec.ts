import { test, expect } from '@playwright/test';

test.describe('E2E Journey: Role-Based Access Control (RBAC)', () => {
  // Give this suite a longer timeout because it will perform 5 full logins
  test.setTimeout(240000);

  const roles = [
    {
      roleName: 'SUPER_ADMIN',
      email: 'admin@smarthotel.com',
      password: 'SmartHotel@2025!Admin',
      dashboardPath: '/admin/dashboard',
      allowedPage: '/admin/roles',
      forbiddenPage: null, // Super admin can access everything
      allowedApi: '/api/admin/audit-logs',
      forbiddenApi: null,
    },
    {
      roleName: 'MANAGER',
      email: 'manager@smarthotel.com',
      password: 'SmartHotel@2025!Manager',
      dashboardPath: '/admin/dashboard',
      allowedPage: '/admin/accounting/night-audit',
      forbiddenPage: '/admin/roles',
      allowedApi: '/api/admin/users',
      forbiddenApi: '/api/admin/roles',
    },
    {
      roleName: 'RECEPTIONIST',
      email: 'receptionist@smarthotel.com',
      password: 'SmartHotel@2025!Reception',
      dashboardPath: '/admin/bookings',
      allowedPage: '/admin/crm/guests',
      forbiddenPage: '/admin/dashboard', // Protected for MANAGER+
      allowedApi: '/api/bookings',
      forbiddenApi: '/api/admin/users', // Protected for MANAGER+
    },
    {
      roleName: 'HOUSEKEEPING',
      email: 'housekeeping@smarthotel.com',
      password: 'SmartHotel@2025!House',
      dashboardPath: '/admin/tasks',
      allowedPage: '/admin/housekeeping',
      forbiddenPage: '/admin/bookings', // Protected for RECEPTIONIST+
      allowedApi: '/api/tasks',
      forbiddenApi: '/api/admin/audit-logs', 
    },
    {
      roleName: 'MAINTENANCE',
      email: 'maintenance@smarthotel.com',
      password: 'SmartHotel@2025!Maint',
      dashboardPath: '/admin/tasks',
      allowedPage: '/admin/maintenance',
      forbiddenPage: '/admin/housekeeping', // Protected for HOUSEKEEPING+
      allowedApi: '/api/tasks',
      forbiddenApi: '/api/admin/housekeeping/rooms', 
    },
    {
      roleName: 'KITCHEN',
      email: 'kitchen@smarthotel.com',
      password: 'SmartHotel@2025!Kitchen',
      dashboardPath: '/kitchen/dashboard',
      allowedPage: '/kitchen/dashboard',
      forbiddenPage: '/admin/tasks', // Protected for HOUSEKEEPING, RECEPTIONIST, MAINT, MGR, ADMIN
      allowedApi: '/api/kitchen',
      forbiddenApi: '/api/tasks',
    }
  ];

  for (const config of roles) {
    test.describe(`Role: ${config.roleName}`, () => {
      
      // Do not use shared storageState for these tests, start fresh each time to test actual auth flows
      test.use({ storageState: { cookies: [], origins: [] } });

      test(`Verify Login, Redirection, UI Access and API boundaries`, async ({ page }) => {
        // Increase timeout for individual navigation for slow environments
        page.setDefaultNavigationTimeout(60000);

        await test.step(`1. Login as ${config.roleName}`, async () => {
          await page.goto('/auth/signin');
          await page.getByPlaceholder('name@smarthotel.com').fill(config.email);
          await page.locator('input[type="password"]').fill(config.password);
          
          await page.getByRole('button', { name: /initialize session/i }).click();
          
          // Wait for navigation and verify intelligent routing based on role
          await page.waitForURL(url => url.pathname.includes(config.dashboardPath), { timeout: 30000 });
          expect(page.url()).toContain(config.dashboardPath);
        });

        await test.step(`2. Verify Allowed View (${config.allowedPage})`, async () => {
          if (!page.url().includes(config.allowedPage)) {
            await page.goto(config.allowedPage);
          }
          
          // Wait for the page to render to ensure it didn't redirect to unauthorized
          await page.waitForLoadState('domcontentloaded');
          
          // Ensure we are not on the signin or unauthorized page
          await expect(page.locator('text=/Access Denied/i')).not.toBeVisible();
          await expect(page.locator('text=/Unauthorized/i')).not.toBeVisible();
          
          // Double check the URL stayed on the allowed page
          expect(page.url()).toContain(config.allowedPage);
        });

        if (config.forbiddenPage) {
          await test.step(`3. Verify Forbidden View is Blocked (${config.forbiddenPage})`, async () => {
            await page.goto(config.forbiddenPage);
            
            // Expected behavior is a redirect to /unauthorized or /auth/signin
            await page.waitForLoadState('domcontentloaded');
            
            // Verify we did not land on the forbidden page successfully
            expect(page.url()).not.toContain(config.forbiddenPage);
          });
        }

        await test.step(`4. Verify Allowed API Access (${config.allowedApi})`, async () => {
          // Use page.evaluate to fetch from the browser context to automatically include auth cookies
          const resStatus = await page.evaluate(async (url) => {
            try {
              const res = await fetch(url);
              return res.status;
            } catch (e) {
              return 0; // Network error
            }
          }, config.allowedApi);
          
          // Any status except 401/403 means it passed authorization middleware 
          // (e.g. 405 Method Not Allowed, 404 Not Found, 200 OK are all fine)
          expect([401, 403]).not.toContain(resStatus);
        });

        if (config.forbiddenApi) {
          await test.step(`5. Verify Forbidden API Access is Blocked (${config.forbiddenApi})`, async () => {
            const resStatus = await page.evaluate(async (url) => {
              try {
                const res = await fetch(url);
                return res.status;
              } catch (e) {
                return 0; // Network error
              }
            }, config.forbiddenApi);
            
            // Middleware should strictly block and return 403 Forbidden
            expect(resStatus).toBe(403);
          });
        }
      });
    });
  }
});
