#!/usr/bin/env node

/**
 * Production Database Seeding Script
 * Seeds the MongoDB Atlas database with initial data
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedProduction() {
  console.log('🌱 Starting production database seed...')
  
  try {
    // Check if data already exists
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      console.log('⚠️ Database already contains data. Skipping seed.')
      return
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@smarthotel.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'SUPER_ADMIN',
        phone: '+1234567890',
      },
    })

    // Create manager user
    const managerPassword = await bcrypt.hash('manager123', 12)
    const manager = await prisma.user.create({
      data: {
        email: 'manager@smarthotel.com',
        name: 'Manager User',
        password: managerPassword,
        role: 'MANAGER',
        phone: '+1234567891',
      },
    })

    // Create receptionist user
    const receptionistPassword = await bcrypt.hash('receptionist123', 12)
    const receptionist = await prisma.user.create({
      data: {
        email: 'receptionist@smarthotel.com',
        name: 'Receptionist User',
        password: receptionistPassword,
        role: 'RECEPTIONIST',
        phone: '+1234567892',
      },
    })

    // Create guest user
    const guestPassword = await bcrypt.hash('guest123', 12)
    const guest = await prisma.user.create({
      data: {
        email: 'guest@example.com',
        name: 'Guest User',
        password: guestPassword,
        role: 'GUEST',
        phone: '+1234567893',
      },
    })

    // Create rooms
    const rooms = await Promise.all([
      prisma.room.create({
        data: {
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
      prisma.room.create({
        data: {
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
      prisma.room.create({
        data: {
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
      prisma.room.create({
        data: {
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
      prisma.room.create({
        data: {
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
    ])

    // Create sample bookings
    await Promise.all([
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

    // Create restaurant menu items
    await Promise.all([
      prisma.foodMenu.create({
        data: {
          id: 'menu-breakfast-1',
          name: 'Continental Breakfast',
          description: 'Fresh croissants, butter, jam, coffee, and orange juice',
          price: 15.99,
          category: 'BREAKFAST',
          available: true,
          preparationTime: 10,
        },
      }),
      prisma.foodMenu.create({
        data: {
          id: 'menu-breakfast-2',
          name: 'Full English Breakfast',
          description: 'Eggs, bacon, sausage, beans, toast, and coffee',
          price: 18.99,
          category: 'BREAKFAST',
          available: true,
          preparationTime: 15,
        },
      }),
      prisma.foodMenu.create({
        data: {
          id: 'menu-lunch-1',
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce, parmesan cheese, croutons, and Caesar dressing',
          price: 12.99,
          category: 'LUNCH',
          available: true,
          preparationTime: 8,
        },
      }),
      prisma.foodMenu.create({
        data: {
          id: 'menu-lunch-2',
          name: 'Club Sandwich',
          description: 'Turkey, bacon, lettuce, tomato, and mayo on toasted bread',
          price: 14.99,
          category: 'LUNCH',
          available: true,
          preparationTime: 12,
        },
      }),
      prisma.foodMenu.create({
        data: {
          id: 'menu-dinner-1',
          name: 'Grilled Salmon',
          description: 'Fresh Atlantic salmon with herbs, served with vegetables and rice',
          price: 24.99,
          category: 'DINNER',
          available: true,
          preparationTime: 20,
        },
      }),
      prisma.foodMenu.create({
        data: {
          id: 'menu-dinner-2',
          name: 'Beef Tenderloin',
          description: '8oz beef tenderloin with red wine reduction and mashed potatoes',
          price: 32.99,
          category: 'DINNER',
          available: true,
          preparationTime: 25,
        },
      }),
    ])

    // Create settings
    await Promise.all([
      prisma.setting.create({
        data: {
          key: 'hotel_name',
          value: 'SmartHotel',
        },
      }),
      prisma.setting.create({
        data: {
          key: 'hotel_address',
          value: '123 Luxury Street, City, Country',
        },
      }),
      prisma.setting.create({
        data: {
          key: 'hotel_phone',
          value: '+1 (555) 123-4567',
        },
      }),
      prisma.setting.create({
        data: {
          key: 'hotel_email',
          value: 'info@smarthotel.com',
        },
      }),
    ])

    console.log('✅ Production database seeded successfully!')
    console.log('👥 Users created:')
    console.log(`   Admin: admin@smarthotel.com / admin123`)
    console.log(`   Manager: manager@smarthotel.com / manager123`)
    console.log(`   Receptionist: receptionist@smarthotel.com / receptionist123`)
    console.log(`   Guest: guest@example.com / guest123`)
    console.log(`🏨 Rooms created: ${rooms.length}`)
    console.log(`🍽️ Menu items created: 6`)
    
  } catch (error) {
    console.error('❌ Error seeding production database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this script is executed directly
if (require.main === module) {
  seedProduction()
    .then(() => {
      console.log('🎉 Seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedProduction }
