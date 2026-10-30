import { test, expect } from '@playwright/test';

test.describe('Pillar 6: HR & Workforce E2E Suite', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  // 6.1 Staff Directory & Roles
  test('6.1 Staff Roster (/admin/staff) - Team Directory, RBAC Roles & Add Member Modal', async ({ page }) => {
    await page.goto('/admin/staff');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Team Directory & Governance")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Create staff accounts, configure operational roles')).toBeVisible();

    // Verify Tab Switchers
    const dirTab = page.locator('button:has-text("DIRECTORY")').first();
    const permTab = page.locator('button:has-text("PERMISSIONS")').first();
    await expect(dirTab).toBeVisible();
    await expect(permTab).toBeVisible();

    // Action button & modal trigger
    const addMemberBtn = page.locator('button:has-text("Add Team Member")').first();
    await expect(addMemberBtn).toBeVisible();
    await addMemberBtn.click();
    await page.waitForTimeout(300);

    // Verify Modal
    await expect(page.locator('text=Add New Staff Member').or(page.locator('input[placeholder*="Name"]')).or(page.locator('input[type="email"]'))).toBeVisible();

    // Close Modal
    const closeBtn = page.locator('button:has-text("Cancel")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  // 6.2 Payroll Ledger
  test('6.2 Payroll Ledger (/admin/hr/payroll) - Global Run & Itemized Payslips', async ({ page }) => {
    await page.goto('/admin/hr/payroll');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Payroll Center")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Process global salaries and itemized payslips')).toBeVisible();

    // Action button & form toggle
    const executeBtn = page.locator('button:has-text("Execute Global Run")').first();
    await expect(executeBtn).toBeVisible();
    await executeBtn.click();
    await page.waitForTimeout(300);

    // Verify Form
    await expect(page.locator('text=Execute Global Payroll Run')).toBeVisible();
    await expect(page.locator('input[type="date"]').first()).toBeVisible();

    // Close form
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    }
  });

  // 6.3 Shift Scheduling
  test('6.3 Shift Scheduling (/admin/hr/shifts) - Shift Roster & Attendance Clock-in', async ({ page }) => {
    await page.goto('/admin/hr/shifts');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Shift Roster")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Schedule staff across departments and manage attendance.')).toBeVisible();

    // Action buttons
    await expect(page.locator('button:has-text("Manual Clock-In")')).toBeVisible();
    await expect(page.locator('button:has-text("Assign Shift")')).toBeVisible();
  });

  // 6.4 Leave Approvals
  test('6.4 Leave Approvals (/admin/hr/leaves) - Leave Management & Requests', async ({ page }) => {
    await page.goto('/admin/hr/leaves');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Leave Management")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Track and approve vacations, sick days, and time off requests.')).toBeVisible();

    // Action button
    const newLeaveBtn = page.locator('button:has-text("New Leave Request")').first();
    await expect(newLeaveBtn).toBeVisible();
    await newLeaveBtn.click();
    await page.waitForTimeout(300);

    // Verify Modal
    await expect(page.getByRole('heading', { name: 'New Leave Request' })).toBeVisible();

    // Close Modal
    const closeBtn = page.locator('button:has([class*="lucide-x"])').or(page.locator('button:has-text("Cancel")')).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });
});
