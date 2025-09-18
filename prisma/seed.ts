import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smarthotel.com' },
    update: {},
    create: {
      email: 'admin@smarthotel.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      phone: '+1234567890',
    },
  })

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 12)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@smarthotel.com' },
    update: {},
    create: {
      email: 'manager@smarthotel.com',
      name: 'Manager User',
      password: managerPassword,
      role: 'MANAGER',
      phone: '+1234567891',
    },
  })

  // Create receptionist user
  const receptionistPassword = await bcrypt.hash('receptionist123', 12)
  const receptionist = await prisma.user.upsert({
    where: { email: 'receptionist@smarthotel.com' },
    update: {},
    create: {
      email: 'receptionist@smarthotel.com',
      name: 'Receptionist User',
      password: receptionistPassword,
      role: 'RECEPTIONIST',
      phone: '+1234567892',
    },
  })

  // Create guest user
  const guestPassword = await bcrypt.hash('guest123', 12)
  const guest = await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: {},
    create: {
      email: 'guest@example.com',
      name: 'Guest User',
      password: guestPassword,
      role: 'GUEST',
      phone: '+1234567893',
    },
  })

  // Create rooms
  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { number: '101' },
      update: {},
      create: {
        number: '101',
        type: 'STANDARD',
        capacity: 2,
        price: 100.00,
        description: 'Comfortable standard room with city view',
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Private Bathroom'],
        images: ['/images/room-101-1.jpg', '/images/room-101-2.jpg'],
        floor: 1,
        size: 25,
        status: 'AVAILABLE',
      },
    }),
    prisma.room.upsert({
      where: { number: '102' },
      update: {},
      create: {
        number: '102',
        type: 'STANDARD',
        capacity: 2,
        price: 100.00,
        description: 'Standard room with garden view',
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Private Bathroom'],
        images: ['/images/room-102-1.jpg', '/images/room-102-2.jpg'],
        floor: 1,
        size: 25,
        status: 'AVAILABLE',
      },
    }),
    prisma.room.upsert({
      where: { number: '201' },
      update: {},
      create: {
        number: '201',
        type: 'DELUXE',
        capacity: 3,
        price: 150.00,
        description: 'Spacious deluxe room with balcony',
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Private Bathroom', 'Balcony', 'Mini Bar'],
        images: ['/images/room-201-1.jpg', '/images/room-201-2.jpg'],
        floor: 2,
        size: 35,
        status: 'AVAILABLE',
      },
    }),
    prisma.room.upsert({
      where: { number: '202' },
      update: {},
      create: {
        number: '202',
        type: 'DELUXE',
        capacity: 3,
        price: 150.00,
        description: 'Deluxe room with city skyline view',
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Private Bathroom', 'Balcony', 'Mini Bar'],
        images: ['/images/room-202-1.jpg', '/images/room-202-2.jpg'],
        floor: 2,
        size: 35,
        status: 'AVAILABLE',
      },
    }),
    prisma.room.upsert({
      where: { number: '301' },
      update: {},
      create: {
        number: '301',
        type: 'SUITE',
        capacity: 4,
        price: 250.00,
        description: 'Luxury suite with separate living area',
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Private Bathroom', 'Living Room', 'Mini Bar', 'Room Service'],
        images: ['/images/room-301-1.jpg', '/images/room-301-2.jpg'],
        floor: 3,
        size: 50,
        status: 'AVAILABLE',
      },
    }),
    prisma.room.upsert({
      where: { number: '401' },
      update: {},
      create: {
        number: '401',
        type: 'PRESIDENTIAL',
        capacity: 6,
        price: 500.00,
        description: 'Presidential suite with panoramic views',
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Private Bathroom', 'Living Room', 'Dining Room', 'Mini Bar', 'Room Service', 'Butler Service'],
        images: ['/images/room-401-1.jpg', '/images/room-401-2.jpg'],
        floor: 4,
        size: 80,
        status: 'AVAILABLE',
      },
    }),
  ])

  // Create sample bookings
  const sampleBookings = await Promise.all([
    prisma.booking.create({
      data: {
        userId: guest.id,
        roomId: rooms[0].id,
        checkIn: new Date('2024-01-15'),
        checkOut: new Date('2024-01-17'),
        guests: 2,
        totalAmount: 200.00,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'Credit Card',
        specialRequests: 'Late check-in around 10 PM',
      },
    }),
    prisma.booking.create({
      data: {
        userId: guest.id,
        roomId: rooms[2].id,
        checkIn: new Date('2024-02-01'),
        checkOut: new Date('2024-02-03'),
        guests: 3,
        totalAmount: 300.00,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'Pay at Hotel',
      },
    }),
  ])

  // Create staff records
  await Promise.all([
    prisma.staff.upsert({
      where: { employeeId: 'EMP001' },
      update: {},
      create: {
        employeeId: 'EMP001',
        name: 'Manager User',
        email: 'manager@smarthotel.com',
        phone: '+1234567891',
        position: 'Hotel Manager',
        department: 'Management',
        hireDate: new Date('2023-01-15'),
        salary: 5000.00,
        isActive: true,
      },
    }),
    prisma.staff.upsert({
      where: { employeeId: 'EMP002' },
      update: {},
      create: {
        employeeId: 'EMP002',
        name: 'Receptionist User',
        email: 'receptionist@smarthotel.com',
        phone: '+1234567892',
        position: 'Receptionist',
        department: 'Front Office',
        hireDate: new Date('2023-02-01'),
        salary: 2500.00,
        isActive: true,
      },
    }),
  ])

  // Create sample inventory items
  await Promise.all([
    prisma.inventory.create({
      data: {
        name: 'Towels',
        description: 'Hotel towels',
        category: 'Linens',
        quantity: 200,
        unit: 'pieces',
        minQuantity: 50,
      },
    }),
    prisma.inventory.create({
      data: {
        name: 'Toilet Paper',
        description: 'Premium toilet paper',
        category: 'Bathroom',
        quantity: 500,
        unit: 'rolls',
        minQuantity: 100,
      },
    }),
    prisma.inventory.create({
      data: {
        name: 'Coffee',
        description: 'Premium coffee beans',
        category: 'Food & Beverage',
        quantity: 25,
        unit: 'kg',
        minQuantity: 10,
      },
    }),
  ])

  // Create sample gallery items
  await Promise.all([
    prisma.gallery.create({
      data: {
        title: 'Hotel Lobby',
        imageUrl: '/images/gallery/lobby.jpg',
        category: 'EXTERIOR',
      },
    }),
    prisma.gallery.create({
      data: {
        title: 'Swimming Pool',
        imageUrl: '/images/gallery/pool.jpg',
        category: 'AMENITY',
      },
    }),
    prisma.gallery.create({
      data: {
        title: 'Restaurant',
        imageUrl: '/images/gallery/restaurant.jpg',
        category: 'FOOD',
      },
    }),
  ])

  // Create sample tasks
  await Promise.all([
    prisma.task.create({
      data: {
        title: 'Clean Room 101',
        description: 'Standard cleaning and restocking',
        type: 'HOUSEKEEPING',
        assignedTo: receptionist.id,
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: new Date('2024-01-16'),
        createdBy: manager.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Fix TV in Room 201',
        description: 'TV not working properly',
        type: 'MAINTENANCE',
        assignedTo: receptionist.id,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2024-01-15'),
        createdBy: manager.id,
      },
    }),
  ])

  // Create settings
  await Promise.all([
    prisma.setting.upsert({
      where: { key: 'hotel_name' },
      update: {},
      create: {
        key: 'hotel_name',
        value: 'SmartHotel',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'hotel_address' },
      update: {},
      create: {
        key: 'hotel_address',
        value: '123 Luxury Street, City, Country',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'hotel_phone' },
      update: {},
      create: {
        key: 'hotel_phone',
        value: '+1 (555) 123-4567',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'hotel_email' },
      update: {},
      create: {
        key: 'hotel_email',
        value: 'info@smarthotel.com',
      },
    }),
  ])

  console.log('✅ Database seeded successfully!')
  console.log('👥 Users created:')
  console.log(`   Admin: admin@smarthotel.com / admin123`)
  console.log(`   Manager: manager@smarthotel.com / manager123`)
  console.log(`   Receptionist: receptionist@smarthotel.com / receptionist123`)
  console.log(`   Guest: guest@example.com / guest123`)
  console.log(`🏨 Rooms created: ${rooms.length}`)
  console.log(`📅 Bookings created: ${sampleBookings.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 