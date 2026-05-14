import { test, expect } from './fixtures'

test.describe('Finance & Audit E2E', () => {

  test('Manager can access Executive Intelligence and view metrics', async ({ managerPage }) => {
    await managerPage.goto('/admin/executive-intelligence')
    await expect(managerPage.locator('text=Executive Intelligence')).toBeVisible()
    
    // Check for financial widgets
    await expect(managerPage.locator('text=Revenue, text=Occupancy, text=ADR')).toBeVisible()
  })

  test('Admin can view Audit Logs and filter by action', async ({ adminPage }) => {
    await adminPage.goto('/admin/audit-logs')
    await expect(adminPage.locator('table')).toBeVisible()
    
    // Try to filter (if filter exists)
    const filterInput = adminPage.locator('input[placeholder*="Search"], input[placeholder*="Filter"]').first()
    if (await filterInput.isVisible()) {
      await filterInput.fill('LOGIN')
      await adminPage.waitForTimeout(1000)
      await expect(adminPage.locator('table')).toContainText('LOGIN')
    }
  })

  test('Governance page shows compliance status', async ({ adminPage }) => {
    await adminPage.goto('/admin/governance')
    await expect(adminPage.locator('text=Governance, text=Compliance')).toBeVisible()
    await expect(adminPage.locator('text=PCI, text=SOC2')).toBeVisible()
  })

  test('Manager can view revenue dashboard', async ({ managerPage }) => {
    await managerPage.goto('/dashboard/revenue')
    await expect(managerPage.locator('canvas, .recharts-surface')).toBeVisible({ timeout: 15000 })
    await expect(managerPage.locator('text=Net Revenue, text=Projected')).toBeVisible()
  })
})
