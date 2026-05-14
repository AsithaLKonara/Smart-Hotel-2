import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/e2e-utils'
import { prisma } from '@/lib/db'
import { AnalyticsEngine } from '@/lib/analytics'

test.describe('Security & Intelligence: RBAC and Dashboards', () => {

  /**
   * RBAC: Unauthorized Access Protection
   */
  test('should deny GUEST access to executive dashboard', async ({ page }) => {
    await loginAs(page, 'GUEST')
    
    // Attempt to bypass UI and go direct to admin
    await page.goto('/admin/executive')
    
    // Should redirect to login or show 401/403
    await expect(page).not.toHaveURL(/.*admin\/executive.*/)
    await expect(page.locator('text=Unauthorized|Login|Permission')).toBeVisible()
  })

  /**
   * Data Accuracy: Dashboard KPIs vs Database
   */
  test('should display accurate Executive KPIs matching DB state', async ({ page }) => {
    await loginAs(page, 'SUPER_ADMIN')
    await page.goto('/admin/executive')

    // 1. Get Live Aggregations from DB
    const dbStats = await AnalyticsEngine.getExecutiveStats()

    // 2. Capture UI Values
    const uiOccupancy = await page.locator('h3:has-text("%")').first().innerText()
    const uiRevenue = await page.locator('h3:has-text("LKR")').first().innerText()
    
    // 3. ASSERT: UI matches DB (approximate for rounding)
    const parsedOccupancy = parseFloat(uiOccupancy.replace('%', ''))
    expect(parsedOccupancy).toBeCloseTo(dbStats.occupancy, 0)
    
    const parsedRevenue = parseFloat(uiRevenue.replace(/[^0-9.]/g, ''))
    expect(parsedRevenue).toBeCloseTo(dbStats.totalRevenue, 0)

    // 4. Verify Chart Presence (Recharts renders SVG)
    await expect(page.locator('.recharts-surface')).toBeVisible()
  })

  /**
   * Role-Based Component Visibility
   */
  test('should show correct navigation for RECEPTIONIST', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST')
    
    // Receptionist should see Booking management but NOT Financial reports
    await expect(page.locator('text=Bookings')).toBeVisible()
    await expect(page.locator('text=Executive Dashboard|Financial Reports')).not.toBeVisible()
  })
})
