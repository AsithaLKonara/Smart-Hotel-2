import { test, expect } from '@playwright/test'
import { loginAsUser } from '../../config/demo-users'
import { PrismaClient } from '@prisma/client'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const prisma = new PrismaClient()

test.describe('🔒 Security Audit - API Direct Attack Prevention', () => {
  test.afterAll(async () => {
    await prisma.$disconnect()
  })

  test('❌ GUEST must be BLOCKED from creating inventory via POST /api/inventory', async ({ page }) => {
    // 1. Log in as Guest to establish GUEST cookies/session
    await loginAsUser(page, 'guest', BASE_URL)

    // 2. Count existing inventory items to verify no partial/unauthorized mutation
    const initialCount = await prisma.inventory.count()

    // 3. Make unauthorized POST request using browser's request context (cookie inherited)
    const response = await page.request.post(`${BASE_URL}/api/inventory`, {
      data: {
        name: 'Unauthorized Security Audit Item',
        category: 'TEST',
        quantity: 100,
        unit: 'pcs',
        minQuantity: 5,
        status: 'IN_STOCK'
      }
    })

    // 4. Assert HTTP unauthorized response
    expect([401, 403]).toContain(response.status())

    // 5. Assert database remains mathematically untouched
    const finalCount = await prisma.inventory.count()
    expect(finalCount).toBe(initialCount)
  })

  test('❌ RECEPTIONIST must be BLOCKED from creating inventory via POST /api/inventory', async ({ page }) => {
    await loginAsUser(page, 'receptionist', BASE_URL)

    const initialCount = await prisma.inventory.count()

    const response = await page.request.post(`${BASE_URL}/api/inventory`, {
      data: {
        name: 'Unauthorized Receptionist Item',
        category: 'TEST',
        quantity: 10,
        unit: 'pcs'
      }
    })

    expect([401, 403]).toContain(response.status())

    const finalCount = await prisma.inventory.count()
    expect(finalCount).toBe(initialCount)
  })

  test('❌ GUEST must be BLOCKED from creating staff via POST /api/staff', async ({ page }) => {
    await loginAsUser(page, 'guest', BASE_URL)

    const initialCount = await prisma.employee.count()

    const response = await page.request.post(`${BASE_URL}/api/staff`, {
      data: {
        employeeId: 'EMP999',
        name: 'Hacker Agent',
        email: 'hacker@smarthotel.com',
        phone: '1234567890',
        position: 'CEO',
        department: 'Management',
        hireDate: new Date().toISOString(),
        salary: 1000000,
        isActive: true
      }
    })

    expect([401, 403]).toContain(response.status())

    const finalCount = await prisma.employee.count()
    expect(finalCount).toBe(initialCount)
  })

  test('❌ KITCHEN must be BLOCKED from creating staff via POST /api/staff', async ({ page }) => {
    await loginAsUser(page, 'kitchen', BASE_URL)

    const initialCount = await prisma.employee.count()

    const response = await page.request.post(`${BASE_URL}/api/staff`, {
      data: {
        employeeId: 'EMP888',
        name: 'Kitchen Chef Intruder',
        email: 'intruder@smarthotel.com',
        phone: '1234567890',
        position: 'Sous Chef',
        department: 'Kitchen',
        hireDate: new Date().toISOString(),
        salary: 50000,
        isActive: true
      }
    })

    expect([401, 403]).toContain(response.status())

    const finalCount = await prisma.employee.count()
    expect(finalCount).toBe(initialCount)
  })
})
