import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Sample data with high-quality images from Unsplash
const sampleData = {
  users: [
    {
      name: 'John Smith',
      email: 'john.smith@example.com',
      password: 'password123',
      phone: '+1-555-0101',
      role: 'GUEST' as const
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      password: 'password123',
      phone: '+1-555-0102',
      role: 'GUEST' as const
    },
    {
      name: 'Mike Wilson',
      email: 'mike.wilson@example.com',
      password: 'password123',
      phone: '+1-555-0103',
      role: 'GUEST' as const
    },
    {
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      password: 'password123',
      phone: '+1-555-0104',
      role: 'GUEST' as const
    },
    {
      name: 'David Brown',
      email: 'david.brown@example.com',
      password: 'password123',
      phone: '+1-555-0105',
      role: 'GUEST' as const
    },
    {
      name: 'Lisa Anderson',
      email: 'lisa.anderson@example.com',
      password: 'password123',
      phone: '+1-555-0106',
      role: 'GUEST' as const
    },
    {
      name: 'Robert Taylor',
      email: 'robert.taylor@example.com',
      password: 'password123',
      phone: '+1-555-0107',
      role: 'GUEST' as const
    },
    {
      name: 'Jennifer Martinez',
      email: 'jennifer.martinez@example.com',
      password: 'password123',
      phone: '+1-555-0108',
      role: 'GUEST' as const
    },
    {
      name: 'Michael Garcia',
      email: 'michael.garcia@example.com',
      password: 'password123',
      phone: '+1-555-0109',
      role: 'GUEST' as const
    },
    {
      name: 'Amanda Rodriguez',
      email: 'amanda.rodriguez@example.com',
      password: 'password123',
      phone: '+1-555-0110',
      role: 'GUEST' as const
    }
  ],

  staff: [
    {
      employeeId: 'EMP001',
      name: 'Hotel Manager',
      email: 'manager@smarthotel.com',
      phone: '+1-555-1001',
      position: 'General Manager',
      department: 'Management',
      hireDate: new Date('2020-01-15'),
      salary: 75000,
      isActive: true
    },
    {
      employeeId: 'EMP002',
      name: 'Reception Supervisor',
      email: 'reception@smarthotel.com',
      phone: '+1-555-1002',
      position: 'Front Desk Supervisor',
      department: 'Reception',
      hireDate: new Date('2020-03-10'),
      salary: 45000,
      isActive: true
    },
    {
      employeeId: 'EMP003',
      name: 'Housekeeping Lead',
      email: 'housekeeping@smarthotel.com',
      phone: '+1-555-1003',
      position: 'Housekeeping Supervisor',
      department: 'Housekeeping',
      hireDate: new Date('2020-02-20'),
      salary: 38000,
      isActive: true
    },
    {
      employeeId: 'EMP004',
      name: 'Maintenance Technician',
      email: 'maintenance@smarthotel.com',
      phone: '+1-555-1004',
      position: 'Maintenance Technician',
      department: 'Maintenance',
      hireDate: new Date('2020-04-05'),
      salary: 42000,
      isActive: true
    },
    {
      employeeId: 'EMP005',
      name: 'Kitchen Manager',
      email: 'kitchen@smarthotel.com',
      phone: '+1-555-1005',
      position: 'Kitchen Manager',
      department: 'Restaurant',
      hireDate: new Date('2020-01-30'),
      salary: 50000,
      isActive: true
    },
    {
      employeeId: 'EMP006',
      name: 'Concierge',
      email: 'concierge@smarthotel.com',
      phone: '+1-555-1006',
      position: 'Concierge',
      department: 'Guest Services',
      hireDate: new Date('2020-05-15'),
      salary: 35000,
      isActive: true
    },
    {
      employeeId: 'EMP007',
      name: 'Security Guard',
      email: 'security@smarthotel.com',
      phone: '+1-555-1007',
      position: 'Security Officer',
      department: 'Security',
      hireDate: new Date('2020-03-25'),
      salary: 32000,
      isActive: true
    },
    {
      employeeId: 'EMP008',
      name: 'Spa Therapist',
      email: 'spa@smarthotel.com',
      phone: '+1-555-1008',
      position: 'Spa Therapist',
      department: 'Wellness',
      hireDate: new Date('2020-06-10'),
      salary: 40000,
      isActive: true
    },
    {
      employeeId: 'EMP009',
      name: 'Bellhop',
      email: 'bellhop@smarthotel.com',
      phone: '+1-555-1009',
      position: 'Bellhop',
      department: 'Guest Services',
      hireDate: new Date('2020-07-01'),
      salary: 28000,
      isActive: true
    },
    {
      employeeId: 'EMP010',
      name: 'Night Auditor',
      email: 'nightaudit@smarthotel.com',
      phone: '+1-555-1010',
      position: 'Night Auditor',
      department: 'Reception',
      hireDate: new Date('2020-04-20'),
      salary: 35000,
      isActive: true
    }
  ],

  rooms: [
    {
      number: '101',
      type: 'STANDARD',
      price: 150,
      capacity: 2,
      description: 'Comfortable standard room with city view',
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning'],
      images: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
      ],
      status: 'AVAILABLE' as const,
      floor: 1,
      size: 25
    },
    {
      number: '102',
      type: 'STANDARD',
      price: 150,
      capacity: 2,
      description: 'Standard room with garden view',
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning'],
      images: [
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800',
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800'
      ],
      status: 'AVAILABLE' as const,
      floor: 1,
      size: 25
    },
    {
      number: '201',
      type: 'DELUXE',
      price: 250,
      capacity: 3,
      description: 'Spacious deluxe room with balcony',
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning', 'Balcony', 'Coffee Maker'],
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
      ],
      status: 'AVAILABLE' as const,
      floor: 2,
      size: 35
    },
    {
      number: '202',
      type: 'DELUXE',
      price: 250,
      capacity: 3,
      description: 'Deluxe room with panoramic city view',
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning', 'Balcony', 'Coffee Maker'],
      images: [
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
      ],
      status: 'AVAILABLE' as const,
      floor: 2,
      size: 35
    },
    {
      number: '301',
      type: 'SUITE',
      price: 450,
      capacity: 4,
      description: 'Luxury suite with separate living area',
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning', 'Balcony', 'Coffee Maker', 'Jacuzzi', 'Kitchenette'],
      images: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800'
      ],
      status: 'AVAILABLE' as const,
      floor: 3,
      size: 60
    },
    {
      number: '302',
      type: 'SUITE',
      price: 450,
      capacity: 4,
      description: 'Executive suite with premium amenities',
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning', 'Balcony', 'Coffee Maker', 'Jacuzzi', 'Kitchenette'],
      images: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
      ],
      status: 'AVAILABLE' as const,
      floor: 3,
      size: 60
    },
    {
      number: '401',
      type: 'PRESIDENTIAL',
      price: 850,
      capacity: 6,
      description: 'Presidential suite with 360-degree city view',
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning', 'Balcony', 'Coffee Maker', 'Jacuzzi', 'Kitchen', 'Butler Service'],
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800'
      ],
      status: 'AVAILABLE' as const,
      floor: 4,
      size: 120
    },
    {
      number: '103',
      type: 'STANDARD',
      price: 150,
      capacity: 2,
      description: 'Standard room with pool view',
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning'],
      images: [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
      ],
      status: 'MAINTENANCE' as const,
      floor: 1,
      size: 25
    },
    {
      number: '203',
      type: 'DELUXE',
      price: 250,
      capacity: 3,
      description: 'Deluxe room with mountain view',
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning', 'Balcony', 'Coffee Maker'],
      images: [
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
      ],
      status: 'OCCUPIED' as const,
      floor: 2,
      size: 35
    },
    {
      number: '303',
      type: 'SUITE',
      price: 450,
      capacity: 4,
      description: 'Family suite with connecting rooms',
      amenities: ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning', 'Balcony', 'Coffee Maker', 'Jacuzzi', 'Kitchenette'],
      images: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
      ],
      status: 'RESERVED' as const,
      floor: 3,
      size: 60
    }
  ],

  foodMenu: [
    {
      name: 'Continental Breakfast',
      description: 'Fresh pastries, fruits, coffee, and juice',
      price: 25.99,
      category: 'BREAKFAST' as const,
      image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',
      available: true,
      preparationTime: 15
    },
    {
      name: 'Full English Breakfast',
      description: 'Eggs, bacon, sausages, beans, toast, and coffee',
      price: 32.99,
      category: 'BREAKFAST' as const,
      image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800',
      available: true,
      preparationTime: 20
    },
    {
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with Caesar dressing and croutons',
      price: 18.99,
      category: 'LUNCH' as const,
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800',
      available: true,
      preparationTime: 10
    },
    {
      name: 'Grilled Salmon',
      description: 'Fresh Atlantic salmon with herbs and vegetables',
      price: 45.99,
      category: 'LUNCH' as const,
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800',
      available: true,
      preparationTime: 25
    },
    {
      name: 'Beef Tenderloin',
      description: 'Premium beef tenderloin with red wine sauce',
      price: 65.99,
      category: 'DINNER' as const,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
      available: true,
      preparationTime: 30
    },
    {
      name: 'Lobster Thermidor',
      description: 'Fresh lobster with creamy cheese sauce',
      price: 85.99,
      category: 'DINNER' as const,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
      available: true,
      preparationTime: 35
    },
    {
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with molten center and vanilla ice cream',
      price: 22.99,
      category: 'DESSERTS' as const,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800',
      available: true,
      preparationTime: 15
    },
    {
      name: 'Tiramisu',
      description: 'Classic Italian dessert with coffee and mascarpone',
      price: 19.99,
      category: 'DESSERTS' as const,
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
      available: true,
      preparationTime: 10
    },
    {
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed orange juice',
      price: 8.99,
      category: 'BEVERAGES' as const,
      image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800',
      available: true,
      preparationTime: 5
    },
    {
      name: 'Espresso',
      description: 'Premium Italian espresso',
      price: 6.99,
      category: 'BEVERAGES' as const,
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
      available: true,
      preparationTime: 3
    }
  ],

  gallery: [
    {
      title: 'Luxury Lobby',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      category: 'EXTERIOR' as const
    },
    {
      title: 'Swimming Pool',
      imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      category: 'AMENITY' as const
    },
    {
      title: 'Spa & Wellness Center',
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      category: 'AMENITY' as const
    },
    {
      title: 'Fine Dining Restaurant',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      category: 'FOOD' as const
    },
    {
      title: 'Executive Suite',
      imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
      category: 'ROOM' as const
    },
    {
      title: 'Garden View Room',
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
      category: 'ROOM' as const
    },
    {
      title: 'Fitness Center',
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      category: 'AMENITY' as const
    },
    {
      title: 'Business Center',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      category: 'AMENITY' as const
    },
    {
      title: 'Wedding Venue',
      imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
      category: 'EVENT' as const
    },
    {
      title: 'Hotel Exterior',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      category: 'EXTERIOR' as const
    }
  ],

  inventory: [
    {
      name: 'Towels',
      description: 'Premium cotton bath towels',
      category: 'Housekeeping',
      quantity: 500,
      unit: 'pieces',
      minQuantity: 100,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Coffee Beans',
      description: 'Premium Arabica coffee beans',
      category: 'Restaurant',
      quantity: 50,
      unit: 'kg',
      minQuantity: 10,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Shampoo',
      description: 'Luxury hotel shampoo',
      category: 'Amenities',
      quantity: 200,
      unit: 'bottles',
      minQuantity: 50,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Fresh Milk',
      description: 'Organic fresh milk',
      category: 'Restaurant',
      quantity: 30,
      unit: 'liters',
      minQuantity: 10,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Bed Sheets',
      description: 'Premium cotton bed sheets',
      category: 'Housekeeping',
      quantity: 300,
      unit: 'sets',
      minQuantity: 75,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Wine Glasses',
      description: 'Crystal wine glasses',
      category: 'Restaurant',
      quantity: 150,
      unit: 'pieces',
      minQuantity: 30,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Toilet Paper',
      description: 'Premium toilet paper',
      category: 'Housekeeping',
      quantity: 80,
      unit: 'rolls',
      minQuantity: 20,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Olive Oil',
      description: 'Extra virgin olive oil',
      category: 'Restaurant',
      quantity: 25,
      unit: 'liters',
      minQuantity: 5,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Pillow Cases',
      description: 'Cotton pillow cases',
      category: 'Housekeeping',
      quantity: 400,
      unit: 'pieces',
      minQuantity: 100,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Champagne',
      description: 'Premium champagne bottles',
      category: 'Restaurant',
      quantity: 60,
      unit: 'bottles',
      minQuantity: 15,
      status: 'IN_STOCK' as const
    }
  ]
}

async function main() {
  console.log('🌱 Starting comprehensive production database seeding...')

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await prisma.booking.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.foodOrder.deleteMany()
    await prisma.foodMenu.deleteMany()
    await prisma.gallery.deleteMany()
    await prisma.inventory.deleteMany()
    await prisma.task.deleteMany()
    await prisma.room.deleteMany()
    await prisma.staff.deleteMany()
    await prisma.user.deleteMany()

    // Create users with hashed passwords
    console.log('👥 Creating users...')
    for (const userData of sampleData.users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      })
    }

    // Create staff
    console.log('👨‍💼 Creating staff...')
    for (const staffData of sampleData.staff) {
      await prisma.staff.create({
        data: staffData
      })
    }

    // Create rooms
    console.log('🏨 Creating rooms...')
    for (const roomData of sampleData.rooms) {
      await prisma.room.create({
        data: roomData
      })
    }

    // Create food menu
    console.log('🍽️ Creating food menu...')
    for (const menuData of sampleData.foodMenu) {
      await prisma.foodMenu.create({
        data: menuData
      })
    }

    // Create gallery
    console.log('🖼️ Creating gallery...')
    for (const galleryData of sampleData.gallery) {
      await prisma.gallery.create({
        data: galleryData
      })
    }

    // Create inventory
    console.log('📦 Creating inventory...')
    for (const inventoryData of sampleData.inventory) {
      await prisma.inventory.create({
        data: inventoryData
      })
    }

    // Create some sample bookings
    console.log('📅 Creating sample bookings...')
    const users = await prisma.user.findMany()
    const rooms = await prisma.room.findMany()
    
    for (let i = 0; i < 10; i++) {
      const user = users[i % users.length]
      const room = rooms[i % rooms.length]
      
      await prisma.booking.create({
        data: {
          userId: user.id,
          roomId: room.id,
          checkIn: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)),
          checkOut: new Date(Date.now() + ((i + 3) * 24 * 60 * 60 * 1000)),
          guests: Math.floor(Math.random() * 4) + 1,
          totalAmount: room.price * 3,
          status: (['PENDING', 'CONFIRMED', 'CHECKED_IN'][Math.floor(Math.random() * 3)]) as any,
          paymentStatus: (['PENDING', 'PAID'][Math.floor(Math.random() * 2)]) as any,
          specialRequests: i % 3 === 0 ? 'Late checkout requested' : null,
          guestName: user.name,
          guestEmail: user.email,
          guestPhone: user.phone
        }
      })
    }

    // Create some sample tasks
    console.log('✅ Creating sample tasks...')
    const staff = await prisma.staff.findMany()
    const bookings = await prisma.booking.findMany()
    
    for (let i = 0; i < 15; i++) {
      const assignedStaff = staff[i % staff.length]
      const booking = bookings[i % bookings.length]
      
      await prisma.task.create({
        data: {
          title: `Task ${i + 1}`,
          description: `Sample task description ${i + 1}`,
          type: (['HOUSEKEEPING', 'MAINTENANCE', 'ROOM_SERVICE', 'GUEST_REQUEST', 'ADMINISTRATIVE'][Math.floor(Math.random() * 5)]) as any,
          priority: (['LOW', 'MEDIUM', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)]) as any,
          status: (['PENDING', 'IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 3)]) as any,
          assignedTo: assignedStaff.id,
          bookingId: booking.id,
          dueDate: new Date(Date.now() + (i * 2 * 60 * 60 * 1000)),
          createdBy: users[0].id
        }
      })
    }

    console.log('✅ Database seeding completed successfully!')
    console.log(`📊 Created:`)
    console.log(`   - ${sampleData.users.length} users`)
    console.log(`   - ${sampleData.staff.length} staff members`)
    console.log(`   - ${sampleData.rooms.length} rooms`)
    console.log(`   - ${sampleData.foodMenu.length} menu items`)
    console.log(`   - ${sampleData.gallery.length} gallery items`)
    console.log(`   - ${sampleData.inventory.length} inventory items`)
    console.log(`   - 10 bookings`)
    console.log(`   - 15 tasks`)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
