import { test, expect } from '@playwright/test';

test.describe('Pillar 7: Management & Governance E2E Suite', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  // 7.1 Website CMS Studio
  test('7.1 Website CMS (/admin/cms) - Studio Tabs & Multi-Property Content', async ({ page }) => {
    await page.goto('/admin/cms', { waitUntil: 'domcontentloaded' });

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Content Management Studio")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Orchestrate multi-property imagery, map pinpoints')).toBeVisible();

    // Verify Studio Tabs
    const propTab = page.locator('button:has-text("Properties & Map Pins")').first();
    const galleryTab = page.locator('button:has-text("Gallery Hub")').first();
    const expTab = page.locator('button:has-text("Signature Experiences")').first();
    const facTab = page.locator('button:has-text("Facilities & Amenities")').first();

    await expect(propTab).toBeVisible();
    await expect(galleryTab).toBeVisible();
    await expect(expTab).toBeVisible();
    await expect(facTab).toBeVisible();

    // Action button
    await expect(page.locator('text=Preview Site')).toBeVisible();

    // Switch Tab to Gallery Hub
    await galleryTab.click();
    await page.waitForTimeout(300);
  });

  // 7.2 SRE Health Cockpit
  test('7.2 SRE Health Cockpit (/admin/sre) - SRE Command Center & Transactional Parity', async ({ page }) => {
    await page.goto('/admin/sre', { waitUntil: 'domcontentloaded' });
    await page.locator('text=Booting Operational Intelligence...').waitFor({ state: 'detached', timeout: 35000 }).catch(() => {});

    // Title & Subtitle
    await expect(page.locator('h1:has-text("SRE Command Center")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Operational Intelligence & Resilience Cockpit')).toBeVisible();

    // Verify Telemetry KPIs
    await expect(page.locator('text=Redis Latency').first()).toBeVisible();
    await expect(page.locator('text=OTA Parity').first()).toBeVisible();
    await expect(page.locator('text=Outbox Depth').first()).toBeVisible();
    await expect(page.locator('text=Active Locks').first()).toBeVisible();
  });

  // 7.3 Governance & Audits
  test('7.3 Governance & Audits (/admin/governance) - Certification Suites & Compliance Ledgers', async ({ page }) => {
    await page.goto('/admin/governance', { waitUntil: 'domcontentloaded' });

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Enterprise Governance Center")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Publish signed SOC2 / PCI evidence dossiers')).toBeVisible();

    // Governance badge & section header
    await expect(page.locator('text=Governance Active')).toBeVisible();
    await expect(page.locator('text=Compliance Certification Suites')).toBeVisible();
  });

  // 7.4 Forensic Audit Stream
  test('7.4 Audit Stream (/admin/audit-logs) - Forensic Cryptographic Event Trail', async ({ page }) => {
    await page.goto('/admin/audit-logs', { waitUntil: 'domcontentloaded' });
    await page.locator('text=Loading Forensic Cryptographic Timeline...').waitFor({ state: 'detached', timeout: 35000 }).catch(() => {});

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Forensic Audit Stream")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Cryptographically indexed event trail')).toBeVisible();

    // Action buttons
    await expect(page.locator('button:has-text("Force Refresh")')).toBeVisible();

    // Search filter
    await expect(page.locator('input[placeholder*="Search"]').first()).toBeVisible();
  });

  // 7.5 System Settings
  test('7.5 System Settings (/admin/settings) - Global Property Brand Configuration', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' });
    await page.locator('text=Accessing settings...').waitFor({ state: 'detached', timeout: 35000 }).catch(() => {});

    // Title & Subtitle
    await expect(page.locator('h1:has-text("System Governance & Settings")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Global property configuration, hospitality protocols')).toBeVisible();

    // Form Sections
    await expect(page.locator('text=Brand Identity').first()).toBeVisible();
    await expect(page.locator('label:has-text("Property Name")').first()).toBeVisible();
    await expect(page.locator('label:has-text("Signature Tagline")').first()).toBeVisible();
  });
});
