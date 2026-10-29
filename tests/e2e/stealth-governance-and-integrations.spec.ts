import { test, expect } from '@playwright/test';

test.describe('Stealth Governance, Pricing & Distribution Modules Verification', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  test('Verify /admin/audit-logs Forensic Cryptographic Stream', async ({ page }) => {
    await page.goto('/admin/audit-logs', { waitUntil: 'domcontentloaded' });
    await page.locator('text=Loading Forensic Cryptographic Timeline...').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(500);

    // 1. Verify Page Title in AdminPageShell
    await expect(page.locator('h1:has-text("Forensic Audit Stream")')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Cryptographically indexed event trail')).toBeVisible();

    // 2. Verify Search & Scope
    const searchInput = page.locator('input[placeholder="Filter by actor, details..."]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveClass(/bg-\[#181A1D\]/);

    // 3. Verify Auditing Scope and Governance Shield Card
    await expect(page.locator('text=Auditing Scope')).toBeVisible();
    await expect(page.locator('text=Governance Shield Active')).toBeVisible();
  });

  test('Verify /admin/pricing Pricing & Yield Engine', async ({ page }) => {
    await page.goto('/admin/pricing', { waitUntil: 'domcontentloaded' });
    await page.locator('text=Loading Pricing Engine...').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(500);

    // 1. Verify Page Title
    await expect(page.locator('h1:has-text("Pricing & Yield Engine")')).toBeVisible({ timeout: 20000 });

    // 2. Verify Tab Switcher
    const ratePlansBtn = page.locator('button:has-text("Rate Plans")');
    const outlookBtn = page.locator('button:has-text("30-Day Outlook")');
    await expect(ratePlansBtn).toBeVisible();
    await expect(outlookBtn).toBeVisible();

    // 3. Switch to 30-Day Outlook Tab
    await outlookBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Showing projected Base Rates')).toBeVisible();

    // 4. Switch back to Rate Plans
    await ratePlansBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Yield Settings')).toBeVisible();
  });

  test('Verify /admin/integrations/channel-manager Core Hub', async ({ page }) => {
    await page.goto('/admin/integrations/channel-manager', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 1. Verify Page Title
    await expect(page.locator('h1:has-text("Channel Manager Core")')).toBeVisible({ timeout: 20000 });

    // 2. Verify Tabs
    const channelsTab = page.locator('button:has-text("Active Channels")');
    const mappingTab = page.locator('button:has-text("Room Type Mappings")');
    const logsTab = page.locator('button:has-text("Sync Events")');

    await expect(channelsTab).toBeVisible();
    await expect(mappingTab).toBeVisible();
    await expect(logsTab).toBeVisible();

    // 3. Switch to Mappings
    await mappingTab.click();
    await page.waitForTimeout(400);
    await expect(page.locator('h2:has-text("OTA Room Type Mappings")')).toBeVisible();

    // 4. Switch to Logs
    await logsTab.click();
    await page.waitForTimeout(400);
    await expect(page.locator('h2:has-text("Channel Synchronization Logs")')).toBeVisible();
  });

  test('Verify /admin/stay-services Studio', async ({ page }) => {
    await page.goto('/admin/stay-services', { waitUntil: 'domcontentloaded' });
    await page.locator('text=Loading Extra Services Studio...').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(500);

    // 1. Verify Page Title
    await expect(page.locator('h1:has-text("Stay Extra Services")')).toBeVisible({ timeout: 20000 });

    // 2. Verify KPI Cards
    await expect(page.locator('p:has-text("Total Extras")')).toBeVisible();
    await expect(page.locator('p:has-text("Active in Booking")')).toBeVisible();

    // 3. Verify Add Extra Service button
    const addBtn = page.locator('button:has-text("Add Extra Service")').first();
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toHaveClass(/bg-white/);
    await expect(addBtn).toHaveClass(/text-black/);
  });

  test('Verify /admin/platform-tools SRE Hub', async ({ page }) => {
    await page.goto('/admin/platform-tools', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // 1. Verify Page Title
    await expect(page.locator('h1:has-text("Platform Operations Hub")')).toBeVisible({ timeout: 20000 });

    // 2. Verify Concurrency Lock Inspector
    await expect(page.locator('text=Concurrency Lock Inspector')).toBeVisible();

    // 3. Verify Outbox Event Broker
    await expect(page.locator('text=Outbox Event Broker')).toBeVisible();

    // 4. Verify Self Healing Engine
    const healBtn = page.locator('button:has-text("EXECUTE SELF-HEALING")');
    await expect(healBtn).toBeVisible();
    await expect(healBtn).toHaveClass(/bg-white/);
    await expect(healBtn).toHaveClass(/text-black/);

    // 5. Test Click Self-Healing
    await healBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=SRE Auto-Healer: Diagnostic cycle completed')).toBeVisible();
  });

  test('Verify /admin/governance Compliance Center', async ({ page }) => {
    await page.goto('/admin/governance', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // 1. Verify Page Title
    await expect(page.locator('h1:has-text("Enterprise Governance Center")')).toBeVisible({ timeout: 20000 });

    // 2. Verify Certification Suites
    await expect(page.locator('h2:has-text("Compliance Certification Suites")')).toBeVisible();
    await expect(page.locator('text=System Operational Controls')).toBeVisible();

    // 3. Verify Production Deploy Gates
    await expect(page.locator('text=Production Deploy Gates')).toBeVisible();
    await expect(page.locator('button:has-text("PROCEED TO PRODUCTION ROLLOUT")')).toBeVisible();
  });
});
