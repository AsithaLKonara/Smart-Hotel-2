import { PrismaClient, RoomStatus, TaskType, TaskStatus, Priority, BookingStatus, StayStatus, BookingSource, PaymentStatus, PaymentMethod } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addDays, subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Clearing existing data...')
  
  // Delete in correct order to respect foreign key constraints
  try { await prisma.task.deleteMany() } catch (e) {}
  try { await prisma.invoiceLineItem.deleteMany() } catch (e) {}
  try { await prisma.invoice.deleteMany() } catch (e) {}
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

  const adminPerm = await prisma.permission.findUnique({ where: { action: '*' } })
  if (adminPerm) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: createdRoles['SUPER_ADMIN'].id, permissionId: adminPerm.id } },
      update: {},
      create: { roleId: createdRoles['SUPER_ADMIN'].id, permissionId: adminPerm.id }
    })
  }

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
    createdUsers[user.email] = await prisma.user.upsert({
      where: { email: user.email },
      update: { roleId: createdRoles[user.roleName].id },
      create: { email: user.email, name: user.name, password: hashedPassword, roleId: createdRoles[user.roleName].id }
    })
  }

  // ==========================================
  // 3. PROPERTY STRUCTURE
  // ==========================================
  console.log('Seeding Property Structure...')
  
  const amenities = [
    { name: 'WiFi', icon: 'wifi', category: 'Basic' },
    { name: 'Pool Access', icon: 'waves', category: 'Leisure' },
    { name: 'Gym', icon: 'dumbbell', category: 'Leisure' },
    { name: 'Ocean View', icon: 'sun', category: 'View' },
  ]
  for (const am of amenities) {
    await prisma.amenity.upsert({ where: { name: am.name }, update: {}, create: am })
  }

  const roomTypes = [
    { name: 'Standard Room', description: 'Cozy room for short stays', baseRate: 150, capacity: 2, amenities: ['WiFi'] },
    { name: 'Deluxe Ocean View', description: 'Spacious room with balcony', baseRate: 250, capacity: 3, amenities: ['WiFi', 'Ocean View'] },
    { name: 'Presidential Suite', description: 'Ultimate luxury experience', baseRate: 800, capacity: 4, amenities: ['WiFi', 'Pool Access', 'Gym', 'Ocean View'] },
  ]

  const createdRoomTypes: Record<string, any> = {}
  for (const rt of roomTypes) {
    createdRoomTypes[rt.name] = await prisma.roomType.upsert({
      where: { name: rt.name },
      update: { baseRate: rt.baseRate },
      create: rt
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
    createdRooms[r.number] = await prisma.room.upsert({
      where: { number: r.number },
      update: { status: r.status, roomTypeId: createdRoomTypes[r.type].id },
      create: { number: r.number, floor: r.floor, status: r.status, roomTypeId: createdRoomTypes[r.type].id }
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
    await prisma.foodMenu.upsert({
      where: { id: menu.name.toLowerCase().replace(/\s+/g, '-') }, // Fake deterministic ID
      update: { price: menu.price },
      create: { id: menu.name.toLowerCase().replace(/\s+/g, '-'), ...menu }
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
  console.log('Seeding Bookings & Stays...')
  const today = new Date()

  // 1. Current Active Booking
  const currentBooking = await prisma.booking.create({
    data: {
      confirmationCode: 'RES-CUR-001',
      checkIn: subDays(today, 1),
      checkOut: addDays(today, 2),
      status: BookingStatus.CHECKED_IN,
      source: BookingSource.WEBSITE,
      roomId: createdRooms['102'].id,
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
      invoices: {
        create: {
          invoiceNo: 'INV-CUR-001',
          subtotal: 450.0,
          taxAmount: 45.0,
          grandTotal: 495.0,
          status: 'OPEN',
          lineItems: {
            create: [
              { description: 'Room Charge (3 nights)', quantity: 1, unitPrice: 450.0, totalPrice: 450.0, category: 'ROOM' }
            ]
          }
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
      roomId: createdRooms['201'].id,
      primaryGuestId: createdUsers['guestb@example.com'].id,
      guests: 2,
      totalAmount: 750.0,
      paymentStatus: PaymentStatus.unpaid,
      invoices: {
        create: {
          invoiceNo: 'INV-FUT-002',
          subtotal: 750.0,
          taxAmount: 75.0,
          grandTotal: 825.0,
          status: 'DRAFT',
          lineItems: {
            create: [
              { description: 'Room Charge (3 nights)', quantity: 1, unitPrice: 750.0, totalPrice: 750.0, category: 'ROOM' }
            ]
          }
        }
      }
    }
  })

  // ==========================================
  // 7. TASKS (MAINTENANCE / HOUSEKEEPING)
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
        createdBy: createdUsers['manager@smarthotel.com'].id,
      },
      {
        type: TaskType.MAINTENANCE,
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.URGENT,
        title: 'Fix AC in 202',
        description: 'AC blowing warm air',
        roomId: createdRooms['202'].id,
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
    process.exit(1)
  })