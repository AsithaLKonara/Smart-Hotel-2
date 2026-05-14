import { test, expect } from '../fixtures'

test.describe('Housekeeping Operations - Cleaning Workflow', () => {
  
  test.beforeEach(async ({ housekeepingPage }) => {
    await housekeepingPage.goto('/admin/housekeeping')
  })

  test('Housekeeping Dashboard & Stats', async ({ housekeepingPage }) => {
    await expect(housekeepingPage.locator('h1')).toContainText(/Housekeeping/i)
    
    // Check KPI cards
    await expect(housekeepingPage.locator('text=Dirty Queue')).toBeVisible()
    await expect(housekeepingPage.locator('text=Active Sweeps')).toBeVisible()
    await expect(housekeepingPage.locator('text=Staff Available')).toBeVisible()
  })

  test('Cleaning Lifecycle Flow', async ({ housekeepingPage }) => {
    // 1. Start Cleaning from DIRTY
    const dirtyRoom = housekeepingPage.locator('div:has-text("DIRTY")').first()
    if (await dirtyRoom.isVisible()) {
      const startBtn = dirtyRoom.locator('button:has-text("Start Cleaning")')
      await startBtn.click()
      await expect(housekeepingPage.locator('text=Operational state synchronized')).toBeVisible()
    }
    
    // 2. Complete Cleaning -> Inspection Pending
    const cleaningRoom = housekeepingPage.locator('div:has-text("CLEANING")').first()
    if (await cleaningRoom.isVisible()) {
      const inspectBtn = cleaningRoom.locator('button:has-text("Request Inspection")')
      await inspectBtn.click()
      await expect(housekeepingPage.locator('text=Operational state synchronized')).toBeVisible()
    }
    
    // 3. Inspection Gate -> Release Room (AVAILABLE)
    const inspectionGate = housekeepingPage.locator('div:has-text("Inspector Gate")')
    const releaseBtn = inspectionGate.locator('button:has-text("Release Room")').first()
    
    if (await releaseBtn.isVisible()) {
      await releaseBtn.click()
      await expect(housekeepingPage.locator('text=Operational state synchronized')).toBeVisible()
    }
  })

  test('Staff Workload Monitoring', async ({ housekeepingPage }) => {
    await expect(housekeepingPage.locator('text=Staff Workload Heatmap')).toBeVisible()
    const bars = housekeepingPage.locator('.bg-emerald-500, .bg-rose-500')
    await expect(bars.first()).toBeVisible()
  })

  test('Role Isolation - Unauthorized Access', async ({ housekeepingPage }) => {
    // Housekeeping should not access Kitchen
    await housekeepingPage.goto('/kitchen/dashboard')
    await expect(housekeepingPage.url()).not.toContain('/kitchen/dashboard')
    
    // Housekeeping should not access Admin Settings
    await housekeepingPage.goto('/admin/settings')
    await expect(housekeepingPage.url()).not.toContain('/admin/settings')
  })
})
