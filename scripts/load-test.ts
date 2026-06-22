import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import path from 'path'

// Load environment configurations atomically before initializing Prisma client
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const prisma = new PrismaClient()
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'
const CONCURRENCY_LEVEL = 20

async function main() {
  console.log('⚡ Starting SmartHotel SRE Concurrency & Consistency Load Test...\n')

  // 1. Ensure a clean test room is available in the database
  let room = await prisma.room.findFirst({
    where: { number: '999' },
  })

  if (!room) {
    console.log('🔧 Test room 999 not found. Creating a clean test room...')
    const standardType = await prisma.roomType.findFirst({
      where: { name: 'Standard Room' },
    })
    if (!standardType) {
      throw new Error('Standard Room type not found in database. Run database seed first!')
    }
    room = await prisma.room.create({
      data: {
        number: '999',
        floor: 3,
        capacity: 2,
        size: 350,
        status: 'AVAILABLE',
        roomTypeId: standardType.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  } else {
    // Reset room status to AVAILABLE
    await prisma.room.update({
      where: { id: room.id },
      data: { status: 'AVAILABLE' },
    })
  }

  const roomId = room.id
  console.log(`📍 Using Test Room ID: ${roomId} (Room Number: ${room.number})`)

  // 2. Clean up any existing bookings for this room to start fresh
  const bookingsToDeleteInit = await prisma.booking.findMany({
    where: { roomId },
    select: { id: true }
  })
  const bookingIdsInit = bookingsToDeleteInit.map(b => b.id)
  
  if (bookingIdsInit.length > 0) {
    await prisma.invoiceLineItem.deleteMany({
      where: { invoice: { bookingId: { in: bookingIdsInit } } }
    })
    await prisma.invoice.deleteMany({
      where: { bookingId: { in: bookingIdsInit } }
    })
    await prisma.payment.deleteMany({
      where: { bookingId: { in: bookingIdsInit } }
    })
    const deleteResult = await prisma.booking.deleteMany({
      where: { id: { in: bookingIdsInit } }
    })
    console.log(`🧹 Deleted ${deleteResult.count} pre-existing bookings for Room 999.\n`)
  } else {
    console.log(`🧹 Deleted 0 pre-existing bookings for Room 999.\n`)
  }

  // 2b. Authenticate programmatically to bypass route protection middleware
  console.log('🔑 Authenticating as demo guest to obtain session token...')
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`)
  const csrfData = await csrfRes.json()
  const csrfToken = csrfData.csrfToken
  const csrfCookie = csrfRes.headers.get('set-cookie')
  const cookieHeader = csrfCookie ? csrfCookie.split(';')[0] : ''
  
  const signinRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieHeader
    },
    body: new URLSearchParams({
      email: 'guest@example.com',
      password: 'SmartHotel@2025!Guest',
      csrfToken,
      redirect: 'false',
      json: 'true'
    })
  })
  
  const signinSetCookie = signinRes.headers.get('set-cookie')
  if (!signinSetCookie) {
    throw new Error('Failed to retrieve session token during load test authentication!')
  }
  const sessionTokenCookie = signinSetCookie
    .split(',')
    .map(c => c.trim())
    .find(c => c.startsWith('next-auth.session-token=') || c.startsWith('__Secure-next-auth.session-token='))
  
  if (!sessionTokenCookie) {
    throw new Error('next-auth.session-token cookie not found in signin response!')
  }
  const sessionCookieHeader = sessionTokenCookie.split(';')[0]
  console.log('✅ Programmatic authentication succeeded.\n')

  // 3. Prepare concurrent booking payloads (overlapping dates)
  const checkInDate = new Date('2026-08-10T14:00:00.000Z').toISOString()
  const checkOutDate = new Date('2026-08-15T11:00:00.000Z').toISOString()
  
  const payloads = Array.from({ length: CONCURRENCY_LEVEL }).map((_, index) => ({
    roomId,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: 2,
    paymentMethod: 'pay_later',
    guestName: `SRE Concurrent Tester ${index + 1}`,
    guestEmail: `concurrent-tester-${index + 1}@smarthotel.com`,
    guestPhone: '555-0199',
  }))

  console.log(`🚀 Dispatching ${CONCURRENCY_LEVEL} overlapping booking requests concurrently...`)

  const start = Date.now()
  
  // Trigger all requests in parallel
  const responses = await Promise.all(
    payloads.map(async (payload, idx) => {
      try {
        const res = await fetch(`${BASE_URL}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': `loadtest-idx-${idx + 1}-${Date.now()}`,
            'Cookie': sessionCookieHeader,
          },
          body: JSON.stringify(payload),
        })
        const status = res.status
        const body = await res.json().catch(() => ({}))
        return { success: true, status, body }
      } catch (err: any) {
        return { success: false, error: err.message, status: 0, body: {} }
      }
    })
  )

  const duration = Date.now() - start
  console.log(`⏱️ All requests completed in ${duration}ms.\n`)

  // 4. Audit responses
  let successCount = 0
  let conflictCount = 0
  let errorCount = 0
  let unhandledCount = 0

  const statusMap: Record<number, number> = {}

  responses.forEach((res, idx) => {
    if (!res.success) {
      errorCount++
      console.error(`❌ Request ${idx + 1}: Connection Failed (${res.error})`)
      return
    }

    const status = res.status
    statusMap[status] = (statusMap[status] || 0) + 1

    if (status === 201) {
      successCount++
      console.log(`✅ Request ${idx + 1}: Booking Created! (201 Created) | Confirmation: ${res.body.booking?.confirmationCode}`)
    } else if (status === 409 || (status === 400 && (res.body.error?.includes('LOCK_ACQUISITION_FAILED') || res.body.error?.includes('DOUBLE_BOOKING')))) {
      conflictCount++
    } else {
      unhandledCount++
      console.warn(`⚠️ Request ${idx + 1}: Unexpected Response (${status}) | Body:`, JSON.stringify(res.body))
    }
  })

  // 5. Output gorgeous SRE load report
  console.log('\n==================================================')
  console.log('📋 SRE CONCURRENCY & TRANSACTION ISOLATION REPORT')
  console.log('==================================================')
  console.log(`Total Requests Sent : ${CONCURRENCY_LEVEL}`)
  console.log(`Concurrency Window  : ${duration}ms`)
  console.log(`Average Latency     : ${Math.round(duration / CONCURRENCY_LEVEL)}ms/req`)
  console.log(`\nStatus Distribution:`)
  Object.entries(statusMap).forEach(([status, count]) => {
    console.log(`  - HTTP ${status}: ${count} requests`)
  })
  if (errorCount > 0) {
    console.log(`  - Connection Failures: ${errorCount}`)
  }

  console.log('\n🔍 Consistency Validation Check:')
  const cleanSuccess = successCount === 1
  const cleanConflicts = conflictCount === CONCURRENCY_LEVEL - 1

  if (cleanSuccess) {
    console.log('  [PASS] Exactly ONE booking was successfully created. Zero double-bookings detected!')
  } else {
    console.error(`  [FAIL] Expected exactly 1 successful booking, but found ${successCount}! Potential double-booking vulnerability!`)
  }

  if (cleanConflicts) {
    console.log(`  [PASS] Exactly ${conflictCount} overlapping requests were rejected with 409/400 (Conflict/Lock).`)
  } else {
    console.warn(`  [WARN] Expected ${CONCURRENCY_LEVEL - 1} rejections with 409/400, but found ${conflictCount}.`)
  }

  // 6. Cleanup testing data
  console.log('\n🧹 Cleaning up SRE test room database data...')
  const bookingsToDelete = await prisma.booking.findMany({
    where: { roomId },
    select: { id: true }
  })
  const bookingIds = bookingsToDelete.map(b => b.id)
  
  if (bookingIds.length > 0) {
    await prisma.invoiceLineItem.deleteMany({
      where: { invoice: { bookingId: { in: bookingIds } } }
    })
    await prisma.invoice.deleteMany({
      where: { bookingId: { in: bookingIds } }
    })
    await prisma.payment.deleteMany({
      where: { bookingId: { in: bookingIds } }
    })
    await prisma.booking.deleteMany({
      where: { id: { in: bookingIds } }
    })
  }
  console.log('  - Booking test data cleaned up successfully.')

  console.log('==================================================')
  if (cleanSuccess && cleanConflicts && errorCount === 0 && unhandledCount === 0) {
    console.log('🎉 SRE CONCURRENCY VERIFICATION PASSED SUCCESSFULLY!')
    console.log('==================================================\n')
    process.exit(0)
  } else {
    console.error('❌ SRE CONCURRENCY VERIFICATION FAILED!')
    console.log('==================================================\n')
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('Fatal execution error in load test:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
