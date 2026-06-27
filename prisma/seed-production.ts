import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Clearing existing data...')
  
  // Safe clear
  const models = [
    'auditLog', 'task', 'booking', 'room', 'staff', 'user', 'roomType', 'property'
  ]

  for (const model of models) {
    if ((prisma as any)[model]) {
      await (prisma as any)[model].deleteMany()
    }
  }

  console.log('🌱 Seeding new data...')

  // Create Property
  const property = await prisma.property.create({
    data: {
      name: 'SmartHotel Grand Palace',
      code: 'SH-NYC',
      address: '123 Grand Boulevard',
      city: 'New York',
      country: 'USA'
    }
  })

  // Create Admin User
  const passwordHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@smarthotel.local',
      password: passwordHash,
      vipStatus: 'STANDARD',
      roleId: 'admin-role-id' // Optional, based on RBAC logic
    }
  })

  // Create basic Room Type
  const roomType = await prisma.roomType.create({
    data: {
      name: 'Deluxe Suite',
      description: 'A luxurious suite with modern amenities.',
      baseRate: 250.0,
      capacity: 2,
      totalRooms: 10,
      amenities: ['WiFi', 'Minibar', 'Ocean View'],
      images: []
    }
  })

  // Create a few Rooms
  for (let i = 1; i <= 5; i++) {
    await prisma.room.create({
      data: {
        number: `10${i}`,
        floor: 1,
        status: 'AVAILABLE',
        capacity: 2,
        size: 45,
        roomTypeId: roomType.id,
        propertyId: property.id
      }
    })
  }

  console.log(`✅ Seed completed successfully!`)
  console.log(`Property created: ${property.name}`)
  console.log(`Admin user: ${admin.email}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
