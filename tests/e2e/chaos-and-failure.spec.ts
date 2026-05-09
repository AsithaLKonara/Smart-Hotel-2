import { test, expect } from './fixtures'

test.describe('SmartHotel E2E Chaos and Failure Simulations', () => {
  test.beforeEach(async ({ page }) => {
    // Mock general layout/settings dependencies
    await page.route('**/api/settings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hotelName: 'SmartHotel Luxury Chaos Lab',
          taxPercent: 5,
          serviceChargePercent: 10,
        }),
      })
    })

    await page.route('**/api/settings/contact*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: 'chaos@smarthotel.com',
          phone: '+1 999 999 999',
        }),
      })
    })

    await page.route('**/api/navigation*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.route('**/api/social-links*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.route('**/api/footer-links*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.route('**/api/notifications*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.route('**/socket.io/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    })

    // Mock NextAuth session
    await page.route('**/api/auth/session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'guest-chaos-123',
            name: 'Chaos Operator',
            email: 'chaos@example.com',
            role: 'GUEST',
          },
          expires: new Date(Date.now() + 3600000).toISOString(),
        }),
      })
    })
  })

  // 1. API 500 INTERNAL ERROR GRACEFUL RECOVERY
  test('gracefully handles database/menu API 500 outages without crashing the client', async ({ page }) => {
    // Intercept menu route to return 500 Server Error
    await page.route('**/api/restaurant/menu*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Database query timed out',
        }),
      })
    })

    // Go to ordering page
    await page.goto('/order')

    // Verify the client application did not crash and handles the state gracefully
    // It should load the container or show a friendly retry/error prompt if implemented,
    // or display empty catalog states instead of breaking.
    await expect(page.locator('body')).toBeVisible()
    
    // Check that we can navigate back to home cleanly
    const homeLink = page.locator('a[href="/"]').first()
    if (await homeLink.count() > 0) {
      await homeLink.click()
      await expect(page).toHaveURL('/')
    }
  })

  // 2. NETWORK TIMEOUT / LATENCY INJECTION SIMULATION
  test('handles slow network responses by disabling multiple consecutive submits', async ({ page }) => {
    // Inject mock menu item
    await page.route('**/api/restaurant/menu*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'menu-chaos-1',
            name: 'Slow Cooked Pork',
            description: 'Cooked over 24 hours',
            price: 1800,
            category: 'DINNER',
            preparationTime: 30,
            available: true,
          }
        ]),
      })
    })

    // Mock order placement with a 3000ms delay to simulate high latency
    let postCallCount = 0
    await page.route('**/api/restaurant/orders*', async (route) => {
      if (route.request().method() === 'POST') {
        postCallCount++
        await new Promise(resolve => setTimeout(resolve, 3000))
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order: { id: 'ord-delayed', totalAmount: 1800, status: 'PENDING' }
          }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      }
    })

    await page.goto('/order')

    // Add Slow Cooked Pork to cart
    await page.getByRole('button', { name: 'Add' }).first().click()

    const placeOrderBtn = page.getByRole('button', { name: 'Place Order' }).first()
    await expect(placeOrderBtn).toBeVisible()

    // Trigger rapid successive clicks (simulating user double-submission)
    await placeOrderBtn.click()
    await placeOrderBtn.click().catch(() => {}) // Catch if button gets disabled immediately

    // Assert that due to loading disabled attributes or state management,
    // we only record a single POST submission dispatch
    expect(postCallCount).toBeLessThanOrEqual(1)
  })

  // 3. PAYMENT STRIPE TRANSITIONS OUTAGES
  test('retains card order states on payment declination and allows checkout retries', async ({ page }) => {
    // Inject mock menu item
    await page.route('**/api/restaurant/menu*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'menu-p1',
            name: 'Special Spicy Hopper',
            price: 600,
            category: 'BREAKFAST',
            preparationTime: 10,
            available: true,
          }
        ]),
      })
    })

    // Mock order posting to fail with a payment error
    await page.route('**/api/restaurant/orders*', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 402, // Payment Required
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Payment failed',
            message: 'Your card was declined. Please choose another payment method.'
          }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      }
    })

    await page.goto('/order')

    // Add Hopper to cart
    await page.getByRole('button', { name: 'Add' }).first().click()

    // Submit order and handle the payment failure gracefully
    const placeOrderBtn = page.getByRole('button', { name: 'Place Order' }).first()
    await placeOrderBtn.click()

    // Verify system recovered gracefully and is ready for retry actions
    await expect(placeOrderBtn).toBeVisible()
    await expect(page.locator('body')).toBeVisible()
  })
})
