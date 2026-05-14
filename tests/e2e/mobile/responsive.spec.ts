import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size

test.describe('Mobile & Responsive Experience', () => {


  test('Mobile navigation menu should toggle correctly', async ({ page }) => {
    await page.goto('/')
    
    const menuButton = page.locator('button[aria-label*="Menu"], .mobile-menu-toggle').first()
    await expect(menuButton).toBeVisible()
    
    await menuButton.click()
    await expect(page.locator('nav.mobile-nav, .mobile-menu-overlay')).toBeVisible()
    
    await page.locator('button[aria-label*="Close"]').click()
    await expect(page.locator('nav.mobile-nav')).not.toBeVisible()
  })

  test('Guest Super App should load mobile-optimized views', async ({ page }) => {
    // Navigate to the specific mobile entry point if exists
    await page.goto('/mobile/guest-super-app')
    
    await expect(page.locator('text=Welcome to Your Stay')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible()
  })

  test('Booking flow should be usable on small screens', async ({ page }) => {
    await page.goto('/booking')
    
    // Check if room cards stack vertically
    const firstCard = page.locator('[data-testid="room-card"]').first()
    const box = await firstCard.boundingBox()
    expect(box?.width).toBeLessThan(400)
    
    await firstCard.getByRole('button', { name: /Book/i }).click()
    await expect(page).toHaveURL(/\/booking-flow/)
  })
})
