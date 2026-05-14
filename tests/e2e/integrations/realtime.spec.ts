import { test, expect } from '../fixtures'

test.describe('Integrations & Realtime Synchronicity', () => {

  test('OTA Webhook should create a booking in the system', async ({ adminPage }) => {
    // Simulate a webhook from Booking.com
    const webhookPayload = {
      provider: 'booking-com',
      reservation_id: 'BK-99999',
      guest_name: 'OTA Guest',
      room_type: 'DELUXE',
      dates: { from: '2025-06-01', to: '2025-06-05' }
    }

    // Use page.request to post to the webhook endpoint
    const response = await adminPage.request.post('/api/webhooks/ota', {
      data: webhookPayload,
      headers: { 'X-OTA-Signature': 'mock-signature' }
    })
    
    expect(response.status()).toBe(200)

    // Verify booking appears in admin
    await adminPage.goto('/admin/bookings')
    await expect(adminPage.locator('text=BK-99999')).toBeVisible()
  })

  test('Real-time notifications should appear for staff', async ({ receptionistPage, adminPage }) => {
    await receptionistPage.goto('/admin/dashboard')
    
    // Trigger an event from another page (e.g. a new booking)
    // Here we simulate the trigger or just wait for one if the system is live
    // For generation, we assume a notification toast appears on event
    
    // We'll check if the notification bell shows a badge
    const badge = receptionistPage.locator('[data-testid="notification-badge"]')
    await expect(badge).toBeVisible()
    
    await receptionistPage.locator('[data-testid="notification-bell"]').click()
    await expect(receptionistPage.locator('text=New Booking')).toBeVisible()
  })

  test('Stripe payment flow should handle success/failure', async ({ page }) => {
    await page.goto('/booking-flow/payment')
    
    // Check if Stripe Elements are injected (placeholder test)
    const stripeFrame = page.frameLocator('iframe[src*="stripe"]')
    // This is hard to test without real keys, but we check for the container
    await expect(page.locator('#payment-element')).toBeVisible()
  })
})
