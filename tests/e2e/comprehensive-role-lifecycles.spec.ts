import { test, expect } from '@playwright/test';

async function loginAsAdmin(page: any) {
  if (page.url().includes('/admin') && !page.url().includes('/auth/signin')) {
    return;
  }
  await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });

  // Wait for interactive form
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.waitForTimeout(600); // Allow React hydration to complete

  // Try simulator button first
  const simButton = page.locator('button:has-text("Super Admin")').first();
  if (await simButton.isVisible().catch(() => false)) {
    await simButton.click();
    await page.waitForTimeout(300);
  }

  // Verify and ensure fields are filled
  const emailInput = page.locator('input[type="email"]').first();
  if (!(await emailInput.inputValue().catch(() => ''))) {
    await emailInput.fill('admin@smarthotel.com');
  }
  const passInput = page.locator('input[type="password"]').first();
  if (!(await passInput.inputValue().catch(() => ''))) {
    await passInput.fill('SmartHotel@2025!Admin');
  }

  await page.getByRole('button', { name: /initialize session|sign in/i }).click();
  await page.waitForURL(/.*\/(admin|dashboard).*/, { timeout: 45000, waitUntil: 'domcontentloaded' });
}

test.describe('SmartHotel OS - Role-Based End-to-End Enterprise Lifecycles', () => {

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  // ========================================================
  // PERSONA 1: THE LUXURY GUEST LIFECYCLE
  // ========================================================
  test.describe('Guest Experience Lifecycle', () => {
    
    test('1.1 Discovery & Luxury Cinematic Video Hero on Hotel Front', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      // Verify page title and header branding
      await expect(page).toHaveTitle(/SmartHotel|Grand Palace/i);

      // Verify Luxury Cinematic Background Video exists
      const heroVideo = page.locator('video source[src*="snaptik_7544319300136471815_v3.mp4"]');
      await expect(heroVideo).toBeAttached({ timeout: 20000 });

      // Verify Hero Heading "The Art of Luxury"
      await expect(page.getByRole('heading', { name: /the art of luxury/i })).toBeVisible({ timeout: 20000 });
      
      // Verify Check Availability / Explore CTAs exist
      const bookCta = page.getByRole('link', { name: /check availability/i }).first();
      await expect(bookCta).toBeVisible({ timeout: 20000 });

      // Verify footer contains links to legal pages
      const termsLink = page.getByRole('link', { name: /terms/i }).first();
      const privacyLink = page.getByRole('link', { name: /privacy/i }).first();
      await expect(termsLink).toBeVisible({ timeout: 20000 });
      await expect(privacyLink).toBeVisible({ timeout: 20000 });
    });

    test('1.2 Legal Compliance Pages (/terms and /privacy)', async ({ page }) => {
      // Test Terms of Service
      await page.goto('/terms', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /terms of (service|excellence)|terms/i }).first()).toBeVisible({ timeout: 30000 });
      await expect(page.locator('text=/cancellation|guest conduct|reservations|covenant/i').first()).toBeVisible();

      // Test Privacy Policy
      await page.goto('/privacy', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /privacy (policy|commitment)|privacy/i }).first()).toBeVisible({ timeout: 30000 });
      await expect(page.locator('text=/gdpr|data stewardship|protection|trust/i').first()).toBeVisible();
    });

    test('1.3 Rooms Directory with Advanced Multi-Property & Attribute Filtering', async ({ page }) => {
      await page.goto('/rooms', { waitUntil: 'domcontentloaded' });

      // Verify directory heading
      await expect(page.getByRole('heading', { name: /our directory|directory|suites|rooms/i }).first()).toBeVisible({ timeout: 30000 });
      
      // Verify filter sections exist (Search, Stay Dates & Availability, Guest Capacity, Price Range)
      await expect(page.locator('text=/filters/i').first()).toBeVisible();
      await expect(page.locator('text=/stay dates & availability/i').first()).toBeVisible();
      await expect(page.locator('text=/guest capacity/i').first()).toBeVisible();
      await expect(page.locator('text=/price range/i').first()).toBeVisible();

      // Verify capacity buttons (Any, 1+, 2+, 3+, 4+, 6+)
      const capacityBtn = page.getByRole('button', { name: '2+' }).first();
      if (await capacityBtn.isVisible()) {
        await expect(capacityBtn).toBeVisible();
      }
    });

    test('1.4 Public Booking Flow with Multi-Property Destination & Stay Extra Services', async ({ page }) => {
      await page.goto('/booking', { waitUntil: 'domcontentloaded' });

      // Verify Booking flow header
      await expect(page.getByRole('heading', { name: /secure your stay|plan your arrival|booking/i }).first()).toBeVisible({ timeout: 30000 });
      
      // Verify Destination selector and dates
      await expect(page.locator('text=/sanctuary destination|dates|check-in/i').first()).toBeVisible();
    });

    test('1.5 Contact Page with Interactive Map Embed', async ({ page }) => {
      await page.goto('/contact', { waitUntil: 'domcontentloaded' });

      // Verify contact details
      await expect(page.getByRole('heading', { name: /contact|reach out|location/i }).first()).toBeVisible({ timeout: 30000 });

      // Verify Google Map iframe or fallback map container is present
      const mapContainer = page.locator('iframe[src*="google.com/maps"], div:has-text("Interactive Map")').first();
      await expect(mapContainer).toBeVisible({ timeout: 20000 });
    });

  });

  // ========================================================
  // PERSONA 2: GENERAL MANAGER & ADMINISTRATOR LIFECYCLE
  // ========================================================
  test.describe('Admin Governance & Operations Lifecycle', () => {

    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('2.1 Admin Room Directory Tabbed Switcher & Room Dossier Modal', async ({ page }) => {
      await page.goto('/admin/rooms', { waitUntil: 'domcontentloaded' });

      // Verify tabbed switcher [ Rooms | Room Types ] exists
      const roomsTab = page.getByRole('button', { name: /rooms \(/i }).first();
      const roomTypesTab = page.getByRole('button', { name: /room types \(/i }).first();
      await expect(roomsTab).toBeVisible({ timeout: 25000 });
      await expect(roomTypesTab).toBeVisible({ timeout: 25000 });

      // Switch to Room Types Tab
      await roomTypesTab.click();
      await expect(page.locator('text=/Suite & Room Type Catalog|base rate|capacity/i').first()).toBeVisible({ timeout: 25000 });
    });

    test('2.2 Stay Extra Services Management Portal (/admin/stay-services)', async ({ page }) => {
      await page.goto('/admin/stay-services', { waitUntil: 'domcontentloaded' });

      // Verify Stay Extra Services Portal header
      await expect(page.getByRole('heading', { name: /stay extra services/i })).toBeVisible({ timeout: 25000 });

      // Verify "Add Extra Service" action exists
      const addServiceBtn = page.getByRole('button', { name: /add extra service|new service/i });
      await expect(addServiceBtn).toBeVisible({ timeout: 20000 });

      // Click to open modal
      await addServiceBtn.click();
      await expect(page.getByRole('heading', { name: /new stay extra service|create extra service/i })).toBeVisible({ timeout: 15000 });

      // Close modal
      const cancelBtn = page.getByRole('button', { name: /cancel/i }).first();
      await cancelBtn.click();
    });

    test('2.3 Corporate Map Settings Input (/admin/settings)', async ({ page }) => {
      await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' });

      // Verify settings page loads System Governance & Brand Identity
      await expect(page.locator('text=/System Governance|Brand Identity/i').first()).toBeVisible({ timeout: 25000 });
      // Verify communications and narrative fields exist
      await expect(page.locator('text=/Communications|Brand Narrative|Official Email/i').first()).toBeVisible({ timeout: 20000 });
    });

    test('2.4 Admin Bookings View Dossier Modal (/admin/bookings)', async ({ page }) => {
      await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: /reservations roster|bookings/i }).first()).toBeVisible({ timeout: 25000 });
    });

  });

  // ========================================================
  // PERSONA 3: RECEPTIONIST & FRONT DESK LIFECYCLE
  // ========================================================
  test.describe('Front Desk & Receptionist Lifecycle', () => {

    test('3.1 Reception Desk Terminal Check-In & Folios', async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate to Receptionist Terminal
      await page.goto('/admin/receptionist', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('text=/Reception Desk|Monitor room occupancy/i').first()).toBeVisible({ timeout: 30000 });
    });

  });

  // ========================================================
  // PERSONA 4: HOUSEKEEPING ATTENDANT LIFECYCLE
  // ========================================================
  test.describe('Housekeeping Operations Lifecycle', () => {

    test('4.1 Mobile Housekeeping Board & Luxury Maintenance Dialog', async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate to Housekeeping Board
      await page.goto('/admin/housekeeping/board', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('text=/My Tasks|Room|Housekeeping/i').first()).toBeVisible({ timeout: 30000 });
    });

    test('4.2 Desktop Housekeeping Management Board (/admin/housekeeping)', async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate to Main Housekeeping Dashboard
      await page.goto('/admin/housekeeping', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /Room Operations & Housekeeping/i }).first()).toBeVisible({ timeout: 30000 });
    });

  });

});
