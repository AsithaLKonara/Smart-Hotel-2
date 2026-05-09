import { test, expect } from './fixtures'

test.describe('Booking & Ordering Smoke Tests', () => {
  test('rooms page surfaces available room cards', async ({ page }) => {
    await page.goto('/rooms')

    // Increase timeout to allow local Next.js compilation & loading state to resolve
    await expect(page.getByRole('heading', { name: /Our\s+Suites/i })).toBeVisible({ timeout: 15000 })
    const roomCards = page.locator('[data-testid="room-card"]')
    await expect(roomCards.first()).toBeVisible({ timeout: 15000 })
    
    await expect(page.getByRole('button', { name: 'Details' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reserve' }).first()).toBeVisible()
  })

  test('booking page exposes search form controls', async ({ page }) => {
    await page.goto('/booking')

    await expect(page.getByRole('heading', { name: /Secure Your/i })).toBeVisible({ timeout: 15000 })
    await expect(page.getByLabel('Check-in')).toBeVisible()
    await expect(page.getByLabel('Check-out')).toBeVisible()
    await expect(page.getByRole('button', { name: /Check Availability/i })).toBeDisabled()
  })

  test('restaurant ordering filters render with accessible state', async ({ page }) => {
    await page.goto('/order')

    await expect(page.getByRole('heading', { name: 'Restaurant Menu' })).toBeVisible({ timeout: 15000 })
    const filterGroup = page.locator('[role="group"][aria-label="Menu category filters"]')
    await expect(filterGroup).toBeVisible()

    const allFilter = filterGroup.getByRole('button', { name: /^All$/i })
    await expect(allFilter).toHaveAttribute('aria-pressed', 'true')

    await expect(page.getByRole('heading', { name: 'Your Order' })).toBeVisible()
  })
})
