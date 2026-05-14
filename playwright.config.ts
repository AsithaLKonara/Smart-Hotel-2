import { defineConfig, devices } from '@playwright/test';

/**
 * Enterprise Playwright Configuration
 * SmartHotel OS — Production Handover QA Certification
 * Covers: multi-browser, mobile, accessibility, responsive, security, and workflow flows.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 90 * 1000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  testMatch: '**/*.spec.ts',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 90000,
  },

  projects: [
    // ── Desktop Browsers ──────────────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/responsive.spec.ts'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      // Only run smoke/core tests on Firefox to keep CI fast
      testMatch: ['**/comprehensive-production.spec.ts', '**/booking-flow.spec.ts', '**/accessibility-wcag.spec.ts'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: ['**/comprehensive-production.spec.ts', '**/booking-flow.spec.ts', '**/accessibility-wcag.spec.ts'],
    },

    // ── Mobile Devices ────────────────────────────────────────────
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/responsive.spec.ts', '**/comprehensive-production.spec.ts'],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
      testMatch: ['**/responsive.spec.ts', '**/comprehensive-production.spec.ts'],
    },
  ],
});
