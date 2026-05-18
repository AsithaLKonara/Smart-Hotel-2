import { PrismaClient, RoomStatus, BookingStatus, BookingSource, PaymentStatus, PaymentMethod, TaskType, TaskStatus, Priority, UserRole, MaintenancePriority, MaintenanceStatus, EventStatus, LoyaltyTransactionType } from '@prisma/client'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING ENTERPRISE RELATIONAL SEEDING (POSTGRESQL) ---')

  const passwordHash = await bcrypt.hash('password123', 12)
  const adminPasswordHash = await bcrypt.hash('SmartHotel@2025!Admin', 12)

  // 1. CLEAN DB (Order matters for FK constraints)
  console.log('🧹 Cleaning database...')
  const deleteOrder = [
    'AuditLog', 'SyncLog', 'Outbox', 'Task', 'MaintenanceRequest', 
    'InvoiceLineItem', 'Invoice', 'FinancialAdjustment', 'Payment', 
    'OrderItem', 'FoodOrder', 'FoodMenu', 'LoyaltyTransaction', 'LoyaltyPoint',
    'RoomReview', 'HotelReview', 'Complaint', 'TableBooking', 'BookingGuest',
    'Booking', 'RoomImage', 'RoomStatusHistory', 'Room', 'RoomType', 
    'Staff', 'GuestPreference', 'User', 'Amenity', 'Knowledge', 'Gallery', 
    'HeroSlide', 'Inventory', 'Conversation', 'ChatCustomer', 'Setting', 
    'SocialLink', 'Testimonial', 'FooterLink', 'NavigationLink', 'FAQ', 'Event'
  ]

  for (const model of deleteOrder) {
    try {
      // @ts-ignore
      const modelName = model.charAt(0).toLowerCase() + model.slice(1);
      if (prisma[modelName]) {
        await prisma[modelName].deleteMany()
      }
    } catch (e) {
      // Ignore models that might not exist or have deletion issues
    }
  }

  // 2. CREATE AMENITIES
  console.log('🏨 Creating Amenities...')
  const amenitiesList = [
    'Ultra High-Speed Wi-Fi', 'Smart 4K TV', 'Nespresso Machine', 'Ocean View Balcony',
    'Mini Bar', 'Luxury Robes', 'Rain Shower', 'Room Automation', 'Safe Box',
    'Jacuzzi', 'Work Desk', 'Air Conditioning'
  ]
  for (const name of amenitiesList) {
    await prisma.amenity.create({ data: { name, active: true } })
  }

  // 3. CREATE ROOM TYPES
  console.log('🏢 Creating Room Types...')
  const roomTypesData = [
    { name: 'Deluxe', baseRate: 250, capacity: 2, amenities: ['Wifi', 'TV', 'Mini Bar'] },
    { name: 'Executive', baseRate: 450, capacity: 2, amenities: ['Wifi', 'TV', 'Mini Bar', 'Work Desk'] },
    { name: 'Presidential', baseRate: 1500, capacity: 4, amenities: ['Wifi', 'TV', 'Mini Bar', 'Jacuzzi', 'Bar'] },
    { name: 'Suite', baseRate: 600, capacity: 3, amenities: ['Wifi', 'TV', 'Kitchenette'] },
    { name: 'Family', baseRate: 500, capacity: 5, amenities: ['Wifi', 'TV', 'Bunk Beds'] },
    { name: 'Ocean View', baseRate: 550, capacity: 2, amenities: ['Wifi', 'TV', 'Balcony'] }
  ]

  const createdRoomTypes = []
  for (const rt of roomTypesData) {
    const created = await prisma.roomType.create({
      data: {
        ...rt,
        description: faker.lorem.paragraph()
      }
    })
    createdRoomTypes.push(created)
  }

  // 4. CREATE ROOMS (100)
  console.log('🛏️ Creating 100 Rooms...')
  const rooms = []
  for (let floor = 1; floor <= 5; floor++) {
    for (let r = 1; r <= 20; r++) {
      const roomNumber = `${floor}${r.toString().padStart(2, '0')}`
      const rt = faker.helpers.arrayElement(createdRoomTypes)
      const room = await prisma.room.create({
        data: {
          number: roomNumber,
          floor,
          capacity: rt.capacity,
          roomTypeId: rt.id,
          status: 'AVAILABLE',
          version: 1
        }
      })
      rooms.push(room)
    }
  }

  // 5. CREATE USERS (50)
  console.log('👥 Creating 50 Users...')
  const users = []
  
  // Create Essential Staff
  const staffConfigs = [
    { role: UserRole.SUPER_ADMIN, email: 'admin@smarthotel.com', name: 'System Administrator' },
    { role: UserRole.MANAGER, email: 'manager@smarthotel.com', name: 'General Manager' },
    { role: UserRole.RECEPTIONIST, email: 'reception@smarthotel.com', name: 'Front Desk Lead' },
    { role: UserRole.KITCHEN, email: 'chef@smarthotel.com', name: 'Executive Chef' },
    { role: UserRole.HOUSEKEEPING, email: 'cleaning@smarthotel.com', name: 'Housekeeping Supervisor' },
    { role: UserRole.MAINTENANCE, email: 'tech@smarthotel.com', name: 'Chief Engineer' }
  ]

  for (const cfg of staffConfigs) {
    const user = await prisma.user.create({
      data: {
        email: cfg.email,
        name: cfg.name,
        password: cfg.role === UserRole.SUPER_ADMIN ? adminPasswordHash : passwordHash,
        role: cfg.role,
        staffProfile: {
          create: {
            employeeId: `SH-${faker.string.alphanumeric(4).toUpperCase()}`,
            name: cfg.name,
            position: cfg.role.toString(),
            department: cfg.role === UserRole.KITCHEN ? 'FOOD & BEVERAGE' : 'OPERATIONS'
          }
        }
      }
    })
    users.push(user)
  }

  // Create Guest for demo
  const guestUser = await prisma.user.create({
    data: {
      email: 'guest@example.com',
      name: 'John Doe (Guest)',
      password: await bcrypt.hash('SmartHotel@2025!Guest', 12),
      role: 'GUEST',
      loyalty: { create: { tier: 'GOLD', points: 1500, totalEarned: 2000 } }
    }
  })
  users.push(guestUser)

  // Create 43 more guests
  for (let i = 0; i < 43; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        name: faker.person.fullName(),
        password: passwordHash,
        role: 'GUEST',
        phone: faker.phone.number()
      }
    })
    users.push(user)
  }

  const guests = users.filter(u => u.role === 'GUEST')
  const staff = users.filter(u => u.role !== 'GUEST')

  // 6. CREATE BOOKINGS (500)
  console.log('📅 Generating 500+ Bookings in parallel chunks of 20...')
  const today = new Date()

  async function createSingleBooking(i) {
    const guest = faker.helpers.arrayElement(guests)
    const room = faker.helpers.arrayElement(rooms)
    const rt = createdRoomTypes.find(t => t.id === room.roomTypeId)!
    
    // Distribute across -6 months to +3 months
    const checkIn = faker.date.between({ 
      from: new Date(today.getTime() - 180 * 24 * 3600000), 
      to: new Date(today.getTime() + 90 * 24 * 3600000) 
    })
    const stayNights = faker.number.int({ min: 1, max: 7 })
    const checkOut = new Date(checkIn.getTime() + stayNights * 24 * 3600000)
    
    let status: BookingStatus = 'CONFIRMED'
    if (checkOut < today) status = 'CHECKED_OUT'
    else if (checkIn < today && checkOut > today) status = 'CHECKED_IN'
    else if (faker.number.int({ min: 1, max: 10 }) === 1) status = 'CANCELLED'

    const totalAmount = rt.baseRate * stayNights

    const booking = await prisma.booking.create({
      data: {
        confirmationCode: `SH-${faker.string.alphanumeric(6).toUpperCase()}`,
        checkIn,
        checkOut,
        status,
        guests: faker.number.int({ min: 1, max: rt.capacity }),
        totalAmount,
        roomId: room.id,
        primaryGuestId: guest.id,
        paymentStatus: status === 'CHECKED_OUT' ? 'completed' : 'unpaid',
        paymentMethod: 'card',
        source: faker.helpers.arrayElement(['WEBSITE', 'BOOKING_COM', 'AGODA', 'WALK_IN']) as BookingSource
      }
    })

    // Create Invoice if Checked Out
    if (status === 'CHECKED_OUT') {
      await prisma.invoice.create({
        data: {
          invoiceNo: `INV-${faker.number.int({ min: 100000, max: 999999 })}`,
          bookingId: booking.id,
          subtotal: totalAmount / 1.1,
          taxAmount: totalAmount - (totalAmount / 1.1),
          grandTotal: totalAmount,
          status: 'PAID',
          lineItems: {
            create: [
              { description: `Accommodation - ${rt.name}`, quantity: stayNights, unitPrice: rt.baseRate, totalPrice: totalAmount, category: 'STAY' }
            ]
          }
        }
      })
      
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalAmount,
          status: 'completed',
          paymentMethod: 'card',
          capturedAt: checkIn
        }
      })
    }
  }

  // Execute in batches of 20 to speed up seeding and prevent timeout disconnects
  const chunkSize = 20;
  for (let i = 0; i < 500; i += chunkSize) {
    const chunkPromises = [];
    for (let j = 0; j < chunkSize && i + j < 500; j++) {
      chunkPromises.push(createSingleBooking(i + j));
    }
    await Promise.all(chunkPromises);
    if ((i + chunkSize) % 100 === 0 || i + chunkSize >= 500) {
      console.log(`  - Seeded ${Math.min(i + chunkSize, 500)}/500 bookings`);
    }
  }

  // 7. CREATE TASKS & MAINTENANCE
  console.log('🧹 Creating Tasks...')
  const housekeepingStaff = await prisma.staff.findFirst({
    where: {
      user: {
        role: 'HOUSEKEEPING'
      }
    }
  })
  const hksId = housekeepingStaff?.id || null

  for (let i = 0; i < 30; i++) {
    const room = faker.helpers.arrayElement(rooms)
    await prisma.task.create({
      data: {
        type: 'HOUSEKEEPING',
        status: faker.helpers.arrayElement(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
        title: `Clean Room ${room.number}`,
        priority: 'MEDIUM',
        roomId: room.id,
        assignedTo: hksId
      }
    })
  }

  // 8. FOOD MENU & ORDERS
  console.log('🍴 Creating Food Menu...')
  const menuCategories = ['Breakfast', 'Main Course', 'Appetizers', 'Drinks', 'Dessert']
  const menuItems = []
  for (const cat of menuCategories) {
    for (let i = 0; i < 4; i++) {
      const item = await prisma.foodMenu.create({
        data: {
          name: faker.food.dish(),
          description: faker.food.description(),
          category: cat,
          price: faker.number.float({ min: 10, max: 50, fractionDigits: 2 }),
          preparationTime: faker.number.int({ min: 15, max: 45 })
        }
      })
      menuItems.push(item)
    }
  }

  // 9. AUDIT LOGS
  console.log('📜 Generating Audit Logs...')
  for (let i = 0; i < 50; i++) {
    await prisma.auditLog.create({
      data: {
        actor: faker.helpers.arrayElement(staff).name,
        action: faker.helpers.arrayElement(['LOGIN', 'BOOKING_CREATE', 'ROOM_UPDATE', 'PAYMENT_CAPTURE']),
        resource: 'SYSTEM',
        details: { ip: faker.internet.ip(), browser: 'Chrome' }
      }
    })
  }

  // 10. CONTACT MESSAGES
  console.log('📧 Creating Contact Messages...')
  for (let i = 0; i < 15; i++) {
    await prisma.contactMessage.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        subject: faker.helpers.arrayElement(['Booking Inquiry', 'Corporate Rates', 'Event Hosting']),
        message: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['UNREAD', 'READ', 'REPLIED'])
      }
    })
  }

  console.log('🚀 ENTERPRISE SEEDING COMPLETE')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })