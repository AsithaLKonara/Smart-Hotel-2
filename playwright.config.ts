import { defineConfig, devices } from '@playwright/test';

/**
 * Enterprise Playwright Configuration
 * Tailored for SmartHotel OS Production Certification.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60 * 1000, // 60s total test timeout
  expect: {
    timeout: 10000, // 10s expect timeout
  },
  fullyParallel: true, 
  forbidOnly: !!process.env.CI,
  retries: 2, // Allow retries for dev-server instability
  workers: 4, // Increased for performance, ensure DB can handle concurrent connections
  reporter: 'html',
  testMatch: '**/*.spec.ts',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
