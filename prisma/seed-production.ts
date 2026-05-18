import { Prisma, PrismaClient, UserRole, RoomStatus, BookingStatus, PaymentStatus, TaskType, Priority, TaskStatus, FoodCategory, OrderStatus, InventoryStatus, GalleryCategory, PromotionType, NotificationType } from '@prisma/client'
// Note: Local type overrides for compatibility if needed, but we use the imported enums
type TaskPriority = Priority

import bcrypt from 'bcryptjs'
import { faker } from '@faker-js/faker'
import { ObjectId } from 'bson'

type JsonValue = Prisma.InputJsonValue

const prisma = new PrismaClient()

const CONFIG = {
  hotels: 1,
  adminUsers: 1,
  managerUsers: 2,
  receptionistUsers: 5,
  guestUsers: 50,
  staffMembers: 20,
  rooms: 50,
  roomImagesPerRoom: 2,
  roomFeatures: 20,
  bookings: 100,
  tasks: 100,
  menuItems: 30,
  foodOrders: 50,
  orderItemsPerOrder: { min: 2, max: 4 },
  guestReviews: 50,
  inventoryItems: 30,
  galleryItems: 20,
  promotions: 10,
  emailTemplates: 10,
  emailLogs: 100,
  notificationsPerUser: 2,
  wishlistEntries: 20,
  auditLogs: 100,
  settings: [
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
  ],
} as const

const BATCH_SIZE = 1000
const today = new Date()
const DAY_IN_MS = 1000 * 60 * 60 * 24

faker.seed(2025)

type RoomMeta = { id: string; number: string; price: number; hotelId: string }

type SeedContext = {
  hotelIds: string[]
  userIdsByRole: Record<UserRole, string[]>
  guestUserIds: string[]
  roomIds: string[]
  rooms: RoomMeta[]
  staffIds: string[]
  menuItems: { id: string; price: number }[]
  bookingIds: string[]
  bookingMeta: Map<
    string,
    {
      guestId: string
      roomId: string
      roomNumber: string
      hotelId: string | null
    }
  >
  expectedOrderItems: number
}

function generateObjectId(): string {
  return new ObjectId().toHexString()
}

async function clearDatabase() {
  console.log('🧹 Clearing existing data...')
  
  // Define models that actually exist in schema.prisma and are camcelCased by Prisma Client
  const models = [
    'auditLog',
    'notification',
    'orderItem',
    'foodOrder',
    'foodMenu',
    'task',
    'invoice',
    'booking',
    'roomImage',
    'roomFeature',
    'room',
    'staff',
    'inventory',
    'gallery',
    'setting',
    'user',
    'roomType',
    'syncLog',
    'outbox',
    'payment',
    'roomStatusHistory',
    'maintenanceRequest'
  ]

  for (const model of models) {
    if ((prisma as any)[model]) {
      await (prisma as any)[model].deleteMany()
    }
  }
}


async function insertInBatches<T>(
  data: T[],
  insert: (batch: T[]) => Promise<unknown>,
  label: string,
) {
  if (data.length === 0) {
    return
  }

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE)
    await insert(batch)
  }

  console.log(`   • ${label}: ${data.length.toLocaleString()} records`)
}

function randomEnumValue<T extends { [key: string]: string }>(enumObj: T, bias?: Partial<Record<T[keyof T], number>>) {
  const entries = Object.values(enumObj) as T[keyof T][]
  if (!bias) {
    return faker.helpers.arrayElement(entries)
  }

  const weighted: { value: T[keyof T]; weight: number }[] = entries.map(value => ({
    value,
    weight: bias[value] ?? 1,
  }))

  return faker.helpers.weightedArrayElement(weighted)
}

function generatePhoneNumber(countryCode = '+1') {
  return `${countryCode}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`
}

function generateImageUrl(collection: 'rooms' | 'gallery' | 'menu', seed: string, width = 1200, height = 800) {
  // Use local images instead of Unsplash URLs
  const localImageMap: Record<typeof collection, string[]> = {
    rooms: [
      '/images/hotel/room-standard.jpg',
      '/images/hotel/room-deluxe.jpg',
      '/images/hotel/room-suite.jpg',
      '/images/hotel/room-luxury.jpg',
    ],
    gallery: [
      '/images/hotel/hotel-hero-1.jpg',
      '/images/hotel/hotel-hero-2.jpg',
      '/images/hotel/hotel-hero-3.jpg',
      '/images/hotel/hotel-lobby.jpg',
      '/images/hotel/hotel-pool.jpg',
      '/images/hotel/hotel-restaurant.jpg',
      '/images/hotel/hotel-spa.jpg',
      '/images/hotel/hotel-gym.jpg',
    ],
    menu: [
      '/images/hotel/food-breakfast.jpg',
      '/images/hotel/food-lunch.jpg',
      '/images/hotel/food-dinner.jpg',
      '/images/hotel/food-dessert.jpg',
      '/images/menu-placeholder.jpg',
    ],
  }
  
  // Use seed to deterministically pick an image
  const images = localImageMap[collection]
  const index = parseInt(seed.replace(/\D/g, '')) % images.length
  return images[index] || images[0]
}

function generateRoomNumber(index: number) {
  const floor = Math.floor(index / 10) + 1
  const room = (index % 10) + 1
  return `${floor}${room.toString().padStart(2, '0')}`
}

function randomDateWithinMonths(offsetMonths: number, spanDays: number) {
  const start = faker.date.between({
    from: faker.date.past({ years: 1 }),
    to: faker.date.future({ years: 1 }),
  })

  const checkIn = new Date(start)
  checkIn.setMonth(checkIn.getMonth() + faker.number.int({ min: -offsetMonths, max: offsetMonths }))

  const checkOut = new Date(checkIn)
  checkOut.setDate(checkOut.getDate() + faker.number.int({ min: 1, max: spanDays }))

  if (checkOut <= checkIn) {
    checkOut.setDate(checkIn.getDate() + 1)
  }

  return { checkIn, checkOut }
}

async function seedUsers(context: SeedContext) {
  console.log('👥 Seeding users...')
  const hotelIds = context.hotelIds
  const users: Prisma.UserCreateManyInput[] = []

  const passwordHashes = {
    admin: await bcrypt.hash('AdminPass123!', 12),
    manager: await bcrypt.hash('ManagerPass123!', 12),
    receptionist: await bcrypt.hash('ReceptionPass123!', 12),
    guest: await bcrypt.hash('GuestPass123!', 12),
  }

  const userRoleMap: Record<UserRole, { count: number; password: string; templateName: string }> = {
    [UserRole.SUPER_ADMIN]: { count: CONFIG.adminUsers, password: passwordHashes.admin, templateName: 'Super Admin' },
    [UserRole.MANAGER]: { count: CONFIG.managerUsers, password: passwordHashes.manager, templateName: 'Manager' },
    [UserRole.RECEPTIONIST]: { count: CONFIG.receptionistUsers, password: passwordHashes.receptionist, templateName: 'Receptionist' },
    [UserRole.GUEST]: { count: CONFIG.guestUsers, password: passwordHashes.guest, templateName: 'Guest' },
  }

  const userIdsByRole: SeedContext['userIdsByRole'] = {
    [UserRole.SUPER_ADMIN]: [],
    [UserRole.MANAGER]: [],
    [UserRole.RECEPTIONIST]: [],
    [UserRole.GUEST]: [],
  }

  Object.entries(userRoleMap).forEach(([roleKey, config]) => {
    const role = roleKey as UserRole
    for (let i = 0; i < config.count; i++) {
      const id = generateObjectId()
      const hotelId = faker.helpers.arrayElement(hotelIds)

      users.push({
        id,
        name: `${config.templateName} ${faker.person.lastName()}`,
        email: `${role.toLowerCase()}${i + 1}@smarthotel.com`,
        password: config.password,
        phone: generatePhoneNumber(),
        role,
        hotelId,
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: faker.date.recent({ days: 30 }),
      })

      userIdsByRole[role].push(id)
    }
  })

  await insertInBatches(users, batch => prisma.user.createMany({ data: batch }), 'Users')

  context.userIdsByRole = userIdsByRole
  context.guestUserIds = userIdsByRole[UserRole.GUEST]
}

async function seedStaff(context: SeedContext) {
  console.log('👔 Seeding staff...')
  const staffRecords: Prisma.StaffCreateManyInput[] = []
  const positions = [
    'Front Desk Supervisor',
    'Concierge Specialist',
    'Executive Chef',
    'Sous Chef',
    'Housekeeping Supervisor',
    'Room Attendant',
    'Maintenance Engineer',
    'Spa Therapist',
    'Event Coordinator',
    'Security Officer',
    'IT Systems Analyst',
    'Revenue Manager',
    'Guest Relations Manager',
    'Bell Service Lead',
    'Night Auditor',
  ]

  for (let i = 0; i < CONFIG.staffMembers; i++) {
    const id = generateObjectId()
    const hireDate = faker.date.between({ from: '2015-01-01', to: today })
    const department = faker.helpers.arrayElement([
      'Front Office',
      'Guest Services',
      'Food & Beverage',
      'Housekeeping',
      'Engineering',
      'Spa & Wellness',
      'Security',
      'Events',
      'Finance',
      'Technology',
    ])

    staffRecords.push({
      id,
      employeeId: `EMP${(i + 1).toString().padStart(4, '0')}`,
      name: faker.person.fullName(),
      email: `staff${i + 1}@smarthotel.com`,
      phone: generatePhoneNumber(),
      position: faker.helpers.arrayElement(positions),
      department,
      hireDate,
      salary: faker.number.int({ min: 32000, max: 95000 }),
      isActive: faker.datatype.boolean({ probability: 0.9 }),
      hotelId: faker.helpers.arrayElement(context.hotelIds),
      createdAt: hireDate,
      updatedAt: faker.date.recent({ days: 60 }),
    })

    context.staffIds.push(id)
  }

  await insertInBatches(staffRecords, batch => prisma.staff.createMany({ data: batch }), 'Staff')
}

async function seedRooms(context: SeedContext) {
  console.log('🏨 Seeding rooms & features...')
  const rooms: Prisma.RoomCreateManyInput[] = []
  const roomImages: Prisma.RoomImageCreateManyInput[] = []
  const roomFeatures: Prisma.RoomFeatureCreateManyInput[] = []

  for (let i = 0; i < CONFIG.rooms; i++) {
    const id = generateObjectId()
    const hotelId = faker.helpers.arrayElement(context.hotelIds)
    const roomNumber = generateRoomNumber(i)
    const roomType = faker.helpers.arrayElement(['Deluxe King', 'Deluxe Twin', 'Executive Suite', 'Premier Suite', 'Presidential Suite', 'Skyline Loft'])
    const amenities = faker.helpers.arrayElements(
      [
        'High-Speed WiFi',
        'Smart TV',
        'Rain Shower',
        'Mini Bar',
        'Walk-in Closet',
        'City View',
        'Butler Service',
        'Private Terrace',
        'Kitchenette',
        'Spa-inspired Bathroom',
        'Workspace',
        'Soundproofing',
      ],
      { min: 4, max: 8 },
    )

    const basePrice = faker.number.int({ min: 220, max: 1200 })
    const status = randomEnumValue(RoomStatus, {
      [RoomStatus.AVAILABLE]: 6,
      [RoomStatus.OCCUPIED]: 2,
      [RoomStatus.RESERVED]: 1,
      [RoomStatus.MAINTENANCE]: 1,
    })

    rooms.push({
      id,
      number: roomNumber,
      type: roomType,
      price: basePrice,
      capacity: faker.number.int({ min: 2, max: 6 }),
      description: `${roomType} with ${amenities.slice(0, 3).join(', ').toLowerCase()} and bespoke SmartHotel services.`,
      amenities,
      images: Array.from({ length: 4 }, (_, index) => generateImageUrl('rooms', `${roomNumber}-${index}`)),
      status,
      floor: faker.number.int({ min: 3, max: 45 }),
      size: faker.number.int({ min: 28, max: 160 }),
      hotelId,
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 15 }),
    })

    context.roomIds.push(id)
    context.rooms.push({ id, number: roomNumber, price: basePrice, hotelId })

    for (let j = 0; j < CONFIG.roomImagesPerRoom; j++) {
      roomImages.push({
        id: generateObjectId(),
        roomId: id,
        url: generateImageUrl('rooms', `${roomNumber}-detail-${j}`, 1600, 900),
        alt: `${roomType} view ${j + 1}`,
        isMain: j === 0,
        order: j + 1,
        createdAt: faker.date.recent({ days: 60 }),
      })
    }
  }

  const featureCategories = ['service', 'amenity', 'feature']
  for (let i = 0; i < CONFIG.roomFeatures; i++) {
    roomFeatures.push({
      id: generateObjectId(),
      name: `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} ${faker.commerce.product()}`,
      icon: faker.helpers.arrayElement(['sparkles', 'crown', 'bed', 'bell', 'spa', 'chef-hat', 'wifi']),
      description: faker.commerce.productDescription(),
      category: faker.helpers.arrayElement(featureCategories),
      isActive: faker.datatype.boolean({ probability: 0.95 }),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 30 }),
    })
  }

  await insertInBatches(rooms, batch => prisma.room.createMany({ data: batch }), 'Rooms')
  await insertInBatches(roomImages, batch => prisma.roomImage.createMany({ data: batch }), 'Room images')
  await insertInBatches(roomFeatures, batch => prisma.roomFeature.createMany({ data: batch }), 'Room features')
}

async function seedBookings(context: SeedContext) {
  console.log('📅 Seeding bookings & invoices...')
  const bookings: Prisma.BookingCreateManyInput[] = []
  const invoices: Prisma.InvoiceCreateManyInput[] = []

  for (let i = 0; i < CONFIG.bookings; i++) {
    const id = generateObjectId()
    const guestId = faker.helpers.arrayElement(context.guestUserIds)
    const roomEntry = faker.helpers.arrayElement(context.rooms)
    const { checkIn, checkOut } = randomDateWithinMonths(8, 10)
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
    const totalAmount = Number((roomEntry.price * nights * faker.number.float({ min: 0.95, max: 1.35, fractionDigits: 2 })).toFixed(2))
    const paymentStatus = randomEnumValue(PaymentStatus, {
      [PaymentStatus.PAID]: 6,
      [PaymentStatus.PENDING]: 2,
      [PaymentStatus.FAILED]: 0.5,
      [PaymentStatus.REFUNDED]: 0.5,
      [PaymentStatus.PARTIAL]: 1,
    })
    const statusBias: Partial<Record<BookingStatus, number>> = {
      [BookingStatus.CONFIRMED]: 6,
      [BookingStatus.PENDING]: 2,
      [BookingStatus.CHECKED_IN]: 1.5,
      [BookingStatus.CHECKED_OUT]: 1.5,
      [BookingStatus.CANCELLED]: 1,
    }
    const bookingStatus = randomEnumValue(BookingStatus, statusBias)

    const confirmationCode = `GP-${faker.string.alphanumeric({ length: 6, casing: 'upper' })}${faker.number.int({ min: 10, max: 99 })}`
    const specialRequests = faker.datatype.boolean({ probability: 0.4 })
      ? faker.helpers.arrayElement([
          'Late checkout requested',
          'Hypoallergenic pillows',
          'Airport transfer required',
          'Celebration setup with champagne',
          'Feather-free bedding',
          'Connecting rooms preferred',
          'High-floor request',
          'Welcome amenities for children',
        ])
      : undefined

    const guestName = faker.person.fullName()
    const guestEmail = faker.internet.email({ firstName: guestName.split(' ')[0], lastName: guestName.split(' ').at(-1) })
    const guestPhone = generatePhoneNumber()

    const cancellationTimestamp =
      bookingStatus === BookingStatus.CANCELLED
        ? (() => {
            const candidate = new Date(checkIn.getTime() - faker.number.int({ min: 1, max: 14 }) * DAY_IN_MS)
            if (candidate.getTime() > today.getTime()) {
              candidate.setTime(today.getTime())
            }
            if (candidate.getTime() < new Date('2023-01-01').getTime()) {
              return new Date('2023-01-01')
            }
            return candidate
          })()
        : undefined

    bookings.push({
      id,
      userId: guestId,
      roomId: roomEntry.id,
      checkIn,
      checkOut,
      guests: faker.number.int({ min: 1, max: 4 }),
      totalAmount,
      status: bookingStatus,
      paymentStatus,
      paymentMethod: faker.helpers.arrayElement(['pay_now', 'pay_later', 'card_on_file', 'corporate_account']),
      paymentIntentId: faker.string.alphanumeric({ length: 24 }),
      specialRequests,
      hotelId: roomEntry.hotelId,
      confirmationCode,
      createdAt: faker.date.between({ from: '2023-01-01', to: today }),
      updatedAt: faker.date.recent({ days: 10 }),
      confirmedAt: bookingStatus === BookingStatus.CONFIRMED || bookingStatus === BookingStatus.CHECKED_IN || bookingStatus === BookingStatus.CHECKED_OUT ? checkIn : undefined,
      cancelledAt: cancellationTimestamp,
      cancellationReason: bookingStatus === BookingStatus.CANCELLED ? faker.helpers.arrayElement(['Guest cancellation', 'Weather impact', 'Payment failure', 'Travel restrictions']) : undefined,
      guestName,
      guestEmail,
      guestPhone,
    })

    const tax = Number((totalAmount * faker.number.float({ min: 0.08, max: 0.15, fractionDigits: 2 })).toFixed(2))
    invoices.push({
      id: generateObjectId(),
      bookingId: id,
      amount: totalAmount,
      tax,
      total: Number((totalAmount + tax).toFixed(2)),
      status: paymentStatus,
      dueDate: faker.date.soon({ days: 14, refDate: checkIn }),
      hotelId: roomEntry.hotelId,
      createdAt: checkIn,
      updatedAt: faker.date.recent({ days: 15 }),
    })

    context.bookingIds.push(id)
    context.bookingMeta.set(id, {
      guestId,
      roomId: roomEntry.id,
      roomNumber: roomEntry.number,
      hotelId: roomEntry.hotelId,
    })
  }

  await insertInBatches(bookings, batch => prisma.booking.createMany({ data: batch }), 'Bookings')
  await insertInBatches(invoices, batch => prisma.invoice.createMany({ data: batch }), 'Invoices')
}

async function seedTasks(context: SeedContext) {
  console.log('🧹 Seeding operational tasks...')
  const tasks: Prisma.TaskCreateManyInput[] = []

  const bookingIdPool = context.bookingIds
  const staffPool = context.staffIds
  const createdByPool = context.userIdsByRole[UserRole.MANAGER].length > 0 ? context.userIdsByRole[UserRole.MANAGER] : context.userIdsByRole[UserRole.SUPER_ADMIN]

  for (let i = 0; i < CONFIG.tasks; i++) {
    const bookingId = faker.helpers.arrayElement(bookingIdPool)
    const assignedTo = faker.helpers.arrayElement(staffPool)
    const createdBy = faker.helpers.arrayElement(createdByPool)
    const dueDate = faker.date.soon({ days: 5 })

    tasks.push({
      id: generateObjectId(),
      title: faker.helpers.arrayElement([
        'Prepare VIP welcome amenities',
        'Inspect room maintenance status',
        'Coordinate airport transfer',
        'Arrange private dining experience',
        'Schedule wellness treatment',
        'Update loyalty guest profile',
        'Restock minibar premium items',
        'Audit housekeeping checklist',
        'Arrange late checkout logistics',
        'Verify payment authorization',
      ]),
      description: faker.lorem.sentences({ min: 1, max: 3 }),
      type: randomEnumValue(TaskType),
      priority: randomEnumValue(TaskPriority, {
        [TaskPriority.MEDIUM]: 4,
        [TaskPriority.HIGH]: 3,
        [TaskPriority.LOW]: 1,
        [TaskPriority.URGENT]: 2,
      }),
      status: randomEnumValue(TaskStatus, {
        [TaskStatus.PENDING]: 3,
        [TaskStatus.IN_PROGRESS]: 3,
        [TaskStatus.COMPLETED]: 2,
        [TaskStatus.CANCELLED]: 0.5,
      }),
      assignedTo,
      bookingId,
      dueDate,
      completedAt: faker.datatype.boolean({ probability: 0.45 }) ? faker.date.between({ from: today, to: dueDate }) : undefined,
      createdBy,
      hotelId: faker.helpers.arrayElement(context.hotelIds),
      createdAt: faker.date.between({ from: '2023-01-01', to: today }),
      updatedAt: faker.date.recent({ days: 25 }),
    })
  }

  await insertInBatches(tasks, batch => prisma.task.createMany({ data: batch }), 'Tasks')
}

async function seedMenuAndOrders(context: SeedContext) {
  console.log('🍽️ Seeding menu, orders, and order items...')
  const menuItems: Prisma.FoodMenuCreateManyInput[] = []
  const orders: Prisma.FoodOrderCreateManyInput[] = []
  const orderItems: Prisma.OrderItemCreateManyInput[] = []

  const menuCategories = Object.values(FoodCategory)

  for (let i = 0; i < CONFIG.menuItems; i++) {
    const id = generateObjectId()
    const price = faker.number.float({ min: 8, max: 160, fractionDigits: 2 })
    menuItems.push({
      id,
      name: `${faker.commerce.productAdjective()} ${faker.commerce.product()} ${faker.commerce.productMaterial()}`,
      description: faker.commerce.productDescription(),
      price,
      category: faker.helpers.arrayElement(menuCategories),
      image: generateImageUrl('menu', `menu-${i}`),
      available: faker.datatype.boolean({ probability: 0.87 }),
      preparationTime: faker.number.int({ min: 5, max: 40 }),
      hotelId: faker.helpers.arrayElement(context.hotelIds),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 15 }),
    })

    context.menuItems.push({ id, price })
  }

  await insertInBatches(menuItems, batch => prisma.foodMenu.createMany({ data: batch }), 'Menu items')

  for (let i = 0; i < CONFIG.foodOrders; i++) {
    const id = generateObjectId()
    const bookingId = faker.helpers.arrayElement(context.bookingIds)
    const bookingMeta = context.bookingMeta.get(bookingId)
    if (!bookingMeta) continue

    const status = randomEnumValue(OrderStatus, {
      [OrderStatus.PENDING]: 2,
      [OrderStatus.CONFIRMED]: 3,
      [OrderStatus.PREPARING]: 2,
      [OrderStatus.READY]: 1,
      [OrderStatus.DELIVERED]: 2,
      [OrderStatus.CANCELLED]: 0.5,
    })

    const itemCount = faker.number.int({ min: CONFIG.orderItemsPerOrder.min, max: CONFIG.orderItemsPerOrder.max })
    const selectedMenu = faker.helpers.arrayElements(context.menuItems, itemCount)
    const totalAmount = selectedMenu.reduce((sum, item) => {
      const quantity = faker.number.int({ min: 1, max: 3 })
      orderItems.push({
        id: generateObjectId(),
        orderId: id,
        menuId: item.id,
        quantity,
        unitPrice: item.price,
        notes: faker.datatype.boolean({ probability: 0.2 }) ? faker.lorem.sentence() : undefined,
        hotelId: bookingMeta.hotelId,
        createdAt: faker.date.recent({ days: 60 }),
      })
      return sum + item.price * quantity
    }, 0)
    context.expectedOrderItems += selectedMenu.length

    orders.push({
      id,
      roomNumber: bookingMeta.roomNumber,
      guestId: bookingMeta.guestId,
      bookingId,
      status,
      totalAmount: Number(totalAmount.toFixed(2)),
      specialRequests: faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.sentence() : undefined,
      deliveryTime: faker.datatype.boolean({ probability: 0.5 }) ? faker.date.soon({ days: 2 }) : undefined,
      hotelId: bookingMeta.hotelId,
      createdAt: faker.date.between({ from: '2023-01-01', to: today }),
      updatedAt: faker.date.recent({ days: 20 }),
    })
  }

  await insertInBatches(orders, batch => prisma.foodOrder.createMany({ data: batch }), 'Food orders')
  await insertInBatches(orderItems, batch => prisma.orderItem.createMany({ data: batch }), 'Order items')
}

async function seedInventoryAndGallery(context: SeedContext) {
  console.log('📦 Seeding inventory and gallery...')
  const inventory: Prisma.InventoryCreateManyInput[] = []
  const gallery: Prisma.GalleryCreateManyInput[] = []

  const inventoryCategories = ['Housekeeping', 'Spa', 'Guest Amenities', 'Food & Beverage', 'Events', 'Technology', 'Security']
  for (let i = 0; i < CONFIG.inventoryItems; i++) {
    inventory.push({
      id: generateObjectId(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      category: faker.helpers.arrayElement(inventoryCategories),
      quantity: faker.number.int({ min: 10, max: 1200 }),
      unit: faker.helpers.arrayElement(['pieces', 'sets', 'kg', 'liters', 'bottles', 'packs']),
      minQuantity: faker.number.int({ min: 5, max: 150 }),
      status: randomEnumValue(InventoryStatus, {
        [InventoryStatus.IN_STOCK]: 6,
        [InventoryStatus.LOW_STOCK]: 2,
        [InventoryStatus.OUT_OF_STOCK]: 1,
        [InventoryStatus.DISCONTINUED]: 0.5,
      }),
      hotelId: faker.helpers.arrayElement(context.hotelIds),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 30 }),
    })
  }

  const galleryCategories = Object.values(GalleryCategory)
  for (let i = 0; i < CONFIG.galleryItems; i++) {
    gallery.push({
      id: generateObjectId(),
      title: `${faker.helpers.arrayElement(['Skyline', 'Grand', 'Signature', 'Prestige', 'Opulent', 'Panorama'])} ${faker.commerce.productName()}`,
      imageUrl: generateImageUrl('gallery', `gallery-${i}`),
      category: faker.helpers.arrayElement(galleryCategories),
      hotelId: faker.helpers.arrayElement(context.hotelIds),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 30 }),
    })
  }

  await insertInBatches(inventory, batch => prisma.inventory.createMany({ data: batch }), 'Inventory items')
  await insertInBatches(gallery, batch => prisma.gallery.createMany({ data: batch }), 'Gallery items')
}

async function seedReviewsPromotionsCommunication(context: SeedContext) {
  console.log('⭐ Seeding guest reviews, promotions, email templates & logs, notifications, wishlist, audit logs...')
  const reviews: Prisma.GuestReviewCreateManyInput[] = []
  const promotions: Prisma.PromotionCreateManyInput[] = []
  const emailTemplates: Prisma.EmailTemplateCreateManyInput[] = []
  const emailLogs: Prisma.EmailLogCreateManyInput[] = []
  const notifications: Prisma.NotificationCreateManyInput[] = []
  const wishlist: Prisma.WishlistCreateManyInput[] = []
  const auditLogs: Prisma.AuditLogCreateManyInput[] = []

  for (let i = 0; i < CONFIG.guestReviews; i++) {
    const bookingId = faker.helpers.arrayElement(context.bookingIds)
    const booking = context.bookingMeta.get(bookingId)
    if (!booking) continue

    reviews.push({
      id: generateObjectId(),
      bookingId,
      userId: booking.guestId,
      roomId: booking.roomId,
      rating: faker.number.int({ min: 3, max: 5 }),
      title: faker.helpers.arrayElement([
        'Exceptional stay with breathtaking views',
        'Personalized service beyond expectations',
        'Luxurious comfort and impeccable dining',
        'Ideal for family retreats and celebrations',
        'Seamless business travel experience',
      ]),
      comment: faker.lorem.paragraph({ min: 1, max: 3 }),
      isVerified: faker.datatype.boolean({ probability: 0.8 }),
      isPublic: faker.datatype.boolean({ probability: 0.9 }),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent({ days: 40 }),
    })
  }

  for (let i = 0; i < CONFIG.promotions; i++) {
    promotions.push({
      id: generateObjectId(),
      title: `${faker.helpers.arrayElement(['Skyline', 'Signature', 'Prestige', 'Elite', 'Taste of Luxury'])} ${faker.company.catchPhraseNoun()}`,
      description: faker.lorem.sentences({ min: 1, max: 2 }),
      code: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
      type: randomEnumValue(PromotionType, {
        [PromotionType.PERCENTAGE]: 5,
        [PromotionType.FIXED_AMOUNT]: 3,
        [PromotionType.FREE_NIGHT]: 1,
      }),
      value: faker.number.float({ min: 5, max: 45, multipleOf: 0.5 }),
      minAmount: faker.datatype.boolean({ probability: 0.6 }) ? faker.number.float({ min: 100, max: 500, fractionDigits: 2 }) : undefined,
      maxDiscount: faker.datatype.boolean({ probability: 0.4 }) ? faker.number.float({ min: 50, max: 400, fractionDigits: 2 }) : undefined,
      startDate: faker.date.recent({ days: 120 }),
      endDate: faker.date.future({ years: 1 }),
      isActive: faker.datatype.boolean({ probability: 0.7 }),
      usageLimit: faker.datatype.boolean({ probability: 0.3 }) ? faker.number.int({ min: 50, max: 500 }) : undefined,
      usedCount: faker.number.int({ min: 0, max: 200 }),
      createdAt: faker.date.recent({ days: 120 }),
      updatedAt: faker.date.recent({ days: 30 }),
    })
  }

  for (let i = 0; i < CONFIG.emailTemplates; i++) {
    const name = faker.helpers.arrayElement([
      'booking_confirmation',
      'pre_arrival_welcome',
      'post_stay_followup',
      'spa_confirmation',
      'dining_reservation',
      'event_proposal',
      'newsletter_insider',
      'vip_alert',
      'maintenance_notification',
      'security_update',
      'loyalty_reward',
      'seasonal_offer',
      'private_dining_invite',
      'corporate_rate_update',
      'wellness_retreat',
      'family_package',
      'wedding_package',
      'holiday_celebration',
      'transportation_confirmation',
      'payment_receipt',
      'invoice_reminder',
      'rate_change_alert',
      'housekeeping_update',
      'staff_announcement',
    ])

    emailTemplates.push({
      id: generateObjectId(),
      name: `${name}_${i}`,
      subject: faker.company.catchPhrase(),
      body: `<p>${faker.lorem.sentences({ min: 2, max: 4 })}</p><p>${faker.lorem.sentences({ min: 1, max: 2 })}</p>`,
      variables: faker.helpers.arrayElements(
        ['guestName', 'checkIn', 'checkOut', 'roomType', 'confirmationCode', 'offerLink', 'loyaltyTier', 'spaDate', 'diningTime'],
        { min: 3, max: 6 },
      ),
      isActive: faker.datatype.boolean({ probability: 0.8 }),
      createdAt: faker.date.recent({ days: 200 }),
      updatedAt: faker.date.recent({ days: 15 }),
    })
  }

  const emailStatuses = Object.values(EmailStatus)
  for (let i = 0; i < CONFIG.emailLogs; i++) {
    emailLogs.push({
      id: generateObjectId(),
      to: faker.internet.email(),
      subject: faker.company.catchPhrase(),
      template: faker.datatype.boolean({ probability: 0.5 }) ? faker.helpers.arrayElement(emailTemplates).name : undefined,
      status: faker.helpers.arrayElement(emailStatuses),
      sentAt: faker.date.recent({ days: 90 }),
      error: faker.datatype.boolean({ probability: 0.1 }) ? faker.lorem.sentence() : undefined,
      createdAt: faker.date.recent({ days: 90 }),
    })
  }

  const notificationTypes = Object.values(NotificationType)
  context.guestUserIds.forEach(userId => {
    for (let i = 0; i < CONFIG.notificationsPerUser; i++) {
      notifications.push({
        id: generateObjectId(),
        userId,
        title: faker.helpers.arrayElement([
          'Your stay itinerary is ready',
          'Exclusive rooftop tasting invitation',
          'Complimentary wellness upgrade',
          'Payment reminder for upcoming stay',
          'Spa appointment confirmation',
        ]),
        message: faker.lorem.sentences({ min: 1, max: 2 }),
        type: faker.helpers.arrayElement(notificationTypes),
        isRead: faker.datatype.boolean({ probability: 0.4 }),
        data: {
          bookingId: faker.helpers.arrayElement(context.bookingIds),
          deeplink: faker.internet.url(),
        } as JsonValue,
        createdAt: faker.date.recent({ days: 60 }),
      })
    }
  })

  const wishlistSet = new Set<string>()
  let attempts = 0
  while (wishlist.length < CONFIG.wishlistEntries && attempts < CONFIG.wishlistEntries * 5) {
    attempts++
    const userId = faker.helpers.arrayElement(context.guestUserIds)
    const roomId = faker.helpers.arrayElement(context.roomIds)
    const key = `${userId}-${roomId}`
    if (wishlistSet.has(key)) continue
    wishlistSet.add(key)
    wishlist.push({
      id: generateObjectId(),
      userId,
      roomId,
      createdAt: faker.date.recent({ days: 180 }),
    })
  }

  const auditActions = [
    'BOOKING_CREATE',
    'BOOKING_UPDATE',
    'BOOKING_CANCEL',
    'TASK_ASSIGN',
    'TASK_COMPLETE',
    'STAFF_LOGIN',
    'PAYMENT_CAPTURED',
    'PROMOTION_APPLIED',
    'EMAIL_SENT',
    'NOTIFICATION_PUSH',
  ]

  const auditUsers = [
    ...context.userIdsByRole[UserRole.SUPER_ADMIN],
    ...context.userIdsByRole[UserRole.MANAGER],
    ...context.userIdsByRole[UserRole.RECEPTIONIST],
  ]

  for (let i = 0; i < CONFIG.auditLogs; i++) {
    const userId = faker.helpers.arrayElement(auditUsers)
    auditLogs.push({
      id: generateObjectId(),
      userId,
      action: faker.helpers.arrayElement(auditActions),
      entityType: faker.helpers.arrayElement(['Booking', 'Task', 'Invoice', 'Promotion', 'Notification', 'Inventory', 'Staff']),
      entityId: faker.helpers.arrayElement([...context.bookingIds, ...context.roomIds, ...context.staffIds]),
      details: {
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        notes: faker.lorem.sentence(),
      } as JsonValue,
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
      hotelId: faker.helpers.arrayElement(context.hotelIds),
      createdAt: faker.date.recent({ days: 400 }),
    })
  }

  await insertInBatches(reviews, batch => prisma.guestReview.createMany({ data: batch }), 'Guest reviews')
  await insertInBatches(promotions, batch => prisma.promotion.createMany({ data: batch }), 'Promotions')
  await insertInBatches(emailTemplates, batch => prisma.emailTemplate.createMany({ data: batch }), 'Email templates')
  await insertInBatches(emailLogs, batch => prisma.emailLog.createMany({ data: batch }), 'Email logs')
  await insertInBatches(notifications, batch => prisma.notification.createMany({ data: batch }), 'Notifications')
  await insertInBatches(wishlist, batch => prisma.wishlist.createMany({ data: batch }), 'Wishlists')
  await insertInBatches(auditLogs, batch => prisma.auditLog.createMany({ data: batch }), 'Audit logs')
}

async function seedSettings() {
  console.log('⚙️ Upserting hotel settings...')
  for (const setting of CONFIG.settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
}

async function summarizeDatabase(context: SeedContext) {
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.staff.count(),
    prisma.room.count(),
    prisma.roomImage.count(),
    prisma.booking.count(),
    prisma.invoice.count(),
    prisma.task.count(),
    prisma.foodMenu.count(),
    prisma.foodOrder.count(),
    prisma.orderItem.count(),
    prisma.guestReview.count(),
    prisma.inventory.count(),
    prisma.gallery.count(),
    prisma.promotion.count(),
    prisma.emailTemplate.count(),
    prisma.emailLog.count(),
    prisma.notification.count(),
    prisma.wishlist.count(),
    prisma.auditLog.count(),
    prisma.roomFeature.count(),
  ])

  const [
    users,
    staff,
    rooms,
    roomImages,
    bookings,
    invoices,
    tasks,
    menuItems,
    foodOrders,
    orderItems,
    guestReviews,
    inventoryItems,
    galleryItems,
    promotions,
    emailTemplates,
    emailLogs,
    notifications,
    wishlists,
    auditLogs,
    roomFeatures,
  ] = counts

  const targets = {
    users: Object.values(context.userIdsByRole).reduce((sum, ids) => sum + ids.length, 0),
    staff: CONFIG.staffMembers,
    rooms: CONFIG.rooms,
    roomImages: CONFIG.rooms * CONFIG.roomImagesPerRoom,
    bookings: CONFIG.bookings,
    invoices: CONFIG.bookings,
    tasks: CONFIG.tasks,
    menuItems: CONFIG.menuItems,
    foodOrders: CONFIG.foodOrders,
    orderItems: context.expectedOrderItems,
    guestReviews: CONFIG.guestReviews,
    inventoryItems: CONFIG.inventoryItems,
    galleryItems: CONFIG.galleryItems,
    promotions: CONFIG.promotions,
    emailTemplates: CONFIG.emailTemplates,
    emailLogs: CONFIG.emailLogs,
    notifications: context.guestUserIds.length * CONFIG.notificationsPerUser,
    wishlists: CONFIG.wishlistEntries,
    auditLogs: CONFIG.auditLogs,
    roomFeatures: CONFIG.roomFeatures,
  }

  const summary = [
    { label: 'Users', actual: users, target: targets.users },
    { label: 'Staff', actual: staff, target: targets.staff },
    { label: 'Rooms', actual: rooms, target: targets.rooms },
    { label: 'Room images', actual: roomImages, target: targets.roomImages },
    { label: 'Bookings', actual: bookings, target: targets.bookings },
    { label: 'Invoices', actual: invoices, target: targets.invoices },
    { label: 'Tasks', actual: tasks, target: targets.tasks },
    { label: 'Menu items', actual: menuItems, target: targets.menuItems },
    { label: 'Food orders', actual: foodOrders, target: targets.foodOrders },
    { label: 'Order items', actual: orderItems, target: targets.orderItems },
    { label: 'Guest reviews', actual: guestReviews, target: targets.guestReviews },
    { label: 'Inventory items', actual: inventoryItems, target: targets.inventoryItems },
    { label: 'Gallery items', actual: galleryItems, target: targets.galleryItems },
    { label: 'Promotions', actual: promotions, target: targets.promotions },
    { label: 'Email templates', actual: emailTemplates, target: targets.emailTemplates },
    { label: 'Email logs', actual: emailLogs, target: targets.emailLogs },
    { label: 'Notifications', actual: notifications, target: targets.notifications },
    { label: 'Wishlists', actual: wishlists, target: targets.wishlists },
    { label: 'Audit logs', actual: auditLogs, target: targets.auditLogs },
    { label: 'Room features', actual: roomFeatures, target: targets.roomFeatures },
  ]

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Dataset summary (actual vs target)')
  summary.forEach(entry => {
    const status = entry.actual >= entry.target ? 'OK' : 'SHORTFALL'
    console.log(
      ` - ${entry.label.padEnd(18, ' ')} ${entry.actual.toLocaleString().padStart(8, ' ')} / ${entry.target.toLocaleString().padStart(8, ' ')}  ${status}`,
    )
  })
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

async function estimateDataFootprint() {
  const collections = [
    { name: 'user', count: await prisma.user.count(), avgSizeKB: 1.4 },
    { name: 'staff', count: await prisma.staff.count(), avgSizeKB: 1.2 },
    { name: 'room', count: await prisma.room.count(), avgSizeKB: 2.8 },
    { name: 'booking', count: await prisma.booking.count(), avgSizeKB: 3.5 },
    { name: 'invoice', count: await prisma.invoice.count(), avgSizeKB: 1.5 },
    { name: 'task', count: await prisma.task.count(), avgSizeKB: 2.0 },
    { name: 'foodOrder', count: await prisma.foodOrder.count(), avgSizeKB: 2.2 },
    { name: 'orderItem', count: await prisma.orderItem.count(), avgSizeKB: 1.1 },
    { name: 'guestReview', count: await prisma.guestReview.count(), avgSizeKB: 1.6 },
    { name: 'notification', count: await prisma.notification.count(), avgSizeKB: 0.9 },
    { name: 'emailLog', count: await prisma.emailLog.count(), avgSizeKB: 0.8 },
    { name: 'auditLog', count: await prisma.auditLog.count(), avgSizeKB: 1.3 },
  ]

  const totalMB =
    collections.reduce((acc, entry) => {
      return acc + (entry.count * entry.avgSizeKB) / 1024
    }, 0) || 0

  console.log(`📦 Estimated data footprint: ${totalMB.toFixed(1)} MB (target < 400 MB)`)
}

async function main() {
  console.log('🌱 Building production-scale SmartHotel dataset...')

  const context: SeedContext = {
    hotelIds: Array.from({ length: CONFIG.hotels }, () => generateObjectId()),
    userIdsByRole: {
      [UserRole.SUPER_ADMIN]: [],
      [UserRole.MANAGER]: [],
      [UserRole.RECEPTIONIST]: [],
      [UserRole.GUEST]: [],
    },
    guestUserIds: [],
    roomIds: [],
    rooms: [],
    staffIds: [],
    menuItems: [],
    bookingIds: [],
    bookingMeta: new Map(),
    expectedOrderItems: 0,
  }

  try {
    await clearDatabase()

    console.log('🏨 Provisioning hotels:', context.hotelIds.join(', '))

    await seedUsers(context)
    await seedStaff(context)
    await seedRooms(context)
    await seedBookings(context)
    await seedTasks(context)
    await seedMenuAndOrders(context)
    await seedInventoryAndGallery(context)
    await seedReviewsPromotionsCommunication(context)
    await seedSettings()

    await summarizeDatabase(context)
    await estimateDataFootprint()

    console.log('✅ Production dataset ready for use.')
  } catch (error) {
    console.error('❌ Production seeding failed:', error)
    throw error
  }
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
