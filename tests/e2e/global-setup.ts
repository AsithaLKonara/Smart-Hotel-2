import { FullConfig } from '@playwright/test';

/**
 * Pre-warms the Next.js development server to prevent timeouts on the first test run.
 * JIT compilation in Next.js dev mode can take >30s for complex admin routes, causing
 * STAB-001 cascade failures if they aren't pre-fetched before Playwright starts.
 */
async function globalSetup(config: FullConfig) {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  
  // We only really need to pre-warm if we're hitting localhost (likely dev server)
  if (!baseURL.includes('localhost')) {
    return;
  }

  const routesToWarm = [
    '/admin/dashboard',
    '/admin/bookings',
    '/admin/rooms',
    '/admin/housekeeping',
    '/admin/staff',
    '/admin/analytics',
    '/admin/calendar',
    '/admin/crm',
    '/admin/inventory',
    '/admin/accounting',
    '/admin/hr',
    '/admin/maintenance',
    '/admin/settings',
    '/admin/audit-logs',
    '/',
    '/rooms',
    '/auth/signin'
  ];

  console.log(`\n🔥 Pre-warming Next.js dev server for ${routesToWarm.length} routes...`);
  
  // Fire requests in parallel to let the dev server compile them
  // We ignore responses since we just want to trigger the compilation
  const warmupPromises = routesToWarm.map(route => {
    return fetch(`${baseURL}${route}`)
      .then(res => {
        if (!res.ok) console.warn(`   Warmup warning for ${route}: ${res.status}`);
      })
      .catch(err => console.warn(`   Warmup failed for ${route}:`, err.message));
  });

  // Wait for all pre-compilation requests to settle
  await Promise.allSettled(warmupPromises);
  
  console.log('✅ Server pre-warmed.\n');
}

export default globalSetup;
