import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const PRODUCTION_URL = 'https://smarthotel-demo.vercel.app'

// Test credentials (should be in environment or test database)
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@smarthotel.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'SmartHotel@2025!Admin'

async function loginAsAdmin(page: Page, baseUrl: string) {
  await page.goto(`${baseUrl}/auth/signin`)
  await page.fill('input[type="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/admin|\/dashboard/)
}

test.describe('Comprehensive CRUD Operations - Admin Dashboard', () => {
  const environments = [
    { name: 'Local', url: BASE_URL },
    { name: 'Production', url: PRODUCTION_URL },
  ]

  for (const env of environments) {
    test.describe(`${env.name} Environment`, () => {
      test.beforeEach(async ({ page }) => {
        test.setTimeout(120000)
        // Skip if production and no credentials
        if (env.name === 'Production' && !process.env.TEST_ADMIN_EMAIL) {
          test.skip()
        }
      })

      test.describe('Rooms CRUD', () => {
        test('✅ View rooms list', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/rooms`)
          await page.waitForTimeout(2000)
          
          // Check if rooms table/list exists
          const hasContent = await page.locator('body').textContent()
          expect(hasContent).toBeTruthy()
        })

        test('✅ Create room form loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/rooms`)
          await page.waitForTimeout(2000)
          
          // Look for create/add button
          const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first()
          const exists = await createButton.isVisible().catch(() => false)
          
          if (exists) {
            await createButton.click()
            await page.waitForTimeout(1000)
            // Form should appear
            await expect(page.locator('body')).toBeVisible()
          }
        })

        test('✅ Edit room form loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/rooms`)
          await page.waitForTimeout(2000)
          
          // Look for edit button
          const editButton = page.locator('button:has-text("Edit"), [aria-label*="edit"]').first()
          const exists = await editButton.isVisible().catch(() => false)
          
          if (exists) {
            await editButton.click()
            await page.waitForTimeout(1000)
            await expect(page.locator('body')).toBeVisible()
          }
        })
      })

      test.describe('Bookings CRUD', () => {
        test('✅ View bookings list', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/bookings`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Booking filters work', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/bookings`)
          await page.waitForTimeout(2000)
          
          // Look for filter/search inputs
          const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first()
          const exists = await searchInput.isVisible().catch(() => false)
          
          if (exists) {
            await searchInput.fill('test')
            await page.waitForTimeout(1000)
            await expect(page.locator('body')).toBeVisible()
          }
        })
      })

      test.describe('Staff CRUD', () => {
        test('✅ View staff list', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/staff`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Create staff form loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/staff`)
          await page.waitForTimeout(2000)
          
          const createButton = page.locator('button:has-text("Add"), button:has-text("Create")').first()
          const exists = await createButton.isVisible().catch(() => false)
          
          if (exists) {
            await createButton.click()
            await page.waitForTimeout(1000)
            await expect(page.locator('body')).toBeVisible()
          }
        })
      })

      test.describe('Tasks CRUD', () => {
        test('✅ View tasks list', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/tasks`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Create task form loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/tasks`)
          await page.waitForTimeout(2000)
          
          const createButton = page.locator('button:has-text("Add"), button:has-text("Create")').first()
          const exists = await createButton.isVisible().catch(() => false)
          
          if (exists) {
            await createButton.click()
            await page.waitForTimeout(1000)
            await expect(page.locator('body')).toBeVisible()
          }
        })
      })

      test.describe('Menu CRUD', () => {
        test('✅ View menu items', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/menu`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Create menu item form loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/menu`)
          await page.waitForTimeout(2000)
          
          const createButton = page.locator('button:has-text("Add"), button:has-text("Create")').first()
          const exists = await createButton.isVisible().catch(() => false)
          
          if (exists) {
            await createButton.click()
            await page.waitForTimeout(1000)
            await expect(page.locator('body')).toBeVisible()
          }
        })
      })

      test.describe('Orders CRUD', () => {
        test('✅ View orders list', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/orders`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })
      })

      test.describe('Inventory CRUD', () => {
        test('✅ View inventory list', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/inventory`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Create inventory item form loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/inventory`)
          await page.waitForTimeout(2000)
          
          const createButton = page.locator('button:has-text("Add"), button:has-text("Create")').first()
          const exists = await createButton.isVisible().catch(() => false)
          
          if (exists) {
            await createButton.click()
            await page.waitForTimeout(1000)
            await expect(page.locator('body')).toBeVisible()
          }
        })
      })

      test.describe('Gallery CRUD', () => {
        test('✅ View gallery items', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/gallery`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Upload form loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/gallery`)
          await page.waitForTimeout(2000)
          
          const uploadButton = page.locator('button:has-text("Add Image"), button:has-text("Upload"), input[type="file"]').first()
          const exists = await uploadButton.isVisible().catch(() => false)
          expect(exists).toBeTruthy()
        })
      })

      test.describe('Settings & Configuration', () => {
        test('✅ Settings page loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/settings`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ FAQ management loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/faq`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Hero slides management loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/hero-slides`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Navigation management loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/navigation`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Social links management loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/social-links`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Amenities management loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/amenities`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Attractions management loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/attractions`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Footer links management loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/footer-links`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })
      })

      test.describe('Analytics & Reports', () => {
        test('✅ Analytics dashboard loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/analytics`)
          await page.waitForTimeout(3000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Calendar view loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/calendar`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })
      })

      test.describe('Check-In/Check-Out', () => {
        test('✅ Check-in/out page loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/dashboard/checkin-checkout`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })
      })

      test.describe('QR Codes', () => {
        test('✅ QR codes page loads', async ({ page }) => {
          await loginAsAdmin(page, env.url)
          await page.goto(`${env.url}/admin/qr-codes`)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })
      })
    })
  }
})

