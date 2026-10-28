import { test, expect } from '@playwright/test';

test.describe('Stealth Industrial Cyber-Minimalism Design System Verification', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  test('Task 1 & 2: Verify Root Shell, Stealth Top Header, and Sidebar Anatomy', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 1. Root shell verification: check that root background contains stealth canvas
    const rootShell = page.locator('.min-h-screen.bg-\\[\\#090A0C\\]').first();
    await expect(rootShell).toBeVisible();

    // 2. Sidebar Brand Header & Violet Pill
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/bg-\[#090A0C\]/);
    await expect(sidebar.locator('text=ELITE').first()).toBeVisible();

    // 3. Top Header Bar Verification
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/bg-\[#090A0C\]/);

    // Omni-search input and ⌘K badge
    const searchInput = header.locator('input[placeholder*="Search reservations"]');
    await expect(searchInput).toBeVisible();
    await expect(header.locator('text=⌘K')).toBeVisible();

    // Live Cluster Pill
    const clusterPill = header.locator('text=Cluster Online');
    await expect(clusterPill).toBeVisible();

    // Primary action button
    const actionBtn = header.locator('text=New Reservation');
    await expect(actionBtn).toBeVisible();

    // 4. Sidebar Nav Items and Active State
    const activeItem = sidebar.locator('#active-sidebar-item');
    if (await activeItem.count() > 0) {
      await expect(activeItem.first()).toHaveClass(/bg-\[#181A1D\]/);
    }

    // 5. Sidebar User Profile Footer
    const profileFooter = sidebar.locator('text=admin@smarthotel.com').first();
    await expect(profileFooter).toBeVisible();
  });

  test('Task 3: Verify Admin Command Deck, KPI Cards, Telemetry Meter, and Table Anatomy', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 1. Verify Page Title
    await expect(page.locator('text=Admin Command Deck').first()).toBeVisible({ timeout: 30000 });

    // 2. Wait for KPI metrics to render
    await expect(page.locator('text=Total Revenue').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Total Bookings').first()).toBeVisible();
    await expect(page.locator('text=Occupancy Rate').first()).toBeVisible();
    await expect(page.locator('text=Service Score').first()).toBeVisible();

    const kpiCards = page.locator('.bg-\\[\\#121417\\].border-\\[\\#1E2227\\]');
    const count = await kpiCards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Check monospace numbers and growth badges
    const growthBadge = page.locator('text=+14.2% MoM').first();
    await expect(growthBadge).toBeVisible();
    await expect(growthBadge).toHaveClass(/font-mono/);
    await expect(growthBadge).toHaveClass(/text-emerald-400/);

    // 3. Verify Live Reservation Stream Table Anatomy
    await expect(page.locator('text=Live Reservation Stream').first()).toBeVisible();
    const tableHeader = page.locator('.bg-\\[\\#141619\\]').first();
    await expect(tableHeader).toBeVisible();

    // 4. Verify VIP Complaint Escalation Card
    await expect(page.locator('text=VIP Complaint Escalation').first()).toBeVisible();

    // 5. Verify Personnel & Direct Routing
    await expect(page.locator('text=Personnel Operations').first()).toBeVisible();
    await expect(page.locator('text=Staff Directory').first()).toBeVisible();
    await expect(page.locator('text=Quick Route Matrix').first()).toBeVisible();
  });

  test('Task 4: Verify Analytics Vector Visualization Engine & Command Palette Modal', async ({ page }) => {
    // 1. Verify Command Palette Modal Trigger
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Trigger Command Palette via search bar click
    await page.locator('input[placeholder*="Search reservations"]').first().click();
    const commandPalette = page.locator('input[placeholder*="Type search terms or command"]').first();
    await expect(commandPalette).toBeVisible();

    // Verify modal container stealth styling
    const modalSurface = page.locator('.bg-\\[\\#121417\\].border-\\[\\#2B3037\\]').first();
    await expect(modalSurface).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(commandPalette).not.toBeVisible();

    // 2. Navigate to SaaS Intelligence & Analytics page
    await page.goto('/admin/analytics', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Verify page title
    await expect(page.locator('text=SaaS Intelligence & Analytics').first()).toBeVisible({ timeout: 30000 });

    // Verify Area Chart SVG and linearGradient
    const areaPath = page.locator('path[fill="url(#areaGrad)"]').first();
    await expect(areaPath).toBeVisible();

    // Verify Donut Chart SVG and background circle track
    const donutTrack = page.locator('circle[stroke="#1C2025"]').first();
    await expect(donutTrack).toBeVisible();

    // Verify Event Ledger Table
    await expect(page.locator('text=Analytics Event Ledger').first()).toBeVisible();
  });
});
