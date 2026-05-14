import { PrismaClient, RoomStatus, BookingStatus, BookingSource, PaymentStatus, PaymentMethod, TaskType, TaskStatus, Priority, UserRole } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING PERFORMANCE-OPTIMIZED SEED ---')

  // 1. CLEAN DB
  const collections = ['AuditLog', 'SyncLog', 'Outbox', 'Task', 'InvoiceLineItem', 'Invoice', 'FinancialAdjustment', 'Payment', 'BookingGuest', 'Booking', 'RoomStatusHistory', 'Room', 'RoomType', 'Staff', 'LoyaltyAccount', 'User']
  for (const c of collections) {
    // @ts-ignore
    await prisma[c.charAt(0).toLowerCase() + c.slice(1)].deleteMany()
  }

  // 2. CREATE ROOM TYPES
  const roomTypes = [
    { name: 'Standard', baseRate: 15000, capacity: 2, amenities: ['Wifi', 'TV'] },
    { name: 'Deluxe', baseRate: 25000, capacity: 2, amenities: ['Wifi', 'TV', 'City View'] },
    { name: 'Suite', baseRate: 45000, capacity: 3, amenities: ['Wifi', 'TV', 'Mini Bar'] },
    { name: 'Presidential', baseRate: 120000, capacity: 4, amenities: ['Wifi', 'TV', 'Bar', 'Jacuzzi'] }
  ]

  const createdRoomTypes = await Promise.all(
    roomTypes.map(rt => prisma.roomType.create({ data: { ...rt, description: faker.lorem.sentence() } }))
  )

  // 3. CREATE ROOMS
  const roomData = []
  for (let floor = 1; floor <= 5; floor++) {
    for (let i = 1; i <= 20; i++) {
      const type = i > 18 ? createdRoomTypes[3] : i > 15 ? createdRoomTypes[2] : i > 10 ? createdRoomTypes[1] : createdRoomTypes[0]
      roomData.push({
        number: `${floor}${i.toString().padStart(2, '0')}`,
        floor,
        roomTypeId: type.id,
        status: RoomStatus.AVAILABLE
      })
    }
  }
  
  // Use createMany for speed where no relations are needed during creation
  await prisma.room.createMany({ data: roomData })
  const rooms = await prisma.room.findMany()
  console.log(`- Seeded ${rooms.length} Rooms.`)

  // 4. CREATE STAFF
  const roles = [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.HOUSEKEEPING, UserRole.MAINTENANCE]
  const staffMembers = []
  for (const role of roles) {
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
        role: role,
        staffProfile: {
          create: {
            employeeId: `EMP-${faker.string.alphanumeric(5).toUpperCase()}`,
            position: role.toString(),
            department: 'OPERATIONS'
          }
        }
      },
      include: { staffProfile: true }
    })
    if (user.staffProfile) staffMembers.push(user.staffProfile)
  }

  // 5. SIMULATE HISTORY
  console.log('- Generating 6 months of operations (Parallelized)...')
  const guests = await Promise.all(
    Array.from({ length: 40 }).map(() => prisma.user.create({
      data: { name: faker.person.fullName(), email: faker.internet.email().toLowerCase(), password: 'p', role: UserRole.GUEST }
    }))
  )

  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 6)
  const today = new Date()

  // Process in weekly chunks to avoid overwhelming MongoDB
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 7)) {
    const weekBatch = []
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(d)
      currentDay.setDate(currentDay.getDate() + i)
      if (currentDay > today) break

      const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6
      const occupancyCount = isWeekend ? 8 : 3
      
      for (let b = 0; b < occupancyCount; b++) {
        const room = faker.helpers.arrayElement(rooms)
        const guest = faker.helpers.arrayElement(guests)
        const roomType = createdRoomTypes.find(rt => rt.id === room.roomTypeId)!
        
        weekBatch.push((async () => {
          const booking = await prisma.booking.create({
            data: {
              confirmationCode: `SH-${faker.string.alphanumeric(6).toUpperCase()}`,
              checkIn: currentDay,
              checkOut: new Date(currentDay.getTime() + 2 * 24 * 3600000),
              status: currentDay < today ? BookingStatus.CHECKED_OUT : BookingStatus.CONFIRMED,
              totalAmount: roomType.baseRate * 2,
              room: { connect: { id: room.id } },
              primaryGuest: { connect: { id: guest.id } },
              payments: {
                create: {
                  amount: roomType.baseRate * 2,
                  method: PaymentMethod.CARD,
                  status: PaymentStatus.PAID,
                  providerId: `pi_${faker.string.alphanumeric(20)}`
                }
              }
            }
          })
          
          if (currentDay < today) {
            const hksId = staffMembers.find(s => s.position === UserRole.HOUSEKEEPING.toString())?.id
            await prisma.task.create({
              data: {
                type: TaskType.HOUSEKEEPING,
                status: TaskStatus.COMPLETED,
                title: `Clean Room ${room.number}`,
                room: { connect: { id: room.id } },
                booking: { connect: { id: booking.id } },
                ...(hksId && { staff: { connect: { id: hksId } } })
              }
            })
          }
        })())
      }
    }
    
    await Promise.all(weekBatch)
    console.log(`- Seeded week starting ${d.toDateString()}`)
  }

  console.log('--- SEEDING COMPLETE: OPERATIONAL DATASET CERTIFIED ---')
}

main().finally(() => prisma.$disconnect())