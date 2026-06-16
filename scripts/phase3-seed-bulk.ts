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
  console.log('--- PHASE 3: RELATIONAL DATA GENERATION (BULK API) ---');
  const START_TIME = Date.now();
  const suffix = Date.now().toString().substring(7); // unique suffix

  console.log('Fetching Roles...');
  const allRoles = await prisma.role.findMany();
  const roleCache: Record<string, string> = {};
  allRoles.forEach(r => { roleCache[r.name] = r.id; });

  if (Object.keys(roleCache).length === 0) {
     console.log('Roles missing. Creating...');
     const rolesData = ['SUPER_ADMIN', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE', 'GUEST']
       .map(name => ({ id: faker.string.uuid(), name, description: `${name} Role` }));
     await prisma.role.createMany({ data: rolesData, skipDuplicates: true });
     const r = await prisma.role.findMany();
     r.forEach(x => { roleCache[x.name] = x.id; });
  }

  console.log('Creating Properties...');
  const propData = [1,2,3].map(i => ({
    id: faker.string.uuid(),
    code: `SH-LOC-${suffix}-${i}`,
    name: `SmartHotel ${faker.location.city()} ${suffix}`,
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    country: faker.location.country(),
    totalRooms: 100,
    status: 'ACTIVE'
  }));
  await prisma.property.createMany({ data: propData, skipDuplicates: true });

  console.log('Creating Users...');
  const usersData: any[] = [];
  
  const staffTypes = [
    { role: 'MANAGER', dept: 'MANAGEMENT', count: 3 },
    { role: 'RECEPTIONIST', dept: 'FRONT_DESK', count: 10 },
    { role: 'HOUSEKEEPING', dept: 'HOUSEKEEPING', count: 15 },
    { role: 'MAINTENANCE', dept: 'MAINTENANCE', count: 5 }
  ];
  
  const employeesData: any[] = [];
  for (const st of staffTypes) {
    for (let i = 1; i <= st.count; i++) {
      const uId = faker.string.uuid();
      const email = `${st.role.toLowerCase()}${i}_${suffix}@smarthotel.local`;
      usersData.push({ id: uId, email, name: faker.person.fullName(), password: 'xxx', roleId: roleCache[st.role] });
      employeesData.push({
        id: faker.string.uuid(),
        userId: uId,
        firstName: 'Staff',
        lastName: 'Member',
        email,
        department: st.dept,
        position: st.role,
        baseSalary: 45000,
        hireDate: new Date(),
        status: 'ACTIVE'
      });
    }
  }

  const guestIds: string[] = [];
  const loyaltyData: any[] = [];
  for(let i=0; i<500; i++) {
    const uId = faker.string.uuid();
    guestIds.push(uId);
    usersData.push({
      id: uId,
      email: `guest${i}_${suffix}@example.com`,
      name: faker.person.fullName(),
      phone: faker.phone.number({ style: 'international' }) + suffix,
      password: 'xxx',
      roleId: roleCache['GUEST']
    });
    loyaltyData.push({
      id: faker.string.uuid(),
      userId: uId,
      points: faker.number.int({ min: 0, max: 5000 }),
      totalEarned: faker.number.int({ min: 0, max: 10000 }),
      tier: 'SILVER'
    });
  }

  await prisma.user.createMany({ data: usersData, skipDuplicates: true });
  await prisma.employee.createMany({ data: employeesData, skipDuplicates: true });
  await prisma.loyaltyPoint.createMany({ data: loyaltyData, skipDuplicates: true });

  console.log('Creating Room Types & Rooms...');
  const rTypes = [
    { name: `Standard Room ${suffix}`, baseRate: 100, capacity: 2 },
    { name: `Deluxe Room ${suffix}`, baseRate: 150, capacity: 2 },
    { name: `Executive Suite ${suffix}`, baseRate: 300, capacity: 3 },
    { name: `Family Suite ${suffix}`, baseRate: 250, capacity: 4 }
  ];
  const roomTypesData = rTypes.map(rt => ({
    id: faker.string.uuid(),
    name: rt.name,
    description: `Beautiful ${rt.name}`,
    baseRate: rt.baseRate,
    capacity: rt.capacity,
    totalRooms: 20
  }));
  await prisma.roomType.createMany({ data: roomTypesData, skipDuplicates: true });

  const types = await prisma.roomType.findMany({ where: { name: { contains: suffix } } });
  const roomsData: any[] = [];
  let roomNumber = 1001;
  const roomIds: string[] = [];
  for (let i = 0; i < 50; i++) {
    const rt = types[i % types.length];
    const rNum = `${roomNumber++}-${suffix}`;
    const rId = faker.string.uuid();
    roomIds.push(rId);
    roomsData.push({
      id: rId,
      number: rNum,
      floor: Math.floor(roomNumber / 100),
      capacity: rt.capacity,
      size: faker.number.int({ min: 25, max: 60 }),
      roomTypeId: rt.id,
      status: 'AVAILABLE'
    });
  }
  await prisma.room.createMany({ data: roomsData, skipDuplicates: true });

  console.log('Creating Bookings, Stays, Invoices, Payments...');
  const bookingsData: any[] = [];
  const staysData: any[] = [];
  const invoicesData: any[] = [];
  const paymentsData: any[] = [];
  
  for(let i=0; i<150; i++) {
    const bId = faker.string.uuid();
    const gId = faker.helpers.arrayElement(guestIds);
    const rId = faker.helpers.arrayElement(roomIds);
    const totalAmount = 300;
    const invId = faker.string.uuid();

    bookingsData.push({
      id: bId,
      confirmationCode: `CONF-${suffix}-${i}`,
      checkIn: faker.date.recent({ days: 60 }),
      checkOut: faker.date.recent({ days: 30 }),
      status: 'CHECKED_OUT',
      source: 'WEBSITE',
      roomId: rId,
      primaryGuestId: gId,
      guests: 2,
      totalAmount,
      paymentStatus: 'completed'
    });

    staysData.push({
      id: faker.string.uuid(),
      bookingId: bId,
      roomId: rId,
      status: 'CHECKED_OUT',
      checkInTime: new Date(),
      checkOutTime: new Date()
    });

    invoicesData.push({
      id: invId,
      invoiceNo: `INV-${suffix}-${i}`,
      bookingId: bId,
      subtotal: totalAmount,
      taxAmount: totalAmount * 0.1,
      grandTotal: totalAmount * 1.1,
      status: 'PAID'
    });

    paymentsData.push({
      id: faker.string.uuid(),
      bookingId: bId,
      invoiceId: invId,
      userId: gId,
      amount: totalAmount * 1.1,
      currency: 'USD',
      paymentMethod: 'card',
      status: 'completed'
    });
  }

  await prisma.booking.createMany({ data: bookingsData, skipDuplicates: true });
  await prisma.stay.createMany({ data: staysData, skipDuplicates: true });
  await prisma.invoice.createMany({ data: invoicesData, skipDuplicates: true });
  await prisma.payment.createMany({ data: paymentsData, skipDuplicates: true });

  console.log('Creating Night Audits...');
  const auditsData = [];
  for(let i=1; i<=30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    auditsData.push({
      id: faker.string.uuid(),
      businessDate: d,
      totalRevenue: faker.number.int({ min: 5000, max: 20000 }),
      roomsProcessed: 50,
      status: 'COMPLETED'
    });
  }
  await prisma.nightAuditLog.createMany({ data: auditsData, skipDuplicates: true });

  const END_TIME = Date.now();
  console.log(`Phase 3 complete in ${(END_TIME - START_TIME) / 1000}s.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
