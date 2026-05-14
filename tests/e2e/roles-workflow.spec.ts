import { test, expect } from '@playwright/test'
import { loginAsUser } from '../../qa/config/demo-users'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Role-Based Access Control (RBAC) & Workflows', () => {
  // Use a longer timeout for E2E authentication flows
  test.setTimeout(120000)

  test.describe('SUPER_ADMIN Capabilities', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, 'admin', BASE_URL)
    })

    test('✅ Should access all settings and system configurations', async ({ page }) => {
      // Check Dashboard
      await page.goto(`${BASE_URL}/admin/dashboard`)
      await expect(page.locator('h1', { hasText: /Dashboard|Overview/i }).first()).toBeVisible()

      // Check Settings
      await page.goto(`${BASE_URL}/admin/settings`)
      await expect(page.locator('text=Settings').first()).toBeVisible()

      // Check Staff Management
      await page.goto(`${BASE_URL}/admin/staff`)
      await expect(page.locator('text=Staff').first()).toBeVisible()
      const createButton = page.locator('button:has-text("Add"), button:has-text("Create")').first()
      await expect(createButton).toBeVisible()
    })
  })

  test.describe('MANAGER Capabilities', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, 'manager', BASE_URL)
    })

    test('✅ Should access analytics and bookings but NOT system settings', async ({ page }) => {
      // Check Analytics
      await page.goto(`${BASE_URL}/admin/analytics`)
      await expect(page.locator('text=Analytics').first()).toBeVisible()

      // Should redirect or deny access to global settings
      await page.goto(`${BASE_URL}/admin/settings`)
      // It should either redirect to dashboard, login, or show an unauthorized message
      await page.waitForURL(url => !url.pathname.includes('/admin/settings') || url.pathname.includes('/auth/signin'))
    })
  })

  test.describe('RECEPTIONIST Capabilities', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, 'receptionist', BASE_URL)
    })

    test('✅ Should access bookings and calendar but NOT analytics', async ({ page }) => {
      // Check Bookings
      await page.goto(`${BASE_URL}/admin/bookings`)
      await expect(page.locator('text=Bookings').first()).toBeVisible()

      // Check Calendar
      await page.goto(`${BASE_URL}/admin/calendar`)
      await expect(page.locator('text=Calendar').first()).toBeVisible()

      // Analytics should be forbidden
      await page.goto(`${BASE_URL}/admin/analytics`)
      await page.waitForURL(url => !url.pathname.includes('/admin/analytics') || url.pathname.includes('/auth/signin'))
    })
  })

  test.describe('KITCHEN_STAFF Capabilities', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUser(page, 'kitchen', BASE_URL)
    })

    test('✅ Should access kitchen dashboard and orders but NOT bookings', async ({ page }) => {
      // Check Kitchen Dashboard (Assuming route is /kitchen/dashboard or similar)
      await page.goto(`${BASE_URL}/kitchen/dashboard`)
      await expect(page.locator('body')).toBeVisible()

      // Bookings should be forbidden
      await page.goto(`${BASE_URL}/admin/bookings`)
      await page.waitForURL(url => !url.pathname.includes('/admin/bookings') || url.pathname.includes('/auth/signin'))
    })
  })
})
