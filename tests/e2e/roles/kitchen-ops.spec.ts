import { test, expect } from '../fixtures'

test.describe('Kitchen Operations - KDS Workflow', () => {
  
  test.beforeEach(async ({ kitchenPage }) => {
    await kitchenPage.goto('/kitchen/dashboard')
  })

  test('KDS Dashboard & Stats', async ({ kitchenPage }) => {
    await expect(kitchenPage.locator('h1')).toContainText(/Culinary/i)
    
    // Check KPI cards
    await expect(kitchenPage.locator('text=Awaiting Confirmation')).toBeVisible()
    await expect(kitchenPage.locator('text=In Active Preparation')).toBeVisible()
  })

  test('Order Lifecycle Flow', async ({ kitchenPage }) => {
    // 1. Accept Order
    const pendingSection = kitchenPage.locator('div:has-text("Pending Receipt")')
    const acceptBtn = pendingSection.locator('button:has-text("Accept")').first()
    
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click()
      await expect(kitchenPage.locator('text=updated to confirmed')).toBeVisible()
    }
    
    // 2. Start Prep
    const confirmedSection = kitchenPage.locator('div:has-text("Confirmed Queue")')
    const startPrepBtn = confirmedSection.locator('button:has-text("Start Prep")').first()
    
    if (await startPrepBtn.isVisible()) {
      await startPrepBtn.click()
      await expect(kitchenPage.locator('text=updated to preparing')).toBeVisible()
    }
    
    // 3. Ready / Dish Up
    const preparingSection = kitchenPage.locator('div:has-text("Active Prep")')
    const readyBtn = preparingSection.locator('button:has-text("Ready")').first()
    
    if (await readyBtn.isVisible()) {
      await readyBtn.click()
      await expect(kitchenPage.locator('text=updated to ready')).toBeVisible()
    }
    
    // 4. Dispatch
    const readySection = kitchenPage.locator('div:has-text("Dispatch")')
    const dispatchBtn = readySection.locator('button:has-text("Dispatch")').first()
    
    if (await dispatchBtn.isVisible()) {
      await dispatchBtn.click()
      await expect(kitchenPage.locator('text=updated to delivered')).toBeVisible()
    }
  })

  test('Incident Escalation', async ({ kitchenPage }) => {
    const reportBtn = kitchenPage.locator('button:has-text("Report Incident")')
    await expect(reportBtn).toBeVisible()
    await reportBtn.click()
    
    await expect(kitchenPage.locator('text=Management notified')).toBeVisible()
  })

  test('Role Isolation - Unauthorized Access', async ({ kitchenPage }) => {
    // Kitchen should not access admin settings
    await kitchenPage.goto('/admin/settings')
    await expect(kitchenPage.url()).not.toContain('/admin/settings')
  })
})
