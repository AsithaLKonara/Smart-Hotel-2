import { defineConfig, devices } from '@playwright/test'

const databaseUrl =
  process.env.PLAYWRIGHT_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'mongodb+srv://SmartHotel:1234@cluster0.1savcxg.mongodb.net/smarthotel?retryWrites=true&w=majority&appName=Cluster0'

const defaultBaseUrl = process.env.BASE_URL || 'http://localhost:3000'
const nextAuthUrl = process.env.PLAYWRIGHT_NEXTAUTH_URL || process.env.NEXTAUTH_URL || defaultBaseUrl
const nextAuthSecret = process.env.PLAYWRIGHT_NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET || 'playwright-secret'

const envEntries: Record<string, string> = {
  DATABASE_URL: databaseUrl,
  NEXTAUTH_URL: nextAuthUrl,
  NEXTAUTH_SECRET: nextAuthSecret,
  NEXT_PUBLIC_APP_URL: defaultBaseUrl,
  NEXT_PUBLIC_GA_ID: '',
}

const envStringUnix = Object.entries(envEntries)
  .map(([key, value]) => `${key}=${value}`)
  .join(' ')
const envStringWindows = Object.entries(envEntries)
  .map(([key, value]) => `set "${key}=${value}"`)
  .join(' && ')

const shouldSkipBuild = !!process.env.PLAYWRIGHT_SKIP_BUILD

const startCommand =
  process.platform === 'win32'
    ? `${envStringWindows} && npm run start`
    : `${envStringUnix} npm run start`

const buildPrefix = shouldSkipBuild ? '' : 'npm run build && '
const webServerCommand = `${buildPrefix}${startCommand}`

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: defaultBaseUrl,
    navigationTimeout: 60_000,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // Skip problematic WebKit features
        ignoreHTTPSErrors: true,
      },
      // Skip WebKit tests that have protocol errors
      grep: /^(?!.*webkit)/i,
    },
    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // Skip problematic WebKit features
        ignoreHTTPSErrors: true,
      },
      // Skip Mobile Safari tests that have protocol errors
      grep: /^(?!.*Mobile Safari)/i,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: webServerCommand,
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 300 * 1000,
  },
})
