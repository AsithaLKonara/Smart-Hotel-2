import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test'
import { demoUsers, loginAsUser } from '../../qa/config/demo-users'

/**
 * SmartHotel OS — Final Production Sequential E2E Suite
 * Adheres strictly to Low-Spec Execution Rules:
 * - Sequential mode only
 * - Single shared browser instance
 * - Small delays between actions
 */

test.describe('SmartHotel OS Final E2E Suite', () => {
  let browser: Browser
  let context: BrowserContext
  let page: Page
  test.describe.configure({ mode: 'serial' })
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
  test.setTimeout(7200000) // 120 minutes

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: true })
    context = await browser.newContext()
    page = await context.newPage()
  })

  test.afterAll(async () => {
    await browser.close()
  })

  // ==================================================
  // PHASE 1 — AUTH & ROLE ACCESS TEST
  // ==================================================
  test('Phase 1: Multi-Role Authentication & RBAC Isolation', async () => {
    console.log('🚀 Phase 1: Authentication & RBAC')
    
    const roles: (keyof typeof demoUsers)[] = ['guest', 'receptionist', 'kitchen', 'manager', 'admin']
    
    for (const role of roles) {
      console.log(`  - Validating role: ${role}`)
      await loginAsUser(page, role, BASE_URL)
      
      // Verify redirect
      const url = page.url()
      if (role === 'guest') {
        expect(url).toContain('/dashboard')
      } else if (role === 'admin' || role === 'manager') {
        expect(url).toContain('/admin')
      } else if (role === 'kitchen') {
        expect(url).toContain('/kitchen')
      } else {
        expect(url).toMatch(/\/dashboard|\/admin|\/kitchen/)
      }

      // Check RBAC isolation (Admin page for Guest should fail or redirect)
      if (role === 'guest') {
        await page.goto(`${BASE_URL}/admin/bookings`)
        await page.waitForTimeout(1000)
        expect(page.url()).not.toContain('/admin/bookings')
      }

      // Logout for next role
      await page.goto(`${BASE_URL}/api/auth/signout?callbackUrl=/auth/signin`)
      await page.waitForTimeout(2000)
      const signOutButton = page.locator('button:has-text("Sign out")')
      if (await signOutButton.isVisible()) {
        await signOutButton.click({ force: true })
        await page.waitForURL('**/auth/signin', { timeout: 30000 }).catch(() => {})
      }
      // Double check we are out
      await page.goto(`${BASE_URL}/auth/signin`)
      await page.waitForTimeout(1000)
    }
    console.log('✅ Phase 1 Complete')
  })

  // ==================================================
  // PHASE 2 — GUEST CORE JOURNEY
  // ==================================================
  test('Phase 2: Guest End-to-End Journey', async () => {
    console.log('🚀 Phase 2: Guest Core Journey')
    await loginAsUser(page, 'guest', BASE_URL)

    // 1. View Booking Page
    await page.goto(`${BASE_URL}/booking`)
    await page.waitForTimeout(1000)
    await expect(page.locator('main h1').first()).toContainText(/Stay|Booking|Control/)

    // 2. View My Bookings
    await page.goto(`${BASE_URL}/my-bookings`)
    await page.waitForTimeout(1000)
    await expect(page.locator('main h1').first()).toContainText(/Reservations|Bookings|Stay/)

    // 3. Place Dining Order (if available)
    await page.goto(`${BASE_URL}/dashboard/dining`)
    await page.waitForTimeout(1000)
    // Check if menu is visible
    const menuItems = page.locator('button:has-text("Add")')
    if (await menuItems.count() > 0) {
      await menuItems.first().click()
      await page.click('button:has-text("Place Order")')
      await page.waitForTimeout(1000)
      await expect(page.locator('text=Order placed')).toBeVisible()
    }

    // 4. View Spending
    await page.goto(`${BASE_URL}/dashboard/spending`)
    await page.waitForTimeout(1000)
    await expect(page.locator('main h1').first()).toContainText(/Financial|Spending|Ledger/)

    console.log('✅ Phase 2 Complete')
  })

  // ==================================================
  // PHASE 3 — RECEPTION WORKFLOW
  // ==================================================
  test('Phase 3: Receptionist Workflow', async () => {
    console.log('🚀 Phase 3: Receptionist Operations')
    await loginAsUser(page, 'receptionist', BASE_URL)

    // 1. Bookings Management
    await page.goto(`${BASE_URL}/admin/bookings`)
    await page.waitForTimeout(1000)
    await expect(page.locator('main h1').first()).toContainText(/Bookings|Reservations|Control|Intelligence/)

    // 2. Room Management
    await page.goto(`${BASE_URL}/admin/rooms`)
    await page.waitForTimeout(1000)
    await expect(page.locator('main h1').first()).toContainText(/Rooms|Inventory|Control|Intelligence/)

    console.log('✅ Phase 3 Complete')
  })

  // ==================================================
  // PHASE 4 — DINING / KITCHEN FLOW
  // ==================================================
  test('Phase 4: Kitchen Operations Feed', async () => {
    console.log('🚀 Phase 4: Kitchen Workflow')
    await loginAsUser(page, 'kitchen', BASE_URL)

    await page.goto(`${BASE_URL}/kitchen/dashboard`)
    await page.waitForTimeout(1000)
    await expect(page.locator('main h1').first()).toContainText(/Kitchen|Orders|Queue|Intelligence/)

    console.log('✅ Phase 4 Complete')
  })

  // ==================================================
  // PHASE 5 — PAYMENTS & FINANCIAL INTEGRITY
  // ==================================================
  test('Phase 5: Financial Governance', async () => {
    console.log('🚀 Phase 5: Payments & Finance')
    await loginAsUser(page, 'admin', BASE_URL)

    await page.goto(`${BASE_URL}/admin/bookings`)
    await page.waitForTimeout(1000)
    await expect(page.locator('main h1').first()).toContainText(/Bookings|Reservations|Control|Intelligence/)

    // Verify Analytics
    await page.goto(`${BASE_URL}/admin/dashboard`)
    await page.waitForTimeout(2000)
    const revenueStat = page.locator('text=Revenue').first()
    await expect(revenueStat).toBeVisible()

    console.log('✅ Phase 5 Complete')
  })

  // ==================================================
  // PHASE 6 — SYSTEM STABILITY CHECK
  // ==================================================
  test('Phase 6: Global Stability Audit', async () => {
    console.log('🚀 Phase 6: System Stability')
    
    const targetRoutes = [
      '/admin/audit-logs',
      '/admin/staff',
      '/admin/timeline',
      '/profile',
      '/rooms',
      '/gallery'
    ]

    for (const route of targetRoutes) {
      console.log(`  - Checking: ${route}`)
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 60000 })
      await page.waitForTimeout(2000)
      
      // Check for runtime error indicators
      const errorText = await page.innerText('body')
      expect(errorText.toLowerCase()).not.toContain('server error')
      expect(errorText.toLowerCase()).not.toContain('not found')
    }

    console.log('✅ Phase 6 Complete')
  })
})
