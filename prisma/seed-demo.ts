import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { faker } from '@faker-js/faker'
import { addDays, subDays, addHours, format, isBefore } from 'date-fns'

const prisma = new PrismaClient()

async function clearDatabase() {
  console.log('🧹 Clearing existing data...')
  try {
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"${name}"`)
      .join(', ');
      
    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
  } catch (err) {
    console.error('Error during DB truncate:', err)
  }
}

async function main() {
  await clearDatabase();
  console.log('🌱 Starting Demo Data Seeding...')
  
  const defaultPassword = await bcrypt.hash('Demo@123', 10)

  // 1. Roles & Permissions
  console.log('Generating Roles...')
  const rolesData = [
    { name: 'SUPER_ADMIN', desc: 'Full System Access' },
    { name: 'GENERAL_MANAGER', desc: 'Property Operations Oversight' },
    { name: 'FINANCE_MANAGER', desc: 'Financial Reporting and Audits' },
    { name: 'ACCOUNTANT', desc: 'Daily Financial Operations' },
    { name: 'FRONT_OFFICE_MANAGER', desc: 'Front Desk Operations' },
    { name: 'RECEPTIONIST', desc: 'Guest Check-in/Check-out' },
    { name: 'NIGHT_AUDITOR', desc: 'Night Audit and Reconciliation' },
    { name: 'RESERVATION_AGENT', desc: 'Booking Management' },
    { name: 'HOUSEKEEPING_MANAGER', desc: 'Housekeeping Management' },
    { name: 'HOUSEKEEPER', desc: 'Room Cleaning Tasks' },
    { name: 'MAINTENANCE_MANAGER', desc: 'Maintenance Oversight' },
    { name: 'MAINTENANCE_TECH', desc: 'Work Order Execution' },
    { name: 'HR_MANAGER', desc: 'Human Resources' },
    { name: 'HR_EXECUTIVE', desc: 'HR Tasks' },
    { name: 'RESTAURANT_MANAGER', desc: 'F&B Management' },
    { name: 'CHEF', desc: 'Kitchen Management' },
    { name: 'WAITER', desc: 'F&B Service' },
    { name: 'EVENTS_MANAGER', desc: 'Banqueting and Events' },
    { name: 'SALES_MANAGER', desc: 'Corporate and Group Sales' },
    { name: 'INVENTORY_MANAGER', desc: 'Stock and Procurement' },
    { name: 'PURCHASING_OFFICER', desc: 'Vendor Orders' }
  ]

  const roles: Record<string, string> = {}
  for (const r of rolesData) {
    const role = await prisma.role.create({ data: { name: r.name, description: r.desc } })
    roles[r.name] = role.id
  }

  // 2. Organization / Properties
  console.log('Generating Properties...')
  const property = await prisma.property.create({
    data: {
      name: 'SmartHotel Grand Palace',
      code: 'SH-GP',
      address: faker.location.streetAddress(),
      city: 'New York',
      country: 'USA',
      timezone: 'America/New_York',
      totalRooms: 50,
      status: 'ACTIVE'
    }
  })

  // 3. Employees & Demo User Accounts
  console.log('Generating Demo Accounts and Employees...')
  const demoAccounts = [
    { email: 'admin@smarthotel.demo', name: 'Alex Admin', role: 'SUPER_ADMIN', dept: 'MANAGEMENT', title: 'Super Admin' },
    { email: 'gm@smarthotel.demo', name: 'Gary Manager', role: 'GENERAL_MANAGER', dept: 'MANAGEMENT', title: 'General Manager' },
    { email: 'finance@smarthotel.demo', name: 'Fiona Finance', role: 'FINANCE_MANAGER', dept: 'FINANCE', title: 'Finance Manager' },
    { email: 'accountant@smarthotel.demo', name: 'Arthur Count', role: 'ACCOUNTANT', dept: 'FINANCE', title: 'Accountant' },
    { email: 'fom@smarthotel.demo', name: 'Frank Office', role: 'FRONT_OFFICE_MANAGER', dept: 'FRONT_DESK', title: 'Front Office Manager' },
    { email: 'reception@smarthotel.demo', name: 'Rachel Desk', role: 'RECEPTIONIST', dept: 'FRONT_DESK', title: 'Receptionist' },
    { email: 'nightaudit@smarthotel.demo', name: 'Nick Auditor', role: 'NIGHT_AUDITOR', dept: 'FRONT_DESK', title: 'Night Auditor' },
    { email: 'reservations@smarthotel.demo', name: 'Rita Booking', role: 'RESERVATION_AGENT', dept: 'FRONT_DESK', title: 'Reservation Agent' },
    { email: 'hkm@smarthotel.demo', name: 'Helen Keeper', role: 'HOUSEKEEPING_MANAGER', dept: 'HOUSEKEEPING', title: 'Housekeeping Manager' },
    { email: 'housekeeping@smarthotel.demo', name: 'Hannah Clean', role: 'HOUSEKEEPER', dept: 'HOUSEKEEPING', title: 'Housekeeper' },
    { email: 'maintenance.mgr@smarthotel.demo', name: 'Mike Fixit', role: 'MAINTENANCE_MANAGER', dept: 'MAINTENANCE', title: 'Maintenance Manager' },
    { email: 'maintenance@smarthotel.demo', name: 'Mark Tech', role: 'MAINTENANCE_TECH', dept: 'MAINTENANCE', title: 'Maintenance Technician' },
    { email: 'hr@smarthotel.demo', name: 'Holly Resources', role: 'HR_MANAGER', dept: 'MANAGEMENT', title: 'HR Manager' },
    { email: 'restaurant@smarthotel.demo', name: 'Rose Dining', role: 'RESTAURANT_MANAGER', dept: 'KITCHEN', title: 'Restaurant Manager' },
    { email: 'chef@smarthotel.demo', name: 'Charlie Cook', role: 'CHEF', dept: 'KITCHEN', title: 'Executive Chef' },
    { email: 'waiter@smarthotel.demo', name: 'Will Serve', role: 'WAITER', dept: 'KITCHEN', title: 'Waiter' },
    { email: 'events@smarthotel.demo', name: 'Eve Party', role: 'EVENTS_MANAGER', dept: 'MANAGEMENT', title: 'Events Manager' },
    { email: 'inventory@smarthotel.demo', name: 'Ian Stock', role: 'INVENTORY_MANAGER', dept: 'MAINTENANCE', title: 'Inventory Manager' }
  ]

  const users = []
  const employees = []

  for (const acc of demoAccounts) {
    const user = await prisma.user.create({
      data: {
        name: acc.name,
        email: acc.email,
        password: defaultPassword,
        phone: faker.phone.number(),
        roleId: roles[acc.role],
        propertyId: property.id
      }
    })
    users.push(user)

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        firstName: acc.name.split(' ')[0],
        lastName: acc.name.split(' ')[1],
        email: acc.email,
        phone: user.phone,
        department: acc.dept,
        position: acc.title,
        baseSalary: faker.number.int({ min: 30000, max: 120000 }),
        hireDate: faker.date.past({ years: 2 })
      }
    })
    employees.push(employee)
  }

  // Developer / Guest 
  const developer = await prisma.user.create({
    data: { name: 'Dev Master', email: 'dev@smarthotel.demo', password: defaultPassword, roleId: roles['SUPER_ADMIN'], propertyId: property.id }
  })
  
  const guestUser = await prisma.user.create({
    data: { name: 'Demo Guest', email: 'guest@smarthotel.demo', password: defaultPassword, vipStatus: 'VIP', propertyId: property.id }
  })

  // 4. Room Types & Rooms
  console.log('Generating Rooms...')
  const roomTypesData = [
    { name: 'Standard Room', desc: 'Cozy room for 2', baseRate: 150, cap: 2 },
    { name: 'Deluxe Room', desc: 'Spacious room with city view', baseRate: 250, cap: 3 },
    { name: 'Executive Suite', desc: 'Luxury suite with lounge access', baseRate: 450, cap: 4 },
    { name: 'Presidential Suite', desc: 'The ultimate luxury experience', baseRate: 1200, cap: 4 }
  ]

  const roomTypes = []
  for (const rt of roomTypesData) {
    const created = await prisma.roomType.create({
      data: {
        name: rt.name,
        description: rt.desc,
        baseRate: rt.baseRate,
        capacity: rt.cap,
        amenities: ['WiFi', 'TV', 'Mini Bar', 'Safe'],
        totalRooms: 10
      }
    })
    roomTypes.push(created)
  }

  const rooms = []
  let floor = 1
  for (let i = 0; i < 40; i++) {
    if (i % 10 === 0) floor++
    const rt = roomTypes[i % roomTypes.length]
    const room = await prisma.room.create({
      data: {
        number: String(floor) + (i % 10).toString().padStart(2, '0'),
        floor,
        capacity: rt.capacity,
        size: faker.number.int({ min: 25, max: 100 }),
        roomTypeId: rt.id,
        propertyId: property.id,
        status: faker.helpers.arrayElement(['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'OCCUPIED', 'DIRTY'])
      }
    })
    rooms.push(room)
  }

  // 5. Suppliers, Inventory & POS
  console.log('Generating Inventory & POS Data...')
  const vendor = await prisma.vendor.create({
    data: {
      name: 'Global Supplies Inc',
      contactPerson: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
    }
  })

  const invItemsData = [
    { name: 'Towels', category: 'LINEN', unit: 'PIECE', price: 15 },
    { name: 'Bed Sheets', category: 'LINEN', unit: 'PIECE', price: 25 },
    { name: 'Shampoo (5L)', category: 'HOUSEKEEPING', unit: 'LITER', price: 12 },
    { name: 'Coffee Beans', category: 'FOOD', unit: 'KG', price: 18 },
    { name: 'Sparkling Water', category: 'BEVERAGE', unit: 'BOX', price: 20 }
  ]

  const invItems = []
  for (const item of invItemsData) {
    const inv = await prisma.inventoryItem.create({
      data: {
        name: item.name,
        sku: faker.string.alphanumeric(8).toUpperCase(),
        category: item.category,
        unit: item.unit,
        unitPrice: item.price,
        vendorId: vendor.id,
        parLevel: 20
      }
    })
    invItems.push(inv)
    
    // Add stock
    await prisma.inventoryStock.create({
      data: {
        itemId: inv.id,
        location: 'MAIN_STORE',
        quantity: faker.number.int({ min: 5, max: 100 })
      }
    })
  }

  const restaurant = await prisma.pOSOutlet.create({
    data: { name: 'Grand Dining', type: 'RESTAURANT' }
  })
  
  const bar = await prisma.pOSOutlet.create({
    data: { name: 'Sky Lounge', type: 'BAR' }
  })

  const posProducts = []
  for (let i = 0; i < 15; i++) {
    const prod = await prisma.pOSProduct.create({
      data: {
        outletId: i % 2 === 0 ? restaurant.id : bar.id,
        name: faker.commerce.productName(),
        category: i % 2 === 0 ? 'Food' : 'Drinks',
        price: faker.number.float({ min: 10, max: 80, fractionDigits: 2 })
      }
    })
    posProducts.push(prod)
  }

  // 6. Network (Corporate, Travel Agents, Guests)
  console.log('Generating Guests & Network...')
  const corporate = await prisma.corporateAccount.create({
    data: {
      companyName: 'TechCorp International',
      contactName: faker.person.fullName(),
      contactEmail: faker.internet.email(),
      contactPhone: faker.phone.number(),
      negotiatedRate: 15
    }
  })

  const agency = await prisma.travelAgent.create({
    data: {
      agencyName: 'Wanderlust Travels',
      iataNumber: faker.string.numeric(8),
      contactName: faker.person.fullName(),
      contactEmail: faker.internet.email(),
      contactPhone: faker.phone.number(),
      commissionRate: 12.5
    }
  })

  const guests = []
  for (let i = 0; i < 30; i++) {
    const guest = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: defaultPassword,
        phone: faker.phone.number(),
        propertyId: property.id,
        corporateAccountId: i % 5 === 0 ? corporate.id : null,
        travelAgentId: i % 7 === 0 ? agency.id : null,
        vipStatus: i % 10 === 0 ? 'VIP' : 'STANDARD'
      }
    })
    guests.push(guest)
  }
  guests.push(guestUser) // Add explicit demo guest

  // 7. Operations (Bookings, Stays, Tasks) over time
  console.log('Generating Bookings & Folios...')
  const today = new Date()
  
  for (let i = 0; i < 60; i++) { // 60 bookings spread over -3 months to +1 month
    const guest = faker.helpers.arrayElement(guests)
    const room = faker.helpers.arrayElement(rooms)
    
    // Spread dates: 80% past/current, 20% future
    const offsetDays = faker.number.int({ min: -90, max: 30 })
    const checkIn = addDays(today, offsetDays)
    const checkOut = addDays(checkIn, faker.number.int({ min: 1, max: 7 }))
    
    let status = 'CONFIRMED'
    if (isBefore(checkOut, today)) status = 'CHECKED_OUT'
    else if (isBefore(checkIn, today) && isBefore(today, checkOut)) status = 'CHECKED_IN'

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    const totalAmount = nights * (roomTypes.find(rt => rt.id === room.roomTypeId)?.baseRate || 200)

    const booking = await prisma.booking.create({
      data: {
        confirmationCode: faker.string.alphanumeric(8).toUpperCase(),
        checkIn,
        checkOut,
        status: status as any,
        source: faker.helpers.arrayElement(['WEBSITE', 'WALK_IN', 'BOOKING_COM', 'EXPEDIA']),
        primaryGuestId: guest.id,
        totalAmount,
        paymentStatus: status === 'CHECKED_OUT' ? 'completed' : (status === 'CHECKED_IN' ? 'partial' : 'pending'),
        propertyId: property.id
      }
    })

    // Folio
    const folio = await prisma.folio.create({
      data: {
        bookingId: booking.id,
        propertyId: property.id,
        status: status === 'CHECKED_OUT' ? 'CLOSED' : 'OPEN'
      }
    })

    // Line items for folio
    await prisma.folioLineItem.create({
      data: {
        folioId: folio.id,
        description: 'Room Charge',
        amount: totalAmount,
        category: 'ROOM',
        createdAt: checkIn
      }
    })

    // Payments
    if (status === 'CHECKED_OUT' || status === 'CHECKED_IN') {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          folioId: folio.id,
          userId: guest.id,
          amount: status === 'CHECKED_OUT' ? totalAmount : totalAmount / 2,
          paymentMethod: 'card',
          status: 'completed',
          createdAt: checkIn
        }
      })
    }

    // Room Assignment & Stay
    if (status === 'CHECKED_IN' || status === 'CHECKED_OUT') {
      await prisma.roomAssignment.create({
        data: {
          bookingId: booking.id,
          roomId: room.id,
          startDate: checkIn,
          endDate: checkOut,
          status: status === 'CHECKED_OUT' ? 'COMPLETED' : 'ACTIVE'
        }
      })

      await prisma.stay.create({
        data: {
          bookingId: booking.id,
          roomId: room.id,
          status: status as any,
          checkInTime: addHours(checkIn, 14),
          checkOutTime: status === 'CHECKED_OUT' ? addHours(checkOut, 10) : null
        }
      })
    }

    // Add POS Order occasionally
    if (i % 3 === 0 && (status === 'CHECKED_IN' || status === 'CHECKED_OUT')) {
      const prod = faker.helpers.arrayElement(posProducts)
      const order = await prisma.internalOrder.create({
        data: {
          orderType: 'POS_OUTLET',
          status: 'COMPLETED',
          totalAmount: prod.price * 2,
          guestId: guest.id,
          roomId: room.id,
          outletId: prod.outletId,
          folioId: folio.id,
          paymentType: 'ROOM_CHARGE'
        }
      })
      await prisma.internalOrderItem.create({
        data: {
          orderId: order.id,
          productId: prod.id,
          quantity: 2,
          price: prod.price,
          subtotal: prod.price * 2
        }
      })
      await prisma.folioLineItem.create({
        data: {
          folioId: folio.id,
          description: `POS Charge - ${prod.name}`,
          amount: prod.price * 2,
          category: 'F&B',
          createdAt: addDays(checkIn, 1)
        }
      })
    }

    // Add Tasks
    if (i % 5 === 0) {
      await prisma.task.create({
        data: {
          type: 'HOUSEKEEPING',
          status: status === 'CHECKED_OUT' ? 'COMPLETED' : 'PENDING',
          title: 'Clean Room',
          roomId: room.id,
          propertyId: property.id,
          assignedTo: faker.helpers.arrayElement(employees.filter(e => e.department === 'HOUSEKEEPING')).id
        }
      })
    }
  }

  // Generate Night Audit Logs
  console.log('Generating Night Audits...')
  for (let i = 30; i > 0; i--) {
    const auditDate = subDays(today, i)
    await prisma.nightAuditLog.create({
      data: {
        businessDate: auditDate,
        totalRevenue: faker.number.float({ min: 5000, max: 15000, fractionDigits: 2 }),
        roomsProcessed: 50,
        status: 'COMPLETED',
        runByUserId: users.find(u => u.email === 'nightaudit@smarthotel.demo')?.id
      }
    })
  }

  // Incidents / Maintenance Work Orders
  console.log('Generating Maintenance Records...')
  for (let i = 0; i < 5; i++) {
    await prisma.maintenanceWorkOrder.create({
      data: {
        roomId: faker.helpers.arrayElement(rooms).id,
        issue: faker.helpers.arrayElement(['AC Not Working', 'Leaking Tap', 'Light Bulb replacement', 'TV Remote not working']),
        status: faker.helpers.arrayElement(['OPEN', 'IN_PROGRESS', 'CLOSED'])
      }
    })
  }

  console.log('✅ Demo data generation completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
