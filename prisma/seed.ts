import { PrismaClient, RoomStatus, BookingStatus, BookingSource, PaymentStatus, PaymentMethod, TaskType, TaskStatus, Priority, UserRole } from '@prisma/client'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'


const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING PERFORMANCE-OPTIMIZED SEED ---')

  // 1. CLEAN DB
  // 1. CLEAN DB (Order matters for relations)
  const collections = [
    'auditLog', 'syncLog', 'outbox', 'task', 'invoiceLineItem', 
    'invoice', 'financialAdjustment', 'payment', 'bookingGuest', 
    'booking', 'roomStatusHistory', 'room', 'roomType', 
    'staff', 'loyaltyPoint', 'user'
  ]
  
  console.log('🧹 Cleaning collections...')
  for (const modelName of collections) {
    // @ts-ignore
    if (prisma[modelName]) {
      try {
        // @ts-ignore
        await prisma[modelName].deleteMany()
      } catch (e) {
        console.warn(`⚠️ Failed to clear ${modelName}, might be due to relations.`)
      }
    }
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

  // 4. CREATE STAFF (Match Sign-in Page Demo Credentials)
  const demoStaff = [
    { role: UserRole.SUPER_ADMIN, email: 'admin@smarthotel.com', password: 'SmartHotel@2025!Admin', name: 'Admin User' },
    { role: UserRole.MANAGER, email: 'manager@smarthotel.com', password: 'SmartHotel@2025!Manager', name: 'Manager User' },
    { role: UserRole.RECEPTIONIST, email: 'receptionist@smarthotel.com', password: 'SmartHotel@2025!Reception', name: 'Receptionist User' },
    { role: UserRole.KITCHEN, email: 'kitchen@smarthotel.com', password: 'SmartHotel@2025!Kitchen', name: 'Kitchen Staff' },
    { role: UserRole.HOUSEKEEPING, email: 'housekeeping1@smarthotel.com', password: 'password123', name: 'Housekeeping User' },
    { role: UserRole.MAINTENANCE, email: 'maintenance1@smarthotel.com', password: 'password123', name: 'Maintenance User' },
  ]

  const staffMembers = []
  for (const demo of demoStaff) {
    const hashedPassword = await bcrypt.hash(demo.password, 12)
    const user = await prisma.user.create({
      data: {
        name: demo.name,
        email: demo.email,
        password: hashedPassword,
        role: demo.role,
        staffProfile: {
          create: {
            name: demo.name,
            employeeId: `EMP-${demo.role}-${faker.string.alphanumeric(3).toUpperCase()}`,
            position: demo.role.toString(),
            department: 'OPERATIONS'
          }
        }
      },
      include: { staffProfile: true }
    })
    if (user.staffProfile) staffMembers.push(user.staffProfile)
  }

  // Predictable Guest (Match Sign-in Page)
  await prisma.user.create({
    data: { 
      name: 'Guest User', 
      email: 'guest@example.com', 
      password: await bcrypt.hash('SmartHotel@2025!Guest', 12), 
      role: UserRole.GUEST 
    }
  })

  // 5. SIMULATE HISTORY
  console.log('- Generating 6 months of operations (Parallelized)...')
  const guests = await Promise.all(
    Array.from({ length: 40 }).map(async () => prisma.user.create({
      data: { 
        name: faker.person.fullName(), 
        email: faker.internet.email().toLowerCase(), 
        password: await bcrypt.hash('password123', 12), 
        role: UserRole.GUEST 
      }
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
              guest: { connect: { id: guest.id } },
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
                ...(hksId && { assignedStaff: { connect: { id: hksId } } })
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