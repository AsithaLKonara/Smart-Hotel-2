import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFileAdmin = path.join(__dirname, '../../playwright/.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  // Check if we already have a valid session (optional optimization)
  // For robustness in this mission, we'll force login to generate the state

  await page.goto('/auth/signin');
  await page.waitForLoadState('networkidle');

  // Fill email & password directly
  const emailInput = page.locator('input#email');
  const passwordInput = page.locator('input#password');
  await emailInput.fill('admin@smarthotel.com');
  await passwordInput.fill('SmartHotel@2025!Admin');
  await expect(emailInput).toHaveValue('admin@smarthotel.com');
  await expect(passwordInput).toHaveValue('SmartHotel@2025!Admin');

  // Submit the form
  const submitBtn = page.locator('button[type="submit"]').first();
  await expect(submitBtn).toBeVisible({ timeout: 10000 });
  await submitBtn.click();

  // Wait for navigation to the dashboard
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 30000 });

  // Ensure directory exists
  const authDir = path.dirname(authFileAdmin);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Save the authentication state
  await page.context().storageState({ path: authFileAdmin });
});
