import { PrismaClient, RoomStatus, BookingStatus, StayStatus, BookingSource, PaymentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addDays, subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Clearing existing data for performance test...')
  
  // Fast delete all
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Task" CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Feedback" CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "FolioLineItem" CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Folio" CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RoomAssignment" CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "BookingGuest" CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Stay" CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Booking" CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Room" CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "RoomType" CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" CASCADE;`)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Role" CASCADE;`)

  console.log('🌱 Starting high-volume performance database seed...')
  const BATCH_SIZE = 5000

  // 1. ROLES
  const role = await prisma.role.create({
    data: { name: 'GUEST', description: 'Default guest role' }
  })
  const adminRole = await prisma.role.create({
    data: { name: 'SUPER_ADMIN', description: 'Admin' }
  })

  // 2. USERS (50,000)
  console.log('Generating 50,000 Users...')
  const hashedPassword = await bcrypt.hash('SmartHotel@2025!', 10)
  
  // Admin user
  await prisma.user.create({
    data: { email: 'admin@smarthotel.com', password: hashedPassword, name: 'System Admin', roleId: adminRole.id }
  })

  const usersToInsert = []
  for (let i = 0; i < 50000; i++) {
    usersToInsert.push({
      email: `guest${i}@performance.local`,
      password: hashedPassword,
      name: `Perf Guest ${i}`,
      roleId: role.id
    })
  }

  for (let i = 0; i < usersToInsert.length; i += BATCH_SIZE) {
    await prisma.user.createMany({ data: usersToInsert.slice(i, i + BATCH_SIZE) })
    console.log(`  Inserted ${Math.min(i + BATCH_SIZE, 50000)} / 50000 users`)
  }

  // Get some user IDs for booking mapping
  const guestUsers = await prisma.user.findMany({
    where: { roleId: role.id },
    select: { id: true },
    take: 10000
  })

  // 3. ROOM TYPES & ROOMS (500)
  console.log('Generating 500 Rooms...')
  const rt = await prisma.roomType.create({
    data: { name: 'Standard Performance Room', description: 'Test', baseRate: 150, capacity: 2 }
  })

  const roomsToInsert = []
  for (let i = 1; i <= 500; i++) {
    roomsToInsert.push({
      number: `P-${i}`,
      floor: Math.ceil(i / 50),
      status: RoomStatus.AVAILABLE,
      roomTypeId: rt.id
    })
  }
  await prisma.room.createMany({ data: roomsToInsert })

  const rooms = await prisma.room.findMany({ select: { id: true } })

  // 4. BOOKINGS (10,000) & FOLIOS
  console.log('Generating 10,000 Bookings and Folios...')
  const today = new Date()
  
  const bookingsToInsert = []
  const foliosToInsert = []
  const roomAssignmentsToInsert = []

  // Ensure unique confirmation codes
  for (let i = 0; i < 10000; i++) {
    const isFuture = i % 2 === 0
    const checkIn = isFuture ? addDays(today, (i % 30) + 1) : subDays(today, (i % 30) + 1)
    const checkOut = isFuture ? addDays(today, (i % 30) + 3) : subDays(today, (i % 30) - 1)
    const status = isFuture ? BookingStatus.CONFIRMED : BookingStatus.CHECKED_OUT
    const roomId = rooms[i % rooms.length].id
    const guestId = guestUsers[i % guestUsers.length].id

    // We can't batch insert related items with createMany that need parent IDs easily unless we predict IDs or use raw inserts.
    // However, Prisma doesn't return inserted IDs in createMany (for SQLite/Postgres sometimes it does, but wait, Prisma createMany skipDuplicates returns count).
    // The easiest way for bulk inserts with relations is raw queries or UUID generation in code.
  }

  // To solve relation inserts, let's generate UUIDs locally.
  const crypto = require('crypto')

  for (let i = 0; i < 10000; i++) {
    const bookingId = crypto.randomUUID()
    const isFuture = i % 2 === 0
    const checkIn = isFuture ? addDays(today, (i % 30) + 1) : subDays(today, (i % 30) + 1)
    const checkOut = isFuture ? addDays(today, (i % 30) + 3) : subDays(today, (i % 30) - 1)
    
    bookingsToInsert.push({
      id: bookingId,
      confirmationCode: `PERF-${i}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      checkIn,
      checkOut,
      status: isFuture ? BookingStatus.CONFIRMED : BookingStatus.CHECKED_OUT,
      source: BookingSource.WEBSITE,
      primaryGuestId: guestUsers[i % guestUsers.length].id,
      guests: 2,
      totalAmount: 300.0,
      paymentStatus: PaymentStatus.unpaid
    })

    roomAssignmentsToInsert.push({
      id: crypto.randomUUID(),
      bookingId,
      roomId: rooms[i % rooms.length].id,
      startDate: checkIn,
      endDate: checkOut
    })

    // 2 Folios per booking = 20,000 folios
    foliosToInsert.push({
      id: crypto.randomUUID(),
      bookingId,
      type: 'GUEST',
      status: 'OPEN'
    })
    foliosToInsert.push({
      id: crypto.randomUUID(),
      bookingId,
      type: 'INCIDENTAL',
      status: 'OPEN'
    })
  }

  for (let i = 0; i < bookingsToInsert.length; i += BATCH_SIZE) {
    await prisma.booking.createMany({ data: bookingsToInsert.slice(i, i + BATCH_SIZE) })
    await prisma.roomAssignment.createMany({ data: roomAssignmentsToInsert.slice(i, i + BATCH_SIZE) })
    console.log(`  Inserted ${Math.min(i + BATCH_SIZE, 10000)} / 10000 bookings & assignments`)
  }

  for (let i = 0; i < foliosToInsert.length; i += BATCH_SIZE) {
    await prisma.folio.createMany({ data: foliosToInsert.slice(i, i + BATCH_SIZE) })
    console.log(`  Inserted ${Math.min(i + BATCH_SIZE, 20000)} / 20000 folios`)
  }

  console.log('✅ High-volume database seed completed successfully!')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
