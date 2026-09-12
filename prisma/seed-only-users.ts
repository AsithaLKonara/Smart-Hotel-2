/// <reference types="node" />
import { 
  PrismaClient, RoomStatus, StayStatus, BookingStatus, BookingSource, 
  PaymentStatus, PaymentMethod, TaskType, TaskStatus, Priority, EventStatus 
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Truncating all tables with CASCADE...')
  
  // Get all tables in the public schema
  const tablenames = await prisma.$queryRaw<Array<{tablename: string}>>`SELECT tablename FROM pg_tables WHERE schemaname='public'`
  
  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ')
    
  if (tables.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
      console.log('Successfully truncated all tables.')
    } catch (error) {
      console.error('Error truncating tables:', error)
      throw error
    }
  }

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
  // 1.5. DEFAULT PROPERTY
  // ==========================================
  console.log('Seeding Default Property...')
  const defaultProperty = await prisma.property.create({
    data: {
      name: 'SmartHotel Grand Palace',
      code: 'SH-GP',
      address: '123 Smart Way',
      city: 'Techville',
      country: 'USA',
      timezone: 'America/New_York',
      totalRooms: 50,
      status: 'ACTIVE'
    }
  })

  // ==========================================
  // 2. USERS (from seed-only-users.ts)
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
        propertyId: defaultProperty.id
      }
    })
  }
  
  const mainGuestId = createdUsers['guest@example.com'].id;
  const adminUserId = createdUsers['admin@smarthotel.com'].id;

  // ==========================================
  // 3. ROOMS & PROPERTY STRUCTURE
  // ==========================================
  console.log('Seeding Rooms & Structure...')
  
  const amenity = await prisma.amenity.create({
    data: { name: 'WiFi', description: 'High-speed internet', category: 'Connectivity' }
  })

  const roomType = await prisma.roomType.create({
    data: { name: 'Deluxe Suite', description: 'Ocean view suite', baseRate: 200, capacity: 2, amenities: [amenity.name] }
  })
  
  const roomType2 = await prisma.roomType.create({
    data: { name: 'Standard Room', description: 'Cozy and comfortable', baseRate: 100, capacity: 2, amenities: [amenity.name] }
  })

  const room = await prisma.room.create({
    data: { number: '101', floor: 1, roomTypeId: roomType.id, propertyId: defaultProperty.id, status: RoomStatus.AVAILABLE }
  })
  const room2 = await prisma.room.create({
    data: { number: '102', floor: 1, roomTypeId: roomType2.id, propertyId: defaultProperty.id, status: RoomStatus.OCCUPIED }
  })

  await prisma.roomImage.create({
    data: { roomId: room.id, imageUrl: 'https://example.com/room101.jpg', isMain: true }
  })
  
  await prisma.roomStatusHistory.create({
    data: { roomId: room.id, oldStatus: RoomStatus.DIRTY, newStatus: RoomStatus.AVAILABLE, actorId: adminUserId }
  })

  // ==========================================
  // 4. PRICING & YIELD
  // ==========================================
  console.log('Seeding Pricing...')
  
  const ratePlan = await prisma.ratePlan.create({
    data: { name: 'Standard Rate', roomTypeId: roomType.id, isDefault: true }
  })

  await prisma.seasonalRate.create({
    data: { ratePlanId: ratePlan.id, name: 'Summer Special', startDate: new Date('2026-06-01'), endDate: new Date('2026-08-31'), multiplier: 1.2 }
  })
  
  await prisma.yieldRule.create({
    data: { name: 'High Occupancy Premium', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), adjustmentType: 'PERCENTAGE', adjustmentValue: 15 }
  })

  // ==========================================
  // 5. GUESTS & PROFILES
  // ==========================================
  console.log('Seeding Guest Profiles...')
  
  await prisma.guestPreference.create({
    data: { userId: mainGuestId, dietaryRestrictions: ['Vegan'], roomPreferences: ['High Floor'] }
  })
  
  await prisma.guestProfile.create({
    data: { userAccountId: mainGuestId, preferences: { language: 'en' } }
  })
  
  await prisma.guestHistory.create({
    data: { userId: mainGuestId, totalStays: 2, totalNights: 5, totalSpend: 1500 }
  })
  
  const corporateAccount = await prisma.corporateAccount.create({
    data: { companyName: 'Acme Corp', contactName: 'John Doe', contactEmail: 'john@acme.com', contactPhone: '555-1234', negotiatedRate: 150 }
  })
  
  const travelAgent = await prisma.travelAgent.create({
    data: { agencyName: 'Wanderlust Travel', contactName: 'Jane Smith', contactEmail: 'jane@wanderlust.com', contactPhone: '555-5678', commissionRate: 12 }
  })

  // ==========================================
  // 6. BOOKINGS, STAYS & ASSIGNMENTS
  // ==========================================
  console.log('Seeding Bookings...')
  
  const booking = await prisma.booking.create({
    data: {
      confirmationCode: 'BKG12345',
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000 * 2), // +2 days
      status: BookingStatus.CONFIRMED,
      source: BookingSource.WEBSITE,
      primaryGuestId: mainGuestId,
      guests: 2,
      totalAmount: 400,
      propertyId: defaultProperty.id
    }
  })
  
  await prisma.bookingGuest.create({
    data: { bookingId: booking.id, name: 'Bob Traveler', email: 'bob@example.com' }
  })
  
  await prisma.roomAssignment.create({
    data: { bookingId: booking.id, roomId: room.id, startDate: new Date(), endDate: new Date(Date.now() + 86400000 * 2) }
  })
  
  const stay = await prisma.stay.create({
    data: { bookingId: booking.id, roomId: room.id, status: StayStatus.CHECKED_IN, checkInTime: new Date() }
  })
  
  await prisma.stayEvent.create({
    data: { bookingId: booking.id, type: 'CHECK_IN', actorId: adminUserId }
  })
  
  await prisma.event.create({
    data: { name: 'Local City Tour', eventDate: new Date(), status: EventStatus.upcoming }
  })

  // ==========================================
  // 7. FINANCIALS & ACCOUNTING
  // ==========================================
  console.log('Seeding Financials...')
  
  await prisma.transactionCode.create({
    data: { id: 'TC001', description: 'Room Charge', type: 'REVENUE' }
  })

  const folio = await prisma.folio.create({
    data: { bookingId: booking.id, propertyId: defaultProperty.id, type: 'GUEST', status: 'OPEN' }
  })
  
  await prisma.folioLineItem.create({
    data: { folioId: folio.id, description: 'Room Rate', amount: 200, category: 'ROOM' }
  })
  
  const payment = await prisma.payment.create({
    data: { bookingId: booking.id, folioId: folio.id, amount: 200, currency: 'USD', paymentMethod: PaymentMethod.card, status: PaymentStatus.completed }
  })
  
  await prisma.financialAdjustment.create({
    data: { paymentId: payment.id, type: 'REFUND', amount: -20, reason: 'Service issue' }
  })
  
  const folio2 = await prisma.folio.create({
    data: { bookingId: booking.id, propertyId: defaultProperty.id, type: 'INCIDENTAL', status: 'OPEN' }
  })
  
  await prisma.routingRule.create({
    data: { sourceFolioId: folio.id, targetFolioId: folio2.id, criteria: { category: 'F&B' } }
  })
  
  await prisma.journalEntry.create({
    data: { accountId: '1000', debit: 200, description: 'Cash Received', postingDate: new Date() }
  })
  
  const nightAudit = await prisma.nightAuditLog.create({
    data: { businessDate: new Date(), totalRevenue: 1500, roomsProcessed: 50, runByUserId: adminUserId }
  })
  
  await prisma.revenuePosting.create({
    data: { nightAuditLogId: nightAudit.id, category: 'ROOM', amount: 1000 }
  })

  // ==========================================
  // 8. OPERATIONS, F&B & POS
  // ==========================================
  console.log('Seeding Operations & POS...')
  
  const outlet = await prisma.pOSOutlet.create({
    data: { name: 'Main Restaurant', type: 'RESTAURANT' }
  })
  
  const product = await prisma.pOSProduct.create({
    data: { outletId: outlet.id, name: 'Burger', category: 'Food', price: 15 }
  })
  
  const foodMenu = await prisma.foodMenu.create({
    data: { name: 'Dinner Menu', description: 'Evening dishes', category: 'Dinner', price: 0, preparationTime: 0 }
  })
  
  const internalOrder = await prisma.internalOrder.create({
    data: { status: 'PENDING', totalAmount: 15, guestId: mainGuestId, outletId: outlet.id, folioId: folio2.id }
  })
  
  await prisma.internalOrderItem.create({
    data: { orderId: internalOrder.id, productId: product.id, quantity: 1, price: 15, subtotal: 15 }
  })
  
  await prisma.outOfOrderRecord.create({
    data: { roomId: room2.id, reason: 'Broken Pipe', startDate: new Date(), endDate: new Date(Date.now() + 86400000) }
  })

  // ==========================================
  // 9. EVENTS & BANQUETING
  // ==========================================
  console.log('Seeding Events & Banqueting...')
  
  const eventSpace = await prisma.eventSpace.create({
    data: { name: 'Grand Ballroom', capacity: 300, hourlyRate: 500, dailyRate: 4000 }
  })
  
  const banquetingEvent = await prisma.banquetingEvent.create({
    data: { name: 'Tech Conference 2026', type: 'CORPORATE', status: 'CONFIRMED', startDate: new Date(), endDate: new Date(Date.now() + 86400000), expectedAttendees: 200, organizerName: 'Tech Corp' }
  })
  
  await prisma.eventBooking.create({
    data: { eventId: banquetingEvent.id, spaceId: eventSpace.id, startTime: new Date(), endTime: new Date(Date.now() + 3600000) }
  })
  
  await prisma.groupBlock.create({
    data: { eventId: banquetingEvent.id, roomTypeId: roomType.id, blockedCount: 20, contractedRate: 150 }
  })

  // ==========================================
  // 10. HR & PAYROLL
  // ==========================================
  console.log('Seeding HR & Payroll...')
  
  const employee = await prisma.employee.create({
    data: { userId: adminUserId, firstName: 'System', lastName: 'Admin', email: 'admin_emp@smarthotel.com', department: 'IT', position: 'Manager', baseSalary: 5000, hireDate: new Date() }
  })
  
  await prisma.shift.create({
    data: { employeeId: employee.id, startTime: new Date(), endTime: new Date(Date.now() + 28800000) }
  })
  
  await prisma.leaveRequest.create({
    data: { employeeId: employee.id, type: 'ANNUAL', startDate: new Date(), endDate: new Date(Date.now() + 86400000) }
  })
  
  await prisma.attendance.create({
    data: { employeeId: employee.id, date: new Date(), clockIn: new Date() }
  })
  
  const payrollRun = await prisma.payrollRun.create({
    data: { periodStart: new Date(), periodEnd: new Date(Date.now() + 86400000 * 30) }
  })
  
  await prisma.payrollLineItem.create({
    data: { payrollRunId: payrollRun.id, employeeId: employee.id, basePay: 5000, netPay: 4500 }
  })
  
  await prisma.payrollRecord.create({
    data: { employeeId: employee.id, periodStart: new Date(), periodEnd: new Date(Date.now() + 86400000 * 30), baseAmount: 5000, netPay: 4500 }
  })

  // ==========================================
  // 11. INVENTORY & PURCHASING
  // ==========================================
  console.log('Seeding Inventory...')
  
  const vendor = await prisma.vendor.create({
    data: { name: 'Hotel Supplies Co.' }
  })
  
  const inventoryItem = await prisma.inventoryItem.create({
    data: { name: 'Bath Towel', category: 'Linens', unit: 'pcs', unitPrice: 5, vendorId: vendor.id }
  })
  
  await prisma.inventoryStock.create({
    data: { itemId: inventoryItem.id, location: 'Main Store', quantity: 100 }
  })
  
  const po = await prisma.purchaseOrder.create({
    data: { orderNumber: 'PO-001', vendorId: vendor.id, status: 'APPROVED' }
  })
  
  await prisma.purchaseOrderItem.create({
    data: { purchaseOrderId: po.id, itemId: inventoryItem.id, quantity: 50, unitPrice: 5, totalPrice: 250 }
  })
  
  await prisma.inventoryMovement.create({
    data: { itemId: inventoryItem.id, type: 'IN', quantity: 50 }
  })
  
  await prisma.goodsReceipt.create({
    data: { purchaseOrderId: po.id }
  })
  
  await prisma.vendorInvoice.create({
    data: { purchaseOrderId: po.id, invoiceNumber: 'INV-123', amount: 250 }
  })
  
  await prisma.inventory.create({
    data: { name: 'Shampoo Mini', category: 'Amenities', unit: 'bottles' }
  })

  // ==========================================
  // 12. MAINTENANCE & ASSETS
  // ==========================================
  console.log('Seeding Maintenance...')
  
  const asset = await prisma.asset.create({
    data: { name: 'HVAC Unit 1', category: 'AC', location: 'Roof' }
  })
  
  await prisma.maintenanceSchedule.create({
    data: { assetId: asset.id, taskName: 'Filter Change', frequencyDays: 90, nextRun: new Date(Date.now() + 86400000 * 90) }
  })
  
  await prisma.inspectionLog.create({
    data: { assetId: asset.id, technicianName: 'Bob Fixit', status: 'PASS' }
  })
  
  await prisma.maintenanceWorkOrder.create({
    data: { assetId: asset.id, issue: 'Strange noise', status: 'OPEN' }
  })
  
  await prisma.task.create({
    data: { type: TaskType.MAINTENANCE, title: 'Fix AC', propertyId: defaultProperty.id, roomId: room.id }
  })

  // ==========================================
  // 13. SUPPORT & COMMUNICATION
  // ==========================================
  console.log('Seeding Support...')
  
  await prisma.complaint.create({
    data: { userId: mainGuestId, subject: 'Noisy Neighbors', description: 'Very loud music', category: 'Noise' }
  })
  
  await prisma.feedback.create({
    data: { userId: mainGuestId, title: 'Great stay', rating: 5, targetType: 'HOTEL' }
  })
  
  await prisma.contactMessage.create({
    data: { name: 'Alice', email: 'alice@test.com', subject: 'Inquiry', message: 'Hello!' }
  })
  
  await prisma.incident.create({
    data: { title: 'Water Leak', category: 'Plumbing', severity: 'HIGH', owner: 'Maintenance Team', slaMinutesRemaining: 120, message: 'Leak in lobby' }
  })
  
  const guestConv = await prisma.guestConversation.create({
    data: { guestId: mainGuestId }
  })
  
  await prisma.guestMessage.create({
    data: { conversationId: guestConv.id, senderType: 'GUEST', content: 'Can I have late checkout?' }
  })
  
  await prisma.conversation.create({
    data: { sessionId: 'sess-123', userId: mainGuestId, message: 'Hi', response: 'Hello, how can I help?' }
  })
  
  await prisma.chatCustomer.create({
    data: { phone: '+1234567890', name: 'John Chat' }
  })
  
  await prisma.notification.create({
    data: { userId: mainGuestId, type: 'PROMO', title: 'Special Offer', message: 'Get 20% off!' }
  })

  // ==========================================
  // 14. SETTINGS & CONTENT
  // ==========================================
  console.log('Seeding Content...')
  
  await prisma.setting.create({
    data: { key: 'SITE_TITLE', value: 'Smart Hotel' }
  })
  
  await prisma.fAQ.create({
    data: { question: 'What is check-in time?', answer: '3 PM' }
  })
  
  await prisma.heroSlide.create({
    data: { image: 'hero.jpg', title: 'Welcome', subtitle: 'To paradise', description: 'Enjoy your stay', cta: 'Book Now', ctaLink: '/book' }
  })
  
  await prisma.gallery.create({
    data: { title: 'Pool', imageUrl: 'pool.jpg', category: 'Facilities' }
  })
  
  await prisma.navigationLink.create({
    data: { name: 'Home', href: '/' }
  })
  
  await prisma.footerLink.create({
    data: { label: 'Privacy', url: '/privacy', category: 'Legal' }
  })
  
  await prisma.socialLink.create({
    data: { platform: 'Twitter', url: 'https://twitter.com' }
  })
  
  await prisma.knowledge.create({
    data: { content: 'Check-out is at 11 AM.', embedding: [0.1, 0.2, 0.3] }
  })
  
  await prisma.embeddingCache.create({
    data: { text: 'Check-out is at 11 AM.', embedding: [0.1, 0.2, 0.3] }
  })

  // ==========================================
  // 15. INTEGRATIONS & WEBHOOKS
  // ==========================================
  console.log('Seeding Integrations...')
  
  const channelConf = await prisma.channelConfig.create({
    data: { provider: 'Booking.com', apiKey: 'secret', propertyId: defaultProperty.id }
  })
  
  await prisma.roomMapping.create({
    data: { localRoomTypeId: roomType.id, otaRoomTypeId: 'BKG-DLX', channelConfigId: channelConf.id }
  })
  
  await prisma.integration.create({
    data: { appName: 'Stripe', provider: 'Stripe' }
  })
  
  const webhook = await prisma.webhookEndpoint.create({
    data: { url: 'https://example.com/webhook', event: 'booking.created' }
  })
  
  await prisma.webhookSubscription.create({
    data: { webhookEndpointId: webhook.id, eventTypes: ['booking.created'] }
  })
  
  await prisma.webhookDelivery.create({
    data: { webhookEndpointId: webhook.id, payload: { test: true } }
  })
  
  await prisma.webhookDLQ.create({
    data: { provider: 'Webhook', payload: { failed: true } }
  })
  
  await prisma.syncLog.create({
    data: { direction: 'OUTBOUND', status: 'SUCCESS', entityType: 'BOOKING' }
  })
  
  await prisma.auditLog.create({
    data: { actor: 'System', action: 'START', resource: 'SEED' }
  })
  
  await prisma.outbox.create({
    data: { topic: 'email.send', payload: { to: 'test@example.com' } }
  })

  // ==========================================
  // 16. LOYALTY & RESORT
  // ==========================================
  console.log('Seeding Loyalty & Resort...')
  
  const loyalty = await prisma.loyaltyPoint.create({
    data: { userId: mainGuestId, points: 500 }
  })
  
  await prisma.loyaltyTransaction.create({
    data: { loyaltyPointId: loyalty.id, type: 'earned', points: 500, description: 'Sign up bonus' }
  })
  
  const facility = await prisma.resortFacility.create({
    data: { name: 'Tennis Court', type: 'SPORTS' }
  })
  
  await prisma.resortBooking.create({
    data: { facilityId: facility.id, guestId: mainGuestId, startTime: new Date(), endTime: new Date(Date.now() + 3600000) }
  })
  
  await prisma.tableBooking.create({
    data: { name: 'Alice', email: 'alice@example.com', phone: '555', guests: 2, bookingDate: new Date(), bookingTime: '19:00' }
  })

  console.log('✅ Database cleared and comprehensively seeded successfully!')
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
