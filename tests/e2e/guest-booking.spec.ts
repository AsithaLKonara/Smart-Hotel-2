import { test, expect } from '@playwright/test'

test.describe('Guest Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should complete guest booking flow successfully', async ({ page }) => {
    // Step 1: Navigate to homepage and verify it loads
    await expect(page).toHaveTitle(/Grand Palace Hotel/)
    await expect(page.locator('h1')).toContainText('Grand Palace Hotel')

    // Step 2: Browse available rooms
    await page.click('text=View Rooms')
    await expect(page).toHaveURL('/rooms')
    
    // Verify room cards are displayed
    await expect(page.locator('[data-testid="room-card"]')).toHaveCount(3)
    
    // Step 3: Select dates using the booking widget
    await page.click('text=Book Now')
    await expect(page).toHaveURL('/booking')
    
    // Fill in check-in date
    await page.fill('[data-testid="check-in-date"]', '2024-02-15')
    
    // Fill in check-out date
    await page.fill('[data-testid="check-out-date"]', '2024-02-18')
    
    // Select number of guests
    await page.selectOption('[data-testid="guests-select"]', '2')
    
    // Step 4: Choose room type
    await page.click('[data-testid="room-type-deluxe-king"]')
    
    // Verify room details are displayed
    await expect(page.locator('[data-testid="room-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="room-price"]')).toContainText('$299')
    
    // Step 5: Fill guest information
    await page.fill('[data-testid="guest-name"]', 'John Doe')
    await page.fill('[data-testid="guest-email"]', 'john.doe@example.com')
    await page.fill('[data-testid="guest-phone"]', '+1234567890')
    
    // Add special requests
    await page.fill('[data-testid="special-requests"]', 'Late checkout requested')
    
    // Step 6: Complete booking
    await page.click('[data-testid="book-now-button"]')
    
    // Verify booking confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirmation-code"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-price"]')).toContainText('$897')
    
    // Step 7: Verify confirmation email would be sent
    await expect(page.locator('[data-testid="email-confirmation"]')).toContainText('john.doe@example.com')
  })

  test('should validate booking form inputs', async ({ page }) => {
    await page.goto('/booking')
    
    // Try to submit without filling required fields
    await page.click('[data-testid="book-now-button"]')
    
    // Verify validation errors
    await expect(page.locator('[data-testid="check-in-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="check-out-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="guest-name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="guest-email-error"]')).toBeVisible()
    
    // Fill invalid email
    await page.fill('[data-testid="guest-email"]', 'invalid-email')
    await page.click('[data-testid="book-now-button"]')
    
    // Verify email validation
    await expect(page.locator('[data-testid="guest-email-error"]')).toContainText('Invalid email')
  })

  test('should handle room availability correctly', async ({ page }) => {
    await page.goto('/booking')
    
    // Select dates
    await page.fill('[data-testid="check-in-date"]', '2024-02-15')
    await page.fill('[data-testid="check-out-date"]', '2024-02-18')
    await page.selectOption('[data-testid="guests-select"]', '2')
    
    // Check availability
    await page.click('[data-testid="check-availability"]')
    
    // Verify available rooms are shown
    await expect(page.locator('[data-testid="available-rooms"]')).toBeVisible()
    await expect(page.locator('[data-testid="room-option"]')).toHaveCount(3)
    
    // Verify pricing is calculated correctly
    await expect(page.locator('[data-testid="deluxe-king-price"]')).toContainText('$897')
    await expect(page.locator('[data-testid="executive-suite-price"]')).toContainText('$1,497')
    await expect(page.locator('[data-testid="presidential-suite-price"]')).toContainText('$2,997')
  })

  test('should handle past date selection', async ({ page }) => {
    await page.goto('/booking')
    
    // Select past dates
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    await page.fill('[data-testid="check-in-date"]', yesterdayStr)
    await page.fill('[data-testid="check-out-date"]', '2024-02-18')
    
    // Verify error message
    await expect(page.locator('[data-testid="date-error"]')).toContainText('Check-in date cannot be in the past')
  })

  test('should handle same day check-in/out', async ({ page }) => {
    await page.goto('/booking')
    
    const today = new Date().toISOString().split('T')[0]
    
    await page.fill('[data-testid="check-in-date"]', today)
    await page.fill('[data-testid="check-out-date"]', today)
    
    // Verify error message
    await expect(page.locator('[data-testid="date-error"]')).toContainText('Check-out date must be after check-in date')
  })
})

test.describe('Authenticated User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'mock-token')
    })
  })

  test('should complete user registration and booking', async ({ page }) => {
    // Step 1: Register new account
    await page.goto('/auth/signup')
    
    await page.fill('[data-testid="name-input"]', 'Jane Smith')
    await page.fill('[data-testid="email-input"]', 'jane.smith@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePassword123!')
    
    await page.click('[data-testid="signup-button"]')
    
    // Verify registration success
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Account created successfully')
    
    // Step 2: Login
    await page.goto('/auth/signin')
    
    await page.fill('[data-testid="email-input"]', 'jane.smith@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
    
    await page.click('[data-testid="signin-button"]')
    
    // Verify login success and redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Step 3: Make booking as registered user
    await page.click('text=Book Room')
    await expect(page).toHaveURL('/booking')
    
    // Fill booking details
    await page.fill('[data-testid="check-in-date"]', '2024-03-01')
    await page.fill('[data-testid="check-out-date"]', '2024-03-04')
    await page.selectOption('[data-testid="guests-select"]', '2')
    
    await page.click('[data-testid="room-type-executive-suite"]')
    
    // User information should be pre-filled
    await expect(page.locator('[data-testid="guest-name"]')).toHaveValue('Jane Smith')
    await expect(page.locator('[data-testid="guest-email"]')).toHaveValue('jane.smith@example.com')
    
    await page.click('[data-testid="book-now-button"]')
    
    // Verify booking confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible()
    
    // Step 4: View booking history
    await page.click('text=My Bookings')
    await expect(page).toHaveURL('/my-bookings')
    
    // Verify booking appears in history
    await expect(page.locator('[data-testid="booking-item"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="booking-room-type"]')).toContainText('Executive Suite')
    
    // Step 5: Update profile
    await page.click('text=Profile')
    await page.fill('[data-testid="phone-input"]', '+1987654321')
    await page.click('[data-testid="save-profile"]')
    
    // Verify profile update
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Profile updated')
    
    // Step 6: Logout
    await page.click('[data-testid="logout-button"]')
    await expect(page).toHaveURL('/')
  })

  test('should handle password reset flow', async ({ page }) => {
    // Step 1: Request password reset
    await page.goto('/auth/forgot-password')
    
    await page.fill('[data-testid="email-input"]', 'jane.smith@example.com')
    await page.click('[data-testid="reset-button"]')
    
    // Verify reset email sent
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Reset email sent')
    
    // Step 2: Reset password (simulate clicking email link)
    await page.goto('/auth/reset-password?token=mock-reset-token')
    
    await page.fill('[data-testid="password-input"]', 'NewSecurePassword123!')
    await page.fill('[data-testid="confirm-password-input"]', 'NewSecurePassword123!')
    await page.click('[data-testid="reset-button"]')
    
    // Verify password reset success
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset successfully')
  })
})

test.describe('Admin Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'admin-token')
      window.localStorage.setItem('user-role', 'ADMIN')
    })
  })

  test('should complete admin dashboard workflow', async ({ page }) => {
    // Step 1: Login as admin
    await page.goto('/admin/dashboard')
    
    // Verify admin dashboard loads
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="revenue-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="bookings-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="occupancy-card"]')).toBeVisible()
    
    // Step 2: View dashboard analytics
    await expect(page.locator('[data-testid="revenue-today"]')).toContainText('$')
    await expect(page.locator('[data-testid="bookings-today"]')).toContainText(/\d+/)
    await expect(page.locator('[data-testid="occupancy-rate"]')).toContainText('%')
    
    // Step 3: Manage bookings
    await page.click('text=Bookings')
    await expect(page).toHaveURL('/admin/bookings')
    
    // Verify bookings table
    await expect(page.locator('[data-testid="bookings-table"]')).toBeVisible()
    
    // Filter bookings by status
    await page.selectOption('[data-testid="status-filter"]', 'CONFIRMED')
    const bookingRows = page.locator('[data-testid="booking-row"]')
    await expect(bookingRows).toHaveCount(await bookingRows.count())
    
    // Update booking status
    await page.click('[data-testid="booking-action-button"]')
    await page.selectOption('[data-testid="status-select"]', 'CHECKED_IN')
    await page.click('[data-testid="update-status"]')
    
    // Verify status update
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Booking updated')
    
    // Step 4: Add/edit room availability
    await page.click('text=Rooms')
    await expect(page).toHaveURL('/admin/rooms')
    
    // Add new room
    await page.click('[data-testid="add-room-button"]')
    await page.fill('[data-testid="room-type-input"]', 'Deluxe Twin')
    await page.fill('[data-testid="room-price-input"]', '279')
    await page.fill('[data-testid="room-capacity-input"]', '2')
    await page.click('[data-testid="save-room"]')
    
    // Verify room added
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Room added')
    
    // Step 5: View reports
    await page.click('text=Analytics')
    await expect(page).toHaveURL('/admin/analytics')
    
    // Verify analytics charts
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="occupancy-chart"]')).toBeVisible()
    
    // Export data
    await page.click('[data-testid="export-button"]')
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()
    
    // Step 6: Manage staff
    await page.click('text=Staff')
    await expect(page).toHaveURL('/admin/staff')
    
    // Add new staff member
    await page.click('[data-testid="add-staff-button"]')
    await page.fill('[data-testid="staff-name-input"]', 'Alice Johnson')
    await page.fill('[data-testid="staff-email-input"]', 'alice@hotel.com')
    await page.selectOption('[data-testid="staff-role-select"]', 'RECEPTIONIST')
    await page.fill('[data-testid="staff-department-input"]', 'Front Desk')
    await page.click('[data-testid="save-staff"]')
    
    // Verify staff added
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Staff member added')
  })

  test('should handle admin permissions correctly', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Verify admin-only features are visible
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible()
    await expect(page.locator('text=Analytics')).toBeVisible()
    await expect(page.locator('text=Staff')).toBeVisible()
    await expect(page.locator('text=Rooms')).toBeVisible()
    
    // Test role-based access
    await page.goto('/admin/staff')
    await expect(page.locator('[data-testid="staff-management"]')).toBeVisible()
    
    await page.goto('/admin/analytics')
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible()
  })
})

test.describe('Kitchen Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock kitchen staff authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'kitchen-token')
      window.localStorage.setItem('user-role', 'KITCHEN_STAFF')
    })
  })

  test('should complete kitchen workflow', async ({ page }) => {
    // Step 1: Login as kitchen staff
    await page.goto('/kitchen/dashboard')
    
    // Verify kitchen dashboard loads
    await expect(page.locator('[data-testid="kitchen-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="pending-orders"]')).toBeVisible()
    await expect(page.locator('[data-testid="preparing-orders"]')).toBeVisible()
    
    // Step 2: View incoming orders
    const orderItems = page.locator('[data-testid="order-item"]')
    await expect(orderItems).toHaveCount(await orderItems.count())
    
    // Step 3: Update order status
    await page.click('[data-testid="order-action-button"]')
    await page.selectOption('[data-testid="status-select"]', 'PREPARING')
    await page.fill('[data-testid="prep-time-input"]', '25')
    await page.click('[data-testid="update-status"]')
    
    // Verify status update
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Order status updated')
    
    // Step 4: Mark order as ready
    await page.click('[data-testid="order-ready-button"]')
    await page.selectOption('[data-testid="status-select"]', 'READY')
    await page.click('[data-testid="update-status"]')
    
    // Verify order moved to ready section
    await expect(page.locator('[data-testid="ready-orders"]')).toContainText('Order')
    
    // Step 5: Verify notifications sent
    await expect(page.locator('[data-testid="notification-sent"]')).toContainText('Notification sent to guest')
  })

  test('should handle order priority correctly', async ({ page }) => {
    await page.goto('/kitchen/dashboard')
    
    // Verify orders are sorted by priority/time
    const orderTimes = await page.locator('[data-testid="order-time"]').allTextContents()
    
    // Check that orders are in chronological order
    for (let i = 1; i < orderTimes.length; i++) {
      const prevTime = new Date(orderTimes[i - 1])
      const currTime = new Date(orderTimes[i])
      expect(prevTime.getTime()).toBeLessThanOrEqual(currTime.getTime())
    }
  })
})

test.describe('Contact and Information Pages', () => {
  test('should navigate all public pages successfully', async ({ page }) => {
    // Test About page
    await page.goto('/about')
    await expect(page.locator('h1')).toContainText('About Us')
    await expect(page.locator('[data-testid="hotel-story"]')).toBeVisible()
    await expect(page.locator('[data-testid="team-section"]')).toBeVisible()
    
    // Test Facilities page
    await page.goto('/facilities')
    await expect(page.locator('h1')).toContainText('Facilities')
    const amenityCards = page.locator('[data-testid="amenity-card"]')
    await expect(amenityCards).toHaveCount(await amenityCards.count())
    
    // Test Contact page
    await page.goto('/contact')
    await expect(page.locator('h1')).toContainText('Contact Us')
    await expect(page.locator('[data-testid="contact-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="google-maps"]')).toBeVisible()
    
    // Test Gallery page
    await page.goto('/gallery')
    await expect(page.locator('h1')).toContainText('Gallery')
    const galleryImages = page.locator('[data-testid="gallery-image"]')
    await expect(galleryImages).toHaveCount(await galleryImages.count())
    
    // Test Rooms page
    await page.goto('/rooms')
    await expect(page.locator('h1')).toContainText('Rooms')
    await expect(page.locator('[data-testid="room-card"]')).toHaveCount(3)
  })

  test('should submit contact form successfully', async ({ page }) => {
    await page.goto('/contact')
    
    // Fill contact form
    await page.fill('[data-testid="name-input"]', 'John Doe')
    await page.fill('[data-testid="email-input"]', 'john@example.com')
    await page.fill('[data-testid="phone-input"]', '+1234567890')
    await page.selectOption('[data-testid="subject-select"]', 'General Inquiry')
    await page.fill('[data-testid="message-textarea"]', 'I would like to know more about your hotel services.')
    
    await page.click('[data-testid="submit-button"]')
    
    // Verify form submission
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Message sent successfully')
  })

  test('should validate contact form inputs', async ({ page }) => {
    await page.goto('/contact')
    
    // Try to submit empty form
    await page.click('[data-testid="submit-button"]')
    
    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="message-error"]')).toBeVisible()
    
    // Fill invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email')
    await page.click('[data-testid="submit-button"]')
    
    // Verify email validation
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email')
  })

  test('should display Google Maps correctly', async ({ page }) => {
    await page.goto('/contact')
    
    // Verify Google Maps iframe is loaded
    await expect(page.locator('[data-testid="google-maps"]')).toBeVisible()
    
    // Check if map loads (iframe should have src)
    const mapIframe = page.locator('[data-testid="google-maps"] iframe')
    await expect(mapIframe).toHaveAttribute('src', /maps\.google\.com/)
  })

  test('should test responsive navigation', async ({ page }) => {
    // Test desktop navigation
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    
    await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible()
    
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test mobile menu links
    await page.click('[data-testid="mobile-menu"] a[href="/rooms"]')
    await expect(page).toHaveURL('/rooms')
  })
})
