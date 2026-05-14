import { Page, expect } from '@playwright/test'

export const TEST_USERS = {
  admin: { email: 'admin@smarthotel.com', password: 'SmartHotel@2025!Admin', role: 'SUPER_ADMIN' },
  manager: { email: 'manager@smarthotel.com', password: 'SmartHotel@2025!Manager', role: 'MANAGER' },
  receptionist: { email: 'receptionist@smarthotel.com', password: 'SmartHotel@2025!Reception', role: 'RECEPTIONIST' },
  guest: { email: 'guest@example.com', password: 'SmartHotel@2025!Guest', role: 'GUEST' },
  kitchen: { email: 'kitchen@smarthotel.com', password: 'SmartHotel@2025!Kitchen', role: 'KITCHEN' },
  housekeeping: { email: 'housekeeping1@smarthotel.com', password: 'password123', role: 'HOUSEKEEPING' },
  maintenance: { email: 'maintenance1@smarthotel.com', password: 'password123', role: 'MAINTENANCE' },
}



export async function loginAs(page: Page, role: keyof typeof TEST_USERS) {
  const user = TEST_USERS[role]
  
  await page.goto('/auth/signin')
  
  // Wait for form to be ready
  await expect(page.locator('input[type="email"]')).toBeVisible()
  
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  
  await page.click('button[type="submit"]')
  
  // Verify successful login (should redirect to dashboard or home)
  await page.waitForLoadState('networkidle')
  
  // Check for common post-login markers
  const isDashboard = page.url().includes('/dashboard') || page.url().includes('/admin')
  const hasUserMenu = await page.locator('[data-testid="user-menu"], .user-menu, button:has-text("Profile")').count() > 0
  
  // Some roles might redirect to home
  if (!isDashboard && !hasUserMenu) {
    // Check if we are still on sign-in page (fail if so)
    if (page.url().includes('/auth/signin')) {
      const error = await page.locator('.error, [role="alert"]').textContent()
      throw new Error(`Login failed for role ${role}: ${error || 'Unknown error'}`)
    }
  }
}

export async function logout(page: Page) {
  await page.goto('/') // Go to home to ensure we can see navigation
  
  const userMenu = page.locator('[data-testid="user-menu"], .user-menu, button:has-text("Profile")').first()
  if (await userMenu.isVisible()) {
    await userMenu.click()
    const logoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Log Out"), a:has-text("Sign Out")').first()
    await logoutBtn.click()
    await page.waitForURL(/\/auth\/signin|\//)
  }
}
