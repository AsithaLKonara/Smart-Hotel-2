import { test as base, expect } from '@playwright/test'

const ALLOWED_CONSOLE_PATTERNS = [
  /MaxListenersExceededWarning/, // emitted by Next.js dev server in rare cases
  /Content-Security-Policy/i,
  /MIME type .* mismatch/i,
  /Failed to load resource: the server responded with a status of 404.*images\.unsplash\.com/i,
  /Refused to frame 'https:\/\/www\.google\.com\//i,
]

const ALLOWED_FAILED_REQUEST_PATTERNS = [
  /images\.unsplash\.com/,
  /\/_next\/static\//,
  /player\.vimeo\.com/,
  /\?_rsc=/,
  /google-analytics\.com/,
  /googletagmanager\.com/,
  /googleapis\.com\/g\/collect/,
]

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const failedRequests: string[] = []

    const recordConsole = (msg: any) => {
      if (msg.type() !== 'error') {
        return
      }

      const text = msg.text()
      const allowed = ALLOWED_CONSOLE_PATTERNS.some(pattern => pattern.test(text))
      if (!allowed) {
        consoleErrors.push(text)
      }
    }

    const recordPageError = (error: Error) => {
      pageErrors.push(error.message)
    }

    const recordFailedRequest = (request: any) => {
      const url = request.url()
      const allowed = ALLOWED_FAILED_REQUEST_PATTERNS.some(pattern => pattern.test(url))
      if (!allowed) {
        const failure = request.failure()
        failedRequests.push(`${failure?.errorText ?? 'unknown error'}: ${url}`)
      }
    }

    page.on('console', recordConsole)
    page.on('pageerror', recordPageError)
    page.on('requestfailed', recordFailedRequest)

    await use(page)

    page.off('console', recordConsole)
    page.off('pageerror', recordPageError)
    page.off('requestfailed', recordFailedRequest)

    const failureMessages: string[] = []

    if (consoleErrors.length > 0) {
      await testInfo.attach('console-errors', {
        body: consoleErrors.join('\n'),
        contentType: 'text/plain',
      })
      failureMessages.push('Unexpected console errors detected')
    }

    if (pageErrors.length > 0) {
      await testInfo.attach('page-errors', {
        body: pageErrors.join('\n'),
        contentType: 'text/plain',
      })
      failureMessages.push('Unhandled page errors detected')
    }

    if (failedRequests.length > 0) {
      await testInfo.attach('failed-requests', {
        body: failedRequests.join('\n'),
        contentType: 'text/plain',
      })
      failureMessages.push('Unexpected failed network requests detected')
    }

    if (failureMessages.length > 0) {
      throw new Error(failureMessages.join('; '))
    }
  },
})

export { expect }
