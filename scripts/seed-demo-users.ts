import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const DEMO_CREDENTIALS = [
  { role: 'Admin', email: 'admin@smarthotel.com', password: 'SmartHotel@2025!Admin', systemRole: 'SUPER_ADMIN' },
  { role: 'Manager', email: 'manager@smarthotel.com', password: 'SmartHotel@2025!Manager', systemRole: 'HOTEL_ADMIN' },
  { role: 'Receptionist', email: 'receptionist@smarthotel.com', password: 'SmartHotel@2025!Reception', systemRole: 'RECEPTIONIST' },
  { role: 'Kitchen', email: 'kitchen@smarthotel.com', password: 'SmartHotel@2025!Kitchen', systemRole: 'KITCHEN' }, // Fallback to HOUSEKEEPING if KITCHEN isn't an enum
  { role: 'Housekeeping', email: 'housekeeping@smarthotel.com', password: 'SmartHotel@2025!House', systemRole: 'HOUSEKEEPING' },
  { role: 'Maintenance', email: 'maintenance@smarthotel.com', password: 'SmartHotel@2025!Maint', systemRole: 'MAINTENANCE' },
  { role: 'Guest', email: 'guest@example.com', password: 'SmartHotel@2025!Guest', systemRole: 'GUEST' }
];

async function main() {
  console.log('--- SEEDING DEMO CREDENTIALS ---');

  // Load or map roles
  const roles = await prisma.role.findMany();
  const roleMap: Record<string, string> = {};
  for (const role of roles) {
    roleMap[role.name] = role.id;
  }

  // Ensure KITCHEN role exists if it's missing (since the UI expects it)
  if (!roleMap['KITCHEN']) {
    const newRole = await prisma.role.create({
      data: { id: faker.string.uuid(), name: 'KITCHEN', description: 'Kitchen Staff' }
    });
    roleMap['KITCHEN'] = newRole.id;
  }

  for (const cred of DEMO_CREDENTIALS) {
    console.log(`Ensuring user ${cred.email} exists...`);
    const hashedPassword = await bcrypt.hash(cred.password, 12);
    const roleId = roleMap[cred.systemRole] || roleMap['HOUSEKEEPING']; // safe fallback

    // Upsert the user
    const user = await prisma.user.upsert({
      where: { email: cred.email },
      update: {
        password: hashedPassword,
        roleId: roleId
      },
      create: {
        id: faker.string.uuid(),
        email: cred.email,
        name: cred.role,
        password: hashedPassword,
        roleId: roleId
      }
    });

    // If it's a staff member, make sure they have an Employee record
    if (cred.systemRole !== 'GUEST') {
      const existingEmp = await prisma.employee.findFirst({ where: { userId: user.id } });
      if (!existingEmp) {
        await prisma.employee.create({
          data: {
            id: faker.string.uuid(),
            userId: user.id,
            firstName: cred.role,
            lastName: 'Staff',
            email: cred.email,
            department: cred.systemRole,
            position: cred.role,
            baseSalary: 50000,
            hireDate: new Date(),
            status: 'ACTIVE'
          }
        });
      }
    }
  }

  console.log('Demo credentials seeded successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
