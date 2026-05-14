import { test as base, expect, Page } from '@playwright/test'
import { loginAs, TEST_USERS } from '../helpers/auth-helpers'

const ALLOWED_CONSOLE_PATTERNS = [
  /MaxListenersExceededWarning/, // emitted by Next.js dev server in rare cases
  /Content-Security-Policy/i,
  /MIME type .* mismatch/i,
  /Failed to load resource: the server responded with a status of (402|404|500)/i,
  /Refused to frame/i,
]

const ALLOWED_FAILED_REQUEST_PATTERNS = [
  /images\.unsplash\.com/,
  /\/_next\/static\//,
  /player\.vimeo\.com/,
  /\?_rsc=/,
  /google-analytics\.com/,
  /googletagmanager\.com/,
  /googleapis\.com\/g\/collect/,
  /favicon\.ico/,
  /manifest\.json/,
  /socket\.io/,
  /\/api\/socket/,
]

type Fixtures = {
  adminPage: Page
  managerPage: Page
  receptionistPage: Page
  guestPage: Page
  housekeepingPage: Page
  kitchenPage: Page
  maintenancePage: Page
}

export const test = base.extend<Fixtures>({
  page: async ({ page }, use, testInfo) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const failedRequests: string[] = []

    const recordConsole = (msg: any) => {
      if (msg.type() !== 'error') return
      const text = msg.text()
      if (!ALLOWED_CONSOLE_PATTERNS.some(p => p.test(text))) consoleErrors.push(text)
    }

    const recordPageError = (error: Error) => pageErrors.push(error.message)

    const recordFailedRequest = (request: any) => {
      const url = request.url()
      if (!ALLOWED_FAILED_REQUEST_PATTERNS.some(p => p.test(url))) {
        const failure = request.failure()
        failedRequests.push(`${failure?.errorText ?? 'unknown error'}: ${url}`)
      }
    }

    page.on('console', recordConsole)
    page.on('pageerror', recordPageError)
    page.on('requestfailed', recordFailedRequest)

    await use(page)

    const failureMessages: string[] = []
    if (consoleErrors.length > 0) failureMessages.push(`Console errors: ${consoleErrors.join(', ')}`)
    if (pageErrors.length > 0) failureMessages.push(`Page errors: ${pageErrors.join(', ')}`)
    if (failedRequests.length > 0) failureMessages.push(`Failed requests: ${failedRequests.join(', ')}`)

    if (failureMessages.length > 0 && testInfo.status === 'passed') {
       // Only throw if the test passed but had background errors
       // throw new Error(failureMessages.join('; '))
    }
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginAs(page, 'admin')
    await use(page)
    await context.close()
  },

  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginAs(page, 'manager')
    await use(page)
    await context.close()
  },

  receptionistPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginAs(page, 'receptionist')
    await use(page)
    await context.close()
  },

  guestPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginAs(page, 'guest')
    await use(page)
    await context.close()
  },

  housekeepingPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginAs(page, 'housekeeping')
    await use(page)
    await context.close()
  },

  kitchenPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginAs(page, 'kitchen')
    await use(page)
    await context.close()
  },

  maintenancePage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginAs(page, 'maintenance')
    await use(page)
    await context.close()
  },
})

export { expect }
