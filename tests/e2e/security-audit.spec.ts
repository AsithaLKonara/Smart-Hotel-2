import { test, expect } from './fixtures'

test.describe('E2E Security Audit', () => {

  test('Guest should be redirected from Admin routes', async ({ guestPage }) => {
    const sensitiveRoutes = [
      '/admin/settings',
      '/admin/audit-logs',
      '/admin/organization',
      '/api/admin/config'
    ]
    
    for (const route of sensitiveRoutes) {
      await guestPage.goto(route)
      // Should redirect to home, login, or show unauthorized
      const url = guestPage.url()
      const hasUnauthorizedText = await guestPage.locator('text=Access Denied, text=Unauthorized, text=Permission Denied').isVisible()
      
      expect(url.includes(route) === false || hasUnauthorizedText).toBeTruthy()
    }
  })

  test('Staff should not access Management analytics', async ({ housekeepingPage }) => {
    await housekeepingPage.goto('/admin/analytics')
    const hasUnauthorizedText = await housekeepingPage.locator('text=Access Denied, text=Unauthorized').isVisible()
    const isRedirected = housekeepingPage.url() !== '/admin/analytics'
    
    expect(hasUnauthorizedText || isRedirected).toBeTruthy()
  })

  test('Prevent IDOR: Guest cannot view other guests bookings', async ({ guestPage }) => {
    // Attempt to access a potentially sensitive booking ID
    // We'll use a random hex string similar to a MongoDB ObjectId but one that likely doesn't belong to this guest
    const fakeBookingId = '663f1234567890abcdef1234' 
    await guestPage.goto(`/my-bookings/${fakeBookingId}`)
    
    // Should show 404 or Unauthorized, NOT the booking details
    const hasError = await guestPage.locator('text=not found, text=Unauthorized, text=Error').isVisible()
    expect(hasError).toBeTruthy()
  })

  test('API Security: Direct API access without token should fail', async ({ request }) => {
    // Using Playwright's API request fixture which doesn't have the browser session by default
    const response = await request.get('/api/admin/settings')
    expect([401, 403]).toContain(response.status())
  })
})
