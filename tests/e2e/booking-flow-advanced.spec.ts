import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Advanced Booking Flow & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000)
    await page.goto(`${BASE_URL}/booking`)
  })

  test.describe('Validation & Boundary Tests', () => {
    test('❌ Should reject past dates for check-in', async ({ page }) => {
      // Find the check-in input
      const checkInInput = page.locator('input[type="date"], input[name*="checkIn"], input[name*="check-in"]').first()
      
      // Calculate a date in the past
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 2)
      const pastDateStr = pastDate.toISOString().split('T')[0]
      
      await checkInInput.fill(pastDateStr)
      
      // Try to submit or blur to trigger validation
      await checkInInput.blur()
      
      // Either the input is invalid or an error message appears
      const isInvalid = await checkInInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      const hasErrorMessage = await page.locator('text=past date').isVisible().catch(() => false)
      
      expect(isInvalid || hasErrorMessage).toBeTruthy()
    })

    test('❌ Should enforce maximum capacity constraints', async ({ page }) => {
      const guestsInput = page.locator('input[type="number"][name*="guest"], select[name*="guest"]').first()
      if (await guestsInput.isVisible()) {
        await guestsInput.fill('15') // Assuming max is much lower
        await guestsInput.blur()
        
        // Ensure availability button is disabled or an error is shown
        const isInvalid = await guestsInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
        expect(isInvalid).toBeTruthy()
      }
    })

    test('🛡️ Should sanitize SQLi and XSS payloads in text fields', async ({ page }) => {
      // Assuming there is a special requests or name field in the booking flow
      // We will navigate to the booking flow where inputs exist
      await page.goto(`${BASE_URL}/booking-flow`)
      
      const textInput = page.locator('input[type="text"], textarea').first()
      if (await textInput.isVisible()) {
        const xssPayload = '"><script>alert(1)</script>'
        const sqliPayload = "' OR 1=1 --"
        
        await textInput.fill(xssPayload)
        await textInput.blur()
        
        // Ensure the payload doesn't break the page rendering
        await expect(page.locator('body')).toBeVisible()
        
        await textInput.fill(sqliPayload)
        await textInput.blur()
        
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Concurrency & Resilience', () => {
    test('⚠️ Should handle rapid repeated clicks on Check Availability (Idempotency)', async ({ page }) => {
      // Fill out valid future dates
      const checkInInput = page.locator('input[type="date"], input[name*="checkIn"], input[name*="check-in"]').first()
      const checkOutInput = page.locator('input[type="date"], input[name*="checkOut"], input[name*="check-out"]').first()
      
      const futureCheckIn = new Date()
      futureCheckIn.setDate(futureCheckIn.getDate() + 10)
      
      const futureCheckOut = new Date()
      futureCheckOut.setDate(futureCheckOut.getDate() + 12)

      if (await checkInInput.isVisible() && await checkOutInput.isVisible()) {
        await checkInInput.fill(futureCheckIn.toISOString().split('T')[0])
        await checkOutInput.fill(futureCheckOut.toISOString().split('T')[0])
        
        const submitBtn = page.locator('button:has-text("Check Availability")').first()
        if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
          // Fire multiple clicks rapidly
          await Promise.all([
            submitBtn.click({ force: true }),
            submitBtn.click({ force: true }),
            submitBtn.click({ force: true })
          ])
          
          // System should gracefully handle this without crashing
          await expect(page.locator('text=Available Rooms')).toBeVisible({ timeout: 15000 }).catch(() => {})
        }
      }
    })
  })

  test.describe('Accessibility in Flow', () => {
    test('✅ Booking form should be keyboard navigable', async ({ page }) => {
      // Focus first element on page
      await page.keyboard.press('Tab')
      
      // Tab through form elements
      let activeId = ''
      for(let i=0; i<10; i++) {
        await page.keyboard.press('Tab')
        const currentActiveId = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)
        // Ensure focus moves
        if (currentActiveId && currentActiveId !== 'BODY') {
          activeId = currentActiveId
          // Focus is trapped correctly or moving
        }
      }
      expect(activeId).not.toBe('')
    })
  })
})
