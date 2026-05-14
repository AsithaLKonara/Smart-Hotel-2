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



