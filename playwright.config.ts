import { defineConfig, devices } from '@playwright/test';
import os from 'os';

const isMac12 = os.platform() === 'darwin' && os.release().startsWith('21.');

/**
 * Enterprise Playwright Configuration
 * SmartHotel OS — Production Handover QA Certification
 * Covers: multi-browser, mobile, accessibility, responsive, security, and workflow flows.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./tests/e2e/global-setup'),
  timeout: 120 * 1000,
  expect: {
    timeout: 20000,
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

  // Ensure screenshots folder exists before any test writes to it
  outputDir: 'test-results',

  projects: [
    // ── Desktop Browsers ──────────────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/responsive.spec.ts'],
      // production-audit.spec.ts runs on chromium by default
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      // Only run smoke/core tests on Firefox to keep CI fast
      testMatch: ['**/comprehensive-production.spec.ts', '**/booking-flow.spec.ts', '**/accessibility-wcag.spec.ts'],
    },
    ...(!isMac12 ? [
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
        testMatch: ['**/comprehensive-production.spec.ts', '**/booking-flow.spec.ts', '**/accessibility-wcag.spec.ts'],
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 13'] },
        testMatch: ['**/responsive.spec.ts', '**/comprehensive-production.spec.ts'],
      }
    ] : []),

    // ── Mobile Devices ────────────────────────────────────────────
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: ['**/responsive.spec.ts', '**/comprehensive-production.spec.ts'],
    },

    // ── Production Certification ──────────────────────────────────
    {
      name: 'Production Certification',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/production-certification.spec.ts'],
      retries: 2, // Allow retries for complex stateful flows
    },
  ],
});
