const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting Enterprise Operational Seed...')

  // 1. Clean existing data (careful order for referential integrity)
  console.log('🧹 Cleaning existing collections...')
  await prisma.task.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.booking.deleteMany({})
  await prisma.roomImage.deleteMany({})
  await prisma.room.deleteMany({})
  await prisma.roomType.deleteMany({})
  await prisma.staff.deleteMany({})
  await prisma.user.deleteMany({})

  // 2. Create Users
  console.log('👥 Creating Enterprise Users...')
  const adminUser = await prisma.user.create({
    data: {
      name: 'Executive Admin',
      email: 'admin@smarthotel.com',
      password: 'password123', // Standard test password
      role: 'SUPER_ADMIN'
    }
  })

  const receptionistUser = await prisma.user.create({
    data: {
      name: 'Sarah Reception',
      email: 'reception@smarthotel.com',
      password: 'password123',
      role: 'RECEPTIONIST'
    }
  })

  const guestUser = await prisma.user.create({
    data: {
      name: 'John Guest',
      email: 'guest@example.com',
      password: 'password123',
      role: 'GUEST'
    }
  })

  // 3. Create Room Types
  console.log('🏨 Creating Room Types...')
  const types = [
    {
      name: 'King Deluxe',
      description: 'Spacious room with a king-size bed and city view.',
      baseRate: 250,
      capacity: 2,
      amenities: ['WiFi', 'Mini Bar', 'Ocean View', 'Smart TV'],
      images: ['https://images.unsplash.com/photo-1590490359683-658d3d23f972']
    },
    {
      name: 'Presidential Suite',
      description: 'The pinnacle of luxury with panoramic views and private terrace.',
      baseRate: 1200,
      capacity: 4,
      amenities: ['WiFi', 'Mini Bar', 'Butler Service', 'Jacuzzi', 'Kitchen'],
      images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b']
    },
    {
      name: 'Standard Twin',
      description: 'Comfortable room with two twin beds, perfect for travel partners.',
      baseRate: 150,
      capacity: 2,
      amenities: ['WiFi', 'Desk', 'Coffee Maker'],
      images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a']
    }
  ]

  const createdTypes = []
  for (const t of types) {
    const type = await prisma.roomType.create({ data: t })
    createdTypes.push(type)
  }

  // 4. Create Rooms
  console.log('🚪 Creating Rooms...')
  const rooms = [
    { number: '101', floor: 1, roomTypeId: createdTypes[0].id, status: 'AVAILABLE' },
    { number: '102', floor: 1, roomTypeId: createdTypes[0].id, status: 'OCCUPIED' },
    { number: '201', floor: 2, roomTypeId: createdTypes[1].id, status: 'AVAILABLE' },
    { number: '301', floor: 3, roomTypeId: createdTypes[2].id, status: 'DIRTY' },
  ]

  const createdRooms = []
  for (const r of rooms) {
    const room = await prisma.room.create({
      data: {
        ...r,
        roomImages: {
          create: [
            { imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a' }
          ]
        }
      }
    })
    createdRooms.push(room)
  }

  // 5. Create Staff
  console.log('👔 Creating Staff Records...')
  await prisma.staff.create({
    data: {
      userId: adminUser.id,
      employeeId: 'EMP001',
      department: 'Management',
      position: 'General Manager',
      isActive: true
    }
  })

  await prisma.staff.create({
    data: {
      userId: receptionistUser.id,
      employeeId: 'EMP002',
      department: 'Front Office',
      position: 'Senior Receptionist',
      isActive: true
    }
  })

  // 6. Create a Sample Booking
  console.log('📅 Creating Sample Bookings...')
  await prisma.booking.create({
    data: {
      confirmationCode: 'BK-ENT-001',
      checkIn: new Date('2026-06-01'),
      checkOut: new Date('2026-06-05'),
      status: 'CONFIRMED',
      source: 'WEBSITE',
      roomId: createdRooms[1].id, // Occupied room
      primaryGuestId: guestUser.id,
      totalAmount: 1000,
      version: 1
    }
  })

  console.log('✅ Enterprise Operational Seed Complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
