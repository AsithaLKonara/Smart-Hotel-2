import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock external services
    await page.route('**/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-guest-1',
            email: 'guest@smarthotel.test',
            name: 'Test Guest',
            role: 'GUEST',
          },
        }),
      })
    })

    // Mock Stripe checkout
    await page.route('**/api/create-checkout-session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'test_session_123',
          url: 'https://checkout.stripe.com/test',
        }),
      })
    })
  })

  test('guest can search and book a room', async ({ page }) => {
    // Navigate to rooms page
    await page.goto('/rooms')

    // Check accessibility
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])

    // Search for available rooms
    await page.fill('input[name="checkIn"]', '2025-10-01')
    await page.fill('input[name="checkOut"]', '2025-10-03')
    await page.click('button[type="submit"]')

    // Wait for search results
    await expect(page.locator('[data-testid="room-card"]')).toBeVisible()

    // Select a room
    await page.click('[data-testid="room-card"]:first-child button:has-text("Book Now")')

    // Fill booking details
    await page.fill('input[name="guestName"]', 'Test Guest')
    await page.fill('input[name="guestEmail"]', 'guest@example.com')
    await page.fill('textarea[name="specialRequests"]', 'Late check-in requested')

    // Select payment method
    await page.click('input[value="pay_now"]')

    // Submit booking
    await page.click('button[type="submit"]:has-text("Confirm Booking")')

    // Verify booking confirmation
    await expect(page.locator('text=Booking Confirmed')).toBeVisible()
    await expect(page.locator('text=Booking Reference')).toBeVisible()
  })

  test('booking form validation works correctly', async ({ page }) => {
    await page.goto('/rooms')

    // Try to submit without filling required fields
    await page.click('[data-testid="room-card"]:first-child button:has-text("Book Now")')
    await page.click('button[type="submit"]:has-text("Confirm Booking")')

    // Check for validation errors
    await expect(page.locator('text=Guest name is required')).toBeVisible()
    await expect(page.locator('text=Guest email is required')).toBeVisible()
  })

  test('user can view booking details', async ({ page }) => {
    // Mock booking data
    await page.route('**/api/bookings', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-booking-1',
            room: {
              number: '101',
              type: 'DELUXE',
            },
            checkIn: '2025-10-01',
            checkOut: '2025-10-03',
            status: 'CONFIRMED',
            totalAmount: 300.00,
          },
        ]),
      })
    })

    await page.goto('/my-bookings')

    // Check accessibility
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])

    // Verify booking details are displayed
    await expect(page.locator('text=Room 101')).toBeVisible()
    await expect(page.locator('text=DELUXE')).toBeVisible()
    await expect(page.locator('text=$300.00')).toBeVisible()
    await expect(page.locator('text=CONFIRMED')).toBeVisible()
  })

  test('admin can manage bookings', async ({ page }) => {
    // Mock admin session
    await page.route('**/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-admin-1',
            email: 'admin@smarthotel.test',
            name: 'Test Admin',
            role: 'SUPER_ADMIN',
          },
        }),
      })
    })

    // Mock bookings data
    await page.route('**/api/bookings', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-booking-1',
            user: {
              name: 'Test Guest',
              email: 'guest@example.com',
            },
            room: {
              number: '101',
              type: 'DELUXE',
            },
            checkIn: '2025-10-01',
            checkOut: '2025-10-03',
            status: 'CONFIRMED',
            totalAmount: 300.00,
          },
        ]),
      })
    })

    await page.goto('/admin/bookings')

    // Check accessibility
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])

    // Verify admin can see booking details
    await expect(page.locator('text=Test Guest')).toBeVisible()
    await expect(page.locator('text=guest@example.com')).toBeVisible()
    await expect(page.locator('text=Room 101')).toBeVisible()

    // Test booking status update
    await page.click('button:has-text("Update Status")')
    await page.selectOption('select[name="status"]', 'CHECKED_IN')
    await page.click('button:has-text("Save Changes")')

    // Verify status update
    await expect(page.locator('text=CHECKED_IN')).toBeVisible()
  })

  test('restaurant ordering flow', async ({ page }) => {
    // Mock menu data
    await page.route('**/api/restaurant/menu', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-menu-1',
            name: 'Margherita Pizza',
            description: 'Classic tomato and mozzarella',
            price: 15.99,
            category: 'MAIN_COURSE',
            isAvailable: true,
          },
        ]),
      })
    })

    await page.goto('/order')

    // Check accessibility
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])

    // Add item to cart
    await expect(page.locator('text=Margherita Pizza')).toBeVisible()
    await page.click('button:has-text("Add to Order")')

    // Verify item added to cart
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()
    await expect(page.locator('text=$15.99')).toBeVisible()

    // Place order
    await page.click('button:has-text("Place Order")')

    // Verify order confirmation
    await expect(page.locator('text=Order Placed')).toBeVisible()
  })
})
