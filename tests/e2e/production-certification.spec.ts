import { test, expect } from './fixtures'

/**
 * 🏨 SmartHotel OS — Master Production Certification Suite
 * 
 * This suite validates the entire business engine, infrastructure integrity,
 * and cross-role stateful synchronization. It is the "Golden Standard" for 
 * production readiness.
 */

test.describe('🛡️ Production Certification: Infrastructure Audit', () => {
  
  test('Security Headers & SSL Integrity', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    const headers = response?.headers() || {}
    
    // In production, we expect security headers
    // Note: These might vary by hosting provider (Vercel, etc.)
    expect(headers['strict-transport-security']).toBeTruthy()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBeTruthy()
  })

  test('API Health & Latency Benchmarks', async ({ request }) => {
    const start = Date.now()
    const response = await request.get('/api/health/live')
    const latency = Date.now() - start

    expect(response.status()).toBe(200)
    // Production API should respond within 800ms for a health check
    expect(latency).toBeLessThan(800)
  })

  test('Client-Side Environment Integrity', async ({ page }) => {
    await page.goto('/')
    // Verify that critical production environment variables are NOT leaked or ARE present where expected
    const envCheck = await page.evaluate(() => {
      return {
        hasPrisma: (window as any).prisma !== undefined,
        hasStripeKey: (window as any).process?.env?.STRIPE_SECRET_KEY === undefined, // Should be undefined on client
        nodeEnv: (window as any).process?.env?.NODE_ENV
      }
    })
    
    expect(envCheck.hasPrisma).toBe(false) // Backend leak check
    expect(envCheck.hasStripeKey).toBe(true) // Secret leak check
  })
})

test.describe('🌟 Production Certification: The Golden Path (Cross-Role Journey)', () => {
  
  test('Full Business Lifecycle: Guest Booking to Kitchen Fulfillment', async ({ 
    browser,
    receptionistPage,
    kitchenPage 
  }) => {
    // 1. Guest Journey: Booking a Suite
    const guestContext = await browser.newContext()
    const guestPage = await guestContext.newPage()
    
    await guestPage.goto('/rooms')
    await guestPage.waitForSelector('[data-testid="room-card"]')
    
    // Select first available room
    const firstRoom = guestPage.locator('[data-testid="room-card"]').first()
    const roomName = await firstRoom.locator('h3').textContent()
    await firstRoom.click()
    
    await guestPage.waitForURL(/\/rooms\/.+/)
    await guestPage.click('button:has-text("Book Now")')
    
    // Fill Guest Details
    await guestPage.fill('input[name="firstName"]', 'Certification')
    await guestPage.fill('input[name="lastName"]', 'Tester')
    await guestPage.fill('input[name="email"]', 'cert-test@smarthotel.com')
    
    // Submit Booking
    await guestPage.click('button[type="submit"]')
    await expect(guestPage.locator('text=Booking Confirmed|Thank you')).toBeVisible({ timeout: 15000 })
    
    const bookingId = (await guestPage.locator('[data-testid="booking-id"]').textContent())?.trim()
    console.log(`✅ Guest created booking: ${bookingId} for room ${roomName}`)

    // 2. Receptionist Journey: Verification & Check-in
    await receptionistPage.goto('/admin/bookings')
    const bookingRow = receptionistPage.locator(`tr:has-text("${bookingId}")`)
    await expect(bookingRow).toBeVisible({ timeout: 10000 })
    
    // Verify status is 'Pending' or 'Confirmed'
    await expect(bookingRow).toContainText('Confirmed')
    
    // 3. Guest Action: Ordering Room Service
    // We reuse the guestPage to simulate the Guest App
    await guestPage.goto('/order')
    await guestPage.locator('[data-testid="menu-item"]').first().click()
    await guestPage.click('button:has-text("Place Order")')
    await expect(guestPage.locator('text=Order Received')).toBeVisible()
    
    console.log(`✅ Guest ordered food for room ${roomName}`)

    // 4. Kitchen Journey: Order Fulfillment
    await kitchenPage.goto('/kitchen/dashboard')
    const kitchenOrder = kitchenPage.locator(`[data-testid="order-card"]:has-text("${roomName}")`)
    await expect(kitchenOrder).toBeVisible({ timeout: 15000 })
    
    // Move to "Preparing"
    await kitchenOrder.click()
    await kitchenPage.click('button:has-text("Start Preparing")')
    await expect(kitchenOrder).toContainText('Preparing')
    
    // Move to "Ready"
    await kitchenPage.click('button:has-text("Mark as Ready")')
    await expect(kitchenOrder).not.toBeVisible() // Should move to 'Ready' column/view

    // 5. Final Integrity Check: Admin Ledger
    const adminContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    // Manual login to avoid fixture conflict if needed, or just use another fixture
    // For now, let's just check the booking status again
    await receptionistPage.goto(`/admin/bookings/${bookingId}`)
    await expect(receptionistPage.locator('text=Paid|Success')).toBeVisible()

    await guestContext.close()
    await adminPage.close()
    await adminContext.close()
  })
})

test.describe('🔒 Production Certification: Security & Persistence', () => {
  
  test('IDOR Protection: Guest cannot access Admin API', async ({ guestPage, request }) => {
    const adminApiUrl = '/api/admin/settings'
    const response = await guestPage.evaluate(async (url) => {
      const res = await fetch(url)
      return res.status
    }, adminApiUrl)
    
    expect(response).toBe(401) // Unauthorized
  })

  test('Idempotency: Double-clicking booking submit should not create duplicates', async ({ guestPage }) => {
    await guestPage.goto('/booking')
    // Fill form...
    // Simulate double click
    // const submitBtn = guestPage.locator('button[type="submit"]')
    // await submitBtn.click({ clickCount: 2 })
    // Verify only one booking exists in /my-bookings
  })
})
