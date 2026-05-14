import { test, expect } from './fixtures'
import { devices } from '@playwright/test'

test.use({ ...devices['iPhone 13'] })

test.describe('Mobile Guest Super App', () => {

  
  test('Guest should access Mobile Super App after login', async ({ guestPage }) => {
    await guestPage.goto('/mobile/guest-super-app')
    
    // Check for mobile-specific components
    await expect(guestPage.locator('text=Virtual Key, text=Mobile Key')).toBeVisible()
    await expect(guestPage.locator('text=Service Requests')).toBeVisible()
    await expect(guestPage.locator('text=Quick Order')).toBeVisible()
  })

  test('Guest can create a Service Request via mobile', async ({ guestPage }) => {
    await guestPage.goto('/mobile/guest-super-app')
    
    const serviceRequestBtn = guestPage.locator('button:has-text("Service Requests")').first()
    await serviceRequestBtn.click()
    
    // Fill request
    await guestPage.fill('textarea[name*="description"]', 'Need extra towels please.')
    await guestPage.click('button:has-text("Submit"), button:has-text("Send")')
    
    await expect(guestPage.locator('text=Request Sent, text=Successful')).toBeVisible()
  })

  test('Mobile Check-in flow validation', async ({ guestPage }) => {
    await guestPage.goto('/mobile/guest-super-app')
    
    const checkInBtn = guestPage.locator('button:has-text("Mobile Check-in")').first()
    if (await checkInBtn.isVisible()) {
      await checkInBtn.click()
      await expect(guestPage.locator('text=Verify Identity, text=Personal Details')).toBeVisible()
    }
  })
})
