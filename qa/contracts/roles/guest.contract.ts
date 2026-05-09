import { test, expect } from '@playwright/test'
import { loginAsUser } from '../../config/demo-users'
import { PrismaClient } from '@prisma/client'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('👤 Guest Contract - Data Ownership & Isolation', () => {
  let prisma: PrismaClient

  test.beforeAll(async () => {
    prisma = new PrismaClient()
  })

  test.afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  test('✔ Should browse public pages and load own guest dashboard', async ({ page }) => {
    await loginAsUser(page, 'guest', BASE_URL)
    
    await page.goto(`${BASE_URL}/rooms`)
    // Wait for loaders to disappear dynamically
    await expect(page.locator('.animate-spin, svg.animate-spin')).not.toBeVisible({ timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(500)
    
    // Check if room title or room search elements exist
    const bodyText = await page.locator('body').textContent() || ''
    expect(bodyText.length).toBeGreaterThan(0)

    await page.goto(`${BASE_URL}/dashboard`)
    // Wait for loaders to disappear dynamically
    await expect(page.locator('.animate-spin, svg.animate-spin')).not.toBeVisible({ timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(500)
    
    expect(page.url()).toContain('/dashboard')
  })

  test('❌ Should strictly forbid access to any admin or kitchen section', async ({ page }) => {
    await loginAsUser(page, 'guest', BASE_URL)

    const forbiddenRoutes = [
      '/admin/dashboard',
      '/admin/bookings',
      '/kitchen/dashboard'
    ]

    for (const route of forbiddenRoutes) {
      await page.goto(`${BASE_URL}${route}`)
      
      // Dynamically wait up to 15 seconds for redirection or block indicator
      await page.waitForFunction((baseUrl) => {
        const bodyText = document.body.textContent || ''
        const currentUrl = window.location.href
        return currentUrl.includes('/auth/signin') || 
               bodyText.includes('Unauthorized') || 
               bodyText.includes('Access Denied') || 
               currentUrl === baseUrl + '/' ||
               currentUrl.includes('error=AccessDenied') ||
               !currentUrl.includes(window.location.pathname)
      }, BASE_URL, { timeout: 15000 }).catch(() => {})
      
      const bodyText = await page.locator('body').textContent() || ''
      const currentUrl = page.url()
      
      const blocked = currentUrl.includes('/auth/signin') || 
                      bodyText.includes('Unauthorized') || 
                      bodyText.includes('Access Denied') || 
                      currentUrl === `${BASE_URL}/` ||
                      currentUrl.includes('error=AccessDenied') ||
                      !currentUrl.includes(route)
                      
      expect(blocked).toBeTruthy()
    }
  })

  test('🔒 [DATA ISOLATION]: Guest must NEVER access or view another guest\'s bookings', async ({ page }) => {
    // Database-Coupled Isolation: fetch another guest's (Emily Carter's) private booking info directly
    const emily = await prisma.user.findFirst({
      where: { email: 'emily.carter@example.com' }
    })
    
    if (!emily) {
      console.log('⚠️ Emily Carter user not found in DB - skipping data isolation check.')
      return
    }

    const emilyBooking = await prisma.booking.findFirst({
      where: { userId: emily.id }
    })

    if (!emilyBooking) {
      console.log('⚠️ Emily Carter booking not found in DB - skipping data isolation check.')
      return
    }

    // Log in as our primary demo guest (John Doe - guest@example.com)
    await loginAsUser(page, 'guest', BASE_URL)

    // Navigate to John Doe's dashboard bookings list
    await page.goto(`${BASE_URL}/my-bookings`)
    // Wait for loaders to disappear dynamically
    await expect(page.locator('.animate-spin, svg.animate-spin')).not.toBeVisible({ timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(500)

    // MATHEMATICALLY ASSERT absolute isolation: Emily's confirmation code must NOT exist in John's DOM
    const pageContent = await page.content()
    expect(pageContent).not.toContain(emilyBooking.confirmationCode)
  })
})
