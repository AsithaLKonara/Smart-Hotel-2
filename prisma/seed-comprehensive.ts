import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seeding...')

  // Hash password once for reuse
  const hashedPassword = await bcrypt.hash('password123', 12)
  const adminHash = await bcrypt.hash('admin123', 12)
  const managerHash = await bcrypt.hash('manager123', 12)
  const receptionistHash = await bcrypt.hash('receptionist123', 12)
  const guestHash = await bcrypt.hash('guest123', 12)

  // ==================== USERS (10+) ====================
  console.log('👥 Seeding Users...')
  
  const users = [
    {
      name: 'Super Admin',
      email: 'admin@smarthotel.com',
      password: adminHash,
      phone: '+1-800-555-0001',
      role: 'SUPER_ADMIN' as const
    },
    {
      name: 'Hotel Manager',
      email: 'manager@smarthotel.com',
      password: managerHash,
      phone: '+1-800-555-0002',
      role: 'MANAGER' as const
    },
    {
      name: 'Front Desk Receptionist',
      email: 'receptionist@smarthotel.com',
      password: receptionistHash,
      phone: '+1-800-555-0003',
      role: 'RECEPTIONIST' as const
    },
    {
      name: 'John Doe',
      email: 'guest@example.com',
      password: guestHash,
      phone: '+1-555-0104',
      role: 'GUEST' as const
    },
    {
      name: 'Emma Wilson',
      email: 'emma.wilson@example.com',
      password: hashedPassword,
      phone: '+1-555-0105',
      role: 'GUEST' as const
    },
    {
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      password: hashedPassword,
      phone: '+1-555-0106',
      role: 'GUEST' as const
    },
    {
      name: 'Sophia Davis',
      email: 'sophia.davis@example.com',
      password: hashedPassword,
      phone: '+1-555-0107',
      role: 'GUEST' as const
    },
    {
      name: 'James Miller',
      email: 'james.miller@example.com',
      password: hashedPassword,
      phone: '+1-555-0108',
      role: 'GUEST' as const
    },
    {
      name: 'Olivia Garcia',
      email: 'olivia.garcia@example.com',
      password: hashedPassword,
      phone: '+1-555-0109',
      role: 'GUEST' as const
    },
    {
      name: 'William Martinez',
      email: 'william.martinez@example.com',
      password: hashedPassword,
      phone: '+1-555-0110',
      role: 'GUEST' as const
    }
  ]

  const createdUsers = []
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData
    })
    createdUsers.push(user)
  }

  console.log(`✅ Created ${createdUsers.length} users`)

  // ==================== STAFF (10+) ====================
  console.log('👔 Seeding Staff...')

  const staffMembers = [
    {
      employeeId: 'EMP001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@smarthotel.com',
      phone: '+1-800-555-0201',
      position: 'Front Desk Manager',
      department: 'Reception',
      hireDate: new Date('2022-01-15'),
      salary: 55000,
      isActive: true
    },
    {
      employeeId: 'EMP002',
      name: 'Mike Chen',
      email: 'mike.chen@smarthotel.com',
      phone: '+1-800-555-0202',
      position: 'Housekeeping Supervisor',
      department: 'Housekeeping',
      hireDate: new Date('2021-06-10'),
      salary: 45000,
      isActive: true
    },
    {
      employeeId: 'EMP003',
      name: 'Lisa Rodriguez',
      email: 'lisa.rodriguez@smarthotel.com',
      phone: '+1-800-555-0203',
      position: 'Head Chef',
      department: 'Kitchen',
      hireDate: new Date('2020-03-20'),
      salary: 65000,
      isActive: true
    },
    {
      employeeId: 'EMP004',
      name: 'David Park',
      email: 'david.park@smarthotel.com',
      phone: '+1-800-555-0204',
      position: 'Maintenance Technician',
      department: 'Maintenance',
      hireDate: new Date('2021-09-01'),
      salary: 42000,
      isActive: true
    },
    {
      employeeId: 'EMP005',
      name: 'Jennifer Lee',
      email: 'jennifer.lee@smarthotel.com',
      phone: '+1-800-555-0205',
      position: 'Receptionist',
      department: 'Reception',
      hireDate: new Date('2023-02-14'),
      salary: 38000,
      isActive: true
    },
    {
      employeeId: 'EMP006',
      name: 'Robert Taylor',
      email: 'robert.taylor@smarthotel.com',
      phone: '+1-800-555-0206',
      position: 'Sous Chef',
      department: 'Kitchen',
      hireDate: new Date('2022-07-01'),
      salary: 52000,
      isActive: true
    },
    {
      employeeId: 'EMP007',
      name: 'Maria Gonzalez',
      email: 'maria.gonzalez@smarthotel.com',
      phone: '+1-800-555-0207',
      position: 'Housekeeper',
      department: 'Housekeeping',
      hireDate: new Date('2023-04-01'),
      salary: 35000,
      isActive: true
    },
    {
      employeeId: 'EMP008',
      name: 'Kevin White',
      email: 'kevin.white@smarthotel.com',
      phone: '+1-800-555-0208',
      position: 'Bellhop',
      department: 'Reception',
      hireDate: new Date('2023-06-15'),
      salary: 32000,
      isActive: true
    },
    {
      employeeId: 'EMP009',
      name: 'Amanda Harris',
      email: 'amanda.harris@smarthotel.com',
      phone: '+1-800-555-0209',
      position: 'Restaurant Manager',
      department: 'Restaurant',
      hireDate: new Date('2021-11-01'),
      salary: 58000,
      isActive: true
    },
    {
      employeeId: 'EMP010',
      name: 'Daniel Kim',
      email: 'daniel.kim@smarthotel.com',
      phone: '+1-800-555-0210',
      position: 'Security Officer',
      department: 'Security',
      hireDate: new Date('2022-08-20'),
      salary: 40000,
      isActive: true
    }
  ]

  const createdStaff = []
  for (const staffData of staffMembers) {
    const staff = await prisma.staff.upsert({
      where: { employeeId: staffData.employeeId },
      update: {},
      create: staffData
    })
    createdStaff.push(staff)
  }

  console.log(`✅ Created ${createdStaff.length} staff members`)

  // ==================== ROOMS (10+) ====================
  console.log('🛏️ Seeding Rooms...')

  const rooms = [
    {
      number: '101',
      type: 'Standard Room',
      price: 129,
      capacity: 2,
      description: 'Comfortable standard room with city view and modern amenities',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Safe', 'Coffee Maker'],
      images: ['/images/room-standard.jpg'],
      status: 'AVAILABLE' as const,
      floor: 1,
      size: 28
    },
    {
      number: '102',
      type: 'Standard Room',
      price: 129,
      capacity: 2,
      description: 'Cozy standard room perfect for business travelers',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Safe', 'Work Desk'],
      images: ['/images/room-standard.jpg'],
      status: 'AVAILABLE' as const,
      floor: 1,
      size: 28
    },
    {
      number: '201',
      type: 'Deluxe Room',
      price: 199,
      capacity: 3,
      description: 'Spacious deluxe room with premium amenities and city skyline views',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Safe', 'Mini Bar', 'Balcony', 'Coffee Maker'],
      images: ['/images/room-deluxe.jpg'],
      status: 'OCCUPIED' as const,
      floor: 2,
      size: 35
    },
    {
      number: '202',
      type: 'Deluxe Room',
      price: 199,
      capacity: 3,
      description: 'Modern deluxe room with elegant furnishings',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Safe', 'Mini Bar', 'Balcony'],
      images: ['/images/room-deluxe.jpg'],
      status: 'AVAILABLE' as const,
      floor: 2,
      size: 35
    },
    {
      number: '301',
      type: 'Suite',
      price: 299,
      capacity: 4,
      description: 'Luxury suite with separate living area and premium facilities',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Safe', 'Mini Bar', 'Balcony', 'Kitchen', 'Jacuzzi'],
      images: ['/images/room-suite.jpg'],
      status: 'RESERVED' as const,
      floor: 3,
      size: 55
    },
    {
      number: '302',
      type: 'Suite',
      price: 299,
      capacity: 4,
      description: 'Elegant suite perfect for families or extended stays',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Safe', 'Mini Bar', 'Balcony', 'Kitchen'],
      images: ['/images/room-suite.jpg'],
      status: 'AVAILABLE' as const,
      floor: 3,
      size: 55
    },
    {
      number: '401',
      type: 'Presidential Suite',
      price: 599,
      capacity: 6,
      description: 'Ultimate luxury with panoramic views, private terrace, and butler service',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Safe', 'Mini Bar', 'Terrace', 'Full Kitchen', 'Jacuzzi', 'Butler Service', 'Piano'],
      images: ['/images/room-presidential.jpg'],
      status: 'AVAILABLE' as const,
      floor: 4,
      size: 120
    },
    {
      number: '203',
      type: 'Deluxe Room',
      price: 199,
      capacity: 3,
      description: 'Corner deluxe room with enhanced space and natural light',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Safe', 'Mini Bar', 'Balcony', 'Coffee Maker'],
      images: ['/images/room-deluxe.jpg'],
      status: 'MAINTENANCE' as const,
      floor: 2,
      size: 40
    },
    {
      number: '104',
      type: 'Standard Room',
      price: 129,
      capacity: 2,
      description: 'Well-appointed standard room with garden view',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Safe'],
      images: ['/images/room-standard.jpg'],
      status: 'AVAILABLE' as const,
      floor: 1,
      size: 28
    },
    {
      number: '303',
      type: 'Suite',
      price: 299,
      capacity: 4,
      description: 'Premium suite with modern design and luxury amenities',
      amenities: ['WiFi', 'TV', 'Air Conditioning', 'Safe', 'Mini Bar', 'Balcony', 'Kitchen', 'Jacuzzi', 'Steam Shower'],
      images: ['/images/room-suite.jpg'],
      status: 'AVAILABLE' as const,
      floor: 3,
      size: 60
    }
  ]

  const createdRooms = []
  for (const roomData of rooms) {
    const room = await prisma.room.upsert({
      where: { number: roomData.number },
      update: {},
      create: roomData
    })
    createdRooms.push(room)
  }

  console.log(`✅ Created ${createdRooms.length} rooms`)

  // ==================== BOOKINGS (10+) ====================
  console.log('📅 Seeding Bookings...')

  const today = new Date()
  const bookings = [
    {
      userId: createdUsers[3].id,
      roomId: createdRooms[0].id,
      checkIn: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
      checkOut: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
      guests: 2,
      totalAmount: 387,
      status: 'CONFIRMED' as const,
      paymentStatus: 'PAID' as const,
      paymentMethod: 'credit_card',
      confirmationCode: 'BK001',
      guestName: 'John Doe',
      guestEmail: 'guest@example.com',
      guestPhone: '+1-555-0104'
    },
    {
      userId: createdUsers[4].id,
      roomId: createdRooms[2].id,
      checkIn: today,
      checkOut: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      guests: 2,
      totalAmount: 597,
      status: 'CHECKED_IN' as const,
      paymentStatus: 'PAID' as const,
      paymentMethod: 'credit_card',
      confirmationCode: 'BK002',
      guestName: 'Emma Wilson',
      guestEmail: 'emma.wilson@example.com'
    },
    {
      userId: createdUsers[5].id,
      roomId: createdRooms[4].id,
      checkIn: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      checkOut: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
      guests: 4,
      totalAmount: 897,
      status: 'CONFIRMED' as const,
      paymentStatus: 'PAID' as const,
      paymentMethod: 'credit_card',
      confirmationCode: 'BK003',
      guestName: 'Michael Brown',
      guestEmail: 'michael.brown@example.com'
    },
    {
      userId: createdUsers[6].id,
      roomId: createdRooms[1].id,
      checkIn: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      checkOut: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      guests: 2,
      totalAmount: 258,
      status: 'CHECKED_OUT' as const,
      paymentStatus: 'PAID' as const,
      paymentMethod: 'credit_card',
      confirmationCode: 'BK004',
      guestName: 'Sophia Davis',
      guestEmail: 'sophia.davis@example.com'
    },
    {
      userId: createdUsers[7].id,
      roomId: createdRooms[3].id,
      checkIn: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
      checkOut: new Date(today.getTime() + 17 * 24 * 60 * 60 * 1000),
      guests: 3,
      totalAmount: 597,
      status: 'PENDING' as const,
      paymentStatus: 'PENDING' as const,
      confirmationCode: 'BK005',
      guestName: 'James Miller',
      guestEmail: 'james.miller@example.com'
    },
    {
      userId: createdUsers[8].id,
      roomId: createdRooms[5].id,
      checkIn: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      checkOut: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      guests: 4,
      totalAmount: 897,
      status: 'CONFIRMED' as const,
      paymentStatus: 'PAID' as const,
      paymentMethod: 'debit_card',
      confirmationCode: 'BK006',
      guestName: 'Olivia Garcia',
      guestEmail: 'olivia.garcia@example.com'
    },
    {
      userId: createdUsers[9].id,
      roomId: createdRooms[6].id,
      checkIn: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
      checkOut: new Date(today.getTime() + 24 * 24 * 60 * 60 * 1000),
      guests: 6,
      totalAmount: 1797,
      status: 'CONFIRMED' as const,
      paymentStatus: 'PAID' as const,
      paymentMethod: 'credit_card',
      confirmationCode: 'BK007',
      guestName: 'William Martinez',
      guestEmail: 'william.martinez@example.com',
      specialRequests: 'Honeymoon suite setup requested'
    },
    {
      userId: createdUsers[3].id,
      roomId: createdRooms[8].id,
      checkIn: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      checkOut: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000),
      guests: 2,
      totalAmount: 258,
      status: 'CHECKED_OUT' as const,
      paymentStatus: 'PAID' as const,
      paymentMethod: 'credit_card',
      confirmationCode: 'BK008'
    },
    {
      userId: createdUsers[4].id,
      roomId: createdRooms[9].id,
      checkIn: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      checkOut: new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000),
      guests: 4,
      totalAmount: 1495,
      status: 'CONFIRMED' as const,
      paymentStatus: 'PAID' as const,
      paymentMethod: 'credit_card',
      confirmationCode: 'BK009'
    },
    {
      userId: createdUsers[5].id,
      roomId: createdRooms[0].id,
      checkIn: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      checkOut: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      guests: 1,
      totalAmount: 258,
      status: 'CANCELLED' as const,
      paymentStatus: 'REFUNDED' as const,
      confirmationCode: 'BK010',
      cancellationReason: 'Guest emergency'
    }
  ]

  const createdBookings = []
  for (const bookingData of bookings) {
    const booking = await prisma.booking.create({
      data: bookingData
    })
    createdBookings.push(booking)
  }

  console.log(`✅ Created ${createdBookings.length} bookings`)

  // ==================== FOOD MENU (10+) ====================
  console.log('🍽️ Seeding Food Menu...')

  const menuItems = [
    {
      name: 'Continental Breakfast',
      description: 'Fresh fruits, pastries, coffee, juice, and yogurt',
      price: 25,
      category: 'BREAKFAST' as const,
      available: true,
      preparationTime: 15
    },
    {
      name: 'American Breakfast',
      description: 'Eggs, bacon, sausage, hash browns, and toast',
      price: 28,
      category: 'BREAKFAST' as const,
      available: true,
      preparationTime: 20
    },
    {
      name: 'Caesar Salad',
      description: 'Crisp romaine lettuce with parmesan, croutons, and Caesar dressing',
      price: 18,
      category: 'APPETIZERS' as const,
      available: true,
      preparationTime: 10
    },
    {
      name: 'Grilled Salmon',
      description: 'Fresh Atlantic salmon with herbs, lemon, and seasonal vegetables',
      price: 35,
      category: 'MAIN_COURSE' as const,
      available: true,
      preparationTime: 25
    },
    {
      name: 'Beef Tenderloin',
      description: 'Prime beef tenderloin with mushroom sauce and roasted potatoes',
      price: 42,
      category: 'MAIN_COURSE' as const,
      available: true,
      preparationTime: 30
    },
    {
      name: 'Vegetarian Pasta',
      description: 'Fresh pasta with seasonal vegetables in tomato basil sauce',
      price: 24,
      category: 'MAIN_COURSE' as const,
      available: true,
      preparationTime: 20
    },
    {
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with molten center and vanilla ice cream',
      price: 12,
      category: 'DESSERTS' as const,
      available: true,
      preparationTime: 15
    },
    {
      name: 'Tiramisu',
      description: 'Classic Italian dessert with coffee-soaked ladyfingers',
      price: 14,
      category: 'DESSERTS' as const,
      available: true,
      preparationTime: 5
    },
    {
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed orange juice',
      price: 8,
      category: 'BEVERAGES' as const,
      available: true,
      preparationTime: 5
    },
    {
      name: 'Cappuccino',
      description: 'Espresso with steamed milk and foam',
      price: 6,
      category: 'BEVERAGES' as const,
      available: true,
      preparationTime: 5
    },
    {
      name: 'Club Sandwich',
      description: 'Triple-decker with turkey, bacon, lettuce, tomato, and mayo',
      price: 22,
      category: 'LUNCH' as const,
      available: true,
      preparationTime: 15
    },
    {
      name: 'French Fries',
      description: 'Crispy golden fries with house seasoning',
      price: 8,
      category: 'SIDES' as const,
      available: true,
      preparationTime: 12
    }
  ]

  const createdMenuItems = []
  for (const menuItem of menuItems) {
    const item = await prisma.foodMenu.create({
      data: menuItem
    })
    createdMenuItems.push(item)
  }

  console.log(`✅ Created ${createdMenuItems.length} menu items`)

  // ==================== FOOD ORDERS (10+) ====================
  console.log('🍔 Seeding Food Orders...')

  const foodOrders = [
    {
      roomNumber: '201',
      guestId: createdUsers[4].id,
      status: 'DELIVERED' as const,
      totalAmount: 75,
      specialRequests: 'No onions please',
      items: {
        create: [
          {
            menuId: createdMenuItems[0].id,
            quantity: 2,
            unitPrice: 25,
            notes: 'Extra coffee'
          },
          {
            menuId: createdMenuItems[8].id,
            quantity: 2,
            unitPrice: 8
          },
          {
            menuId: createdMenuItems[9].id,
            quantity: 1,
            unitPrice: 6
          }
        ]
      }
    },
    {
      roomNumber: '301',
      guestId: createdUsers[5].id,
      status: 'PREPARING' as const,
      totalAmount: 118,
      specialRequests: 'Gluten-free bread please',
      items: {
        create: [
          {
            menuId: createdMenuItems[3].id,
            quantity: 2,
            unitPrice: 35
          },
          {
            menuId: createdMenuItems[2].id,
            quantity: 2,
            unitPrice: 18
          },
          {
            menuId: createdMenuItems[6].id,
            quantity: 1,
            unitPrice: 12
          }
        ]
      }
    },
    {
      roomNumber: '101',
      guestId: createdUsers[3].id,
      status: 'READY' as const,
      totalAmount: 66,
      items: {
        create: [
          {
            menuId: createdMenuItems[4].id,
            quantity: 1,
            unitPrice: 42
          },
          {
            menuId: createdMenuItems[11].id,
            quantity: 2,
            unitPrice: 8
          },
          {
            menuId: createdMenuItems[8].id,
            quantity: 1,
            unitPrice: 8
          }
        ]
      }
    },
    {
      roomNumber: '302',
      guestId: createdUsers[8].id,
      status: 'PENDING' as const,
      totalAmount: 96,
      specialRequests: 'Room service to terrace',
      items: {
        create: [
          {
            menuId: createdMenuItems[5].id,
            quantity: 2,
            unitPrice: 24
          },
          {
            menuId: createdMenuItems[10].id,
            quantity: 2,
            unitPrice: 22
          }
        ]
      }
    },
    {
      roomNumber: '201',
      guestId: createdUsers[4].id,
      status: 'CONFIRMED' as const,
      totalAmount: 54,
      items: {
        create: [
          {
            menuId: createdMenuItems[1].id,
            quantity: 1,
            unitPrice: 28
          },
          {
            menuId: createdMenuItems[7].id,
            quantity: 1,
            unitPrice: 14
          },
          {
            menuId: createdMenuItems[9].id,
            quantity: 2,
            unitPrice: 6
          }
        ]
      }
    },
    {
      roomNumber: '101',
      guestId: createdUsers[3].id,
      status: 'DELIVERED' as const,
      totalAmount: 44,
      items: {
        create: [
          {
            menuId: createdMenuItems[10].id,
            quantity: 2,
            unitPrice: 22
          }
        ]
      }
    },
    {
      roomNumber: '302',
      guestId: createdUsers[8].id,
      status: 'PREPARING' as const,
      totalAmount: 90,
      specialRequests: 'Extra spicy',
      items: {
        create: [
          {
            menuId: createdMenuItems[4].id,
            quantity: 2,
            unitPrice: 42
          },
          {
            menuId: createdMenuItems[9].id,
            quantity: 1,
            unitPrice: 6
          }
        ]
      }
    },
    {
      roomNumber: '101',
      guestId: createdUsers[3].id,
      status: 'CANCELLED' as const,
      totalAmount: 35,
      items: {
        create: [
          {
            menuId: createdMenuItems[3].id,
            quantity: 1,
            unitPrice: 35
          }
        ]
      }
    },
    {
      roomNumber: '401',
      guestId: createdUsers[9].id,
      status: 'READY' as const,
      totalAmount: 152,
      specialRequests: 'Champagne with dessert',
      items: {
        create: [
          {
            menuId: createdMenuItems[4].id,
            quantity: 2,
            unitPrice: 42
          },
          {
            menuId: createdMenuItems[6].id,
            quantity: 2,
            unitPrice: 12
          },
          {
            menuId: createdMenuItems[7].id,
            quantity: 2,
            unitPrice: 14
          }
        ]
      }
    },
    {
      roomNumber: '201',
      guestId: createdUsers[4].id,
      status: 'PENDING' as const,
      totalAmount: 32,
      items: {
        create: [
          {
            menuId: createdMenuItems[2].id,
            quantity: 1,
            unitPrice: 18
          },
          {
            menuId: createdMenuItems[7].id,
            quantity: 1,
            unitPrice: 14
          }
        ]
      }
    }
  ]

  const createdOrders = []
  for (const orderData of foodOrders) {
    const order = await prisma.foodOrder.create({
      data: orderData
    })
    createdOrders.push(order)
  }

  console.log(`✅ Created ${createdOrders.length} food orders with items`)

  // ==================== TASKS (10+) ====================
  console.log('📋 Seeding Tasks...')

  const tasks = [
    {
      title: 'Room 101 Deep Clean',
      description: 'Thorough deep cleaning for room 101 after checkout',
      type: 'HOUSEKEEPING' as const,
      priority: 'HIGH' as const,
      status: 'PENDING' as const,
      assignedTo: createdStaff[1].id,
      dueDate: new Date(today.getTime() + 2 * 60 * 60 * 1000),
      createdBy: createdUsers[1].id
    },
    {
      title: 'AC Maintenance - Room 203',
      description: 'Check and repair air conditioning unit',
      type: 'MAINTENANCE' as const,
      priority: 'URGENT' as const,
      status: 'IN_PROGRESS' as const,
      assignedTo: createdStaff[3].id,
      dueDate: new Date(today.getTime() + 1 * 60 * 60 * 1000),
      createdBy: createdUsers[1].id
    },
    {
      title: 'Extra Towels Delivery',
      description: 'Deliver extra towels to room 201',
      type: 'ROOM_SERVICE' as const,
      priority: 'MEDIUM' as const,
      status: 'COMPLETED' as const,
      assignedTo: createdStaff[6].id,
      dueDate: new Date(today.getTime() - 1 * 60 * 60 * 1000),
      completedAt: new Date(today.getTime() - 30 * 60 * 1000),
      createdBy: createdUsers[2].id
    },
    {
      title: 'VIP Guest Welcome Setup',
      description: 'Setup welcome amenities for Presidential Suite guest',
      type: 'GUEST_REQUEST' as const,
      priority: 'HIGH' as const,
      status: 'PENDING' as const,
      assignedTo: createdStaff[0].id,
      dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      createdBy: createdUsers[1].id
    },
    {
      title: 'Weekly Inventory Count',
      description: 'Conduct weekly inventory count for all supplies',
      type: 'ADMINISTRATIVE' as const,
      priority: 'MEDIUM' as const,
      status: 'PENDING' as const,
      assignedTo: createdStaff[1].id,
      dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      createdBy: createdUsers[1].id
    },
    {
      title: 'Minibar Restocking - Room 301',
      description: 'Restock minibar for room 301',
      type: 'ROOM_SERVICE' as const,
      priority: 'LOW' as const,
      status: 'PENDING' as const,
      assignedTo: createdStaff[6].id,
      dueDate: new Date(today.getTime() + 4 * 60 * 60 * 1000),
      createdBy: createdUsers[2].id
    },
    {
      title: 'Lobby Decoration Update',
      description: 'Update seasonal decorations in main lobby',
      type: 'ADMINISTRATIVE' as const,
      priority: 'LOW' as const,
      status: 'IN_PROGRESS' as const,
      assignedTo: createdStaff[0].id,
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdBy: createdUsers[1].id
    },
    {
      title: 'Kitchen Equipment Check',
      description: 'Monthly maintenance check for all kitchen equipment',
      type: 'MAINTENANCE' as const,
      priority: 'MEDIUM' as const,
      status: 'PENDING' as const,
      assignedTo: createdStaff[3].id,
      dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      createdBy: createdUsers[1].id
    },
    {
      title: 'Late Checkout Request - Room 201',
      description: 'Guest requested 3 PM checkout',
      type: 'GUEST_REQUEST' as const,
      priority: 'MEDIUM' as const,
      status: 'COMPLETED' as const,
      assignedTo: createdStaff[4].id,
      completedAt: new Date(),
      createdBy: createdUsers[2].id
    },
    {
      title: 'Laundry Service - Room 302',
      description: 'Pick up laundry from room 302',
      type: 'ROOM_SERVICE' as const,
      priority: 'MEDIUM' as const,
      status: 'IN_PROGRESS' as const,
      assignedTo: createdStaff[6].id,
      dueDate: new Date(today.getTime() + 2 * 60 * 60 * 1000),
      createdBy: createdUsers[2].id
    }
  ]

  const createdTasks = []
  for (const taskData of tasks) {
    const task = await prisma.task.create({
      data: taskData
    })
    createdTasks.push(task)
  }

  console.log(`✅ Created ${createdTasks.length} tasks`)

  // ==================== INVENTORY (10+) ====================
  console.log('📦 Seeding Inventory...')

  const inventoryItems = [
    {
      name: 'Bath Towels',
      description: 'Luxury bath towels for guest rooms',
      category: 'Linens',
      quantity: 150,
      unit: 'pieces',
      minQuantity: 50,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Hand Towels',
      description: 'Small towels for bathrooms',
      category: 'Linens',
      quantity: 200,
      unit: 'pieces',
      minQuantity: 75,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Bed Sheets - King',
      description: 'Premium king-size bed sheets',
      category: 'Linens',
      quantity: 60,
      unit: 'sets',
      minQuantity: 30,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Coffee Beans',
      description: 'Premium Arabica coffee beans',
      category: 'Food & Beverage',
      quantity: 25,
      unit: 'kg',
      minQuantity: 10,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Tea Bags Assorted',
      description: 'Variety pack of premium teas',
      category: 'Food & Beverage',
      quantity: 500,
      unit: 'pieces',
      minQuantity: 200,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Minibar Snacks',
      description: 'Assorted snacks for minibar',
      category: 'Food & Beverage',
      quantity: 120,
      unit: 'pieces',
      minQuantity: 50,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Cleaning Supplies',
      description: 'General cleaning supplies and detergents',
      category: 'Housekeeping',
      quantity: 8,
      unit: 'sets',
      minQuantity: 15,
      status: 'LOW_STOCK' as const
    },
    {
      name: 'Vacuum Cleaner Bags',
      description: 'Replacement bags for vacuum cleaners',
      category: 'Housekeeping',
      quantity: 15,
      unit: 'pieces',
      minQuantity: 20,
      status: 'LOW_STOCK' as const
    },
    {
      name: 'Toilet Paper',
      description: 'Premium 3-ply toilet paper',
      category: 'Bathroom Supplies',
      quantity: 250,
      unit: 'rolls',
      minQuantity: 100,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Shampoo Bottles',
      description: 'Individual shampoo bottles for bathrooms',
      category: 'Bathroom Supplies',
      quantity: 180,
      unit: 'pieces',
      minQuantity: 100,
      status: 'IN_STOCK' as const
    },
    {
      name: 'Conditioner Bottles',
      description: 'Individual conditioner bottles',
      category: 'Bathroom Supplies',
      quantity: 5,
      unit: 'pieces',
      minQuantity: 100,
      status: 'OUT_OF_STOCK' as const
    },
    {
      name: 'Light Bulbs',
      description: 'LED bulbs for room lighting',
      category: 'Maintenance',
      quantity: 45,
      unit: 'pieces',
      minQuantity: 30,
      status: 'IN_STOCK' as const
    }
  ]

  const createdInventory = []
  for (const inventoryItem of inventoryItems) {
    const item = await prisma.inventory.create({
      data: inventoryItem
    })
    createdInventory.push(item)
  }

  console.log(`✅ Created ${createdInventory.length} inventory items`)

  // ==================== GALLERY (10+) ====================
  console.log('🖼️ Seeding Gallery...')

  const galleryItems = [
    {
      title: 'Presidential Suite - Living Room',
      imageUrl: '/images/room-presidential.jpg',
      category: 'ROOM' as const
    },
    {
      title: 'Deluxe Room - Bedroom',
      imageUrl: '/images/room-deluxe.jpg',
      category: 'ROOM' as const
    },
    {
      title: 'Standard Room - Interior',
      imageUrl: '/images/room-standard.jpg',
      category: 'ROOM' as const
    },
    {
      title: 'Hotel Exterior - Night View',
      imageUrl: '/images/hotel-hero-1.jpg',
      category: 'EXTERIOR' as const
    },
    {
      title: 'Main Lobby',
      imageUrl: '/images/gallery/lobby-1.jpg',
      category: 'AMENITY' as const
    },
    {
      title: 'Fine Dining Restaurant',
      imageUrl: '/images/gallery/restaurant-1.jpg',
      category: 'FOOD' as const
    },
    {
      title: 'Breakfast Buffet',
      imageUrl: '/images/menu-placeholder.jpg',
      category: 'FOOD' as const
    },
    {
      title: 'Infinity Pool',
      imageUrl: '/images/gallery/pool-1.jpg',
      category: 'AMENITY' as const
    },
    {
      title: 'Spa & Wellness Center',
      imageUrl: '/images/gallery/spa-1.jpg',
      category: 'AMENITY' as const
    },
    {
      title: 'Wedding Venue',
      imageUrl: '/images/gallery/events-1.jpg',
      category: 'EVENT' as const
    },
    {
      title: 'Conference Room',
      imageUrl: '/images/gallery/conference-1.jpg',
      category: 'EVENT' as const
    },
    {
      title: 'Hotel Garden',
      imageUrl: '/images/gallery/garden-1.jpg',
      category: 'EXTERIOR' as const
    }
  ]

  const createdGallery = []
  for (const galleryItem of galleryItems) {
    const item = await prisma.gallery.create({
      data: galleryItem
    })
    createdGallery.push(item)
  }

  console.log(`✅ Created ${createdGallery.length} gallery items`)

  // ==================== SETTINGS ====================
  console.log('⚙️ Seeding Settings...')

  const settings = [
    { key: 'hotel_name', value: 'SmartHotel Grand Palace' },
    { key: 'hotel_address', value: '123 Grand Boulevard, City Center, Metropolitan Area, ST 10001' },
    { key: 'hotel_phone', value: '+1 (800) 555-HOTEL' },
    { key: 'hotel_email', value: 'info@smarthotel.com' },
    { key: 'check_in_time', value: '15:00' },
    { key: 'check_out_time', value: '11:00' },
    { key: 'currency', value: 'USD' },
    { key: 'timezone', value: 'America/New_York' },
    { key: 'max_booking_days', value: '30' },
    { key: 'cancellation_hours', value: '48' }
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    })
  }

  console.log(`✅ Created ${settings.length} settings`)

  // ==================== SUMMARY ====================
  console.log('\n🎉 Comprehensive database seeding completed successfully!')
  console.log('\n📊 Sample Data Summary:')
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Users:            ${createdUsers.length} (Admin, Manager, Receptionist, Guests)`)
  console.log(`✅ Staff:            ${createdStaff.length} (Various departments)`)
  console.log(`✅ Rooms:            ${createdRooms.length} (Standard to Presidential)`)
  console.log(`✅ Bookings:         ${createdBookings.length} (Various statuses)`)
  console.log(`✅ Food Menu:        ${createdMenuItems.length} (All categories)`)
  console.log(`✅ Food Orders:      ${createdOrders.length} (With order items)`)
  console.log(`✅ Tasks:            ${createdTasks.length} (Various priorities)`)
  console.log(`✅ Inventory:        ${createdInventory.length} (All categories)`)
  console.log(`✅ Gallery:          ${createdGallery.length} (All categories)`)
  console.log(`✅ Settings:         ${settings.length} (Hotel configuration)`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📦 Total Records:    ${createdUsers.length + createdStaff.length + createdRooms.length + createdBookings.length + createdMenuItems.length + createdOrders.length + createdTasks.length + createdInventory.length + createdGallery.length + settings.length}+`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log('\n🔐 Demo Login Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👑 Super Admin:')
  console.log('   Email: admin@smarthotel.com')
  console.log('   Password: admin123')
  console.log('')
  console.log('👨‍💼 Manager:')
  console.log('   Email: manager@smarthotel.com')
  console.log('   Password: manager123')
  console.log('')
  console.log('👩‍💼 Receptionist:')
  console.log('   Email: receptionist@smarthotel.com')
  console.log('   Password: receptionist123')
  console.log('')
  console.log('👤 Guest:')
  console.log('   Email: guest@example.com')
  console.log('   Password: guest123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n✅ Database is ready for demo!')
  console.log('🚀 Run: npm run dev')
  console.log('🌐 Visit: http://localhost:3000/admin')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })




