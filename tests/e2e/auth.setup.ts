import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFileAdmin = path.join(__dirname, '../../playwright/.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  // Check if we already have a valid session (optional optimization)
  // For robustness in this mission, we'll force login to generate the state

  await page.goto('/auth/signin');
  
  // Fill the credentials
  const emailInput = page.getByPlaceholder(/smarthotel\.com/i).or(page.getByRole('textbox', { name: /Operator Identity/i }));
  await emailInput.fill('admin@smarthotel.com');
  await page.locator('input[type="password"]').fill('SmartHotel@2025!Admin');
  
  // Submit the form
  await page.getByRole('button', { name: /initialize session/i }).click();

  // Wait for navigation to the dashboard and ensure the URL is correct
  await expect(page).toHaveURL(/.*\/admin\//, { timeout: 60000 });

  // Ensure directory exists
  const authDir = path.dirname(authFileAdmin);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Save the authentication state
  await page.context().storageState({ path: authFileAdmin });
});
