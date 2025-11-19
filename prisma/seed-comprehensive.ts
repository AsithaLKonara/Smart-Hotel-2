import { PrismaClient } from '@prisma/client'
// Note: Enums don't exist in Prisma schema - define locally
type UserRole = 'GUEST' | 'STAFF' | 'MANAGER' | 'SUPER_ADMIN' | 'RECEPTIONIST'
type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING' | 'RESERVED'
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
type TaskType = 'CLEANING' | 'MAINTENANCE' | 'ROOM_SERVICE' | 'CONCIERGE' | 'OTHER'
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type FoodCategory = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'BEVERAGES' | 'SNACKS'
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
type GalleryCategory = 'ROOM' | 'RESTAURANT' | 'FACILITY' | 'EVENT'
type PromotionType = 'DISCOUNT' | 'PACKAGE' | 'SEASONAL'
type EmailStatus = 'PENDING' | 'SENT' | 'FAILED'
type NotificationType = 'GENERAL' | 'BOOKING_REMINDER' | 'ROOM_SERVICE_READY' | 'PAYMENT_RECEIVED' | 'CHECK_IN_REMINDER' | 'CHECK_OUT_REMINDER'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function clearDatabase() {
  // Note: These models don't exist in schema - skip clearing
  // await prisma.emailLog.deleteMany()
  // await prisma.emailTemplate.deleteMany()
  // await prisma.promotion.deleteMany()
  // await prisma.guestReview.deleteMany()
  // Note: These models don't exist in schema - skip clearing
  // await prisma.wishlist.deleteMany()
  
  // Delete in correct order to respect foreign key constraints
  // Delete child records first, then parent records
  
  // Delete OrderItem first (child) before FoodOrder (parent)
  try {
    await prisma.orderItem.deleteMany()
  } catch (e) {
    // OrderItem might not exist, continue
  }
  
  // Delete Payment (references Booking, FoodOrder, User)
  try {
    await prisma.payment.deleteMany()
  } catch (e) {
    // Continue if doesn't exist
  }
  
  // Delete RoomImage (references Room)
  try {
    await prisma.roomImage.deleteMany()
  } catch (e) {
    // Continue if doesn't exist
  }
  
  // Delete RoomReview (references Room, User, Booking)
  try {
    await prisma.roomReview.deleteMany()
  } catch (e) {
    // Continue if doesn't exist
  }
  
  // Delete FoodOrder (references User)
  await prisma.foodOrder.deleteMany()
  
  // Delete FoodMenu (no dependencies)
  await prisma.foodMenu.deleteMany()
  
  // Delete Task (references User/Staff)
  await prisma.task.deleteMany()
  
  // Delete Booking (references Room, User)
  await prisma.booking.deleteMany()
  
  // Delete Room (after deleting dependent records)
  await prisma.room.deleteMany()
  
  // Delete Staff (no dependencies)
  await prisma.staff.deleteMany()
  
  // Delete Inventory (no dependencies)
  await prisma.inventory.deleteMany()
  
  // Delete Gallery (no dependencies)
  await prisma.gallery.deleteMany()
  
  // Delete Setting (no dependencies)
  await prisma.setting.deleteMany()
  
  // Delete Notification (references User)
  try {
    await prisma.notification.deleteMany()
  } catch (e) {
    // Continue if doesn't exist
  }
  
  // Delete User last (after all dependent records)
  await prisma.user.deleteMany()
}

async function main() {
  console.log('🌱 Rebuilding comprehensive SmartHotel demo dataset...')
  await clearDatabase()

  const passwordHashes = {
    admin: await bcrypt.hash('admin123', 12),
    manager: await bcrypt.hash('manager123', 12),
    receptionist: await bcrypt.hash('receptionist123', 12),
    guest: await bcrypt.hash('guest123', 12),
  }

  const userSeeds = [
    { key: 'admin', name: 'Super Admin', email: 'admin@smarthotel.com', phone: '+1-800-555-0001', role: 'SUPER_ADMIN' as UserRole },
    { key: 'manager', name: 'Hotel Manager', email: 'manager@smarthotel.com', phone: '+1-800-555-0002', role: 'MANAGER' as UserRole },
    { key: 'receptionist', name: 'Front Desk Receptionist', email: 'receptionist@smarthotel.com', phone: '+1-800-555-0003', role: 'RECEPTIONIST' as UserRole },
    { key: 'guest1', name: 'Emily Carter', email: 'emily.carter@example.com', phone: '+1-800-555-1001', role: 'GUEST' as UserRole },
    { key: 'guest2', name: 'Michael Rivera', email: 'michael.rivera@example.com', phone: '+1-800-555-1002', role: 'GUEST' as UserRole },
    { key: 'guest3', name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+1-800-555-1003', role: 'GUEST' as UserRole },
    { key: 'guest4', name: 'Oliver Chen', email: 'oliver.chen@example.com', phone: '+1-800-555-1004', role: 'GUEST' as UserRole },
    { key: 'guest5', name: 'Sofia Hernandez', email: 'sofia.hernandez@example.com', phone: '+1-800-555-1005', role: 'GUEST' as UserRole },
    { key: 'guest6', name: 'Daniel Thompson', email: 'daniel.thompson@example.com', phone: '+1-800-555-1006', role: 'GUEST' as UserRole },
    { key: 'guest7', name: 'Ava Williams', email: 'ava.williams@example.com', phone: '+1-800-555-1007', role: 'GUEST' as UserRole },
  ]

  const users: Record<string, { id: string }> = {}
  for (const user of userSeeds) {
    const password =
      user.role === 'SUPER_ADMIN' as UserRole
        ? passwordHashes.admin
        : user.role === 'MANAGER' as UserRole
        ? passwordHashes.manager
        : user.role === 'RECEPTIONIST' as UserRole
        ? passwordHashes.receptionist
        : passwordHashes.guest

    const record = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password,
        phone: user.phone,
        role: user.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    users[user.key] = { id: record.id }
  }

  const staffSeeds = [
    { employeeId: 'EMP001', name: 'Sarah Johnson', email: 'sarah.johnson@smarthotel.com', phone: '+1-800-555-2001', position: 'Front Desk Supervisor', department: 'Front Office', salary: 54000 },
    { employeeId: 'EMP002', name: 'Marcus Lee', email: 'marcus.lee@smarthotel.com', phone: '+1-800-555-2002', position: 'Chief Concierge', department: 'Guest Services', salary: 58000 },
    { employeeId: 'EMP003', name: 'Isabella Rossi', email: 'isabella.rossi@smarthotel.com', phone: '+1-800-555-2003', position: 'Executive Chef', department: 'Food & Beverage', salary: 72000 },
    { employeeId: 'EMP004', name: 'James Anderson', email: 'james.anderson@smarthotel.com', phone: '+1-800-555-2004', position: 'Events Manager', department: 'Events', salary: 61000 },
    { employeeId: 'EMP005', name: 'Laura Bennett', email: 'laura.bennett@smarthotel.com', phone: '+1-800-555-2005', position: 'Spa Director', department: 'Spa & Wellness', salary: 65000 },
    { employeeId: 'EMP006', name: 'Hiro Tanaka', email: 'hiro.tanaka@smarthotel.com', phone: '+1-800-555-2006', position: 'Facilities Engineer', department: 'Engineering', salary: 57000 },
    { employeeId: 'EMP007', name: 'Natalie Brooks', email: 'natalie.brooks@smarthotel.com', phone: '+1-800-555-2007', position: 'Housekeeping Supervisor', department: 'Housekeeping', salary: 52000 },
    { employeeId: 'EMP008', name: 'Carlos Mendes', email: 'carlos.mendes@smarthotel.com', phone: '+1-800-555-2008', position: 'Security Chief', department: 'Security', salary: 49000 },
    { employeeId: 'EMP009', name: 'Lily Thompson', email: 'lily.thompson@smarthotel.com', phone: '+1-800-555-2009', position: 'Revenue Analyst', department: 'Finance', salary: 68000 },
    { employeeId: 'EMP010', name: 'Ahmed Farouk', email: 'ahmed.farouk@smarthotel.com', phone: '+1-800-555-2010', position: 'IT Systems Manager', department: 'Technology', salary: 63000 },
  ]

  const staffMembers = await Promise.all(
    staffSeeds.map((staff, index) =>
      prisma.staff.create({
        data: {
          ...staff,
          hireDate: new Date(`2020-0${(index % 6) + 1}-15`),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    )
  )

  const roomSeeds = [
    { number: '101', type: 'Deluxe King', price: 325, capacity: 2, floor: 10, size: 42, status: 'AVAILABLE' as RoomStatus, amenities: ['City View', 'King Bed', 'Rain Shower', 'Mini Bar'] },
    { number: '102', type: 'Deluxe Twin', price: 315, capacity: 3, floor: 10, size: 40, status: 'AVAILABLE' as RoomStatus, amenities: ['Garden View', 'Twin Beds', 'Smart TV'] },
    { number: '201', type: 'Executive Suite', price: 520, capacity: 4, floor: 20, size: 68, status: 'OCCUPIED' as RoomStatus, amenities: ['Living Area', 'Workspace', 'Butler Service', 'Balcony'] },
    { number: '202', type: 'Executive Corner Suite', price: 560, capacity: 4, floor: 20, size: 72, status: 'RESERVED' as RoomStatus, amenities: ['Panoramic View', 'Jacuzzi', 'Butler Service'] },
    { number: '301', type: 'Presidential Suite', price: 980, capacity: 6, floor: 30, size: 120, status: 'AVAILABLE' as RoomStatus, amenities: ['Dining Room', 'Private Terrace', 'Grand Piano'] },
    { number: '302', type: 'Skyline Suite', price: 680, capacity: 5, floor: 30, size: 90, status: 'AVAILABLE' as RoomStatus, amenities: ['Skyline View', 'Kitchenette', 'Media Room'] },
    { number: '401', type: 'Grand Deluxe King', price: 360, capacity: 3, floor: 12, size: 45, status: 'MAINTENANCE' as RoomStatus, amenities: ['Renovation', 'Walk-in Closet'] },
    { number: '402', type: 'Grand Deluxe Accessible', price: 340, capacity: 3, floor: 12, size: 45, status: 'AVAILABLE' as RoomStatus, amenities: ['Accessible Bathroom', 'Lowered Switches', 'Assistive Devices'] },
    { number: '501', type: 'Junior Suite', price: 410, capacity: 4, floor: 16, size: 55, status: 'AVAILABLE' as RoomStatus, amenities: ['Wet Bar', 'Lounge Area', 'Rain Shower'] },
    { number: '502', type: 'Family Suite', price: 445, capacity: 5, floor: 16, size: 60, status: 'OCCUPIED' as RoomStatus, amenities: ['Connecting Room', 'Double Vanity', 'Kids Amenities'] },
  ]

  const rooms = []
  for (const room of roomSeeds) {
    // Use empty array to trigger frontend fallback to type-specific placeholders
    // Frontend will automatically use appropriate placeholder based on room type
    const record = await prisma.room.create({
      data: {
        number: room.number,
        type: room.type,
        price: room.price,
        capacity: room.capacity,
        description: `${room.type} featuring ${room.amenities.slice(0, 2).join(', ').toLowerCase()} and bespoke SmartHotel touches.`,
        amenities: room.amenities,
        images: [], // Empty array - frontend will use type-specific placeholders
        status: room.status,
        floor: room.floor,
        size: room.size,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    rooms.push(record)
  }

  const roomFeatureSeeds = [
    { name: 'Complimentary Champagne', icon: 'sparkles', description: 'Welcome bottle of French champagne upon arrival', category: 'service' },
    { name: 'Turndown Aromatherapy', icon: 'telescope', description: 'Choose from three bespoke aromas for nightly turndown service', category: 'amenity' },
    { name: 'In-Room Peloton Bike', icon: 'bike', description: 'State-of-the-art Peloton bike with curated SmartHotel workouts', category: 'feature' },
    { name: 'Digital Concierge Tablet', icon: 'tablet', description: '24/7 virtual concierge with on-demand services', category: 'service' },
  ]
  // Note: roomFeature model doesn't exist in schema
  // await prisma.roomFeature.createMany({ data: roomFeatureSeeds })

  // Skip roomImage creation - frontend will use type-specific placeholders
  // This prevents 400 errors from missing image files
  // Room images can be added later via admin panel when actual images are available

  const bookingSeeds = [
    {
      userKey: 'guest1',
      roomNumber: '201',
      checkIn: new Date('2025-02-12'),
      checkOut: new Date('2025-02-16'),
      guests: 2,
      totalAmount: 2080,
      status: 'CONFIRMED' as BookingStatus,
      paymentStatus: 'PAID' as PaymentStatus,
      paymentMethod: 'pay_now',
      specialRequests: 'Late-night airport transfer',
      createdAt: new Date('2025-01-05'),
    },
    {
      userKey: 'guest2',
      roomNumber: '301',
      checkIn: new Date('2025-03-01'),
      checkOut: new Date('2025-03-05'),
      guests: 4,
      totalAmount: 3920,
      status: 'PENDING' as BookingStatus,
      paymentStatus: 'PENDING' as PaymentStatus,
      paymentMethod: 'pay_now',
      specialRequests: 'Private chef dinner for first evening',
      createdAt: new Date('2025-02-10'),
    },
    {
      userKey: 'guest3',
      roomNumber: '102',
      checkIn: new Date('2025-01-20'),
      checkOut: new Date('2025-01-22'),
      guests: 2,
      totalAmount: 630,
      status: 'CHECKED_IN' as BookingStatus,
      paymentStatus: 'PAID' as PaymentStatus,
      paymentMethod: 'pay_later',
      specialRequests: 'Feather-free pillows',
      createdAt: new Date('2025-01-05'),
    },
    {
      userKey: 'guest4',
      roomNumber: '502',
      checkIn: new Date('2025-01-10'),
      checkOut: new Date('2025-01-14'),
      guests: 4,
      totalAmount: 1780,
      status: 'CHECKED_OUT' as BookingStatus,
      paymentStatus: 'PAID' as PaymentStatus,
      paymentMethod: 'pay_now',
      specialRequests: 'Children amenities on arrival',
      createdAt: new Date('2024-12-20'),
    },
    {
      userKey: 'guest5',
      roomNumber: '302',
      checkIn: new Date('2025-04-02'),
      checkOut: new Date('2025-04-06'),
      guests: 3,
      totalAmount: 2720,
      status: 'CONFIRMED' as BookingStatus,
      paymentStatus: 'PARTIAL' as PaymentStatus,
      paymentMethod: 'pay_now',
      specialRequests: 'Vegan minibar selection',
      createdAt: new Date('2025-02-28'),
    },
    {
      userKey: 'guest6',
      roomNumber: '101',
      checkIn: new Date('2025-02-05'),
      checkOut: new Date('2025-02-07'),
      guests: 2,
      totalAmount: 650,
      status: 'CANCELLED' as BookingStatus,
      paymentStatus: 'REFUNDED' as PaymentStatus,
      paymentMethod: 'pay_now',
      specialRequests: 'Corner room requested',
      createdAt: new Date('2025-01-15'),
    },
    {
      userKey: 'guest7',
      roomNumber: '402',
      checkIn: new Date('2025-02-18'),
      checkOut: new Date('2025-02-21'),
      guests: 2,
      totalAmount: 1020,
      status: 'CONFIRMED' as BookingStatus,
      paymentStatus: 'PAID' as PaymentStatus,
      paymentMethod: 'pay_now',
      specialRequests: 'Accessible airport transfer',
      createdAt: new Date('2025-01-12'),
    },
    {
      userKey: 'guest1',
      roomNumber: '501',
      checkIn: new Date('2024-12-15'),
      checkOut: new Date('2024-12-18'),
      guests: 3,
      totalAmount: 1230,
      status: 'CHECKED_OUT' as BookingStatus,
      paymentStatus: 'PAID' as PaymentStatus,
      paymentMethod: 'pay_later',
      specialRequests: 'Extra bed for child',
      createdAt: new Date('2024-11-25'),
    },
    {
      userKey: 'guest2',
      roomNumber: '401',
      checkIn: new Date('2025-05-10'),
      checkOut: new Date('2025-05-12'),
      guests: 2,
      totalAmount: 720,
      status: 'PENDING' as BookingStatus,
      paymentStatus: 'PENDING' as PaymentStatus,
      paymentMethod: 'pay_now',
      specialRequests: 'Renovation update before arrival',
      createdAt: new Date('2025-03-20'),
    },
    {
      userKey: 'guest3',
      roomNumber: '202',
      checkIn: new Date('2025-02-25'),
      checkOut: new Date('2025-02-28'),
      guests: 2,
      totalAmount: 1680,
      status: 'CONFIRMED' as BookingStatus,
      paymentStatus: 'PAID' as PaymentStatus,
      paymentMethod: 'pay_now',
      specialRequests: 'Butler to arrange city tour',
      createdAt: new Date('2025-01-30'),
    },
  ]

  const bookings = []
  for (let i = 0; i < bookingSeeds.length; i++) {
    const booking = bookingSeeds[i]
    const room = rooms.find(r => r.number === booking.roomNumber)
    if (!room) continue

    // Add small delay to ensure unique timestamps for confirmationCode generation
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Generate unique confirmation code
    const confirmationCode = `GP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}${i}`
    
    try {
      const record = await prisma.booking.create({
        data: {
          userId: users[booking.userKey].id,
          roomId: room.id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: BigInt(booking.guests),
          totalAmount: booking.totalAmount,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          paymentMethod: booking.paymentMethod,
          specialRequests: booking.specialRequests || null,
          confirmationCode,
          createdAt: booking.createdAt,
          updatedAt: booking.createdAt,
        },
      })
      bookings.push(record)
    } catch (error: any) {
      // If confirmationCode constraint error, try with a different code
      if (error.code === 'P2002' && error.meta?.target?.includes('confirmationCode')) {
        // Retry with a more unique code
        const retryCode = `GP${Date.now()}${Math.floor(Math.random() * 10000)}${i}${Math.random().toString(36).substring(7)}`
        try {
          const record = await prisma.booking.create({
            data: {
              userId: users[booking.userKey].id,
              roomId: room.id,
              checkIn: booking.checkIn,
              checkOut: booking.checkOut,
              guests: BigInt(booking.guests),
              totalAmount: booking.totalAmount,
              status: booking.status,
              paymentStatus: booking.paymentStatus,
              paymentMethod: booking.paymentMethod,
              specialRequests: booking.specialRequests || null,
              confirmationCode: retryCode,
              createdAt: booking.createdAt,
              updatedAt: booking.createdAt,
            },
          })
          bookings.push(record)
          continue
        } catch (retryError: any) {
          console.warn(`⚠️ Skipping booking ${i + 1} due to confirmationCode constraint after retry`)
          continue
        }
      }
      throw error
    }

    // Note: Invoice model doesn't exist in schema - skipping
    // const tax = Number((booking.totalAmount * 0.1).toFixed(2))
    // await prisma.invoice.create({
    //   data: {
    //     bookingId: record.id,
    //     amount: booking.totalAmount,
    //     tax,
    //     total: booking.totalAmount + tax,
    //     status: booking.paymentStatus,
    //     dueDate: new Date(record.checkIn.getTime() - 3 * 24 * 60 * 60 * 1000),
    //   },
    // })
  }

  // Only create tasks if we have bookings and staff
  const taskSeeds = []
  if (bookings.length > 0 && staffMembers.length > 0) {
    taskSeeds.push({
      title: 'Refresh welcome amenities',
      description: 'Set up champagne, chocolates, and personalized welcome note in Executive Suite 201',
      type: 'ROOM_SERVICE' as TaskType,
      priority: 'HIGH' as TaskPriority,
      status: 'IN_PROGRESS' as TaskStatus,
      assignedTo: staffMembers[0]?.id || staffMembers[0].id,
      dueDate: new Date('2025-02-12T16:00:00'),
    })
    if (bookings.length > 1 && staffMembers.length > 2) {
      taskSeeds.push({
        title: 'Coordinate private chef dinner',
        description: 'Liaise with culinary team for five-course tasting menu on March 1st',
        type: 'ROOM_SERVICE' as TaskType,
        priority: 'HIGH' as TaskPriority,
        status: 'PENDING' as TaskStatus,
        assignedTo: staffMembers[2]?.id || staffMembers[0].id,
        dueDate: new Date('2025-02-28T18:00:00'),
      })
    }
    if (bookings.length > 5 && staffMembers.length > 5) {
      taskSeeds.push({
        title: 'Repair rainfall shower',
        description: 'Resolve low pressure complaint in Deluxe King room 101',
        type: 'MAINTENANCE' as TaskType,
        priority: 'URGENT' as TaskPriority,
        status: 'PENDING' as TaskStatus,
        assignedTo: staffMembers[5]?.id || staffMembers[0].id,
        dueDate: new Date('2025-01-26T10:00:00'),
      })
    }
    if (bookings.length > 3 && staffMembers.length > 6) {
      taskSeeds.push({
        title: 'Daily turndown aromatherapy',
        description: 'Apply lavender aromatherapy preference for family suite 502',
        type: 'CLEANING' as TaskType,
        priority: 'MEDIUM' as TaskPriority,
        status: 'COMPLETED' as TaskStatus,
        assignedTo: staffMembers[6]?.id || staffMembers[0].id,
        dueDate: new Date('2025-01-10T20:00:00'),
        completedAt: new Date('2025-01-10T19:30:00'),
      })
    }
    if (bookings.length > 4 && staffMembers.length > 1) {
      taskSeeds.push({
        title: 'Assist VIP sky tour booking',
        description: 'Confirm helicopter sky tour with concierge partners for Skyline Suite guests',
        type: 'CONCIERGE' as TaskType,
        priority: 'MEDIUM' as TaskPriority,
        status: 'IN_PROGRESS' as TaskStatus,
        assignedTo: staffMembers[1]?.id || staffMembers[0].id,
        dueDate: new Date('2025-03-20T17:00:00'),
      })
    }
  }

  const taskRecords = []
  for (const task of taskSeeds) {
    const { bookingId, ...taskData } = task // Remove bookingId as it doesn't exist in schema
    const record = await prisma.task.create({
      data: {
        ...taskData,
        createdBy: users.manager.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    taskRecords.push(record)
  }

  const menuSeeds = [
    { name: 'Sunrise Acai Bowl', description: 'Acai puree with seasonal berries and almond granola', price: 18.5, category: 'BREAKFAST' as FoodCategory, preparationTime: 8 },
    { name: 'Truffle Omelette', description: 'Cage-free eggs, black truffle shavings, manchego', price: 24, category: 'BREAKFAST' as FoodCategory, preparationTime: 12 },
    { name: 'Heritage Tomato Burrata', description: 'Heirloom tomatoes, basil oil, aged balsamic', price: 22, category: 'LUNCH' as FoodCategory, preparationTime: 10 },
    { name: 'Seared Atlantic Salmon', description: 'Citrus beurre blanc, fennel pollen, charred broccolini', price: 42, category: 'LUNCH' as FoodCategory, preparationTime: 18 },
    { name: 'Prime Wagyu Tenderloin', description: 'Miyazaki wagyu with pomme puree and bordelaise', price: 98, category: 'DINNER' as FoodCategory, preparationTime: 25 },
    { name: 'Porcini Risotto', description: 'Aged carnaroli rice, porcini broth, Parmigiano Reggiano', price: 36, category: 'DINNER' as FoodCategory, preparationTime: 22 },
    { name: 'Valrhona Chocolate Soufflé', description: '70% Guanaja chocolate, Tahitian vanilla anglaise', price: 18, category: 'DESSERTS' as FoodCategory, preparationTime: 15 },
    { name: 'Passionfruit Pavlova', description: 'Crisp meringue, tropical fruits, coconut cream', price: 17, category: 'DESSERTS' as FoodCategory, preparationTime: 12 },
    { name: 'Cold Brew Negroni', description: 'Coffee-infused Campari, gin, vermouth', price: 16, category: 'BEVERAGES' as FoodCategory, preparationTime: 5 },
    { name: 'Cucumber Elderflower Fizz', description: 'House soda, cucumber, elderflower cordial', price: 12, category: 'BEVERAGES' as FoodCategory, preparationTime: 4 },
    { name: 'Lobster Benedict', description: 'Maine lobster, brown butter hollandaise, brioche', price: 32, category: 'BREAKFAST' as FoodCategory, preparationTime: 14 },
    { name: 'Grilled Octopus', description: 'Smoked paprika aioli, crispy chickpeas, lemon', price: 28, category: 'LUNCH' as FoodCategory, preparationTime: 16 },
  ]

  const menuItems = await Promise.all(menuSeeds.map(item => prisma.foodMenu.create({ 
    data: {
      ...item,
      available: true, // Add required available field
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })))

  // Only create orders if we have bookings
  const orders = []
  if (bookings.length > 0) {
    orders.push({
      roomNumber: '201',
      bookingId: bookings[0]?.id,
      guestId: users.guest1.id,
      status: 'DELIVERED' as OrderStatus,
      totalAmount: 140,
      specialRequests: 'Deliver during sunset with champagne pairing',
      items: [
        { menuName: 'Prime Wagyu Tenderloin', quantity: 2 },
        { menuName: 'Valrhona Chocolate Soufflé', quantity: 2 },
      ],
    })
    if (bookings.length > 1) {
      orders.push({
        roomNumber: '301',
        bookingId: bookings[1]?.id,
        guestId: users.guest2.id,
        status: 'PREPARING' as OrderStatus,
        totalAmount: 210,
        specialRequests: 'Chef tasting menu amuse bouche',
        items: [
          { menuName: 'Heritage Tomato Burrata', quantity: 2 },
          { menuName: 'Seared Atlantic Salmon', quantity: 2 },
          { menuName: 'Cold Brew Negroni', quantity: 2 },
        ],
      })
    }
    if (bookings.length > 2) {
      orders.push({
        roomNumber: '102',
        bookingId: bookings[2]?.id,
        guestId: users.guest3.id,
        status: 'PENDING' as OrderStatus,
        totalAmount: 62,
        specialRequests: 'Room service breakfast for 8am',
        items: [
          { menuName: 'Truffle Omelette', quantity: 1 },
          { menuName: 'Sunrise Acai Bowl', quantity: 1 },
          { menuName: 'Cucumber Elderflower Fizz', quantity: 2 },
        ],
      })
    }
  }

  for (const order of orders) {
    if (!order.bookingId) continue // Skip if booking doesn't exist
    const createdOrder = await prisma.foodOrder.create({
      data: {
        roomNumber: order.roomNumber,
        guestId: order.guestId,
        status: order.status,
        totalAmount: order.totalAmount,
        specialRequests: order.specialRequests,
        deliveryTime: new Date(order.status === 'PENDING' as OrderStatus ? Date.now() + 60 * 60 * 1000 : Date.now()),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    for (const item of order.items) {
      const menu = menuItems.find(m => m.name === item.menuName)
      if (!menu) continue
      // Note: OrderItem model doesn't exist in schema - skipping
      // await prisma.orderItem.create({
      //   data: {
      //     orderId: createdOrder.id,
      //     menuId: menu.id,
      //     quantity: item.quantity,
      //     unitPrice: menu.price,
      //     notes: 'Prepared according to SmartHotel plating standards',
      //   },
      // })
    }
  }

  const inventorySeeds = [
    { name: 'Hypoallergenic Pillows', description: 'Premium hypoallergenic pillows for allergy-sensitive guests', category: 'Linens', quantity: 120, unit: 'pieces', minQuantity: 40, status: 'IN_STOCK' as InventoryStatus },
    { name: 'Spa Aromatherapy Oils', description: 'Signature wellness scents for turndown service', category: 'Spa', quantity: 85, unit: 'bottles', minQuantity: 30, status: 'LOW_STOCK' as InventoryStatus },
    { name: 'SmartHotel Robes', description: 'Embroidered Frette robes for suites and premium rooms', category: 'Guest Amenities', quantity: 45, unit: 'sets', minQuantity: 50, status: 'LOW_STOCK' as InventoryStatus },
    { name: 'Nespresso Capsules', description: 'Grand Cru coffee capsule assortment', category: 'Food & Beverage', quantity: 900, unit: 'capsules', minQuantity: 300, status: 'IN_STOCK' as InventoryStatus },
    { name: 'Crystal Champagne Flutes', description: 'Hand-cut crystal flutes for in-room celebrations', category: 'Food & Beverage', quantity: 26, unit: 'pairs', minQuantity: 20, status: 'IN_STOCK' as InventoryStatus },
  ]
  for (const item of inventorySeeds) {
    await prisma.inventory.create({ 
      data: {
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
  }

  // Gallery images - use placeholder images that exist or empty strings to trigger frontend fallbacks
  const gallerySeeds = [
    { title: 'Skyline Infinity Pool', imageUrl: '/images/hotel/hotel-pool.jpg', category: 'AMENITY' as GalleryCategory },
    { title: 'Grand Lobby Arrival', imageUrl: '/images/hotel/hotel-lobby.jpg', category: 'EVENT' as GalleryCategory },
    { title: 'Presidential Living Room', imageUrl: '/images/hotel/room-suite.jpg', category: 'ROOM' as GalleryCategory },
    { title: 'Executive Chef Tasting', imageUrl: '/images/hotel/food-dinner.jpg', category: 'FOOD' as GalleryCategory },
    { title: 'SmartHotel Spa Retreat', imageUrl: '/images/hotel/hotel-spa.jpg', category: 'AMENITY' as GalleryCategory },
    { title: 'Sky Terrace Sunset', imageUrl: '/images/hotel/hotel-view.jpg', category: 'EXTERIOR' as GalleryCategory },
    { title: 'The Grand Ballroom', imageUrl: '/images/hotel/hotel-view.jpg', category: 'EVENT' as GalleryCategory },
    { title: 'Candlelight Dinner', imageUrl: '/images/hotel/food-dinner.jpg', category: 'FOOD' as GalleryCategory },
    { title: 'Digital Concierge Tablet', imageUrl: '/images/hotel/hotel-lobby.jpg', category: 'AMENITY' as GalleryCategory },
    { title: 'Fitness and Wellness Club', imageUrl: '/images/hotel/hotel-spa.jpg', category: 'AMENITY' as GalleryCategory },
    { title: 'Luxury Suite Bathroom', imageUrl: '/images/hotel/room-suite.jpg', category: 'ROOM' as GalleryCategory },
    { title: 'Skyline Champagne Lounge', imageUrl: '/images/hotel/hotel-bar.jpg', category: 'EVENT' as GalleryCategory },
  ]
  await prisma.gallery.createMany({ 
    data: gallerySeeds.map(item => ({
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  })

  const settingsSeeds = [
    { key: 'hotel_name', value: 'SmartHotel Grand Palace' },
    { key: 'hotel_tagline', value: 'Luxury 5-Star Accommodation' },
    { key: 'hotel_description', value: 'Experience unparalleled luxury where timeless elegance meets modern hospitality in the heart of the city.' },
    { key: 'hotel_story', value: 'Since opening in 1985, SmartHotel Grand Palace has welcomed discerning travelers with refined service, timeless design, and innovative experiences.' },
    { key: 'hotel_founded', value: '1985' },
    {
      key: 'hotel_milestones',
      value: JSON.stringify([
        '1985 - Grand opening of SmartHotel Grand Palace',
        '1992 - Awarded first AAA Five Diamond rating',
        '2008 - Debuted sky terrace and infinity pool',
        '2016 - Completed digital concierge transformation',
        '2023 - Named World Luxury Hotel of the Year',
      ]),
    },
    { key: 'hotel_address', value: '123 Grand Boulevard, City Center, Metropolitan Area, ST 10001' },
    { key: 'hotel_phone', value: '+1 (800) 555-HOTEL' },
    { key: 'hotel_email', value: 'info@smarthotel.com' },
    { key: 'check_in_time', value: '15:00' },
    { key: 'check_out_time', value: '11:00' },
    { key: 'hotel_latitude', value: '40.7589' },
    { key: 'hotel_longitude', value: '-73.9851' },
  ]

  for (const setting of settingsSeeds) {
    // Check if setting exists, then update or create
    const existing = await prisma.setting.findFirst({ where: { key: setting.key } })
    if (existing) {
      await prisma.setting.update({
        where: { id: existing.id },
        data: { value: setting.value },
      })
    } else {
      await prisma.setting.create({ data: setting })
    }
  }

  // Note: GuestReview model doesn't exist in schema
  // await prisma.guestReview.createMany({
  //   data: [
  //     {
  //       bookingId: bookings[3].id,
  //       userId: users.guest4.id,
  //       roomId: rooms.find(r => r.number === '502')!.id,
  //       rating: 5,
  //       title: 'Unforgettable family retreat',
  //       comment: 'The attention to detail for our children was extraordinary, from bedtime stories to customized turndown service.',
  //       isVerified: true,
  //       isPublic: true,
  //     },
  //     {
  //       bookingId: bookings[0].id,
  //       userId: users.guest1.id,
  //       roomId: rooms.find(r => r.number === '201')!.id,
  //       rating: 5,
  //       title: 'Executive perfection',
  //       comment: 'Butler service and culinary experiences exceeded expectations. The team anticipated every need.',
  //       isVerified: true,
  //       isPublic: true,
  //     },
  //     {
  //       bookingId: bookings[2].id,
  //       userId: users.guest3.id,
  //       roomId: rooms.find(r => r.number === '102')!.id,
  //       rating: 4,
  //       title: 'Excellent service',
  //       comment: 'Room service breakfast was sublime and the concierge made brilliant dining recommendations.',
  //       isVerified: true,
  //       isPublic: true,
  //     },
  //   ],
  // })

  // Note: Promotion model doesn't exist in schema
  // await prisma.promotion.createMany({
  //   data: [
  //     {
  //       title: 'Skyline Escape',
  //       description: 'Save 20% on Skyline Suite bookings with rooftop sunset tasting.',
  //       code: 'SKYLINE20',
  //       type: 'PERCENTAGE' as PromotionType,
  //       value: 20,
  //       minAmount: 500,
  //       maxDiscount: 300,
  //       startDate: new Date('2025-02-01'),
  //       endDate: new Date('2025-05-31'),
  //     },
  //     {
  //       title: 'Stay 3 Pay 2',
  //       description: 'Complimentary third night in Grand Deluxe Rooms.',
  //       code: 'STAY3PAY2',
  //       type: 'FREE_NIGHT' as PromotionType,
  //       value: 1,
  //       minAmount: 0,
  //       startDate: new Date('2025-01-15'),
  //       endDate: new Date('2025-12-20'),
  //     },
  //   ],
  // })

  // Note: EmailTemplate model doesn't exist in schema
  // await prisma.emailTemplate.createMany({
  //   data: [
  //     {
  //       name: 'booking_confirmation',
  //       subject: 'Your SmartHotel Grand Palace Reservation',
  //       body: '<p>Dear {{guestName}},</p><p>Your reservation for {{roomType}} is confirmed from {{checkIn}} to {{checkOut}}. Confirmation: {{confirmationCode}}</p><p>We look forward to welcoming you.</p>',
  //       variables: ['guestName', 'roomType', 'checkIn', 'checkOut', 'confirmationCode'],
  //     },
  //     {
  //       name: 'contact_acknowledgement',
  //       subject: 'We received your message',
  //       body: '<p>Dear {{name}},</p><p>Thank you for contacting SmartHotel Grand Palace. Our concierge desk will respond shortly.</p>',
  //       variables: ['name'],
  //     },
  //   ],
  // })

  // Note: EmailLog model doesn't exist in schema
  // await prisma.emailLog.createMany({
  //   data: [
  //     {
  //       to: 'emily.carter@example.com',
  //       subject: 'Your SmartHotel Grand Palace Reservation',
  //       template: 'booking_confirmation',
  //       status: 'DELIVERED' as EmailStatus,
  //       sentAt: new Date('2025-01-05T09:30:00'),
  //     },
  //     {
  //       to: 'michael.rivera@example.com',
  //       subject: 'Your SmartHotel Grand Palace Reservation',
  //       template: 'booking_confirmation',
  //       status: 'SENT' as EmailStatus,
  //       sentAt: new Date('2025-02-10T11:15:00'),
  //     },
  //     {
  //       to: 'info@smarthotel.com',
  //       subject: 'Inquiry from wellness columnist',
  //       template: null,
  //       status: 'PENDING' as EmailStatus,
  //     },
  //   ],
  // })

  // Note: Notification model doesn't exist in schema
  // await prisma.notification.createMany({
  //   data: [
  //     {
  //       userId: users.manager.id,
  //       title: 'VIP Arrival Alert',
  //       message: 'Executive Suite 201 guests arriving 30 minutes early. Butler team notified.',
  //       type: 'BOOKING_REMINDER' as NotificationType,
  //       isRead: false,
  //       data: { bookingId: bookings[0].id },
  //     },
  //     {
  //       userId: users.admin.id,
  //       title: 'Maintenance Flag',
  //       message: 'Room 401 scheduled for maintenance review prior to May bookings.',
  //       type: 'GENERAL' as NotificationType,
  //       isRead: true,
  //     },
  //     {
  //       userId: users.guest4.id,
  //       title: 'Thank you for staying',
  //       message: 'We hope you enjoyed your stay. Share feedback for a personalized offer.',
  //       type: 'BOOKING_REMINDER' as NotificationType,
  //       isRead: false,
  //       data: { surveyUrl: 'https://smarthotel.com/feedback' },
  //     },
  //   ],
  // })

  // Note: Wishlist model doesn't exist in schema
  // await prisma.wishlist.createMany({
  //   data: [
  //     { userId: users.guest1.id, roomId: rooms.find(r => r.number === '301')!.id },
  //     { userId: users.guest2.id, roomId: rooms.find(r => r.number === '302')!.id },
  //     { userId: users.guest3.id, roomId: rooms.find(r => r.number === '201')!.id },
  //   ],
  // })

  // Note: AuditLog model doesn't exist in schema
  // await prisma.auditLog.createMany({
  //   data: [
  //     {
  //       userId: users.manager.id,
  //       action: 'BOOKING_CREATE',
  //       entityType: 'Booking',
  //       entityId: bookings[0].id,
  //       details: { confirmationCode: bookings[0].confirmationCode, roomNumber: '201' },
  //     },
  //     {
  //       userId: users.admin.id,
  //       action: 'TASK_ASSIGN',
  //       entityType: 'Task',
  //       entityId: taskRecords[0].id,
  //       details: { assignedTo: taskRecords[0].assignedTo, priority: taskRecords[0].priority },
  //     },
  //   ],
  // })

  console.log('✅ Seeding complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`👥 Users: ${await prisma.user.count()}`)
  console.log(`👔 Staff: ${await prisma.staff.count()}`)
  console.log(`🏨 Rooms: ${await prisma.room.count()}`)
  console.log(`📅 Bookings: ${await prisma.booking.count()}`)
  // console.log(`🧾 Invoices: ${await prisma.invoice.count()}`)
  console.log(`🧹 Tasks: ${await prisma.task.count()}`)
  console.log(`🍽️ Menu Items: ${await prisma.foodMenu.count()}`)
  console.log(`🥂 Orders: ${await prisma.foodOrder.count()}`)
  console.log(`📦 Inventory Items: ${await prisma.inventory.count()}`)
  console.log(`🖼️ Gallery Items: ${await prisma.gallery.count()}`)
  // console.log(`⭐ Guest Reviews: ${await prisma.guestReview.count()}`)
  // console.log(`🎁 Promotions: ${await prisma.promotion.count()}`)
  // console.log(`📧 Email Templates: ${await prisma.emailTemplate.count()}`)
  // console.log(`🔔 Notifications: ${await prisma.notification.count()}`)
  // console.log(`❤️ Wishlists: ${await prisma.wishlist.count()}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(error => {
    console.error('❌ Comprehensive seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

