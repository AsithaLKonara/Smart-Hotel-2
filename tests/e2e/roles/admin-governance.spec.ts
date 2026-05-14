import { test, expect } from '../fixtures'

test.describe('Admin Governance - System Cockpit', () => {
  
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/admin/dashboard')
  })

  test('Admin Dashboard & High-Level KPIs', async ({ adminPage }) => {
    await expect(adminPage.locator('h1')).toContainText(/Admin Cockpit/i)
    
    // Check Global KPIs
    await expect(adminPage.locator('text=Bookings Velocity')).toBeVisible()
    await expect(adminPage.locator('text=Yield Revenue')).toBeVisible()
    await expect(adminPage.locator('text=SLA Performance')).toBeVisible()
  })

  test('PMS Booking Calendar Access', async ({ adminPage }) => {
    await adminPage.locator('button:has-text("PMS Booking Calendar")').click()
    await expect(adminPage.locator('.rbc-calendar')).toBeVisible()
  })

  test('Command Deck - Operational Redirection', async ({ adminPage }) => {
    await expect(adminPage.locator('h2')).toContainText(/Command Deck/i)
    
    // Test redirection to Kitchen from Admin
    const kitchenCard = adminPage.locator('div:has-text("Kitchen Display")').first()
    await kitchenCard.click()
    await expect(adminPage).toHaveURL(/\/kitchen\/dashboard/)
    
    // Go back and test Receptionist
    await adminPage.goto('/admin/dashboard')
    const receptionCard = adminPage.locator('div:has-text("Receptionist Center")').first()
    await receptionCard.click()
    await expect(adminPage).toHaveURL(/\/admin\/receptionist/)
  })

  test('System Governance - Settings & Audit Logs', async ({ adminPage }) => {
    // Audit logs access
    await adminPage.goto('/admin/audit-logs')
    await expect(adminPage.locator('h1:has-text("Audit"), text=Audit')).toBeVisible()
    
    // Settings access
    await adminPage.goto('/admin/settings')
    await expect(adminPage.locator('h1:has-text("Settings"), text=Settings')).toBeVisible()
  })

  test('Role Isolation - Total Visibility', async ({ adminPage }) => {
    // Admin should see everything
    await adminPage.goto('/admin/manager')
    await expect(adminPage).toHaveURL(/\/admin\/manager/)
    
    await adminPage.goto('/admin/housekeeping')
    await expect(adminPage).toHaveURL(/\/admin\/housekeeping/)
  })
})
