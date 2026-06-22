import { test, expect, Page } from '@playwright/test';

// Configuration
const ROLES = [
  { role: 'Admin', email: 'admin@smarthotel.com', password: 'SmartHotel@2025!Admin' },
  { role: 'Manager', email: 'manager@smarthotel.com', password: 'SmartHotel@2025!Manager' },
  { role: 'Receptionist', email: 'receptionist@smarthotel.com', password: 'SmartHotel@2025!Reception' },
  { role: 'Kitchen', email: 'kitchen@smarthotel.com', password: 'SmartHotel@2025!Kitchen' },
  { role: 'Housekeeping', email: 'housekeeping@smarthotel.com', password: 'SmartHotel@2025!House' },
  { role: 'Maintenance', email: 'maintenance@smarthotel.com', password: 'SmartHotel@2025!Maint' },
];

const IGNORE_URLS = [
  '/api/auth/signout',
  '/auth/signin',
  '#',
];

const IGNORE_CONSOLE = [
  'Download the React DevTools', // React devtools suggestion
  'Stripe.js', // Stripe logs
  'Third-party cookie', // Chrome warnings
];

test.describe('Zero Error Audit Crawler', () => {
  // Give it a long timeout as it crawls many pages
  test.setTimeout(5 * 60 * 1000); 

  for (const { role, email, password } of ROLES) {
    test(`Crawl as ${role} looking for zero errors`, async ({ page, baseURL }) => {
      const errors: string[] = [];

      // Intercept console errors/warnings
      page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if ((type === 'error' || type === 'warning') && !IGNORE_CONSOLE.some(ignore => text.includes(ignore))) {
          errors.push(`[Console ${type}] ${text}`);
        }
      });

      // Intercept uncaught exceptions
      page.on('pageerror', error => {
        errors.push(`[Page Error] ${error.name}: ${error.message}\n${error.stack}`);
      });

      // Intercept failed requests (500s, failed fetch, etc.)
      page.on('requestfailed', request => {
        // Exclude some analytics/tracking domains if they fail due to adblockers in CI
        if (request.url().includes('google-analytics') || request.url().includes('stripe.com/v1/m')) return;
        errors.push(`[Request Failed] ${request.url()} - ${request.failure()?.errorText}`);
      });

      page.on('response', response => {
        if (response.status() >= 400) {
          // Sometimes 401s on polling might be expected, but we want zero errors.
          if (response.url().includes('google-analytics') || response.url().includes('sentry')) return;
          errors.push(`[HTTP ${response.status()}] ${response.url()}`);
        }
      });

      // 1. Login
      await page.goto('/auth/signin');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');

      // Wait for redirect away from signin (give it 45s for slow dev compiles)
      await page.waitForURL(url => !url.toString().includes('/auth/signin'), { timeout: 45000 }).catch(() => null);

      // Verify login success by checking URL
      expect(page.url()).not.toContain('/auth/signin');

      // 2. Discover and Visit Links
      const visited = new Set<string>();
      const queue: string[] = [new URL(page.url()).pathname];

      while (queue.length > 0) {
        const currentPath = queue.shift()!;
        if (visited.has(currentPath)) continue;
        visited.add(currentPath);

        console.log(`[${role}] Visiting: ${currentPath}`);
        
        try {
          await page.goto(currentPath, { waitUntil: 'networkidle', timeout: 15000 });
        } catch (e: any) {
           errors.push(`[Navigation Failed] ${currentPath} - ${e.message}`);
           continue;
        }

        // Check if there are errors accumulated
        if (errors.length > 0) {
          console.error(`\nErrors found on ${currentPath} for role ${role}:`);
          errors.forEach(e => console.error(e));
          throw new Error(`Zero Error Violation on ${currentPath}:\n${errors.join('\n')}`);
        }

        // Find all internal links
        const hrefs = await page.$$eval('a', anchors => anchors.map(a => a.getAttribute('href')));
        for (const href of hrefs) {
          if (!href) continue;
          if (href.startsWith('http') && !href.startsWith(baseURL!)) continue; // external
          
          let path = href;
          if (href.startsWith(baseURL!)) {
            path = href.replace(baseURL!, '');
          }

          // Strip query params/hashes for deduplication if needed, but here we'll keep simple paths
          const cleanPath = path.split('?')[0].split('#')[0];

          if (cleanPath.startsWith('/') && !visited.has(cleanPath) && !IGNORE_URLS.some(i => cleanPath.includes(i))) {
            queue.push(cleanPath);
          }
        }
        
        // Wait a small moment for any lazy effects
        await page.waitForTimeout(500);

        // Fail immediately if errors popped up during wait
        if (errors.length > 0) {
           throw new Error(`Zero Error Violation on ${currentPath}:\n${errors.join('\n')}`);
        }
      }
    });
  }
});
