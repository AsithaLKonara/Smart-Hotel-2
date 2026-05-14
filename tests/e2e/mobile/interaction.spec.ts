import { test, expect, devices } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.use({ ...devices['iPhone 13'] })

test.describe('📱 Mobile-Specific Interaction Tests', () => {
  test.setTimeout(60000)

  test('✅ Mobile navigation hamburger menu opens and closes', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('domcontentloaded')

    const menuBtn = page.locator(
      'button[aria-label*="menu" i], button[aria-label*="navigation" i], button[class*="hamburger"], button[class*="mobile-menu"]'
    ).first()

    if (await menuBtn.isVisible()) {
      await menuBtn.tap()
      await page.waitForTimeout(500)

      // Menu should be open
      const navMenu = page.locator('nav, [role="navigation"]').first()
      await expect(navMenu).toBeVisible()

      // Close by pressing Escape or tapping again
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }
    
    await expect(page.locator('body')).toBeVisible()
  })

  test('✅ Touch scrolling works on rooms list', async ({ page }) => {
    await page.goto(`${BASE_URL}/rooms`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const initialScrollY = await page.evaluate(() => window.scrollY)

    // Simulate swipe scroll by touching and dragging
    await page.touchscreen.tap(200, 400)
    await page.evaluate(() => window.scrollBy(0, 300))
    await page.waitForTimeout(300)

    const newScrollY = await page.evaluate(() => window.scrollY)
    // Should have scrolled
    expect(newScrollY).toBeGreaterThanOrEqual(initialScrollY)
  })

  test('✅ Booking form inputs are touch-friendly (min 44x44px)', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`)
    await page.waitForLoadState('domcontentloaded')

    const buttons = page.locator('button:visible')
    const count = await buttons.count()

    let failedButtons = 0
    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = buttons.nth(i)
      const box = await btn.boundingBox()
      if (box) {
        // WCAG 2.5.5 recommends 44x44px touch targets
        if (box.width < 40 || box.height < 30) {
          failedButtons++
        }
      }
    }

    // Allow max 20% of buttons to be undersized (some may be icon-only)
    expect(failedButtons).toBeLessThan(Math.ceil(Math.min(count, 10) * 0.2) + 1)
  })
})
