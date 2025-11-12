import { PrismaClient, UserRole, RoomStatus, BookingStatus, PaymentStatus, TaskType, TaskPriority, TaskStatus, FoodCategory, OrderStatus, InventoryStatus, GalleryCategory, PromotionType, EmailStatus, NotificationType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function clearDatabase() {
  await prisma.emailLog.deleteMany()
  await prisma.emailTemplate.deleteMany()
  await prisma.promotion.deleteMany()
  await prisma.guestReview.deleteMany()
  await prisma.wishlist.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.foodOrder.deleteMany()
  await prisma.foodMenu.deleteMany()
  await prisma.task.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.roomImage.deleteMany()
  await prisma.roomFeature.deleteMany()
  await prisma.room.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.gallery.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
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
    { key: 'admin', name: 'Super Admin', email: 'admin@smarthotel.com', phone: '+1-800-555-0001', role: UserRole.SUPER_ADMIN },
    { key: 'manager', name: 'Hotel Manager', email: 'manager@smarthotel.com', phone: '+1-800-555-0002', role: UserRole.MANAGER },
    { key: 'receptionist', name: 'Front Desk Receptionist', email: 'receptionist@smarthotel.com', phone: '+1-800-555-0003', role: UserRole.RECEPTIONIST },
    { key: 'guest1', name: 'Emily Carter', email: 'emily.carter@example.com', phone: '+1-800-555-1001', role: UserRole.GUEST },
    { key: 'guest2', name: 'Michael Rivera', email: 'michael.rivera@example.com', phone: '+1-800-555-1002', role: UserRole.GUEST },
    { key: 'guest3', name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+1-800-555-1003', role: UserRole.GUEST },
    { key: 'guest4', name: 'Oliver Chen', email: 'oliver.chen@example.com', phone: '+1-800-555-1004', role: UserRole.GUEST },
    { key: 'guest5', name: 'Sofia Hernandez', email: 'sofia.hernandez@example.com', phone: '+1-800-555-1005', role: UserRole.GUEST },
    { key: 'guest6', name: 'Daniel Thompson', email: 'daniel.thompson@example.com', phone: '+1-800-555-1006', role: UserRole.GUEST },
    { key: 'guest7', name: 'Ava Williams', email: 'ava.williams@example.com', phone: '+1-800-555-1007', role: UserRole.GUEST },
  ]

  const users: Record<string, { id: string }> = {}
  for (const user of userSeeds) {
    const password =
      user.role === UserRole.SUPER_ADMIN
        ? passwordHashes.admin
        : user.role === UserRole.MANAGER
        ? passwordHashes.manager
        : user.role === UserRole.RECEPTIONIST
        ? passwordHashes.receptionist
        : passwordHashes.guest

    const record = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password,
        phone: user.phone,
        role: user.role,
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
        },
      })
    )
  )

  const roomSeeds = [
    { number: '101', type: 'Deluxe King', price: 325, capacity: 2, floor: 10, size: 42, status: RoomStatus.AVAILABLE, amenities: ['City View', 'King Bed', 'Rain Shower', 'Mini Bar'] },
    { number: '102', type: 'Deluxe Twin', price: 315, capacity: 3, floor: 10, size: 40, status: RoomStatus.AVAILABLE, amenities: ['Garden View', 'Twin Beds', 'Smart TV'] },
    { number: '201', type: 'Executive Suite', price: 520, capacity: 4, floor: 20, size: 68, status: RoomStatus.OCCUPIED, amenities: ['Living Area', 'Workspace', 'Butler Service', 'Balcony'] },
    { number: '202', type: 'Executive Corner Suite', price: 560, capacity: 4, floor: 20, size: 72, status: RoomStatus.RESERVED, amenities: ['Panoramic View', 'Jacuzzi', 'Butler Service'] },
    { number: '301', type: 'Presidential Suite', price: 980, capacity: 6, floor: 30, size: 120, status: RoomStatus.AVAILABLE, amenities: ['Dining Room', 'Private Terrace', 'Grand Piano'] },
    { number: '302', type: 'Skyline Suite', price: 680, capacity: 5, floor: 30, size: 90, status: RoomStatus.AVAILABLE, amenities: ['Skyline View', 'Kitchenette', 'Media Room'] },
    { number: '401', type: 'Grand Deluxe King', price: 360, capacity: 3, floor: 12, size: 45, status: RoomStatus.MAINTENANCE, amenities: ['Renovation', 'Walk-in Closet'] },
    { number: '402', type: 'Grand Deluxe Accessible', price: 340, capacity: 3, floor: 12, size: 45, status: RoomStatus.AVAILABLE, amenities: ['Accessible Bathroom', 'Lowered Switches', 'Assistive Devices'] },
    { number: '501', type: 'Junior Suite', price: 410, capacity: 4, floor: 16, size: 55, status: RoomStatus.AVAILABLE, amenities: ['Wet Bar', 'Lounge Area', 'Rain Shower'] },
    { number: '502', type: 'Family Suite', price: 445, capacity: 5, floor: 16, size: 60, status: RoomStatus.OCCUPIED, amenities: ['Connecting Room', 'Double Vanity', 'Kids Amenities'] },
  ]

  const rooms = []
  for (const room of roomSeeds) {
    const record = await prisma.room.create({
      data: {
        number: room.number,
        type: room.type,
        price: room.price,
        capacity: room.capacity,
        description: `${room.type} featuring ${room.amenities.slice(0, 2).join(', ').toLowerCase()} and bespoke SmartHotel touches.`,
        amenities: room.amenities,
        images: [`/images/rooms/${room.number}-1.jpg`, `/images/rooms/${room.number}-2.jpg`],
        status: room.status,
        floor: room.floor,
        size: room.size,
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
  await prisma.roomFeature.createMany({ data: roomFeatureSeeds })

  for (const room of rooms) {
    await prisma.roomImage.create({
      data: {
        roomId: room.id,
        url: `/images/gallery/${room.number}-main.jpg`,
        alt: `${room.type} main view`,
        isMain: true,
        order: 1,
      },
    })
    await prisma.roomImage.create({
      data: {
        roomId: room.id,
        url: `/images/gallery/${room.number}-detail.jpg`,
        alt: `${room.type} detail`,
        isMain: false,
        order: 2,
      },
    })
  }

  const bookingSeeds = [
    {
      userKey: 'guest1',
      roomNumber: '201',
      checkIn: new Date('2025-02-12'),
      checkOut: new Date('2025-02-16'),
      guests: 2,
      totalAmount: 2080,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: 'pay_now',
      specialRequests: 'Late-night airport transfer',
      confirmationCode: 'GP-742315',
      createdAt: new Date('2025-01-05'),
    },
    {
      userKey: 'guest2',
      roomNumber: '301',
      checkIn: new Date('2025-03-01'),
      checkOut: new Date('2025-03-05'),
      guests: 4,
      totalAmount: 3920,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: 'pay_now',
      specialRequests: 'Private chef dinner for first evening',
      confirmationCode: 'GP-958432',
      createdAt: new Date('2025-02-10'),
    },
    {
      userKey: 'guest3',
      roomNumber: '102',
      checkIn: new Date('2025-01-20'),
      checkOut: new Date('2025-01-22'),
      guests: 2,
      totalAmount: 630,
      status: BookingStatus.CHECKED_IN,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: 'pay_later',
      specialRequests: 'Feather-free pillows',
      confirmationCode: 'GP-614278',
      createdAt: new Date('2025-01-05'),
    },
    {
      userKey: 'guest4',
      roomNumber: '502',
      checkIn: new Date('2025-01-10'),
      checkOut: new Date('2025-01-14'),
      guests: 4,
      totalAmount: 1780,
      status: BookingStatus.CHECKED_OUT,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: 'pay_now',
      specialRequests: 'Children amenities on arrival',
      confirmationCode: 'GP-328417',
      createdAt: new Date('2024-12-20'),
    },
    {
      userKey: 'guest5',
      roomNumber: '302',
      checkIn: new Date('2025-04-02'),
      checkOut: new Date('2025-04-06'),
      guests: 3,
      totalAmount: 2720,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PARTIAL,
      paymentMethod: 'pay_now',
      specialRequests: 'Vegan minibar selection',
      confirmationCode: 'GP-772934',
      createdAt: new Date('2025-02-28'),
    },
    {
      userKey: 'guest6',
      roomNumber: '101',
      checkIn: new Date('2025-02-05'),
      checkOut: new Date('2025-02-07'),
      guests: 2,
      totalAmount: 650,
      status: BookingStatus.CANCELLED,
      paymentStatus: PaymentStatus.REFUNDED,
      paymentMethod: 'pay_now',
      specialRequests: 'Corner room requested',
      confirmationCode: 'GP-441203',
      createdAt: new Date('2025-01-15'),
      cancelledAt: new Date('2025-01-25'),
      cancellationReason: 'Travel itinerary change',
    },
    {
      userKey: 'guest7',
      roomNumber: '402',
      checkIn: new Date('2025-02-18'),
      checkOut: new Date('2025-02-21'),
      guests: 2,
      totalAmount: 1020,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: 'pay_now',
      specialRequests: 'Accessible airport transfer',
      confirmationCode: 'GP-118825',
      createdAt: new Date('2025-01-12'),
    },
    {
      userKey: 'guest1',
      roomNumber: '501',
      checkIn: new Date('2024-12-15'),
      checkOut: new Date('2024-12-18'),
      guests: 3,
      totalAmount: 1230,
      status: BookingStatus.CHECKED_OUT,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: 'pay_later',
      specialRequests: 'Extra bed for child',
      confirmationCode: 'GP-552019',
      createdAt: new Date('2024-11-25'),
    },
    {
      userKey: 'guest2',
      roomNumber: '401',
      checkIn: new Date('2025-05-10'),
      checkOut: new Date('2025-05-12'),
      guests: 2,
      totalAmount: 720,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: 'pay_now',
      specialRequests: 'Renovation update before arrival',
      confirmationCode: 'GP-229471',
      createdAt: new Date('2025-03-20'),
    },
    {
      userKey: 'guest3',
      roomNumber: '202',
      checkIn: new Date('2025-02-25'),
      checkOut: new Date('2025-02-28'),
      guests: 2,
      totalAmount: 1680,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: 'pay_now',
      specialRequests: 'Butler to arrange city tour',
      confirmationCode: 'GP-619337',
      createdAt: new Date('2025-01-30'),
    },
  ]

  const bookings = []
  for (const booking of bookingSeeds) {
    const room = rooms.find(r => r.number === booking.roomNumber)
    if (!room) continue

    const record = await prisma.booking.create({
      data: {
        userId: users[booking.userKey].id,
        roomId: room.id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalAmount: booking.totalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        specialRequests: booking.specialRequests,
        confirmationCode: booking.confirmationCode,
        createdAt: booking.createdAt,
        cancelledAt: booking.cancelledAt,
        cancellationReason: booking.cancellationReason,
      },
    })
    bookings.push(record)

    const tax = Number((booking.totalAmount * 0.1).toFixed(2))
    await prisma.invoice.create({
      data: {
        bookingId: record.id,
        amount: booking.totalAmount,
        tax,
        total: booking.totalAmount + tax,
        status: booking.paymentStatus,
        dueDate: new Date(record.checkIn.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    })
  }

  const taskSeeds = [
    {
      title: 'Refresh welcome amenities',
      description: 'Set up champagne, chocolates, and personalized welcome note in Executive Suite 201',
      type: TaskType.GUEST_REQUEST,
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      assignedTo: staffMembers[0].id,
      bookingId: bookings[0].id,
      dueDate: new Date('2025-02-12T16:00:00'),
    },
    {
      title: 'Coordinate private chef dinner',
      description: 'Liaise with culinary team for five-course tasting menu on March 1st',
      type: TaskType.ROOM_SERVICE,
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
      assignedTo: staffMembers[2].id,
      bookingId: bookings[1].id,
      dueDate: new Date('2025-02-28T18:00:00'),
    },
    {
      title: 'Repair rainfall shower',
      description: 'Resolve low pressure complaint in Deluxe King room 101',
      type: TaskType.MAINTENANCE,
      priority: TaskPriority.URGENT,
      status: TaskStatus.PENDING,
      assignedTo: staffMembers[5].id,
      bookingId: bookings[5].id,
      dueDate: new Date('2025-01-26T10:00:00'),
    },
    {
      title: 'Daily turndown aromatherapy',
      description: 'Apply lavender aromatherapy preference for family suite 502',
      type: TaskType.HOUSEKEEPING,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.COMPLETED,
      assignedTo: staffMembers[6].id,
      bookingId: bookings[3].id,
      dueDate: new Date('2025-01-10T20:00:00'),
      completedAt: new Date('2025-01-10T19:30:00'),
    },
    {
      title: 'Assist VIP sky tour booking',
      description: 'Confirm helicopter sky tour with concierge partners for Skyline Suite guests',
      type: TaskType.ADMINISTRATIVE,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.IN_PROGRESS,
      assignedTo: staffMembers[1].id,
      bookingId: bookings[4].id,
      dueDate: new Date('2025-03-20T17:00:00'),
    },
  ]

  const taskRecords = []
  for (const task of taskSeeds) {
    const record = await prisma.task.create({
      data: {
        ...task,
        createdBy: users.manager.id,
      },
    })
    taskRecords.push(record)
  }

  const menuSeeds = [
    { name: 'Sunrise Acai Bowl', description: 'Acai puree with seasonal berries and almond granola', price: 18.5, category: FoodCategory.BREAKFAST, image: '/images/menu/acai-bowl.jpg', preparationTime: 8 },
    { name: 'Truffle Omelette', description: 'Cage-free eggs, black truffle shavings, manchego', price: 24, category: FoodCategory.BREAKFAST, image: '/images/menu/truffle-omelette.jpg', preparationTime: 12 },
    { name: 'Heritage Tomato Burrata', description: 'Heirloom tomatoes, basil oil, aged balsamic', price: 22, category: FoodCategory.LUNCH, image: '/images/menu/burrata.jpg', preparationTime: 10 },
    { name: 'Seared Atlantic Salmon', description: 'Citrus beurre blanc, fennel pollen, charred broccolini', price: 42, category: FoodCategory.LUNCH, image: '/images/menu/salmon.jpg', preparationTime: 18 },
    { name: 'Prime Wagyu Tenderloin', description: 'Miyazaki wagyu with pomme puree and bordelaise', price: 98, category: FoodCategory.DINNER, image: '/images/menu/wagyu.jpg', preparationTime: 25 },
    { name: 'Porcini Risotto', description: 'Aged carnaroli rice, porcini broth, Parmigiano Reggiano', price: 36, category: FoodCategory.DINNER, image: '/images/menu/risotto.jpg', preparationTime: 22 },
    { name: 'Valrhona Chocolate Soufflé', description: '70% Guanaja chocolate, Tahitian vanilla anglaise', price: 18, category: FoodCategory.DESSERTS, image: '/images/menu/souffle.jpg', preparationTime: 15 },
    { name: 'Passionfruit Pavlova', description: 'Crisp meringue, tropical fruits, coconut cream', price: 17, category: FoodCategory.DESSERTS, image: '/images/menu/pavlova.jpg', preparationTime: 12 },
    { name: 'Cold Brew Negroni', description: 'Coffee-infused Campari, gin, vermouth', price: 16, category: FoodCategory.BEVERAGES, image: '/images/menu/negroni.jpg', preparationTime: 5 },
    { name: 'Cucumber Elderflower Fizz', description: 'House soda, cucumber, elderflower cordial', price: 12, category: FoodCategory.BEVERAGES, image: '/images/menu/fizz.jpg', preparationTime: 4 },
    { name: 'Lobster Benedict', description: 'Maine lobster, brown butter hollandaise, brioche', price: 32, category: FoodCategory.BREAKFAST, image: '/images/menu/lobster-benedict.jpg', preparationTime: 14 },
    { name: 'Grilled Octopus', description: 'Smoked paprika aioli, crispy chickpeas, lemon', price: 28, category: FoodCategory.LUNCH, image: '/images/menu/octopus.jpg', preparationTime: 16 },
  ]

  const menuItems = await Promise.all(menuSeeds.map(item => prisma.foodMenu.create({ data: item })))

  const orders = [
    {
      roomNumber: '201',
      bookingId: bookings[0].id,
      guestId: users.guest1.id,
      status: OrderStatus.DELIVERED,
      totalAmount: 140,
      specialRequests: 'Deliver during sunset with champagne pairing',
      items: [
        { menuName: 'Prime Wagyu Tenderloin', quantity: 2 },
        { menuName: 'Valrhona Chocolate Soufflé', quantity: 2 },
      ],
    },
    {
      roomNumber: '301',
      bookingId: bookings[1].id,
      guestId: users.guest2.id,
      status: OrderStatus.PREPARING,
      totalAmount: 210,
      specialRequests: 'Chef tasting menu amuse bouche',
      items: [
        { menuName: 'Heritage Tomato Burrata', quantity: 2 },
        { menuName: 'Seared Atlantic Salmon', quantity: 2 },
        { menuName: 'Cold Brew Negroni', quantity: 2 },
      ],
    },
    {
      roomNumber: '102',
      bookingId: bookings[2].id,
      guestId: users.guest3.id,
      status: OrderStatus.PENDING,
      totalAmount: 62,
      specialRequests: 'Room service breakfast for 8am',
      items: [
        { menuName: 'Truffle Omelette', quantity: 1 },
        { menuName: 'Sunrise Acai Bowl', quantity: 1 },
        { menuName: 'Cucumber Elderflower Fizz', quantity: 2 },
      ],
    },
  ]

  for (const order of orders) {
    const createdOrder = await prisma.foodOrder.create({
      data: {
        roomNumber: order.roomNumber,
        guestId: order.guestId,
        bookingId: order.bookingId,
        status: order.status,
        totalAmount: order.totalAmount,
        specialRequests: order.specialRequests,
        deliveryTime: new Date(order.status === OrderStatus.PENDING ? Date.now() + 60 * 60 * 1000 : Date.now()),
      },
    })

    for (const item of order.items) {
      const menu = menuItems.find(m => m.name === item.menuName)
      if (!menu) continue
      await prisma.orderItem.create({
        data: {
          orderId: createdOrder.id,
          menuId: menu.id,
          quantity: item.quantity,
          unitPrice: menu.price,
          notes: 'Prepared according to SmartHotel plating standards',
        },
      })
    }
  }

  const inventorySeeds = [
    { name: 'Hypoallergenic Pillows', description: 'Premium hypoallergenic pillows for allergy-sensitive guests', category: 'Linens', quantity: 120, unit: 'pieces', minQuantity: 40, status: InventoryStatus.IN_STOCK },
    { name: 'Spa Aromatherapy Oils', description: 'Signature wellness scents for turndown service', category: 'Spa', quantity: 85, unit: 'bottles', minQuantity: 30, status: InventoryStatus.LOW_STOCK },
    { name: 'SmartHotel Robes', description: 'Embroidered Frette robes for suites and premium rooms', category: 'Guest Amenities', quantity: 45, unit: 'sets', minQuantity: 50, status: InventoryStatus.LOW_STOCK },
    { name: 'Nespresso Capsules', description: 'Grand Cru coffee capsule assortment', category: 'Food & Beverage', quantity: 900, unit: 'capsules', minQuantity: 300, status: InventoryStatus.IN_STOCK },
    { name: 'Crystal Champagne Flutes', description: 'Hand-cut crystal flutes for in-room celebrations', category: 'Food & Beverage', quantity: 26, unit: 'pairs', minQuantity: 20, status: InventoryStatus.IN_STOCK },
  ]
  for (const item of inventorySeeds) {
    await prisma.inventory.create({ data: item })
  }

  const gallerySeeds = [
    { title: 'Skyline Infinity Pool', imageUrl: '/images/gallery/infinity-pool.jpg', category: GalleryCategory.AMENITY },
    { title: 'Grand Lobby Arrival', imageUrl: '/images/gallery/grand-lobby.jpg', category: GalleryCategory.EVENT },
    { title: 'Presidential Living Room', imageUrl: '/images/gallery/presidential-suite.jpg', category: GalleryCategory.ROOM },
    { title: 'Executive Chef Tasting', imageUrl: '/images/gallery/tasting-menu.jpg', category: GalleryCategory.FOOD },
    { title: 'SmartHotel Spa Retreat', imageUrl: '/images/gallery/spa-suite.jpg', category: GalleryCategory.AMENITY },
    { title: 'Sky Terrace Sunset', imageUrl: '/images/gallery/sky-terrace.jpg', category: GalleryCategory.EXTERIOR },
    { title: 'The Grand Ballroom', imageUrl: '/images/gallery/ballroom.jpg', category: GalleryCategory.EVENT },
    { title: 'Candlelight Dinner', imageUrl: '/images/gallery/dinner.jpg', category: GalleryCategory.FOOD },
    { title: 'Digital Concierge Tablet', imageUrl: '/images/gallery/digital-concierge.jpg', category: GalleryCategory.AMENITY },
    { title: 'Fitness and Wellness Club', imageUrl: '/images/gallery/fitness-club.jpg', category: GalleryCategory.AMENITY },
    { title: 'Luxury Suite Bathroom', imageUrl: '/images/gallery/luxury-bathroom.jpg', category: GalleryCategory.ROOM },
    { title: 'Skyline Champagne Lounge', imageUrl: '/images/gallery/champagne-lounge.jpg', category: GalleryCategory.EVENT },
  ]
  await prisma.gallery.createMany({ data: gallerySeeds })

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
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  await prisma.guestReview.createMany({
    data: [
      {
        bookingId: bookings[3].id,
        userId: users.guest4.id,
        roomId: rooms.find(r => r.number === '502')!.id,
        rating: 5,
        title: 'Unforgettable family retreat',
        comment: 'The attention to detail for our children was extraordinary, from bedtime stories to customized turndown service.',
        isVerified: true,
        isPublic: true,
      },
      {
        bookingId: bookings[0].id,
        userId: users.guest1.id,
        roomId: rooms.find(r => r.number === '201')!.id,
        rating: 5,
        title: 'Executive perfection',
        comment: 'Butler service and culinary experiences exceeded expectations. The team anticipated every need.',
        isVerified: true,
        isPublic: true,
      },
      {
        bookingId: bookings[2].id,
        userId: users.guest3.id,
        roomId: rooms.find(r => r.number === '102')!.id,
        rating: 4,
        title: 'Excellent service',
        comment: 'Room service breakfast was sublime and the concierge made brilliant dining recommendations.',
        isVerified: true,
        isPublic: true,
      },
    ],
  })

  await prisma.promotion.createMany({
    data: [
      {
        title: 'Skyline Escape',
        description: 'Save 20% on Skyline Suite bookings with rooftop sunset tasting.',
        code: 'SKYLINE20',
        type: PromotionType.PERCENTAGE,
        value: 20,
        minAmount: 500,
        maxDiscount: 300,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-05-31'),
      },
      {
        title: 'Stay 3 Pay 2',
        description: 'Complimentary third night in Grand Deluxe Rooms.',
        code: 'STAY3PAY2',
        type: PromotionType.FREE_NIGHT,
        value: 1,
        minAmount: 0,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-12-20'),
      },
    ],
  })

  await prisma.emailTemplate.createMany({
    data: [
      {
        name: 'booking_confirmation',
        subject: 'Your SmartHotel Grand Palace Reservation',
        body: '<p>Dear {{guestName}},</p><p>Your reservation for {{roomType}} is confirmed from {{checkIn}} to {{checkOut}}. Confirmation: {{confirmationCode}}</p><p>We look forward to welcoming you.</p>',
        variables: ['guestName', 'roomType', 'checkIn', 'checkOut', 'confirmationCode'],
      },
      {
        name: 'contact_acknowledgement',
        subject: 'We received your message',
        body: '<p>Dear {{name}},</p><p>Thank you for contacting SmartHotel Grand Palace. Our concierge desk will respond shortly.</p>',
        variables: ['name'],
      },
    ],
  })

  await prisma.emailLog.createMany({
    data: [
      {
        to: 'emily.carter@example.com',
        subject: 'Your SmartHotel Grand Palace Reservation',
        template: 'booking_confirmation',
        status: EmailStatus.DELIVERED,
        sentAt: new Date('2025-01-05T09:30:00'),
      },
      {
        to: 'michael.rivera@example.com',
        subject: 'Your SmartHotel Grand Palace Reservation',
        template: 'booking_confirmation',
        status: EmailStatus.SENT,
        sentAt: new Date('2025-02-10T11:15:00'),
      },
      {
        to: 'info@smarthotel.com',
        subject: 'Inquiry from wellness columnist',
        template: null,
        status: EmailStatus.PENDING,
      },
    ],
  })

  await prisma.notification.createMany({
    data: [
      {
        userId: users.manager.id,
        title: 'VIP Arrival Alert',
        message: 'Executive Suite 201 guests arriving 30 minutes early. Butler team notified.',
        type: NotificationType.BOOKING_REMINDER,
        isRead: false,
        data: { bookingId: bookings[0].id },
      },
      {
        userId: users.admin.id,
        title: 'Maintenance Flag',
        message: 'Room 401 scheduled for maintenance review prior to May bookings.',
        type: NotificationType.GENERAL,
        isRead: true,
      },
      {
        userId: users.guest4.id,
        title: 'Thank you for staying',
        message: 'We hope you enjoyed your stay. Share feedback for a personalized offer.',
        type: NotificationType.BOOKING_REMINDER,
        isRead: false,
        data: { surveyUrl: 'https://smarthotel.com/feedback' },
      },
    ],
  })

  await prisma.wishlist.createMany({
    data: [
      { userId: users.guest1.id, roomId: rooms.find(r => r.number === '301')!.id },
      { userId: users.guest2.id, roomId: rooms.find(r => r.number === '302')!.id },
      { userId: users.guest3.id, roomId: rooms.find(r => r.number === '201')!.id },
    ],
  })

  await prisma.auditLog.createMany({
    data: [
      {
        userId: users.manager.id,
        action: 'BOOKING_CREATE',
        entityType: 'Booking',
        entityId: bookings[0].id,
        details: { confirmationCode: bookings[0].confirmationCode, roomNumber: '201' },
      },
      {
        userId: users.admin.id,
        action: 'TASK_ASSIGN',
        entityType: 'Task',
        entityId: taskRecords[0].id,
        details: { assignedTo: taskRecords[0].assignedTo, priority: taskRecords[0].priority },
      },
    ],
  })

  console.log('✅ Seeding complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`👥 Users: ${await prisma.user.count()}`)
  console.log(`👔 Staff: ${await prisma.staff.count()}`)
  console.log(`🏨 Rooms: ${await prisma.room.count()}`)
  console.log(`📅 Bookings: ${await prisma.booking.count()}`)
  console.log(`🧾 Invoices: ${await prisma.invoice.count()}`)
  console.log(`🧹 Tasks: ${await prisma.task.count()}`)
  console.log(`🍽️ Menu Items: ${await prisma.foodMenu.count()}`)
  console.log(`🥂 Orders: ${await prisma.foodOrder.count()}`)
  console.log(`📦 Inventory Items: ${await prisma.inventory.count()}`)
  console.log(`🖼️ Gallery Items: ${await prisma.gallery.count()}`)
  console.log(`⭐ Guest Reviews: ${await prisma.guestReview.count()}`)
  console.log(`🎁 Promotions: ${await prisma.promotion.count()}`)
  console.log(`📧 Email Templates: ${await prisma.emailTemplate.count()}`)
  console.log(`🔔 Notifications: ${await prisma.notification.count()}`)
  console.log(`❤️ Wishlists: ${await prisma.wishlist.count()}`)
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

