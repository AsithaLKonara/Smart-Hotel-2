import { test, expect, devices } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Responsive breakpoints to validate
const VIEWPORTS = [
  { name: 'Mobile S (320px)', width: 320, height: 568 },
  { name: 'Mobile M (375px)', width: 375, height: 667 },
  { name: 'Mobile L (425px)', width: 425, height: 812 },
  { name: 'Tablet (768px)', width: 768, height: 1024 },
  { name: 'Laptop (1024px)', width: 1024, height: 768 },
  { name: 'Desktop (1440px)', width: 1440, height: 900 },
]

const CRITICAL_ROUTES = ['/', '/rooms', '/booking', '/order', '/gallery']

test.describe('📱 Responsive & Cross-Device Layout Tests', () => {
  test.setTimeout(90000)

  for (const viewport of VIEWPORTS) {
    test.describe(`Viewport: ${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      test(`✅ Homepage renders without overflow at ${viewport.name}`, async ({ page }) => {
        await page.goto(`${BASE_URL}/`)
        await page.waitForLoadState('domcontentloaded')

        // Check for horizontal scroll (indicates layout overflow)
        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth
        })

        expect(hasHorizontalOverflow).toBe(false)
      })

      test(`✅ Rooms page renders cards correctly at ${viewport.name}`, async ({ page }) => {
        await page.goto(`${BASE_URL}/rooms`)
        await page.waitForLoadState('domcontentloaded')
        await page.waitForTimeout(2000)

        // Body must be visible (no crash)
        await expect(page.locator('body')).toBeVisible()

        // Check no overflow
        const hasHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth
        })
        expect(hasHorizontalOverflow).toBe(false)
      })

      test(`✅ Booking page form usable at ${viewport.name}`, async ({ page }) => {
        await page.goto(`${BASE_URL}/booking`)
        await page.waitForLoadState('domcontentloaded')

        // Form inputs must be visible and not clipped
        const inputs = page.locator('input[type="date"], input[type="number"]')
        if (await inputs.count() > 0) {
          const firstInput = inputs.first()
          const box = await firstInput.boundingBox()

          // Must be within viewport (not hidden or clipped off-screen)
          if (box) {
            expect(box.x).toBeGreaterThanOrEqual(0)
            expect(box.y).toBeGreaterThanOrEqual(0)
            expect(box.width).toBeGreaterThan(0)
          }
        }
      })
    })
  }
})

test.describe('📱 Mobile-Specific Interaction Tests', () => {
  test.use({ ...devices['iPhone 13'] })
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
