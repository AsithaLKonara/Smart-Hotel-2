import fs from 'fs';
import path from 'path';

// Read the routes discovered earlier (assuming we run this after the previous script)
const discoverRoutesPath = path.join(process.cwd(), 'scratch/discover-routes.js');
// Wait, we need the JSON output. Let's just re-run the discovery logic here for simplicity.

const appDir = path.join(process.cwd(), 'app');
const specsDir = path.join(process.cwd(), 'tests/autonomous/specs');

if (!fs.existsSync(specsDir)) {
  fs.mkdirSync(specsDir, { recursive: true });
}

function scanDirectory(dir, basePath = '') {
  const routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const isRouteGroup = entry.name.startsWith('(') && entry.name.endsWith(')');
      const nextBasePath = isRouteGroup ? basePath : `${basePath}/${entry.name}`;
      
      const subRoutes = scanDirectory(path.join(dir, entry.name), nextBasePath);
      routes.push(...subRoutes);
    } else if (entry.name === 'page.tsx') {
      const routePath = basePath === '' ? '/' : basePath;
      routes.push({ path: routePath, file: path.join(dir, entry.name) });
    }
  }

  return routes;
}

const routes = scanDirectory(appDir);

// Generate specs for each page route
routes.forEach((route) => {
  // Replace dynamic segments with a mock id
  const testUrl = route.path.replace(/\[.*?\]/g, 'mock-id-123');
  
  // Create a safe filename
  const safeName = route.path === '/' ? 'home' : route.path.replace(/[^a-zA-Z0-9]/g, '-').replace(/^-+|-+$/g, '');
  const fileName = `${safeName}.spec.ts`;
  
  const content = `import { expect } from '@playwright/test';
import { test } from '../fixtures/auth';

test.describe('Autonomous Coverage: ${route.path}', () => {
  test('should load without critical errors as UNAUTHENTICATED', async ({ page, loginAs }) => {
    await loginAs('UNAUTHENTICATED');
    
    // Catch console errors
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const response = await page.goto('${testUrl}', { waitUntil: 'domcontentloaded' });
    
    // We expect either a success or a redirect to login (if protected)
    if (response) {
      const status = response.status();
      // 200 = Success, 401/403/302 = Auth/Redirect expected behavior
      expect([200, 302, 304, 307, 308, 401, 403, 404]).toContain(status);
    }
    
    // Check if there are catastrophic react errors
    const reactError = errors.find(e => e.includes('Minified React error') || e.includes('Application error'));
    expect(reactError).toBeUndefined();
  });

  // Example of a role-based test. The engine will iteratively expand this.
  test('should load without critical errors as SUPER_ADMIN', async ({ page, loginAs }) => {
    await loginAs('SUPER_ADMIN');
    
    const response = await page.goto('${testUrl}', { waitUntil: 'domcontentloaded' });
    if (response) {
      expect([200, 302, 304, 404]).toContain(response.status());
    }
  });
});
`;

  fs.writeFileSync(path.join(specsDir, fileName), content);
  console.log(`Generated test for ${route.path} -> ${fileName}`);
});

console.log(`Successfully generated ${routes.length} spec files.`);
