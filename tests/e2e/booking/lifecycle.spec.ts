import { test, expect } from '../fixtures'
import { BookingPage } from '../page-objects/BookingPage'
import { getFutureDates, generateGuestData } from '../utils/test-data'

test.describe('Booking Lifecycle Management', () => {
  
  test('Guest should be able to complete a full booking journey', async ({ page }) => {
    const bookingPage = new BookingPage(page)
    const dates = getFutureDates(14, 3)
    const guest = generateGuestData()

    // 1. Search for rooms
    await bookingPage.goto('/booking')
    await bookingPage.searchAvailability(dates.checkIn, dates.checkOut)
    await expect(bookingPage.roomCards.first()).toBeVisible()

    // 2. Select and reserve
    await bookingPage.reserveFirstRoom()
    await page.waitForURL(/\/booking-flow/)

    // 3. Fill guest details
    await page.getByLabel(/Full Name/i).fill(guest.name)
    await page.getByLabel(/Email/i).fill(guest.email)
    await page.getByLabel(/Phone/i).fill(guest.phone)
    await page.getByRole('button', { name: /Continue/i }).click()

    // 4. Payment Simulation
    await expect(page.locator('text=Payment Details')).toBeVisible()
    await page.getByRole('button', { name: /Confirm & Pay/i }).click()

    // 5. Confirmation
    await expect(page.locator('text=Booking Confirmed')).toBeVisible({ timeout: 20000 })
    await expect(page.locator('[data-testid="confirmation-code"]')).not.toBeEmpty()
  })

  test('Guest should be able to cancel a pending booking', async ({ guestPage }) => {
    await guestPage.goto('/my-bookings')
    const firstBooking = guestPage.locator('[data-testid="booking-card"]').first()
    
    if (await firstBooking.isVisible()) {
      await firstBooking.getByRole('button', { name: /Cancel/i }).click()
      await guestPage.getByRole('button', { name: /Confirm Cancellation/i }).click()
      await expect(guestPage.locator('text=Cancelled')).toBeVisible()
    }
  })
})
