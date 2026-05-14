import { test, expect } from '../fixtures'

test.describe('Finance & Audit Integrity', () => {

  test('Finance Manager should verify current day ledger balance', async ({ managerPage }) => {
    await managerPage.goto('/admin/organization')
    await expect(managerPage.locator('text=Financial Overview')).toBeVisible()
    
    const revenueValue = await managerPage.locator('[data-testid="total-revenue"]').textContent()
    expect(Number(revenueValue?.replace(/[^0-9.]/g, ''))).toBeGreaterThanOrEqual(0)
  })

  test('Auditor should access comprehensive audit logs', async ({ adminPage }) => {
    await adminPage.goto('/admin/audit-logs')
    await expect(adminPage.locator('h1:has-text("Audit")')).toBeVisible()
    
    // Verify log table has entries
    const rowCount = await adminPage.locator('table tbody tr').count()
    expect(rowCount).toBeGreaterThan(0)

    
    // Search for a specific action
    await adminPage.fill('input[placeholder*="Search"]', 'LOGIN')
    await expect(adminPage.locator('table tbody')).toContainText(/LOGIN/i)
  })

  test('Receptionist should generate invoice for checkout', async ({ receptionistPage }) => {
    await receptionistPage.goto('/admin/bookings')
    
    const checkoutBtn = receptionistPage.getByRole('button', { name: /Checkout/i }).first()
    if (await checkoutBtn.isVisible()) {
      await checkoutBtn.click()
      await expect(receptionistPage.locator('text=Invoice Generated')).toBeVisible()
      await expect(receptionistPage.getByRole('button', { name: /Download PDF/i })).toBeEnabled()
    }
  })
})
