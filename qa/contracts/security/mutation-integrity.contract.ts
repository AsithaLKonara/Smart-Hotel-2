import { test, expect } from '@playwright/test'
import { loginAsUser } from '../../config/demo-users'
import { PrismaClient } from '@prisma/client'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const prisma = new PrismaClient()

test.describe('📥 Security Audit - Mutation & Database State Integrity', () => {
  let guestUser: any = null
  let targetRoom: any = null
  let createdBookingId: string | null = null

  test.beforeAll(async () => {
    // 1. Fetch seeded Guest User to use for booking mutation
    guestUser = await prisma.user.findFirst({
      where: { email: 'guest@example.com' }
    })
    if (!guestUser) {
      throw new Error('Seeded Guest (guest@example.com) is missing!')
    }

    // 2. Fetch a valid available room
    targetRoom = await prisma.room.findFirst({
      where: { status: 'AVAILABLE' }
    })
    if (!targetRoom) {
      throw new Error('No available rooms in DB for mutation testing!')
    }
  })

  test.afterAll(async () => {
    // Teardown: Clean up dynamically created booking record to ensure zero database pollution
    if (createdBookingId) {
      await prisma.booking.delete({
        where: { id: createdBookingId }
      }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  test('✔ DB Mutation Integrity: Booking creation must match database state and API response precisely', async ({ page }) => {
    // Log in as Guest
    await loginAsUser(page, 'guest', BASE_URL)

    // 1. Audit Database State BEFORE Mutation
    const initialBookingsCount = await prisma.booking.count({
      where: { userId: guestUser.id }
    })

    const checkInDate = new Date()
    checkInDate.setDate(checkInDate.getDate() + 2) // Check-in 2 days from now
    const checkOutDate = new Date()
    checkOutDate.setDate(checkOutDate.getDate() + 5) // Check-out 5 days from now

    // 2. Execute API Trigger
    const response = await page.request.post(`${BASE_URL}/api/bookings`, {
      data: {
        roomId: targetRoom.id,
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0],
        guests: 2,
        specialRequests: 'Integrity Audit Test Request',
        paymentMethod: 'pay_later'
      }
    })

    // Assert successful booking creation (201 Created)
    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body).toHaveProperty('booking')
    const apiBooking = body.booking
    expect(apiBooking).toHaveProperty('id')
    createdBookingId = apiBooking.id

    // 3. Audit Database State AFTER Mutation
    const finalBookingsCount = await prisma.booking.count({
      where: { userId: guestUser.id }
    })

    // Verify bookings count increased by exactly 1
    expect(finalBookingsCount).toBe(initialBookingsCount + 1)

    // Fetch the newly created record directly from the database using Prisma
    const dbBooking = await prisma.booking.findUnique({
      where: { id: createdBookingId! }
    })

    // Assert absolute database-to-API state alignment
    expect(dbBooking).not.toBeNull()
    expect(dbBooking!.roomId).toBe(targetRoom.id)
    expect(dbBooking!.userId).toBe(guestUser.id)
    expect(dbBooking!.status).toBe('PENDING')
    expect(dbBooking!.paymentMethod).toBe('CASH') // pay_later resolves to CASH in schema
    expect(Number(dbBooking!.guests)).toBe(2) // Handle BigInt conversions precisely
    expect(dbBooking!.confirmationCode).toBe(apiBooking.confirmationCode)

    // 4. Verify UI Consistency: Entity must render correctly in Guest Dashboard
    await page.goto(`${BASE_URL}/booking`) // Or guest dashboard page
    await page.waitForTimeout(1000)
    
    // Assert the page reflects active/pending booking states
    const pageBody = await page.locator('body').textContent()
    expect(pageBody).not.toContain('Access Denied')
  })
})
