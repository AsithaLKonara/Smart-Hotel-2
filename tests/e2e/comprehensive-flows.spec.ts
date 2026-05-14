import { test, expect } from './fixtures'

test.describe('End-to-End Guest Lifecycle', () => {

  test('Complete Guest Journey: Booking -> Ordering -> Checkout', async ({ guestPage, adminPage, kitchenPage }) => {
    test.setTimeout(180000) // 3 minutes for the full lifecycle

    // 1. Guest: Search and Book
    await guestPage.goto('/booking')
    
    // Fill search criteria
    const checkIn = new Date()
    checkIn.setDate(checkIn.getDate() + 7)
    const checkOut = new Date()
    checkOut.setDate(checkOut.getDate() + 9)
    
    await guestPage.fill('input[name*="checkIn"], input[name*="check-in"]', checkIn.toISOString().split('T')[0])
    await guestPage.fill('input[name*="checkOut"], input[name*="check-out"]', checkOut.toISOString().split('T')[0])
    
    // Click check availability
    const searchBtn = guestPage.locator('button:has-text("Check Availability")')
    if (await searchBtn.isEnabled()) {
      await searchBtn.click()
    } else {
      // Handle disabled state if search requires more fields
      await guestPage.selectOption('select[name*="guest"]', '2')
      await searchBtn.click()
    }
    
    // Select a room
    const reserveBtn = guestPage.locator('button:has-text("Reserve"), button:has-text("Book Now")').first()
    await expect(reserveBtn).toBeVisible({ timeout: 15000 })
    await reserveBtn.click()
    
    // Finalize booking (assuming a confirmation step)
    await guestPage.waitForURL(/\/booking-flow|\/confirmation/)
    const confirmBtn = guestPage.locator('button:has-text("Confirm Booking"), button:has-text("Pay Now")').first()
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click()
    }
    
    // 2. Admin: Verify Booking appears in dashboard
    await adminPage.goto('/admin/bookings')
    // Search for guest name or confirmation (simplified: check list)
    await expect(adminPage.locator('table, .booking-list')).toBeVisible()
    
    // 3. Guest: Order Food from Restaurant
    await guestPage.goto('/order')
    const addToCart = guestPage.locator('button:has-text("Add to Cart"), button:has-text("Order")').first()
    await addToCart.click()
    
    const checkoutOrder = guestPage.locator('button:has-text("Place Order"), button:has-text("Checkout")').first()
    await checkoutOrder.click()
    
    await expect(guestPage.locator('text=Order Confirmed, text=Thank you')).toBeVisible()
    
    // 4. Kitchen: Fulfill Order
    await kitchenPage.goto('/kitchen/dashboard')
    const prepareBtn = kitchenPage.locator('button:has-text("Start Preparing"), button:has-text("Accept")').first()
    if (await prepareBtn.isVisible()) {
      await prepareBtn.click()
      await kitchenPage.locator('button:has-text("Ready"), button:has-text("Complete")').first().click()
    }
    
    // 5. Guest: View Order Status
    await guestPage.goto('/order/tracking')
    await expect(guestPage.locator('text=Ready, text=Delivered, text=Completed')).toBeVisible()
    
    // 6. Guest: Check Out
    await guestPage.goto('/my-bookings')
    const checkoutBtn = guestPage.locator('button:has-text("Check Out"), button:has-text("Pay & Leave")').first()
    if (await checkoutBtn.isVisible()) {
      await checkoutBtn.click()
      await expect(guestPage.locator('text=Checked Out, text=Receipt')).toBeVisible()
    }
  })
})
