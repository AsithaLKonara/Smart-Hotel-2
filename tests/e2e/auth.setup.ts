import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFileAdmin = path.join(__dirname, '../../playwright/.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  // Check if we already have a valid session (optional optimization)
  // For robustness in this mission, we'll force login to generate the state

  await page.goto('/auth/signin');
  
  // Fill the credentials
  await page.getByPlaceholder('name@example.com').fill('admin@smarthotel.local');
  await page.getByPlaceholder('••••••••').fill('admin123');
  
  // Submit the form
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for navigation to the dashboard and ensure the URL is correct
  await page.waitForURL('/admin/dashboard');

  // Assert successful login by checking for a known element on the dashboard
  await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

  // Ensure directory exists
  const authDir = path.dirname(authFileAdmin);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Save the authentication state
  await page.context().storageState({ path: authFileAdmin });
});
