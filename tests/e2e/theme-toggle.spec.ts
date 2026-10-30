import { test, expect } from '@playwright/test';

test.describe('SmartHotel-2: Theme Switching System (Dark / Light / System)', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  test('Admin Header: Theme toggle transitions between dark and light mode seamlessly', async ({ page }) => {
    // 1. Navigate to admin dashboard
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.locator('text=Loading Command Deck...').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});

    // 2. Locate theme toggle button in header
    const themeBtn = page.locator('#theme-toggle-btn');
    await expect(themeBtn).toBeVisible({ timeout: 15000 });

    // 3. Inspect initial theme on <html> tag
    const initialHtmlClass = await page.locator('html').getAttribute('class') || '';
    const initialIsDark = initialHtmlClass.includes('dark');

    // 4. Click toggle button to switch theme
    await themeBtn.click();
    await page.waitForTimeout(500);

    // 5. Assert the theme class toggled on <html>
    const toggledHtmlClass = await page.locator('html').getAttribute('class') || '';
    if (initialIsDark) {
      expect(toggledHtmlClass.includes('light') || !toggledHtmlClass.includes('dark')).toBeTruthy();
    } else {
      expect(toggledHtmlClass.includes('dark')).toBeTruthy();
    }

    // 6. Assert persistence in localStorage under smarthotel-theme
    const storedTheme = await page.evaluate(() => localStorage.getItem('smarthotel-theme'));
    expect(storedTheme).toBeTruthy();

    // 7. Click toggle button again to switch back
    await themeBtn.click();
    await page.waitForTimeout(500);

    const revertedHtmlClass = await page.locator('html').getAttribute('class') || '';
    if (initialIsDark) {
      expect(revertedHtmlClass.includes('dark')).toBeTruthy();
    } else {
      expect(revertedHtmlClass.includes('light') || !revertedHtmlClass.includes('dark')).toBeTruthy();
    }

    // 8. Reload page to verify persistence without hydration mismatch
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(themeBtn).toBeVisible({ timeout: 15000 });

    const postReloadHtmlClass = await page.locator('html').getAttribute('class') || '';
    if (initialIsDark) {
      expect(postReloadHtmlClass.includes('dark')).toBeTruthy();
    }
  });

  test('Public Landing Page: Respects persisted theme across route navigation', async ({ page }) => {
    // 1. Set explicit light theme in admin dashboard
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    const themeBtn = page.locator('#theme-toggle-btn');
    await expect(themeBtn).toBeVisible({ timeout: 15000 });

    const currentClass = await page.locator('html').getAttribute('class') || '';
    if (currentClass.includes('dark')) {
      await themeBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify localStorage has light theme
    const themeAfterSwitch = await page.evaluate(() => localStorage.getItem('smarthotel-theme'));
    expect(themeAfterSwitch).toBe('light');

    // 2. Navigate to public landing page
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verify html tag retains light mode
    const publicHtmlClass = await page.locator('html').getAttribute('class') || '';
    expect(publicHtmlClass.includes('light') || !publicHtmlClass.includes('dark')).toBeTruthy();

    // 3. Switch back to dark theme to maintain luxury stealth default
    await page.evaluate(() => {
      localStorage.setItem('smarthotel-theme', 'dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
  });

  test('Admin Dashboard: Cards, tables, and headings compute appropriate colors in light and dark modes', async ({ page }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.locator('text=Loading Command Deck...').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});

    const themeBtn = page.locator('#theme-toggle-btn');
    await expect(themeBtn).toBeVisible({ timeout: 15000 });

    // Ensure we start in light mode
    await page.evaluate(() => {
      localStorage.setItem('smarthotel-theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('text=Loading Command Deck...').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});

    // Verify Page Heading in Light Mode
    const pageHeading = page.locator('h1').first();
    await expect(pageHeading).toBeVisible();
    const headingColorLight = await pageHeading.evaluate((el) => window.getComputedStyle(el).color);
    // Heading color should be dark text (slate-900 / #0F172A), NOT white rgb(255, 255, 255)
    expect(headingColorLight).not.toBe('rgb(255, 255, 255)');

    // Verify KPI Card background in Light Mode
    const kpiRevenueCard = page.locator('.rounded-2xl.bg-card').first();
    await expect(kpiRevenueCard).toBeVisible();
    const kpiBgLight = await kpiRevenueCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // In light mode, background should be white/off-white (rgb(255, 255, 255)), not dark rgb(18, 20, 23)
    expect(kpiBgLight).not.toBe('rgb(18, 20, 23)');
    expect(kpiBgLight).not.toBe('rgba(0, 0, 0, 0)');

    // Verify Table Card background in Light Mode
    const liveStreamSection = page.locator('.rounded-2xl.bg-card').nth(4);
    await expect(liveStreamSection).toBeVisible();
    const liveStreamBgLight = await liveStreamSection.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(liveStreamBgLight).not.toBe('rgb(18, 20, 23)');
    expect(liveStreamBgLight).not.toBe('rgba(0, 0, 0, 0)');

    // Switch to Dark Mode
    await page.evaluate(() => {
      localStorage.setItem('smarthotel-theme', 'dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('text=Loading Command Deck...').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});

    // Verify Heading in Dark Mode
    const headingColorDark = await pageHeading.evaluate((el) => window.getComputedStyle(el).color);
    // In dark mode, heading should be white (or very light)
    expect(headingColorDark).toBe('rgb(255, 255, 255)');

    // Verify KPI Card background in Dark Mode
    const kpiBgDark = await kpiRevenueCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(kpiBgDark).toBe('rgb(18, 20, 23)');
  });
});
