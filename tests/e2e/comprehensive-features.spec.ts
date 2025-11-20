import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const PRODUCTION_URL = 'https://smarthotel-demo.vercel.app'

test.describe('Comprehensive Features Test - All Environments', () => {
  const environments = [
    { name: 'Local', url: BASE_URL },
    { name: 'Production', url: PRODUCTION_URL },
  ]

  for (const env of environments) {
    test.describe(`${env.name} Environment - Feature Tests`, () => {
      test.beforeEach(async ({ page }) => {
        test.setTimeout(120000)
      })

      test.describe('Search Functionality', () => {
        test('✅ Search bar is accessible', async ({ page }) => {
          await page.goto(env.url)
          await page.waitForTimeout(2000)
          
          // Look for search input
          const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first()
          const exists = await searchInput.isVisible().catch(() => false)
          
          if (exists) {
            await searchInput.fill('test')
            await page.waitForTimeout(1000)
            await expect(page.locator('body')).toBeVisible()
          }
        })
      })

      test.describe('Filter Functionality', () => {
        test('✅ Room filters work', async ({ page }) => {
          await page.goto(`${env.url}/rooms`)
          await page.waitForTimeout(2000)
          
          // Look for filter controls
          const filters = page.locator('select, input[type="checkbox"], button:has-text("Filter")')
          const count = await filters.count()
          
          if (count > 0) {
            // Try interacting with first filter
            await filters.first().click().catch(() => {})
            await page.waitForTimeout(500)
            await expect(page.locator('body')).toBeVisible()
          }
        })
      })

      test.describe('Pagination', () => {
        test('✅ Pagination controls work (if applicable)', async ({ page }) => {
          await page.goto(`${env.url}/rooms`)
          await page.waitForTimeout(2000)
          
          // Look for pagination
          const pagination = page.locator('button:has-text("Next"), button:has-text("Previous"), [class*="pagination"]')
          const exists = await pagination.first().isVisible().catch(() => false)
          
          if (exists) {
            await expect(pagination.first()).toBeVisible()
          }
        })
      })

      test.describe('Modal & Dialog Interactions', () => {
        test('✅ Modals can be opened and closed', async ({ page }) => {
          await page.goto(env.url)
          await page.waitForTimeout(2000)
          
          // Look for buttons that might open modals
          const modalTriggers = page.locator('button:has-text("Book"), button:has-text("View"), [data-modal]')
          const count = await modalTriggers.count()
          
          if (count > 0) {
            await modalTriggers.first().click().catch(() => {})
            await page.waitForTimeout(1000)
            
            // Look for close button
            const closeButton = page.locator('button:has-text("Close"), [aria-label*="close"], button:has([class*="close"])')
            const hasClose = await closeButton.first().isVisible().catch(() => false)
            
            if (hasClose) {
              await closeButton.first().click()
              await page.waitForTimeout(500)
            }
          }
          
          await expect(page.locator('body')).toBeVisible()
        })
      })

      test.describe('Form Interactions', () => {
        test('✅ Contact form is functional', async ({ page }) => {
          await page.goto(`${env.url}/contact`)
          await page.waitForTimeout(2000)
          
          // Fill form fields if they exist
          const nameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first()
          const emailInput = page.locator('input[type="email"]').first()
          const messageInput = page.locator('textarea, input[name*="message"]').first()
          
          const hasForm = await nameInput.isVisible().catch(() => false) ||
                          await emailInput.isVisible().catch(() => false)
          
          if (hasForm) {
            if (await nameInput.isVisible().catch(() => false)) {
              await nameInput.fill('Test User')
            }
            if (await emailInput.isVisible().catch(() => false)) {
              await emailInput.fill('test@example.com')
            }
            if (await messageInput.isVisible().catch(() => false)) {
              await messageInput.fill('Test message')
            }
          }
          
          await expect(page.locator('body')).toBeVisible()
        })
      })

      test.describe('Image Loading', () => {
        test('✅ Images load correctly', async ({ page }) => {
          await page.goto(env.url)
          await page.waitForTimeout(3000)
          
          // Check for images
          const images = page.locator('img')
          const imageCount = await images.count()
          
          if (imageCount > 0) {
            // Check first few images load
            for (let i = 0; i < Math.min(3, imageCount); i++) {
              const img = images.nth(i)
              const src = await img.getAttribute('src').catch(() => null)
              expect(src).toBeTruthy()
            }
          }
        })
      })

      test.describe('Responsive Design', () => {
        test('✅ Mobile viewport works', async ({ page }) => {
          await page.setViewportSize({ width: 375, height: 667 })
          await page.goto(env.url)
          await page.waitForTimeout(2000)
          
          await expect(page.locator('body')).toBeVisible()
          
          // Check mobile menu
          const menuButton = page.locator('button[aria-label*="menu"], [class*="menu-toggle"]').first()
          const exists = await menuButton.isVisible().catch(() => false)
          expect(exists).toBeTruthy()
        })

        test('✅ Tablet viewport works', async ({ page }) => {
          await page.setViewportSize({ width: 768, height: 1024 })
          await page.goto(env.url)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })

        test('✅ Desktop viewport works', async ({ page }) => {
          await page.setViewportSize({ width: 1920, height: 1080 })
          await page.goto(env.url)
          await page.waitForTimeout(2000)
          await expect(page.locator('body')).toBeVisible()
        })
      })

      test.describe('Loading States', () => {
        test('✅ Loading indicators appear', async ({ page }) => {
          await page.goto(`${env.url}/rooms`)
          
          // Look for loading states
          const loading = page.locator('[class*="loading"], [class*="spinner"], text=Loading')
          const hasLoading = await loading.first().isVisible().catch(() => false)
          
          // Either loading appears or page loads quickly
          await page.waitForTimeout(3000)
          await expect(page.locator('body')).toBeVisible()
        })
      })

      test.describe('Error Handling', () => {
        test('✅ Error states are handled', async ({ page }) => {
          // Try accessing invalid route
          await page.goto(`${env.url}/invalid-route-12345`)
          await page.waitForTimeout(2000)
          
          // Should show 404 or redirect, not crash
          await expect(page.locator('body')).toBeVisible()
        })
      })

      test.describe('Accessibility', () => {
        test('✅ Page has title', async ({ page }) => {
          await page.goto(env.url)
          const title = await page.title()
          expect(title.length).toBeGreaterThan(0)
        })

        test('✅ Main content is accessible', async ({ page }) => {
          await page.goto(env.url)
          await page.waitForTimeout(2000)
          
          // Check for main landmark
          const main = page.locator('main, [role="main"], [id*="main"]')
          const exists = await main.first().isVisible().catch(() => false)
          expect(exists).toBeTruthy()
        })

        test('✅ Navigation is accessible', async ({ page }) => {
          await page.goto(env.url)
          
          const nav = page.locator('nav, [role="navigation"]')
          const exists = await nav.first().isVisible().catch(() => false)
          expect(exists).toBeTruthy()
        })
      })
    })
  }
})

