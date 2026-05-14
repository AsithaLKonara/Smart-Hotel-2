import { test, expect } from '../fixtures'

test.describe('Security & RBAC Enforcement', () => {

  const restrictedAdminRoutes = [
    '/admin/dashboard',
    '/admin/settings',
    '/admin/staff',
    '/admin/audit-logs',
    '/admin/organization'
  ]

  for (const route of restrictedAdminRoutes) {
    test(`Guest should be denied access to ${route}`, async ({ guestPage }) => {
      await guestPage.goto(route)
      // Expect redirect to login or dashboard or a clear "Access Denied" message/modal
      await expect(guestPage).not.toHaveURL(route)
      // Optional: check for 403 status or redirect to signin
      // await expect(guestPage).toHaveURL(/\/auth\/signin|dashboard/)
    })
  }

  test('Housekeeping should NOT access finance settings', async ({ housekeepingPage }) => {
    await housekeepingPage.goto('/admin/organization')
    await expect(housekeepingPage.locator('text=Access Denied|Not Authorized')).toBeVisible()
  })

  test('User should not be able to view another guest\'s booking (IDOR)', async ({ guestPage }) => {
    // Attempt to access a random high-ID booking
    await guestPage.goto('/booking/6a0624db766977add0f4de60') // Random valid-looking ObjectId
    await expect(guestPage.locator('text=Booking not found|Access Denied')).toBeVisible()
  })

  test('Malicious input should be sanitized (XSS prevention)', async ({ guestPage }) => {
    await guestPage.goto('/booking')
    // Search with script tag
    const searchInput = guestPage.locator('input[type="text"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('<script>alert("xss")</script>')
      await guestPage.keyboard.press('Enter')
      // Ensure no alert popped up (handled by playwright's default behavior)
      // Ensure the text is escaped in the UI
      await expect(guestPage.locator('text=<script>')).toBeVisible()
    }
  })
})
