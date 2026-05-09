import { test, expect } from '@playwright/test'
import { loginAsUser } from '../../config/demo-users'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('🍳 Kitchen Staff Contract - Queue & Restrictive Bounds', () => {
  test('✔ Should allow access to kitchen queue dashboard', async ({ page }) => {
    await loginAsUser(page, 'kitchen', BASE_URL)
    await page.goto(`${BASE_URL}/kitchen/dashboard`)
    
    // Wait for loaders to disappear dynamically
    await expect(page.locator('.animate-spin, svg.animate-spin')).not.toBeVisible({ timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(500)

    expect(page.url()).toContain('/kitchen/dashboard')
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('Unauthorized')
    expect(bodyText).not.toContain('Access Denied')
  })

  test('❌ Should strictly forbid access to core admin and billing panels', async ({ page }) => {
    await loginAsUser(page, 'kitchen', BASE_URL)

    const kitchenForbidden = [
      '/admin/rooms',
      '/admin/bookings',
      '/admin/analytics'
    ]

    for (const route of kitchenForbidden) {
      await page.goto(`${BASE_URL}${route}`)
      
      // Dynamically wait up to 15 seconds for redirection or block indicator
      await page.waitForFunction((baseUrl) => {
        const bodyText = document.body.textContent || ''
        const currentUrl = window.location.href
        return currentUrl.includes('/auth/signin') || 
               bodyText.includes('Unauthorized') || 
               bodyText.includes('Access Denied') || 
               currentUrl === baseUrl + '/' ||
               currentUrl.includes('error=AccessDenied') ||
               !currentUrl.includes(window.location.pathname)
      }, BASE_URL, { timeout: 15000 }).catch(() => {})
      
      const bodyText = await page.locator('body').textContent() || ''
      const currentUrl = page.url()
      
      const blocked = currentUrl.includes('/auth/signin') || 
                      bodyText.includes('Unauthorized') || 
                      bodyText.includes('Access Denied') || 
                      currentUrl === `${BASE_URL}/` ||
                      currentUrl.includes('error=AccessDenied') ||
                      !currentUrl.includes(route)
                      
      expect(blocked).toBeTruthy()
    }
  })
})
