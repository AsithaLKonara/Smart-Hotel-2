import { Page, expect } from '@playwright/test'
import { prisma } from '@/lib/db'

/**
 * Authentication Helper
 */
export async function loginAs(page: Page, role: 'SUPER_ADMIN' | 'RECEPTIONIST' | 'HOUSEKEEPING' | 'KITCHEN' | 'GUEST') {
  // Use a simulated session bypass for testing if environment allows, 
  // or perform actual login UI steps.
  await page.goto('/auth/signin')
  
  // For production certification, we use real UI login
  const email = role === 'SUPER_ADMIN' ? 'admin@smarthotel.com' : (role === 'GUEST' ? 'guest@example.com' : `${role.toLowerCase()}@smarthotel.com`)
  const password = 'password123'
  
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  
  // Verify redirect to correct dashboard
  const expectedPath = role === 'GUEST' ? '/dashboard' : (role === 'RECEPTIONIST' ? '/admin/bookings' : `/admin/${role.toLowerCase()}`)
  // Handle Executive Dashboard mapping
  const finalPath = role === 'SUPER_ADMIN' ? '/admin/dashboard' : expectedPath
  
  await page.waitForURL(new RegExp(finalPath), { timeout: 30000 })
}

/**
 * Database Verification Helper
 */
export const dbAssert = {
  async bookingExists(code: string) {
    const booking = await prisma.booking.findUnique({ where: { confirmationCode: code } })
    expect(booking).not.toBeNull()
    return booking
  },
  
  async roomStatusMatches(roomNumber: string, status: string) {
    const room = await prisma.room.findUnique({ where: { number: roomNumber } })
    expect(room?.status).toBe(status)
  },
  
  async taskCreatedForRoom(roomNumber: string, type: string) {
    const task = await prisma.task.findFirst({
      where: { room: { number: roomNumber }, type: type as any },
      orderBy: { createdAt: 'desc' }
    })
    expect(task).not.toBeNull()
    return task
  },
  
  async paymentCaptured(bookingId: string) {
    const payment = await prisma.payment.findFirst({
      where: { bookingId, status: 'PAID' }
    })
    expect(payment).not.toBeNull()
    return payment
  }
}

/**
 * External Event Simulators
 */
export const simulate = {
  /**
   * Simulate Stripe Checkout Success
   */
  async stripeWebhook(bookingId: string, amount: number) {
    const response = await fetch(`${process.env.BASE_URL}/api/webhooks/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Stripe-Signature': 'mock_sig' },
      body: JSON.stringify({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { bookingId },
            amount_total: amount * 100, // Stripe uses cents
            payment_status: 'paid',
            id: `cs_test_${Math.random()}`
          }
        }
      })
    })
    return response
  },

  /**
   * Simulate OTA Pull Failure
   */
  async otaSyncFailure(roomTypeId: string) {
    // This would typically involve mocking the axios call in the ota-service
    // For E2E, we check if the SyncLog is created with status FAILED
    const log = await prisma.syncLog.findFirst({
      where: { entityId: roomTypeId, status: 'FAILED' },
      orderBy: { createdAt: 'desc' }
    })
    return log
  }
}
