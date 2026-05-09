import { test, expect } from '@playwright/test'
import { loginAsUser } from '../../config/demo-users'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('💼 Manager Contract - Access & Permission Bounds', () => {
  test('✔ Should have management access to key admin sections', async ({ page }) => {
    await loginAsUser(page, 'manager', BASE_URL)

    const managerRoutes = [
      '/admin/dashboard',
      '/admin/bookings',
      '/admin/rooms',
      '/admin/menu',
      '/admin/inventory',
      '/admin/gallery',
    ]

    for (const route of managerRoutes) {
      // Use realistic client-side sidebar navigation to avoid cold-load session lookup stress
      const sidebarLink = page.locator(`aside a[href="${route}"], nav a[href="${route}"]`).first()
      await expect(sidebarLink).toBeVisible({ timeout: 15000 })
      await sidebarLink.click()
      
      // Wait for loaders to disappear dynamically
      await expect(page.locator('.animate-spin, svg.animate-spin')).not.toBeVisible({ timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(500)
      
      expect(page.url()).toContain(route)
      
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).not.toContain('Unauthorized')
      expect(bodyText).not.toContain('Access Denied')
    }
  })
})
