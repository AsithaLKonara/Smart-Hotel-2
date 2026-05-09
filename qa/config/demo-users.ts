import { Page, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

export const demoUsers = {
  admin: {
    email: 'admin@smarthotel.com',
    password: 'SmartHotel@2025!Admin',
    expectedRole: 'SUPER_ADMIN',
  },
  manager: {
    email: 'manager@smarthotel.com',
    password: 'SmartHotel@2025!Manager',
    expectedRole: 'MANAGER',
  },
  receptionist: {
    email: 'receptionist@smarthotel.com',
    password: 'SmartHotel@2025!Reception',
    expectedRole: 'RECEPTIONIST',
  },
  kitchen: {
    email: 'kitchen@smarthotel.com',
    password: 'SmartHotel@2025!Kitchen',
    expectedRole: 'KITCHEN_STAFF',
  },
  guest: {
    email: 'guest@example.com',
    password: 'SmartHotel@2025!Guest',
    expectedRole: 'GUEST',
  },
  guestb: {
    email: 'guestb@example.com',
    password: 'SmartHotel@2025!GuestB',
    expectedRole: 'GUEST',
  },
}

/**
 * Automates sign-in process for any valid demo role and blocks until redirection completes
 */
export async function loginAsUser(page: Page, roleKey: keyof typeof demoUsers, baseUrl: string) {
  const user = demoUsers[roleKey]

  const performLogin = async () => {
    await page.goto(`${baseUrl}/auth/signin`)
    await page.fill('input[type="email"]', user.email)
    await page.fill('input[type="password"]', user.password)
    await page.click('button[type="submit"]')
    
    // Wait for the URL to change away from /auth/signin and resolve to a valid dashboard or landing route
    await page.waitForURL((url) => {
      const path = url.pathname
      return !path.includes('/auth/signin') && (
        path.includes('/dashboard') || 
        path.includes('/admin/bookings') || 
        path.includes('/admin/tasks') ||
        path === '/'
      )
    }, { timeout: 10000 }).catch(() => {})
  }

  await performLogin()

  // Self-heal: If redirected back to signin immediately due to transient session drop on cold mount, retry logging in
  if (page.url().includes('/auth/signin')) {
    console.warn(`[Login Self-Healing] Redirected back to signin for role ${roleKey}. Retrying authentication...`)
    await page.waitForTimeout(1000)
    await performLogin()
  }

  // Ensure any spinners are gone
  await expect(page.locator('.animate-spin, svg.animate-spin')).not.toBeVisible({ timeout: 15000 }).catch(() => {})
  
  // Wait for the page's primary heading (h1) to be visible, ensuring full rendering and context-level hydration
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
  await page.waitForTimeout(1000)
}

/**
 * Asserts database-level existence and role mapping for all five primary accounts
 */
export async function verifyDemoUsersSeeded() {
  const prisma = new PrismaClient()
  try {
    for (const [key, user] of Object.entries(demoUsers)) {
      if (key === 'guestb') continue // Skip dynamic test-only guest accounts during pre-flight seed validation
      const dbUser = await prisma.user.findFirst({
        where: { email: user.email },
      })
      if (!dbUser) {
        throw new Error(`Demo user check failed: User with email ${user.email} is not seeded in the database.`)
      }
      if (dbUser.role !== user.expectedRole) {
        throw new Error(`Demo user check failed: Email ${user.email} is expected to have role ${user.expectedRole} but has ${dbUser.role}.`)
      }
    }
    console.log('✅ Demo Governance: All primary demo accounts are active and role-validated.')
  } catch (error) {
    console.error('❌ Demo Governance Pre-Flight Validation Failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}
