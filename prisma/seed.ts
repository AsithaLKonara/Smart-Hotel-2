/// <reference types="node" />
import { PrismaClient, RoomStatus, TaskType, TaskStatus, Priority, BookingStatus, StayStatus, BookingSource, PaymentStatus, PaymentMethod } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addDays, subDays } from 'date-fns'
import { encryptPII } from '../lib/crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Clearing existing data...')
  
  // Delete in correct order to respect foreign key constraints
  try { await prisma.task.deleteMany() } catch (e) {}
  try { await prisma.feedback.deleteMany() } catch (e) {}
  try { await prisma.internalOrderItem.deleteMany() } catch (e) {}
  try { await prisma.internalOrder.deleteMany() } catch (e) {}
  try { await prisma.folioLineItem.deleteMany() } catch (e) {}
  try { await prisma.folio.deleteMany() } catch (e) {}
  try { await prisma.bookingGuest.deleteMany() } catch (e) {}
  try { await prisma.stay.deleteMany() } catch (e) {}
  try { await prisma.booking.deleteMany() } catch (e) {}
  try { await prisma.room.deleteMany() } catch (e) {}
  try { await prisma.roomType.deleteMany() } catch (e) {}
  try { await prisma.amenity.deleteMany() } catch (e) {}
  try { await prisma.pOSProduct.deleteMany() } catch (e) {}
  try { await prisma.pOSOutlet.deleteMany() } catch (e) {}
  try { await prisma.foodMenu.deleteMany() } catch (e) {}
  try { await prisma.eventSpace.deleteMany() } catch (e) {}
  try { await prisma.user.deleteMany() } catch (e) {}
  try { await prisma.rolePermission.deleteMany() } catch (e) {}
  try { await prisma.role.deleteMany() } catch (e) {}
  try { await prisma.permission.deleteMany() } catch (e) {}

  console.log('🌱 Starting comprehensive database seed...')

  // ==========================================
  // 1. RBAC: PERMISSIONS & ROLES
  // ==========================================
  console.log('Seeding Permissions & Roles...')
  const permissions = [
    { action: '*', description: 'Super Admin wildcard' },
    { action: 'booking:read', description: 'Read bookings' },
    { action: 'booking:write', description: 'Create and update bookings' },
    { action: 'payment:write', description: 'Process payments' },
    { action: 'invoice:read', description: 'Read invoices' },
    { action: 'invoice:write', description: 'Modify invoices' },
    { action: 'order:write', description: 'Place F&B orders' },
    { action: 'pos:read', description: 'View POS and Menus' },
    { action: 'pos:write', description: 'Manage POS and Menus' },
    { action: 'housekeeping:read', description: 'View housekeeping tasks' },
    { action: 'housekeeping:write', description: 'Manage housekeeping' },
    { action: 'analytics:read', description: 'View analytics' },
    { action: 'inventory:manage', description: 'Manage inventory' },
    { action: 'users:manage', description: 'Manage users' },
  ]

  for (const perm of permissions) {
    await prisma.permission.upsert({ where: { action: perm.action }, update: {}, create: perm })
  }

  const rolesToCreate = [
    { name: 'SUPER_ADMIN', description: 'Full system access' },
    { name: 'MANAGER', description: 'Hotel manager' },
    { name: 'RECEPTIONIST', description: 'Front desk operations' },
    { name: 'KITCHEN', description: 'Kitchen and F&B operations' },
    { name: 'HOUSEKEEPING', description: 'Housekeeping operations' },
    { name: 'MAINTENANCE', description: 'Maintenance operations' },
    { name: 'GUEST', description: 'Default guest role' },
  ]

  const createdRoles: Record<string, any> = {}
  for (const role of rolesToCreate) {
    createdRoles[role.name] = await prisma.role.upsert({ where: { name: role.name }, update: {}, create: role })
  }

  // 1.5. MATRIX BINDING
  console.log('Binding Permission Matrix...')
  const roleMatrix: Record<string, string[]> = {
    'SUPER_ADMIN': ['*'],
    'MANAGER': ['booking:read', 'booking:write', 'payment:write', 'invoice:read', 'invoice:write', 'order:write', 'pos:read', 'pos:write', 'housekeeping:read', 'housekeeping:write', 'analytics:read', 'inventory:manage', 'users:manage'],
    'RECEPTIONIST': ['booking:read', 'booking:write', 'payment:write', 'invoice:read', 'invoice:write'],
    'KITCHEN': ['pos:read', 'pos:write', 'order:write', 'inventory:manage'],
    'HOUSEKEEPING': ['housekeeping:read', 'housekeeping:write'],
    'MAINTENANCE': ['housekeeping:read', 'housekeeping:write'],
    'GUEST': []
  }

  for (const [roleName, actions] of Object.entries(roleMatrix)) {
    const roleId = createdRoles[roleName]?.id
    if (!roleId) continue

    for (const action of actions) {
      const perm = await prisma.permission.findUnique({ where: { action } })
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId: perm.id } },
          update: {},
          create: { roleId, permissionId: perm.id }
        })
      }
    }
  }

  // ==========================================
  // 1.5 PROPERTY STRUCTURE
  // ==========================================
  console.log('Seeding Property...')
  const mainProperty = await prisma.property.upsert({
    where: { code: 'MAIN-001' },
    update: {},
    create: {
      name: 'SmartHotel Main',
      code: 'MAIN-001',
      address: '123 Smart St',
      city: 'Techville',
      country: 'USA',
      timezone: 'America/New_York',
      totalRooms: 100,
      status: 'ACTIVE'
    }
  })

  // ==========================================
  // 2. USERS
  // ==========================================
  console.log('Seeding Users...')
  const demoUsers = [
    { email: 'admin@smarthotel.com', password: 'SmartHotel@2025!Admin', roleName: 'SUPER_ADMIN', name: 'System Admin' },
    { email: 'manager@smarthotel.com', password: 'SmartHotel@2025!Manager', roleName: 'MANAGER', name: 'Sarah Manager' },
    { email: 'receptionist@smarthotel.com', password: 'SmartHotel@2025!Reception', roleName: 'RECEPTIONIST', name: 'John Frontdesk' },
    { email: 'kitchen@smarthotel.com', password: 'SmartHotel@2025!Kitchen', roleName: 'KITCHEN', name: 'Chef Gordon' },
    { email: 'housekeeping@smarthotel.com', password: 'SmartHotel@2025!House', roleName: 'HOUSEKEEPING', name: 'Maria Clean' },
    { email: 'maintenance@smarthotel.com', password: 'SmartHotel@2025!Maint', roleName: 'MAINTENANCE', name: 'Bob Fixit' },
    { email: 'guest@example.com', password: 'SmartHotel@2025!Guest', roleName: 'GUEST', name: 'Alice Traveler' },
    { email: 'guestb@example.com', password: 'SmartHotel@2025!GuestB', roleName: 'GUEST', name: 'Charlie Voyager' },
  ]

  const createdUsers: Record<string, any> = {}
  for (const user of demoUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10)
    createdUsers[user.email] = await prisma.user.create({
      data: { 
        email: user.email, 
        name: user.name, 
        password: hashedPassword, 
        roleId: createdRoles[user.roleName].id, 
        propertyId: mainProperty.id 
      }
    })
  }

  // ==========================================
  // 3. ROOM STRUCTURE
  // ==========================================
  console.log('Seeding Room Structure...')
  
  const amenities = [
    { name: 'WiFi', icon: 'wifi', category: 'Basic' },
    { name: 'Pool Access', icon: 'waves', category: 'Leisure' },
    { name: 'Gym', icon: 'dumbbell', category: 'Leisure' },
    { name: 'Ocean View', icon: 'sun', category: 'View' },
  ]
  for (const am of amenities) {
    await prisma.amenity.create({ data: am })
  }

  const roomTypes = [
    { name: 'Standard Room', description: 'Cozy room for short stays', baseRate: 150, capacity: 2, amenities: ['WiFi'] },
    { name: 'Deluxe Ocean View', description: 'Spacious room with balcony', baseRate: 250, capacity: 3, amenities: ['WiFi', 'Ocean View'] },
    { name: 'Presidential Suite', description: 'Ultimate luxury experience', baseRate: 800, capacity: 4, amenities: ['WiFi', 'Pool Access', 'Gym', 'Ocean View'] },
  ]

  const createdRoomTypes: Record<string, any> = {}
  for (const rt of roomTypes) {
    createdRoomTypes[rt.name] = await prisma.roomType.create({
      data: rt
    })
  }

  const roomsToCreate = [
    { number: '101', floor: 1, type: 'Standard Room', status: RoomStatus.AVAILABLE },
    { number: '102', floor: 1, type: 'Standard Room', status: RoomStatus.OCCUPIED },
    { number: '103', floor: 1, type: 'Standard Room', status: RoomStatus.DIRTY },
    { number: '201', floor: 2, type: 'Deluxe Ocean View', status: RoomStatus.AVAILABLE },
    { number: '202', floor: 2, type: 'Deluxe Ocean View', status: RoomStatus.MAINTENANCE },
    { number: '301', floor: 3, type: 'Presidential Suite', status: RoomStatus.AVAILABLE },
  ]

  const createdRooms: Record<string, any> = {}
  for (const r of roomsToCreate) {
    createdRooms[r.number] = await prisma.room.create({
      data: { number: r.number, floor: r.floor, status: r.status, roomTypeId: createdRoomTypes[r.type].id, propertyId: mainProperty.id }
    })
  }

  // ==========================================
  // 4. OPERATIONS & F&B
  // ==========================================
  console.log('Seeding Operations & F&B...')

  const menus = [
    { name: 'Wagyu Burger', category: 'Mains', price: 45, description: 'Premium wagyu beef with truffle fries', preparationTime: 20 },
    { name: 'Caesar Salad', category: 'Appetizers', price: 18, description: 'Fresh romaine with house dressing', preparationTime: 10 },
    { name: 'Dom Perignon', category: 'Drinks', price: 250, description: 'Vintage Champagne', preparationTime: 5 },
  ]
  for (const menu of menus) {
    await prisma.foodMenu.create({
      data: { id: menu.name.toLowerCase().replace(/\s+/g, '-'), ...menu }
    })
  }

  const outlets = [
    { name: 'Main Restaurant', type: 'RESTAURANT' },
    { name: 'Pool Bar', type: 'BAR' },
    { name: 'Lotus Spa', type: 'SPA' },
  ]
  const createdOutlets: Record<string, any> = {}
  for (const outlet of outlets) {
    createdOutlets[outlet.name] = await prisma.pOSOutlet.create({
      data: outlet
    })
  }

  await prisma.pOSProduct.create({
    data: { outletId: createdOutlets['Lotus Spa'].id, name: 'Deep Tissue Massage 60m', category: 'Service', price: 120 }
  })

  // ==========================================
  // 5. EVENTS
  // ==========================================
  console.log('Seeding Events...')
  const eventSpaces = [
    { name: 'Grand Ballroom', capacity: 500, hourlyRate: 1000, dailyRate: 8000 },
    { name: 'Boardroom A', capacity: 12, hourlyRate: 100, dailyRate: 600 },
  ]
  for (const space of eventSpaces) {
    await prisma.eventSpace.create({ data: space })
  }

  // ==========================================
  // 6. BOOKINGS, STAYS, AND INVOICES
  // ==========================================
  console.log('Seeding Bookings, Guests, and Feedback...')
  const today = new Date()

  // 1. Current Active Booking
  const currentBooking = await prisma.booking.create({
    data: {
      confirmationCode: 'RES-CUR-001',
      checkIn: subDays(today, 1),
      checkOut: addDays(today, 2),
      status: BookingStatus.CHECKED_IN,
      source: BookingSource.WEBSITE,
      propertyId: mainProperty.id,
      roomAssignments: { create: { roomId: createdRooms['102'].id, startDate: subDays(today, 1), endDate: addDays(today, 2) } },
      primaryGuestId: createdUsers['guest@example.com'].id,
      guests: 2,
      totalAmount: 450.0,
      paymentStatus: PaymentStatus.partial,
      stay: {
        create: {
          roomId: createdRooms['102'].id,
          status: StayStatus.CHECKED_IN,
          checkInTime: subDays(today, 1)
        }
      },
      folios: {
        create: {
          type: 'GUEST',
          status: 'OPEN',
          propertyId: mainProperty.id,
          lineItems: {
            create: [
              { description: 'Room Charge (3 nights)', amount: 450.0, category: 'ROOM' }
            ]
          }
        }
      },
      additionalGuests: {
        create: {
          name: 'Alice Traveler',
          email: 'guest@example.com',
          identity: encryptPII('PA1234567'),
          isMinor: false
        }
      }
    }
  })

  // 2. Future Booking
  await prisma.booking.create({
    data: {
      confirmationCode: 'RES-FUT-002',
      checkIn: addDays(today, 5),
      checkOut: addDays(today, 8),
      status: BookingStatus.CONFIRMED,
      source: BookingSource.EXPEDIA,
      propertyId: mainProperty.id,
      roomAssignments: { create: { roomId: createdRooms['201'].id, startDate: addDays(today, 5), endDate: addDays(today, 8) } },
      primaryGuestId: createdUsers['guestb@example.com'].id,
      guests: 2,
      totalAmount: 750.0,
      paymentStatus: PaymentStatus.unpaid,
      folios: {
        create: {
          type: 'GUEST',
          status: 'OPEN',
          propertyId: mainProperty.id,
          lineItems: {
            create: [
              { description: 'Room Charge (3 nights)', amount: 750.0, category: 'ROOM' }
            ]
          }
        }
      },
      additionalGuests: {
        create: {
          name: 'Charlie Voyager',
          email: 'guestb@example.com',
          identity: encryptPII('ID987654321'),
          isMinor: false
        }
      }
    }
  })

  // 3. Feedback
  await prisma.feedback.create({
    data: {
      userId: createdUsers['guest@example.com'].id,
      targetType: 'HOTEL',
      rating: 5,
      overallRating: 5,
      serviceRating: 5,
      cleanlinessRating: 4,
      title: 'Amazing Stay!',
      comment: 'We loved the room and the food was excellent.',
      verified: true,
      bookingId: currentBooking.id,
      roomId: createdRooms['102'].id
    }
  })

  // ==========================================
  // 7. INTERNAL ORDERS (POS / F&B)
  // ==========================================
  console.log('Seeding Internal Orders...')

  await prisma.internalOrder.create({
    data: {
      orderType: 'IN_ROOM_DINING',
      status: 'DELIVERED',
      totalAmount: 45.0,
      guestId: createdUsers['guest@example.com'].id,
      roomId: createdRooms['102'].id,
      paymentType: 'ROOM_CHARGE',
      items: {
        create: [
          {
            menuItemId: 'wagyu-burger',
            quantity: 1,
            price: 45.0,
            subtotal: 45.0,
            notes: 'Medium rare'
          }
        ]
      }
    }
  })

  // ==========================================
  // 8. TASKS (MAINTENANCE / HOUSEKEEPING)
  // ==========================================
  console.log('Seeding Tasks...')
  
  await prisma.task.createMany({
    data: [
      {
        type: TaskType.HOUSEKEEPING,
        status: TaskStatus.PENDING,
        priority: Priority.HIGH,
        title: 'Clean Room 103',
        description: 'Deep clean required after checkout',
        roomId: createdRooms['103'].id,
        propertyId: mainProperty.id,
        createdBy: createdUsers['manager@smarthotel.com'].id,
      },
      {
        type: TaskType.MAINTENANCE,
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.URGENT,
        title: 'Fix AC in 202',
        description: 'AC blowing warm air',
        roomId: createdRooms['202'].id,
        propertyId: mainProperty.id,
        createdBy: createdUsers['guest@example.com'].id,
      },
      {
        type: TaskType.ROOM_SERVICE,
        status: TaskStatus.PENDING,
        priority: Priority.MEDIUM,
        title: 'Deliver Extra Towels',
        description: 'Guest requested 2 extra bath towels',
        roomId: createdRooms['102'].id,
        bookingId: currentBooking.id,
        propertyId: mainProperty.id,
        createdBy: createdUsers['guest@example.com'].id,
      }
    ]
  })

  console.log('✅ Comprehensive database seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    // @ts-ignore
    process.exit(1)
  })