import { test, expect } from '@playwright/test'

test.describe('Booking & Ordering Smoke Tests', () => {
  test('rooms page surfaces available room cards', async ({ page }) => {
    await page.goto('/rooms')

    await expect(page.getByRole('heading', { name: 'Our Rooms' })).toBeVisible()
    const roomCards = page.locator('[data-testid="room-card"]')
    await expect(roomCards.first()).toBeVisible()
    await expect(page.getByText('View Details').first()).toBeVisible()
    await expect(page.getByText('Book Now').first()).toBeVisible()
  })

  test('booking page exposes search form controls', async ({ page }) => {
    await page.goto('/booking')

    await expect(page.getByRole('heading', { name: 'Book Your Stay' })).toBeVisible()
    await expect(page.getByLabel('Check-in Date')).toBeVisible()
    await expect(page.getByLabel('Check-out Date')).toBeVisible()
    await expect(page.getByRole('button', { name: /Search Available Rooms/i })).toBeDisabled()
  })

  test('restaurant ordering filters render with accessible state', async ({ page }) => {
    await page.goto('/order')

    await expect(page.getByRole('heading', { name: 'Restaurant Menu' })).toBeVisible()
    const filterGroup = page.locator('[role="group"][aria-label="Menu category filters"]')
    await expect(filterGroup).toBeVisible()

    const allFilter = filterGroup.getByRole('button', { name: /^All$/i })
    await expect(allFilter).toHaveAttribute('aria-pressed', 'true')

    await expect(page.getByRole('heading', { name: 'Your Order' })).toBeVisible()
  })
})
