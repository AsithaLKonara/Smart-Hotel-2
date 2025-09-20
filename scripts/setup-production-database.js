#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupProductionDatabase() {
  console.log('🚀 Setting up SmartHotel Production Database...')
  
  try {
    // Check database connection
    await prisma.$connect()
    console.log('✅ Database connection established')
    
    // Clear existing data (optional - remove this in production)
    console.log('🧹 Clearing existing data...')
    await prisma.auditLog.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.foodOrder.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.task.deleteMany()
    await prisma.booking.deleteMany()
    await prisma.foodMenu.deleteMany()
    await prisma.gallery.deleteMany()
    await prisma.inventory.deleteMany()
    await prisma.staff.deleteMany()
    await prisma.user.deleteMany()
    await prisma.room.deleteMany()
    await prisma.setting.deleteMany()
    
    console.log('✅ Existing data cleared')
    
    // Create sample users
    console.log('👥 Creating users...')
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@smarthotel.com',
        password: hashedPassword,
        phone: '+1-555-0100',
        role: 'SUPER_ADMIN'
      }
    })
    
    const managerUser = await prisma.user.create({
      data: {
        name: 'Hotel Manager',
        email: 'manager@smarthotel.com',
        password: hashedPassword,
        phone: '+1-555-0101',
        role: 'MANAGER'
      }
    })
    
    const receptionistUser = await prisma.user.create({
      data: {
        name: 'Reception Staff',
        email: 'reception@smarthotel.com',
        password: hashedPassword,
        phone: '+1-555-0102',
        role: 'RECEPTIONIST'
      }
    })
    
    const guestUser = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'guest@example.com',
        password: hashedPassword,
        phone: '+1-555-0103',
        role: 'GUEST'
      }
    })
    
    console.log('✅ Users created')
    
    // Create sample staff
    console.log('👨‍💼 Creating staff...')
    const staff1 = await prisma.staff.create({
      data: {
        employeeId: 'EMP001',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@smarthotel.com',
        phone: '+1-555-0201',
        position: 'Front Desk Manager',
        department: 'Reception',
        hireDate: new Date('2022-01-15'),
        salary: 55000,
        isActive: true
      }
    })
    
    const staff2 = await prisma.staff.create({
      data: {
        employeeId: 'EMP002',
        name: 'Mike Chen',
        email: 'mike.chen@smarthotel.com',
        phone: '+1-555-0202',
        position: 'Housekeeping Supervisor',
        department: 'Housekeeping',
        hireDate: new Date('2021-06-10'),
        salary: 45000,
        isActive: true
      }
    })
    
    const staff3 = await prisma.staff.create({
      data: {
        employeeId: 'EMP003',
        name: 'Lisa Rodriguez',
        email: 'lisa.rodriguez@smarthotel.com',
        phone: '+1-555-0203',
        position: 'Head Chef',
        department: 'Kitchen',
        hireDate: new Date('2020-03-20'),
        salary: 65000,
        isActive: true
      }
    })
    
    console.log('✅ Staff created')
    
    // Create sample rooms
    console.log('🏨 Creating rooms...')
    const rooms = [
      {
        number: '101',
        type: 'Standard Room',
        price: 150,
        capacity: 2,
        description: 'Comfortable standard room with city view',
        amenities: ['wifi', 'tv', 'air-conditioning', 'safe'],
        images: ['/images/room-placeholder.jpg'],
        floor: 1,
        size: 25
      },
      {
        number: '102',
        type: 'Deluxe Room',
        price: 200,
        capacity: 3,
        description: 'Spacious deluxe room with premium amenities',
        amenities: ['wifi', 'tv', 'air-conditioning', 'safe', 'minibar', 'balcony'],
        images: ['/images/room-placeholder.jpg'],
        floor: 1,
        size: 35
      },
      {
        number: '201',
        type: 'Suite',
        price: 350,
        capacity: 4,
        description: 'Luxury suite with separate living area',
        amenities: ['wifi', 'tv', 'air-conditioning', 'safe', 'minibar', 'balcony', 'kitchen', 'jacuzzi'],
        images: ['/images/room-placeholder.jpg'],
        floor: 2,
        size: 60
      },
      {
        number: '301',
        type: 'Presidential Suite',
        price: 500,
        capacity: 6,
        description: 'Ultimate luxury with panoramic city views',
        amenities: ['wifi', 'tv', 'air-conditioning', 'safe', 'minibar', 'balcony', 'kitchen', 'jacuzzi', 'concierge', 'butler'],
        images: ['/images/room-placeholder.jpg'],
        floor: 3,
        size: 100
      }
    ]
    
    for (const roomData of rooms) {
      await prisma.room.create({ data: roomData })
    }
    
    console.log('✅ Rooms created')
    
    // Create sample bookings
    console.log('📅 Creating bookings...')
    const room101 = await prisma.room.findUnique({ where: { number: '101' } })
    const room102 = await prisma.room.findUnique({ where: { number: '102' } })
    const room201 = await prisma.room.findUnique({ where: { number: '201' } })
    
    if (room101 && room102 && room201) {
      const bookings = [
        {
          userId: guestUser.id,
          roomId: room101.id,
          checkIn: new Date('2024-01-15'),
          checkOut: new Date('2024-01-18'),
          guests: 2,
          totalAmount: 450,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: 'credit_card',
          specialRequests: 'Late checkout requested'
        },
        {
          userId: guestUser.id,
          roomId: room102.id,
          checkIn: new Date('2024-01-20'),
          checkOut: new Date('2024-01-22'),
          guests: 2,
          totalAmount: 400,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          specialRequests: 'High floor preferred'
        },
        {
          userId: adminUser.id,
          roomId: room201.id,
          checkIn: new Date('2024-01-25'),
          checkOut: new Date('2024-01-28'),
          guests: 4,
          totalAmount: 1050,
          status: 'CHECKED_IN',
          paymentStatus: 'PAID',
          paymentMethod: 'credit_card',
          specialRequests: 'Anniversary celebration'
        }
      ]
      
      for (const bookingData of bookings) {
        await prisma.booking.create({ data: bookingData })
      }
    }
    
    console.log('✅ Bookings created')
    
    // Create sample food menu
    console.log('🍽️ Creating food menu...')
    const menuItems = [
      {
        name: 'Continental Breakfast',
        description: 'Fresh fruits, pastries, coffee, and juice',
        price: 25,
        category: 'BREAKFAST',
        image: '/images/menu-placeholder.jpg',
        available: true,
        preparationTime: 15
      },
      {
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with herbs and lemon',
        price: 35,
        category: 'MAIN_COURSE',
        image: '/images/menu-placeholder.jpg',
        available: true,
        preparationTime: 25
      },
      {
        name: 'Caesar Salad',
        description: 'Crisp romaine lettuce with parmesan and croutons',
        price: 18,
        category: 'APPETIZERS',
        image: '/images/menu-placeholder.jpg',
        available: true,
        preparationTime: 10
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with vanilla ice cream',
        price: 12,
        category: 'DESSERTS',
        image: '/images/menu-placeholder.jpg',
        available: true,
        preparationTime: 20
      },
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        price: 8,
        category: 'BEVERAGES',
        image: '/images/menu-placeholder.jpg',
        available: true,
        preparationTime: 5
      },
      {
        name: 'Club Sandwich',
        description: 'Turkey, bacon, lettuce, tomato on toasted bread',
        price: 22,
        category: 'LUNCH',
        image: '/images/menu-placeholder.jpg',
        available: true,
        preparationTime: 15
      }
    ]
    
    for (const menuItem of menuItems) {
      await prisma.foodMenu.create({ data: menuItem })
    }
    
    console.log('✅ Food menu created')
    
    // Create sample gallery items
    console.log('🖼️ Creating gallery items...')
    const galleryItems = [
      {
        title: 'Luxury Suite Interior',
        imageUrl: '/images/room-placeholder.jpg',
        category: 'ROOM'
      },
      {
        title: 'Hotel Lobby',
        imageUrl: '/images/hotel-hero-1.jpg',
        category: 'EXTERIOR'
      },
      {
        title: 'Fine Dining Restaurant',
        imageUrl: '/images/menu-placeholder.jpg',
        category: 'FOOD'
      },
      {
        title: 'Spa and Wellness Center',
        imageUrl: '/images/room-placeholder.jpg',
        category: 'AMENITY'
      }
    ]
    
    for (const galleryItem of galleryItems) {
      await prisma.gallery.create({ data: galleryItem })
    }
    
    console.log('✅ Gallery items created')
    
    // Create sample tasks
    console.log('📋 Creating tasks...')
    const tasks = [
      {
        title: 'Room 101 Housekeeping',
        description: 'Clean and prepare room 101 for next guest',
        type: 'HOUSEKEEPING',
        priority: 'HIGH',
        status: 'PENDING',
        assignedTo: staff2.id,
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        createdBy: managerUser.id
      },
      {
        title: 'Maintenance Check - Room 102',
        description: 'Check air conditioning unit in room 102',
        type: 'MAINTENANCE',
        priority: 'MEDIUM',
        status: 'PENDING',
        assignedTo: staff1.id,
        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
        createdBy: managerUser.id
      },
      {
        title: 'Guest Request - Extra Towels',
        description: 'Deliver extra towels to room 201',
        type: 'ROOM_SERVICE',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        assignedTo: staff2.id,
        dueDate: new Date(Date.now() + 30 * 60 * 1000),
        createdBy: receptionistUser.id
      }
    ]
    
    for (const taskData of tasks) {
      await prisma.task.create({ data: taskData })
    }
    
    console.log('✅ Tasks created')
    
    // Create sample inventory
    console.log('📦 Creating inventory items...')
    const inventoryItems = [
      {
        name: 'Towels',
        description: 'Bath towels for guest rooms',
        category: 'Linens',
        quantity: 150,
        unit: 'pieces',
        minQuantity: 50,
        status: 'IN_STOCK'
      },
      {
        name: 'Coffee Beans',
        description: 'Premium coffee beans for room service',
        category: 'Food & Beverage',
        quantity: 25,
        unit: 'kg',
        minQuantity: 10,
        status: 'IN_STOCK'
      },
      {
        name: 'Cleaning Supplies',
        description: 'General cleaning supplies',
        category: 'Housekeeping',
        quantity: 8,
        unit: 'sets',
        minQuantity: 15,
        status: 'LOW_STOCK'
      }
    ]
    
    for (const inventoryItem of inventoryItems) {
      await prisma.inventory.create({ data: inventoryItem })
    }
    
    console.log('✅ Inventory items created')
    
    // Create sample settings
    console.log('⚙️ Creating settings...')
    const settings = [
      {
        key: 'hotel_name',
        value: 'SmartHotel Premium'
      },
      {
        key: 'hotel_address',
        value: '123 Luxury Street, Downtown City, 12345'
      },
      {
        key: 'hotel_phone',
        value: '+1-555-HOTEL-1'
      },
      {
        key: 'check_in_time',
        value: '15:00'
      },
      {
        key: 'check_out_time',
        value: '11:00'
      },
      {
        key: 'currency',
        value: 'USD'
      }
    ]
    
    for (const setting of settings) {
      await prisma.setting.create({ data: setting })
    }
    
    console.log('✅ Settings created')
    
    console.log('🎉 Production database setup completed successfully!')
    console.log('\n📋 Sample Data Summary:')
    console.log('- 4 Users (Admin, Manager, Reception, Guest)')
    console.log('- 3 Staff Members')
    console.log('- 4 Rooms (Standard to Presidential Suite)')
    console.log('- 3 Bookings (Various statuses)')
    console.log('- 6 Food Menu Items')
    console.log('- 4 Gallery Items')
    console.log('- 3 Tasks')
    console.log('- 3 Inventory Items')
    console.log('- 6 Settings')
    console.log('\n🔐 Default Login Credentials:')
    console.log('- Admin: admin@smarthotel.com / password123')
    console.log('- Manager: manager@smarthotel.com / password123')
    console.log('- Reception: reception@smarthotel.com / password123')
    console.log('- Guest: guest@example.com / password123')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the setup
setupProductionDatabase()
  .then(() => {
    console.log('✅ Setup completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })
