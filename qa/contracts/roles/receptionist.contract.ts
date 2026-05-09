import { test, expect } from '@playwright/test'
import { loginAsUser } from '../../config/demo-users'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('🛎️ Receptionist Contract - Permission Guardrails', () => {
  test('✔ Should allow access to front-desk pages', async ({ page }) => {
    await loginAsUser(page, 'receptionist', BASE_URL)

    const receptionistAllowed = [
      '/admin/bookings',
      '/admin/calendar',
      '/admin/dashboard/checkin-checkout',
      '/admin/tasks',
      '/admin/qr-codes'
    ]

    for (const route of receptionistAllowed) {
      // Use client-side sidebar navigation if the link exists; fallback to page.goto for routes not present in the sidebar (e.g. calendar)
      const sidebarLink = page.locator(`aside a[href="${route}"], nav a[href="${route}"]`).first()
      if (await sidebarLink.isVisible().catch(() => false)) {
        await sidebarLink.click()
      } else {
        await page.goto(`${BASE_URL}${route}`)
      }
      
      // Wait for loaders to disappear dynamically
      await expect(page.locator('.animate-spin, svg.animate-spin')).not.toBeVisible({ timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(500)
      
      // Self-healing fallback: if redirected to signin on cold load, re-authenticate and reload
      if (page.url().includes('/auth/signin')) {
        console.warn(`[Self-Healing Fallback] Redirected to signin on route: ${route}. Retrying authentication...`)
        await loginAsUser(page, 'receptionist', BASE_URL)
        await page.goto(`${BASE_URL}${route}`)
        await expect(page.locator('.animate-spin, svg.animate-spin')).not.toBeVisible({ timeout: 15000 }).catch(() => {})
        await page.waitForTimeout(500)
      }
      
      expect(page.url()).toContain(route)
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).not.toContain('Unauthorized')
      expect(bodyText).not.toContain('Access Denied')
    }
  })

  test('❌ Should strictly forbid access to unauthorized manager/admin dashboards', async ({ page }) => {
    await loginAsUser(page, 'receptionist', BASE_URL)

    const receptionistForbidden = [
      '/admin/staff',
      '/admin/analytics'
    ]

    for (const route of receptionistForbidden) {
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
      
      // Check if redirected to signin, home, or error page, or shows Access Denied / Unauthorized text
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
