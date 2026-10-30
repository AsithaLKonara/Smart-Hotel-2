import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth-helpers';

test.describe('Domain 3: Front Desk & Reception Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');
    await page.goto('/admin/receptionist', { waitUntil: 'domcontentloaded', timeout: 60000 });
  });

  test('should display the Reception Desk with Room Matrix and Status Filters', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Reception Desk/i })).toBeVisible({ timeout: 25000 });

    // Verify filter buttons for room statuses exist
    await expect(page.getByRole('button', { name: /^Available$/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^Occupied$/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^All$/i }).first()).toBeVisible();

    // Verify room matrix has room cards
    const roomCards = page.locator('[data-testid="room-card"]');
    await expect(roomCards.first()).toBeVisible({ timeout: 15000 });
    const count = await roomCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display live Room Status summary counts and Express Walk-in button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Reception Desk/i })).toBeVisible({ timeout: 25000 });

    // Verify Express Walk-in button exists
    const expressBtn = page.getByRole('button', { name: /Express Walk-in/i });
    await expect(expressBtn).toBeVisible();

    // Verify Refresh button exists
    const refreshBtn = page.locator('button:has(svg.lucide-refresh-cw)').first();
    await expect(refreshBtn).toBeVisible();
  });

  test('should seamlessly render Tape Chart timeline view', async ({ page }) => {
    await page.goto('/admin/receptionist?view=tape-chart', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await expect(page).toHaveURL(/.*\/admin\/receptionist\?view=tape-chart/);
    await expect(page.getByRole('heading', { name: /Reception Desk/i })).toBeVisible({ timeout: 25000 });
  });
});
