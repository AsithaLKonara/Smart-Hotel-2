import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('--- PHASE 3: RELATIONAL DATA GENERATION ---');
  
  const START_TIME = Date.now();

  console.log('Ensuring roles exist...');
  const roles = ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE', 'GUEST'];
  const roleCache: Record<string, string> = {};
  
  for (const roleName of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} Role` }
    });
    roleCache[roleName] = role.id;
  }

  console.log('Creating Super Admins...');
  for (let i = 1; i <= 2; i++) {
    await prisma.user.upsert({
      where: { email: `superadmin${i}@smarthotel.local` },
      update: {},
      create: {
        email: `superadmin${i}@smarthotel.local`,
        name: `Super Admin ${i}`,
        password: '$2b$10$hashedpasswordplaceholder',
        roleId: roleCache['SUPER_ADMIN']
      }
    });
  }

  console.log('Creating Hotel Admins...');
  for (let i = 1; i <= 5; i++) {
    await prisma.user.upsert({
      where: { email: `hoteladmin${i}@smarthotel.local` },
      update: {},
      create: {
        email: `hoteladmin${i}@smarthotel.local`,
        name: `Hotel Admin ${i}`,
        password: '$2b$10$hashedpasswordplaceholder',
        roleId: roleCache['HOTEL_ADMIN']
      }
    });
  }

  console.log('Creating Staff & Employees...');
  const staffTypes = [
    { role: 'MANAGER', dept: 'MANAGEMENT', count: 3 },
    { role: 'RECEPTIONIST', dept: 'FRONT_DESK', count: 10 },
    { role: 'HOUSEKEEPING', dept: 'HOUSEKEEPING', count: 15 },
    { role: 'MAINTENANCE', dept: 'MAINTENANCE', count: 5 }
  ];

  for (const st of staffTypes) {
    for (let i = 1; i <= st.count; i++) {
      const email = `${st.role.toLowerCase()}${i}@smarthotel.local`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name: faker.person.fullName(),
          password: '$2b$10$hashedpasswordplaceholder',
          roleId: roleCache[st.role]
        }
      });

      await prisma.employee.upsert({
        where: { email },
        update: {},
        create: {
          userId: user.id,
          firstName: user.name.split(' ')[0],
          lastName: user.name.split(' ')[1] || 'Staff',
          email,
          department: st.dept,
          position: st.role,
          baseSalary: faker.number.float({ min: 30000, max: 80000, fractionDigits: 2 }),
          hireDate: faker.date.past({ years: 5 }),
          status: 'ACTIVE'
        }
      });
    }
  }

  console.log('Creating Properties...');
  for (let i = 1; i <= 3; i++) {
    const code = `SH-LOC${i}`;
    await prisma.property.upsert({
      where: { code },
      update: {},
      create: {
        name: `SmartHotel ${faker.location.city()}`,
        code,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
        totalRooms: 100,
        status: 'ACTIVE'
      }
    });
  }

  console.log('Creating Amenities...');
  const amenitiesList = ['Free WiFi', 'Pool', 'Spa', 'Gym', 'Parking', 'Room Service', 'Airport Shuttle'];
  for (const aName of amenitiesList) {
    await prisma.amenity.upsert({
      where: { name: aName },
      update: {},
      create: {
        name: aName,
        description: `High quality ${aName.toLowerCase()}`,
        active: true
      }
    });
  }

  console.log('Creating Room Types...');
  const rTypes = [
    { name: 'Standard Room', baseRate: 100, capacity: 2 },
    { name: 'Deluxe Room', baseRate: 150, capacity: 2 },
    { name: 'Executive Suite', baseRate: 300, capacity: 3 },
    { name: 'Family Suite', baseRate: 250, capacity: 4 }
  ];
  
  const roomTypeCache: Record<string, any> = {};
  for (const rt of rTypes) {
    const createdRt = await prisma.roomType.upsert({
      where: { name: rt.name },
      update: {},
      create: {
        name: rt.name,
        description: `Beautiful ${rt.name} with great views.`,
        baseRate: rt.baseRate,
        capacity: rt.capacity,
        totalRooms: 20
      }
    });
    roomTypeCache[rt.name] = createdRt;
  }

  console.log('Creating Rooms...');
  const rooms = [];
  let roomNumber = 101;
  const types = Object.values(roomTypeCache);
  
  for (let i = 0; i < 50; i++) {
    const rt = types[i % types.length];
    const rNum = `${roomNumber++}`;
    try {
      const room = await prisma.room.upsert({
        where: { number: rNum },
        update: {},
        create: {
          number: rNum,
          floor: Math.floor(roomNumber / 100),
          capacity: rt.capacity,
          size: faker.number.int({ min: 25, max: 60 }),
          roomTypeId: rt.id,
          status: 'AVAILABLE'
        }
      });
      rooms.push(room);
    } catch (e) {
      // Room already exists
    }
  }

  console.log('Creating Customers...');
  const guests = [];
  for (let i = 0; i < 500; i++) {
    const email = `guest${i}_${faker.string.alphanumeric(4)}@example.com`;
    try {
      const guest = await prisma.user.create({
        data: {
          email,
          name: faker.person.fullName(),
          phone: faker.phone.number({ style: 'international' }),
          password: '$2b$10$hashedpasswordplaceholder',
          roleId: roleCache['GUEST']
        }
      });
      guests.push(guest);
      
      await prisma.loyaltyPoint.create({
        data: {
          userId: guest.id,
          points: faker.number.int({ min: 0, max: 5000 }),
          totalEarned: faker.number.int({ min: 0, max: 10000 }),
          tier: 'SILVER'
        }
      });
    } catch (e) {}
  }

  console.log('Creating Bookings, Invoices, Payments...');
  for (let i = 0; i < 150; i++) {
    if (guests.length === 0 || rooms.length === 0) break;
    
    const guest = faker.helpers.arrayElement(guests);
    const room = faker.helpers.arrayElement(rooms);
    const rt = types.find(t => t.id === room.roomTypeId) || types[0];
    
    const checkIn = faker.date.recent({ days: 60 });
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + faker.number.int({ min: 1, max: 5 }));
    const totalAmount = rt.baseRate * 2;
    
    try {
      const booking = await prisma.booking.create({
        data: {
          confirmationCode: faker.string.alphanumeric(8).toUpperCase(),
          checkIn,
          checkOut,
          status: 'CHECKED_OUT',
          source: 'WEBSITE',
          roomId: room.id,
          primaryGuestId: guest.id,
          guests: 2,
          totalAmount,
          paymentStatus: 'completed'
        }
      });

      await prisma.stay.create({
        data: {
          bookingId: booking.id,
          roomId: room.id,
          status: 'CHECKED_OUT',
          checkInTime: checkIn,
          checkOutTime: checkOut
        }
      });

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNo: `INV-${booking.confirmationCode}`,
          bookingId: booking.id,
          subtotal: totalAmount,
          taxAmount: totalAmount * 0.1,
          grandTotal: totalAmount * 1.1,
          status: 'PAID'
        }
      });

      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          invoiceId: invoice.id,
          userId: guest.id,
          amount: totalAmount * 1.1,
          currency: 'USD',
          paymentMethod: 'card',
          status: 'completed'
        }
      });
      
      if (faker.datatype.boolean()) {
        await prisma.roomReview.create({
          data: {
            roomId: room.id,
            userId: guest.id,
            bookingId: booking.id,
            rating: faker.number.int({ min: 3, max: 5 }),
            comment: faker.lorem.sentence()
          }
        });
      }
    } catch (e) {}
  }

  console.log('Creating Promotions / Yield Rules...');
  await prisma.yieldRule.create({
    data: {
      name: 'Summer Promo',
      description: '10% off for Summer',
      startDate: faker.date.soon({ days: 5 }),
      endDate: faker.date.future(),
      adjustmentType: 'PERCENTAGE',
      adjustmentValue: -10,
      isActive: true
    }
  });

  console.log('Creating Notifications...');
  for (let i = 0; i < 20; i++) {
    const guest = faker.helpers.arrayElement(guests);
    await prisma.notification.create({
      data: {
        userId: guest.id,
        type: 'SYSTEM',
        title: 'Welcome to SmartHotel',
        message: 'Your stay was great. Book again soon.',
        read: false
      }
    });
  }

  console.log('Creating Audit Logs...');
  for (let i = 0; i < 50; i++) {
    const guest = faker.helpers.arrayElement(guests);
    await prisma.auditLog.create({
      data: {
        userId: guest.id,
        actor: 'SYSTEM',
        action: 'LOGIN',
        resource: 'USER',
        resourceId: guest.id,
        details: { ip: faker.internet.ipv4() }
      }
    });
  }

  console.log('Creating Reporting Data (Night Audits)...');
  for (let i = 1; i <= 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    await prisma.nightAuditLog.create({
      data: {
        businessDate: date,
        totalRevenue: faker.number.int({ min: 5000, max: 20000 }),
        roomsProcessed: faker.number.int({ min: 20, max: 50 }),
        status: 'COMPLETED'
      }
    });
  }

  const END_TIME = Date.now();
  console.log(`Phase 3 complete in ${(END_TIME - START_TIME) / 1000}s.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
