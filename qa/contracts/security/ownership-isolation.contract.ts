import { test, expect } from '@playwright/test'
import { loginAsUser } from '../../config/demo-users'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const prisma = new PrismaClient()

test.describe('🧬 Security Audit - Ownership & Cross-User Isolation', () => {
  let guestA: any = null
  let guestB: any = null
  let bookingA: any = null

  test.beforeAll(async () => {
    // 1. Fetch seeded Guest A (guest@example.com)
    guestA = await prisma.user.findFirst({
      where: { email: 'guest@example.com' }
    })
    if (!guestA) {
      throw new Error('Seeded Guest A (guest@example.com) is missing!')
    }

    // 2. Dynamically create Guest B (guestB@example.com) to test isolation
    const hashedPassword = await bcrypt.hash('SmartHotel@2025!GuestB', 12)
    guestB = await prisma.user.findFirst({
      where: { email: 'guestB@example.com' }
    })
    if (!guestB) {
      guestB = await prisma.user.create({
        data: {
          name: 'Guest B Isolation Test',
          email: 'guestb@example.com',
          password: hashedPassword,
          phone: '0987654321',
          role: 'GUEST',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    // 3. Ensure Guest A has at least one valid booking
    bookingA = await prisma.booking.findFirst({
      where: { userId: guestA.id }
    })
    if (!bookingA) {
      // Find any room
      const room = await prisma.room.findFirst({
        where: { status: 'AVAILABLE' }
      })
      if (!room) {
        throw new Error('No available rooms in DB to create test booking!')
      }
      bookingA = await prisma.booking.create({
        data: {
          roomId: room.id,
          userId: guestA.id,
          checkIn: new Date(),
          checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000),
          guests: 2,
          totalAmount: room.price,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: 'CASH',
          confirmationCode: 'ISOLATION123',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }
  })

  test.afterAll(async () => {
    // Teardown: Clean up Guest B and disconnect Prisma client
    if (guestB) {
      await prisma.booking.deleteMany({
        where: { userId: guestB.id }
      }).catch(() => {})
      await prisma.user.delete({
        where: { id: guestB.id }
      }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  test('❌ Guest B must be FORBIDDEN from viewing Guest A booking details via GET /api/bookings/[id]', async ({ page }) => {
    // Log in as Guest B (fully integrated in demoUsers configuration)
    await loginAsUser(page, 'guestb', BASE_URL)

    // Attempt to access Guest A's booking directly via API
    const response = await page.request.get(`${BASE_URL}/api/bookings/${bookingA.id}`)

    // Expect forbidden status (403)
    expect(response.status()).toBe(403)
  })

  test('❌ Guest B must be BLOCKED from editing Guest A booking via PATCH /api/bookings/[id]', async ({ page }) => {
    // Log in as Guest B
    await loginAsUser(page, 'guestb', BASE_URL)

    // Attempt to modify Guest A's booking status
    const response = await page.request.patch(`${BASE_URL}/api/bookings/${bookingA.id}`, {
      data: {
        status: 'CONFIRMED'
      }
    })

    // Expect unauthorized (receptionist/admin check fails) or forbidden
    expect([401, 403]).toContain(response.status())

    // Verify DB booking remains untouched
    const dbBooking = await prisma.booking.findUnique({
      where: { id: bookingA.id }
    })
    expect(dbBooking?.status).toBe(bookingA.status)
  })
})
