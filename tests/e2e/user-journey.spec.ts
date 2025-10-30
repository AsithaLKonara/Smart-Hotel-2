import { test, expect } from '@playwright/test'

test.describe('User Journey E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should complete full user journey from registration to booking', async ({ page }) => {
    // Step 1: Register new account
    await page.click('text=Sign Up')
    await expect(page).toHaveURL('/auth/signup')
    
    await page.fill('[data-testid="name-input"]', 'Sarah Johnson')
    await page.fill('[data-testid="email-input"]', 'sarah.johnson@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePassword123!')
    
    await page.click('[data-testid="signup-button"]')
    
    // Verify registration success
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Account created successfully')
    
    // Step 2: Login
    await page.goto('/auth/signin')
    
    await page.fill('[data-testid="email-input"]', 'sarah.johnson@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
    
    await page.click('[data-testid="signin-button"]')
    
    // Verify login success and redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Step 3: Explore hotel information
    await page.click('text=About Us')
    await expect(page).toHaveURL('/about')
    await expect(page.locator('h1')).toContainText('About Us')
    
    await page.click('text=Facilities')
    await expect(page).toHaveURL('/facilities')
    await expect(page.locator('h1')).toContainText('Facilities')
    
    await page.click('text=Gallery')
    await expect(page).toHaveURL('/gallery')
    await expect(page.locator('h1')).toContainText('Gallery')
    
    // Step 4: Make booking as registered user
    await page.click('text=Book Room')
    await expect(page).toHaveURL('/booking')
    
    // Fill booking details
    await page.fill('[data-testid="check-in-date"]', '2024-04-01')
    await page.fill('[data-testid="check-out-date"]', '2024-04-04')
    await page.selectOption('[data-testid="guests-select"]', '2')
    
    await page.click('[data-testid="room-type-presidential-suite"]')
    
    // User information should be pre-filled
    await expect(page.locator('[data-testid="guest-name"]')).toHaveValue('Sarah Johnson')
    await expect(page.locator('[data-testid="guest-email"]')).toHaveValue('sarah.johnson@example.com')
    
    await page.click('[data-testid="book-now-button"]')
    
    // Verify booking confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirmation-code"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-price"]')).toContainText('$2,997')
    
    // Step 5: View booking history
    await page.click('text=My Bookings')
    await expect(page).toHaveURL('/my-bookings')
    
    // Verify booking appears in history
    await expect(page.locator('[data-testid="booking-item"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="booking-room-type"]')).toContainText('Presidential Suite')
    await expect(page.locator('[data-testid="booking-status"]')).toContainText('CONFIRMED')
    
    // Step 6: Update profile
    await page.click('[data-testid="profile-menu"]')
    await page.click('text=Profile Settings')
    
    await page.fill('[data-testid="phone-input"]', '+1555123456')
    await page.fill('[data-testid="address-input"]', '123 Main St, City, State')
    await page.selectOption('[data-testid="preferences-select"]', 'email')
    
    await page.click('[data-testid="save-profile"]')
    
    // Verify profile update
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Profile updated successfully')
    
    // Step 7: Test restaurant ordering
    await page.click('text=Restaurant')
    await expect(page).toHaveURL('/order')
    
    // Browse menu
    const menuCategories = page.locator('[data-testid="menu-category"]')
    await expect(menuCategories).toHaveCount(await menuCategories.count())
    
    // Add items to cart
    await page.click('[data-testid="menu-item-caesar-salad"]')
    await page.click('[data-testid="add-to-cart"]')
    
    await page.click('[data-testid="menu-item-grilled-salmon"]')
    await page.click('[data-testid="add-to-cart"]')
    
    // Verify cart
    await page.click('[data-testid="cart-button"]')
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2)
    
    // Place order
    await page.click('[data-testid="checkout-button"]')
    await page.fill('[data-testid="room-number"]', '205')
    await page.fill('[data-testid="special-requests"]', 'Please deliver to room')
    
    await page.click('[data-testid="place-order"]')
    
    // Verify order confirmation
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible()
    
    // Step 8: Track order
    await page.click('text=Track Order')
    await expect(page.locator('[data-testid="order-status"]')).toContainText('PENDING')
    
    // Step 9: Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    // Verify logout and redirect to homepage
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
  })

  test('should handle password reset flow', async ({ page }) => {
    // Step 1: Request password reset
    await page.goto('/auth/forgot-password')
    
    await page.fill('[data-testid="email-input"]', 'sarah.johnson@example.com')
    await page.click('[data-testid="reset-button"]')
    
    // Verify reset email sent
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset email sent')
    
    // Step 2: Reset password (simulate clicking email link)
    await page.goto('/auth/reset-password?token=mock-reset-token')
    
    await page.fill('[data-testid="password-input"]', 'NewSecurePassword123!')
    await page.fill('[data-testid="confirm-password-input"]', 'NewSecurePassword123!')
    await page.click('[data-testid="reset-button"]')
    
    // Verify password reset success
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset successfully')
    
    // Step 3: Login with new password
    await page.goto('/auth/signin')
    
    await page.fill('[data-testid="email-input"]', 'sarah.johnson@example.com')
    await page.fill('[data-testid="password-input"]', 'NewSecurePassword123!')
    
    await page.click('[data-testid="signin-button"]')
    
    // Verify login success
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle booking modifications', async ({ page }) => {
    // Login as existing user
    await page.goto('/auth/signin')
    await page.fill('[data-testid="email-input"]', 'sarah.johnson@example.com')
    await page.fill('[data-testid="password-input"]', 'NewSecurePassword123!')
    await page.click('[data-testid="signin-button"]')
    
    // Go to booking history
    await page.goto('/my-bookings')
    
    // Modify existing booking
    await page.click('[data-testid="modify-booking-button"]')
    
    // Change dates
    await page.fill('[data-testid="check-in-date"]', '2024-04-02')
    await page.fill('[data-testid="check-out-date"]', '2024-04-05')
    
    await page.click('[data-testid="update-booking"]')
    
    // Verify booking updated
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Booking updated successfully')
    
    // Cancel booking
    await page.click('[data-testid="cancel-booking-button"]')
    await page.click('[data-testid="confirm-cancel"]')
    
    // Verify booking cancelled
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Booking cancelled successfully')
    await expect(page.locator('[data-testid="booking-status"]')).toContainText('CANCELLED')
  })

  test('should handle multiple bookings', async ({ page }) => {
    // Login as existing user
    await page.goto('/auth/signin')
    await page.fill('[data-testid="email-input"]', 'sarah.johnson@example.com')
    await page.fill('[data-testid="password-input"]', 'NewSecurePassword123!')
    await page.click('[data-testid="signin-button"]')
    
    // Make first booking
    await page.goto('/booking')
    await page.fill('[data-testid="check-in-date"]', '2024-05-01')
    await page.fill('[data-testid="check-out-date"]', '2024-05-03')
    await page.selectOption('[data-testid="guests-select"]', '1')
    await page.click('[data-testid="room-type-deluxe-king"]')
    await page.click('[data-testid="book-now-button"]')
    
    // Verify first booking
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible()
    
    // Make second booking
    await page.goto('/booking')
    await page.fill('[data-testid="check-in-date"]', '2024-06-01')
    await page.fill('[data-testid="check-out-date"]', '2024-06-04')
    await page.selectOption('[data-testid="guests-select"]', '2')
    await page.click('[data-testid="room-type-executive-suite"]')
    await page.click('[data-testid="book-now-button"]')
    
    // Verify second booking
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible()
    
    // Check booking history
    await page.goto('/my-bookings')
    await expect(page.locator('[data-testid="booking-item"]')).toHaveCount(2)
    
    // Verify both bookings are displayed
    const bookingTypes = await page.locator('[data-testid="booking-room-type"]').allTextContents()
    expect(bookingTypes).toContain('Deluxe King')
    expect(bookingTypes).toContain('Executive Suite')
  })

  test('should handle loyalty program', async ({ page }) => {
    // Login as existing user
    await page.goto('/auth/signin')
    await page.fill('[data-testid="email-input"]', 'sarah.johnson@example.com')
    await page.fill('[data-testid="password-input"]', 'NewSecurePassword123!')
    await page.click('[data-testid="signin-button"]')
    
    // Check loyalty status
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="loyalty-points"]')).toBeVisible()
    await expect(page.locator('[data-testid="membership-tier"]')).toBeVisible()
    
    // View loyalty benefits
    await page.click('[data-testid="loyalty-program"]')
    await expect(page.locator('[data-testid="loyalty-benefits"]')).toBeVisible()
    
    // Check point history
    await page.click('[data-testid="point-history"]')
    await expect(page.locator('[data-testid="point-transactions"]')).toBeVisible()
  })

  test('should handle preferences and notifications', async ({ page }) => {
    // Login as existing user
    await page.goto('/auth/signin')
    await page.fill('[data-testid="email-input"]', 'sarah.johnson@example.com')
    await page.fill('[data-testid="password-input"]', 'NewSecurePassword123!')
    await page.click('[data-testid="signin-button"]')
    
    // Go to preferences
    await page.goto('/dashboard')
    await page.click('[data-testid="preferences-menu"]')
    
    // Update notification preferences
    await page.check('[data-testid="email-notifications"]')
    await page.check('[data-testid="sms-notifications"]')
    await page.uncheck('[data-testid="marketing-emails"]')
    
    // Update room preferences
    await page.selectOption('[data-testid="room-type-preference"]', 'Deluxe King')
    await page.selectOption('[data-testid="floor-preference"]', 'High Floor')
    await page.check('[data-testid="city-view-preference"]')
    
    // Save preferences
    await page.click('[data-testid="save-preferences"]')
    
    // Verify preferences saved
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Preferences updated')
    
    // Check notification settings
    await page.click('[data-testid="notification-settings"]')
    await expect(page.locator('[data-testid="email-notifications"]')).toBeChecked()
    await expect(page.locator('[data-testid="sms-notifications"]')).toBeChecked()
    await expect(page.locator('[data-testid="marketing-emails"]')).not.toBeChecked()
  })
})
