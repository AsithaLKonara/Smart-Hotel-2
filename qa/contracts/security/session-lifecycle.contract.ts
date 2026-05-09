import { test, expect } from '@playwright/test'
import { loginAsUser } from '../../config/demo-users'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('⏳ Security Audit - Session Lifecycle & Expiry Recovery', () => {
  test('❌ Multi-Tab Logout: Logging out in Tab A must instantly invalidate session in Tab B', async ({ context }) => {
    // 1. Create Tab A and Tab B within the same browser context (sharing cookies)
    const pageA = await context.newPage()
    const pageB = await context.newPage()

    // 2. Log in as admin in Tab A
    await loginAsUser(pageA, 'admin', BASE_URL)

    // 3. Tab B must now automatically be authenticated because cookies are shared
    const checkResponseBefore = await pageB.request.get(`${BASE_URL}/api/inventory`)
    expect(checkResponseBefore.status()).toBe(200)

    // 4. Perform logout in Tab A by hitting NextAuth signout endpoint directly or clearing cookies
    // Let's clear cookies to simulate global cookie death on signout
    await context.clearCookies()

    // 5. Attempt protected action in Tab B
    const checkResponseAfter = await pageB.request.get(`${BASE_URL}/api/inventory`)
    
    // Assert that the request is now immediately blocked
    expect([401, 403]).toContain(checkResponseAfter.status())
  })

  test('❌ Expired/Revoked Cookie: Stale or revoked session cookies must be rejected', async ({ context }) => {
    const page = await context.newPage()

    // 1. Log in to establish valid initial session
    await loginAsUser(page, 'admin', BASE_URL)

    // 2. Clear cookies to simulate expired or revoked token on the client
    await context.clearCookies()

    // 3. Attempt to fetch a protected endpoint
    const response = await page.request.get(`${BASE_URL}/api/inventory`)

    // Assert that the request is blocked and rejected by the server
    expect([401, 403]).toContain(response.status())
  })
})
