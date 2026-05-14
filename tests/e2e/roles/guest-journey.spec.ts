import { test, expect } from '../fixtures'

test.describe('Guest Journey - E2E Operations', () => {
  
  test.beforeEach(async ({ guestPage }) => {
    await guestPage.goto('/')
  })

  test('Public Landing Page - Testimonials & Navigation', async ({ page }) => {
    await page.goto('/')
    
    // Check for premium branding
    await expect(page.locator('h1')).toContainText(/Refined/i)
    
    // Verify Testimonials section
    const testimonials = page.locator('section:has-text("Guest Voices")')
    await expect(testimonials).toBeVisible()
    await expect(testimonials.locator('h2')).toContainText('Stories of Distinction')
    
    // Check navigation items
    await expect(page.locator('nav')).toContainText(/Rooms/i)
    await expect(page.locator('nav')).toContainText(/Dining/i)
  })

  test('Room Browsing & Availability', async ({ guestPage }) => {
    await guestPage.goto('/rooms')
    await expect(guestPage.locator('h1')).toContainText(/Collection/i)
    
    // Verify at least one room card
    const roomCards = guestPage.locator('.grid >> div:has-text("Book Now")')
    await expect(roomCards.first()).toBeVisible()
  })

  test('Guest Dashboard - Unified View & Role Isolation', async ({ guestPage }) => {
    await guestPage.goto('/dashboard')
    
    // Verify Guest Dashboard elements
    await expect(guestPage.locator('h1')).toContainText(/Welcome/i)
    await expect(guestPage.locator('text=Stay Folio')).toBeVisible()
    await expect(guestPage.locator('text=In-Room Dining')).toBeVisible()
    await expect(guestPage.locator('text=Butler Service')).toBeVisible()
    
    // Verify Role Isolation: No Staff links should be visible
    await expect(guestPage.locator('text=Kitchen Display')).not.toBeVisible()
    await expect(guestPage.locator('text=Housekeeping Hub')).not.toBeVisible()
    await expect(guestPage.locator('text=Admin Cockpit')).not.toBeVisible()
    
    // Try accessing Admin route directly - should redirect or deny
    await guestPage.goto('/admin/dashboard')
    await expect(guestPage.url()).not.toContain('/admin/dashboard')
  })

  test('Dining & Table Booking Integration', async ({ guestPage }) => {
    await guestPage.goto('/dining')
    
    // Open Table Booking Modal
    const bookTableBtn = guestPage.locator('button:has-text("Reserve Table")')
    await bookTableBtn.first().click()
    
    await expect(guestPage.locator('h2:has-text("Reserve")')).toBeVisible()
    
    // View Menu Modal
    await guestPage.goto('/dining')
    const viewMenuBtn = guestPage.locator('button:has-text("View Menu")')
    await viewMenuBtn.first().click()
    
    await expect(guestPage.locator('h2:has-text("Culinary")')).toBeVisible()
  })

  test('Service Requests & Complaints', async ({ guestPage }) => {
    await guestPage.goto('/dashboard')
    
    // Request creation
    const requestSection = guestPage.locator('section:has-text("Butler Service")')
    await expect(requestSection).toBeVisible()
    
    // Complaint creation flow
    const complaintSection = guestPage.locator('section:has-text("Issue Resolution")')
    await expect(complaintSection).toBeVisible()
    
    // Simulate opening a complaint modal if applicable
    const reportBtn = guestPage.locator('button:has-text("Report Issue")')
    if (await reportBtn.isVisible()) {
      await reportBtn.click()
      await expect(guestPage.locator('text=Describe the issue')).toBeVisible()
    }
  })

  test('Spending Summary & Folio', async ({ guestPage }) => {
    await guestPage.goto('/dashboard')
    
    const folioSection = guestPage.locator('section:has-text("Stay Folio")')
    await expect(folioSection).toBeVisible()
    await expect(folioSection.locator('text=Total Spending')).toBeVisible()
    
    // Verify "Settle Now" button presence
    await expect(guestPage.locator('button:has-text("Settle Now")')).toBeVisible()
  })

  test('Stay Feedback & Reviews', async ({ guestPage }) => {
    await guestPage.goto('/dashboard')
    
    const reviewSection = guestPage.locator('section:has-text("Service Feedback")')
    await expect(reviewSection).toBeVisible()
    
    // Check if stars are visible for rating
    const stars = reviewSection.locator('svg.lucide-star')
    await expect(stars.first()).toBeVisible()
  })
})
