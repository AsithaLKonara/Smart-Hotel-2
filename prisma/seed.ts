import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create sample users with secure demo passwords (not in breach databases)
  // Using unique passwords that won't trigger Chrome security warnings
  const adminHash = await bcrypt.hash('SmartHotel@2025!Admin', 12)
  const managerHash = await bcrypt.hash('SmartHotel@2025!Manager', 12)
  const receptionistHash = await bcrypt.hash('SmartHotel@2025!Reception', 12)
  const guestHash = await bcrypt.hash('SmartHotel@2025!Guest', 12)

  // Helper function to create or update user
  async function createOrUpdateUser(email: string, data: any) {
    const existing = await prisma.user.findFirst({ where: { email } })
    if (existing) {
      return await prisma.user.update({
        where: { id: existing.id },
        data
      })
    }
    return await prisma.user.create({ data })
  }

  const adminUser = await createOrUpdateUser('admin@smarthotel.com', {
    name: 'Super Admin',
    email: 'admin@smarthotel.com',
    password: adminHash,
    phone: '+1-800-555-0001',
    role: 'SUPER_ADMIN',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const managerUser = await createOrUpdateUser('manager@smarthotel.com', {
    name: 'Hotel Manager',
    email: 'manager@smarthotel.com',
    password: managerHash,
    phone: '+1-800-555-0002',
    role: 'MANAGER',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const receptionistUser = await createOrUpdateUser('receptionist@smarthotel.com', {
    name: 'Front Desk Receptionist',
    email: 'receptionist@smarthotel.com',
    password: receptionistHash,
    phone: '+1-800-555-0003',
    role: 'RECEPTIONIST',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const guestUser = await createOrUpdateUser('guest@example.com', {
    name: 'John Doe',
    email: 'guest@example.com',
    password: guestHash,
    phone: '+1-555-0104',
    role: 'GUEST',
    createdAt: new Date(),
    updatedAt: new Date()
  })

  console.log('✅ Users created')

  // Helper function to create or update staff
  async function createOrUpdateStaff(employeeId: string, data: any) {
    const existing = await prisma.staff.findFirst({ where: { employeeId } })
    if (existing) {
      return await prisma.staff.update({
        where: { id: existing.id },
        data
      })
    }
    return await prisma.staff.create({ data })
  }

  // Create sample staff
  const staff1 = await createOrUpdateStaff('EMP001', {
    employeeId: 'EMP001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@smarthotel.com',
    phone: '+1-555-0201',
    position: 'Front Desk Manager',
    department: 'Reception',
    hireDate: new Date('2022-01-15'),
    salary: 55000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const staff2 = await createOrUpdateStaff('EMP002', {
    employeeId: 'EMP002',
    name: 'Mike Chen',
    email: 'mike.chen@smarthotel.com',
    phone: '+1-555-0202',
    position: 'Housekeeping Supervisor',
    department: 'Housekeeping',
    hireDate: new Date('2021-06-10'),
    salary: 45000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  const staff3 = await createOrUpdateStaff('EMP003', {
    employeeId: 'EMP003',
    name: 'Lisa Rodriguez',
    email: 'lisa.rodriguez@smarthotel.com',
    phone: '+1-555-0203',
    position: 'Head Chef',
    department: 'Kitchen',
    hireDate: new Date('2020-03-20'),
    salary: 65000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  console.log('✅ Staff created')

  // Create sample rooms
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
    },
    {
      number: '103',
      type: 'Standard Room',
      price: 150,
      capacity: 2,
      description: 'Comfortable standard room with garden view',
      amenities: ['wifi', 'tv', 'air-conditioning', 'safe'],
      images: ['/images/room-placeholder.jpg'],
      floor: 1,
      size: 25
    }
  ]

  // Helper function to create or update room
  async function createOrUpdateRoom(number: string, data: any) {
    const existing = await prisma.room.findFirst({ where: { number } })
    if (existing) {
      return await prisma.room.update({
        where: { id: existing.id },
        data: { ...data, updatedAt: new Date() }
      })
    }
    return await prisma.room.create({ 
      data: { 
        ...data, 
        createdAt: new Date(),
        updatedAt: new Date(),
        status: data.status || 'AVAILABLE'
      } 
    })
  }

  for (const roomData of rooms) {
    await createOrUpdateRoom(roomData.number, {
      number: roomData.number,
      type: roomData.type,
      price: roomData.price,
      capacity: BigInt(roomData.capacity),
      description: roomData.description,
      amenities: roomData.amenities,
      images: roomData.images,
      floor: BigInt(roomData.floor),
      size: BigInt(roomData.size),
      status: 'AVAILABLE'
    })
  }

  console.log('✅ Rooms created')

  // Skip bookings for now - database schema may have confirmationCode field that's not in Prisma schema
  // Create sample bookings
  try {
    const room101 = await prisma.room.findFirst({ where: { number: '101' } })
    const room102 = await prisma.room.findFirst({ where: { number: '102' } })
    const room201 = await prisma.room.findFirst({ where: { number: '201' } })

    if (room101 && room102 && room201) {
      const bookings = [
        {
          userId: guestUser.id,
          roomId: room101.id,
          checkIn: new Date('2024-01-15'),
          checkOut: new Date('2024-01-18'),
          guests: 2,
          totalAmount: 450,
          status: 'CONFIRMED' as const,
          paymentStatus: 'PAID' as const,
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
          status: 'PENDING' as const,
          paymentStatus: 'PENDING' as const,
          specialRequests: 'High floor preferred'
        },
        {
          userId: adminUser.id,
          roomId: room201.id,
          checkIn: new Date('2024-01-25'),
          checkOut: new Date('2024-01-28'),
          guests: 4,
          totalAmount: 1050,
          status: 'CHECKED_IN' as const,
          paymentStatus: 'PAID' as const,
          paymentMethod: 'credit_card',
          specialRequests: 'Anniversary celebration'
        }
      ]

      for (const bookingData of bookings) {
        // Generate unique confirmation code
        const confirmationCode = `GP${Date.now()}${Math.floor(Math.random() * 1000)}`
        
        await prisma.booking.create({
          data: {
            ...bookingData,
            guests: BigInt(bookingData.guests),
            checkIn: new Date(bookingData.checkIn),
            checkOut: new Date(bookingData.checkOut),
            createdAt: new Date(),
            updatedAt: new Date(),
            paymentMethod: bookingData.paymentMethod || 'cash',
            specialRequests: bookingData.specialRequests || '',
            confirmationCode: confirmationCode as any // Add confirmationCode if it exists in DB
          }
        } as any)
        
        // Small delay to ensure unique confirmation codes
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      console.log('✅ Bookings created')
    }
  } catch (bookingError) {
    console.log('⚠️ Skipping bookings creation:', bookingError instanceof Error ? bookingError.message : 'Unknown error')
    console.log('✅ Continuing with other data...')
  }

  // Create sample food menu
  const menuItems = [
    {
      name: 'Continental Breakfast',
      description: 'Fresh fruits, pastries, coffee, and juice',
      price: 25,
      category: 'BREAKFAST' as const,
      image: '/images/menu-placeholder.jpg',
      available: true,
      preparationTime: 15
    },
    {
      name: 'Grilled Salmon',
      description: 'Fresh Atlantic salmon with herbs and lemon',
      price: 35,
      category: 'MAIN_COURSE' as const,
      image: '/images/menu-placeholder.jpg',
      available: true,
      preparationTime: 25
    },
    {
      name: 'Caesar Salad',
      description: 'Crisp romaine lettuce with parmesan and croutons',
      price: 18,
      category: 'APPETIZERS' as const,
      image: '/images/menu-placeholder.jpg',
      available: true,
      preparationTime: 10
    },
    {
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with vanilla ice cream',
      price: 12,
      category: 'DESSERTS' as const,
      image: '/images/menu-placeholder.jpg',
      available: true,
      preparationTime: 20
    },
    {
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed orange juice',
      price: 8,
      category: 'BEVERAGES' as const,
      image: '/images/menu-placeholder.jpg',
      available: true,
      preparationTime: 5
    },
    {
      name: 'Club Sandwich',
      description: 'Turkey, bacon, lettuce, tomato on toasted bread',
      price: 22,
      category: 'LUNCH' as const,
      image: '/images/menu-placeholder.jpg',
      available: true,
      preparationTime: 15
    }
  ]

  for (const menuItem of menuItems) {
    // Remove image field if it doesn't exist in schema
    const { image, ...menuData } = menuItem as any
    await prisma.foodMenu.create({
      data: {
        ...menuData,
        preparationTime: BigInt(menuItem.preparationTime),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  }

  console.log('✅ Food menu created')

  // Create sample gallery items
  const galleryItems = [
    {
      title: 'Luxury Suite Interior',
      imageUrl: '/images/room-placeholder.jpg',
      category: 'ROOM' as const
    },
    {
        title: 'Hotel Lobby',
      imageUrl: '/images/hotel-hero-1.jpg',
      category: 'EXTERIOR' as const
    },
    {
      title: 'Fine Dining Restaurant',
      imageUrl: '/images/menu-placeholder.jpg',
      category: 'FOOD' as const
    },
    {
      title: 'Spa and Wellness Center',
      imageUrl: '/images/room-placeholder.jpg',
      category: 'AMENITY' as const
    }
  ]

  for (const galleryItem of galleryItems) {
    await prisma.gallery.create({
      data: {
        ...galleryItem,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  }

  console.log('✅ Gallery items created')

  // Create sample tasks
  const tasks = [
    {
      title: 'Room 101 Housekeeping',
      description: 'Clean and prepare room 101 for next guest',
      type: 'HOUSEKEEPING' as const,
      priority: 'HIGH' as const,
      status: 'PENDING' as const,
      assignedTo: staff2.id,
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      createdBy: managerUser.id
    },
    {
      title: 'Maintenance Check - Room 102',
      description: 'Check air conditioning unit in room 102',
      type: 'MAINTENANCE' as const,
      priority: 'MEDIUM' as const,
      status: 'PENDING' as const,
      assignedTo: staff1.id,
      dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      createdBy: managerUser.id
    },
    {
      title: 'Guest Request - Extra Towels',
      description: 'Deliver extra towels to room 201',
      type: 'ROOM_SERVICE' as const,
      priority: 'MEDIUM' as const,
      status: 'IN_PROGRESS' as const,
      assignedTo: staff2.id,
      dueDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      createdBy: receptionistUser.id
    }
  ]

  for (const taskData of tasks) {
    await prisma.task.create({
      data: {
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  }

  console.log('✅ Tasks created')

  // Create sample inventory
  const inventoryItems = [
    {
      name: 'Towels',
      description: 'Bath towels for guest rooms',
      category: 'Linens',
      quantity: 150,
      unit: 'pieces',
      minQuantity: 50,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Coffee Beans',
      description: 'Premium coffee beans for room service',
      category: 'Food & Beverage',
      quantity: 25,
      unit: 'kg',
      minQuantity: 10,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Cleaning Supplies',
      description: 'General cleaning supplies',
      category: 'Housekeeping',
      quantity: 8,
      unit: 'sets',
      minQuantity: 15,
      status: 'LOW_STOCK' as const
    }
  ]

  for (const inventoryItem of inventoryItems) {
    await prisma.inventory.create({
      data: {
        ...inventoryItem,
        quantity: BigInt(inventoryItem.quantity),
        minQuantity: BigInt(inventoryItem.minQuantity),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  }

  console.log('✅ Inventory items created')

  // Create sample settings
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

  // Helper function to create or update setting
  async function createOrUpdateSetting(key: string, value: string) {
    const existing = await prisma.setting.findFirst({ where: { key } })
    if (existing) {
      return await prisma.setting.update({
        where: { id: existing.id },
        data: { value }
      })
    }
    return await prisma.setting.create({ data: { key, value } })
  }

  for (const setting of settings) {
    await createOrUpdateSetting(setting.key, setting.value)
  }

  console.log('✅ Settings created')

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📋 Sample Data Summary:')
  console.log('- 4 Users (Admin, Manager, Receptionist, Guest)')
  console.log('- 3 Staff Members')
  console.log('- 5 Rooms (Standard to Presidential Suite)')
  console.log('- 3 Bookings (Various statuses)')
  console.log('- 6 Food Menu Items')
  console.log('- 4 Gallery Items')
  console.log('- 3 Tasks')
  console.log('- 3 Inventory Items')
  console.log('- 6 Settings')
  console.log('\n🔐 Demo Login Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👑 Admin: admin@smarthotel.com / SmartHotel@2025!Admin')
  console.log('👨‍💼 Manager: manager@smarthotel.com / SmartHotel@2025!Manager')
  console.log('👩‍💼 Receptionist: receptionist@smarthotel.com / SmartHotel@2025!Reception')
  console.log('👤 Guest: guest@example.com / SmartHotel@2025!Guest')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n🚀 For comprehensive demo data, run: npm run db:seed:demo')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 