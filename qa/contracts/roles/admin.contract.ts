import { test, expect } from '@playwright/test'
import { loginAsUser, verifyDemoUsersSeeded } from '../../config/demo-users'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('👑 Admin Contract - Access & Permission Bounds', () => {
  test.beforeAll(async () => {
    // Proactive Pre-Flight demo governance check
    await verifyDemoUsersSeeded()
  })

  test('✔ Should have full access to all admin dashboard sections', async ({ page }) => {
    await loginAsUser(page, 'admin', BASE_URL)

    const adminRoutes = [
      '/admin/dashboard',
      '/admin/bookings',
      '/admin/staff',
      '/admin/rooms',
      '/admin/menu',
      '/admin/orders',
      '/admin/inventory',
      '/admin/gallery',
      '/admin/analytics'
    ]

    for (const route of adminRoutes) {
      // Use realistic client-side sidebar navigation to avoid cold-load session lookup stress
      const sidebarLink = page.locator(`aside a[href="${route}"], nav a[href="${route}"]`).first()
      await expect(sidebarLink).toBeVisible({ timeout: 15000 })
      await sidebarLink.click()
      
      // Wait for page loaders to disappear dynamically
      await expect(page.locator('.animate-spin, svg.animate-spin')).not.toBeVisible({ timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(500) // Small stabilization buffer
      
      // Assert no unauthorized redirects occurred
      expect(page.url()).toContain(route)
      
      // Assert no error page text is visible
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).not.toContain('Unauthorized')
      expect(bodyText).not.toContain('Access Denied')
    }
  })

  test('✔ Should allow mutations in gallery (open Add Image modal)', async ({ page }) => {
    await loginAsUser(page, 'admin', BASE_URL)
    
    // Use client-side navigation to reach the gallery to avoid transient cold-load session loss
    const galleryLink = page.locator('aside a[href="/admin/gallery"], nav a[href="/admin/gallery"]').first()
    await expect(galleryLink).toBeVisible({ timeout: 15000 })
    await galleryLink.click()
    
    // Wait for loaders to disappear dynamically
    await expect(page.locator('.animate-spin, svg.animate-spin')).not.toBeVisible({ timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(500)
    
    const addImageButton = page.locator('button:has-text("Add Image")').first()
    await expect(addImageButton).toBeVisible({ timeout: 15000 })
    
    // Perform open-modal mutation
    await addImageButton.click()
    await page.waitForTimeout(500)

    // Verify modal elements are visible
    const fileInput = page.locator('input[type="file"]').first()
    const isFileVisible = await fileInput.isVisible().catch(() => false)
    const textInput = page.locator('input[type="url"]').first()
    const isUrlVisible = await textInput.isVisible().catch(() => false)
    
    expect(isFileVisible || isUrlVisible).toBeTruthy()
  })
})
