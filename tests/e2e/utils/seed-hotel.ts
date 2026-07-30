import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Phase 0: Test Environment Certification
 * Seeds a deterministic 100-room hotel for the E2E environment.
 */
export async function seedTestHotel() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: Attempted to seed test data in production environment.');
  }

  console.log('🌱 Executing Phase 0: Seeding Deterministic Hotel State...');

  try {
    // 1. Seed RBAC Users (Super Admin, Manager, Reception, Staff, Guest)
    const password = await hash('EnterpriseTest123!', 10);
    
    const property = await prisma.property.findFirst() || await prisma.property.create({ data: { name: 'Test Hotel', code: 'TEST', address: '123 Test', city: 'Test City', country: 'Test Country' } });
    const roles = await prisma.role.findMany();
    const getRoleId = (name: string) => roles.find((r: any) => r.name === name)?.id || undefined;
    
    await prisma.user.createMany({
      data: [
        { name: 'Admin', email: 'admin@smarthotel.local', password, roleId: getRoleId('SUPER_ADMIN'), propertyId: property.id },
        { name: 'Manager', email: 'manager@smarthotel.local', password, roleId: getRoleId('MANAGER'), propertyId: property.id },
        { name: 'Reception', email: 'reception@smarthotel.local', password, roleId: getRoleId('RECEPTIONIST'), propertyId: property.id },
        { name: 'Staff', email: 'staff@smarthotel.local', password, roleId: getRoleId('STAFF'), propertyId: property.id },
        { name: 'Guest', email: 'guest@smarthotel.local', password, roleId: getRoleId('GUEST'), propertyId: property.id }
      ]
    });

    // 2. Seed Tax Rules
    // Removed because TaxRule does not exist in schema

    // 3. Seed Room Types & Rooms (100 total across 4 floors)
    const stdType = await prisma.roomType.create({
      data: { name: 'Standard King', baseRate: 150.00, capacity: 2, description: 'Standard King' }
    });

    const roomsToInsert = [];
    for (let floor = 1; floor <= 4; floor++) {
      for (let num = 1; num <= 25; num++) {
        roomsToInsert.push({
          number: `${floor}${(num < 10 ? '0' : '')}${num}`,
          floor: floor,
          roomTypeId: stdType.id,
          propertyId: property.id,
          status: 'AVAILABLE' as any
        });
      }
    }
    await prisma.room.createMany({ data: roomsToInsert });

    // 4. Seed Inventory (50 Products)
    const productsToInsert = [];
    for (let i = 1; i <= 50; i++) {
      productsToInsert.push({
        name: `Test Product ${i}`,
        category: 'Linens',
        minQuantity: 20,
        unit: 'PIECE'
      });
    }
    await prisma.inventory.createMany({ data: productsToInsert });

    console.log('✅ Deterministic Test Hotel seeded successfully.');
  } catch (error) {
    console.error('❌ Failed to seed test hotel:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
