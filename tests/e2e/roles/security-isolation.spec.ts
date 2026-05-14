import { test, expect } from '../fixtures'

test.describe('Security Isolation & RBAC Enforcement', () => {

  test('GUEST - Unauthorized Access Denied', async ({ guestPage }) => {
    const restrictedRoutes = [
      '/admin/dashboard',
      '/admin/settings',
      '/admin/audit-logs',
      '/admin/staff',
      '/kitchen/dashboard',
      '/admin/housekeeping'
    ]
    
    for (const route of restrictedRoutes) {
      await guestPage.goto(route)
      // Should redirect to signin or home, or show access denied
      await expect(guestPage.url()).not.toContain(route)
    }
  })

  test('KITCHEN - Unauthorized Access Denied', async ({ kitchenPage }) => {
    const restrictedRoutes = [
      '/admin/dashboard',
      '/admin/settings',
      '/admin/staff',
      '/admin/receptionist',
      '/admin/housekeeping'
    ]
    
    for (const route of restrictedRoutes) {
      await kitchenPage.goto(route)
      await expect(kitchenPage.url()).not.toContain(route)
    }
  })

  test('HOUSEKEEPING - Unauthorized Access Denied', async ({ housekeepingPage }) => {
    const restrictedRoutes = [
      '/admin/dashboard',
      '/admin/settings',
      '/kitchen/dashboard',
      '/admin/receptionist'
    ]
    
    for (const route of restrictedRoutes) {
      await housekeepingPage.goto(route)
      await expect(housekeepingPage.url()).not.toContain(route)
    }
  })

  test('RECEPTIONIST - Unauthorized Access Denied', async ({ receptionistPage }) => {
    const restrictedRoutes = [
      '/admin/dashboard',
      '/admin/settings',
      '/admin/staff', // Unless receptionist manages staff (usually not)
      '/kitchen/dashboard'
    ]
    
    for (const route of restrictedRoutes) {
      await receptionistPage.goto(route)
      await expect(receptionistPage.url()).not.toContain(route)
    }
  })

  test('Unauthenticated Access - Global Redirection', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/admin/dashboard',
      '/kitchen/dashboard'
    ]
    
    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/auth\/signin/)
    }
  })
})
