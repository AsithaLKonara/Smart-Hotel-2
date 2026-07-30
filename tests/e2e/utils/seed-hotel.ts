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
    
    await prisma.user.createMany({
      data: [
        { name: 'Admin', email: 'admin@smarthotel.local', password, role: 'SUPER_ADMIN' },
        { name: 'Manager', email: 'manager@smarthotel.local', password, role: 'MANAGER' },
        { name: 'Reception', email: 'reception@smarthotel.local', password, role: 'RECEPTIONIST' },
        { name: 'Staff', email: 'staff@smarthotel.local', password, role: 'STAFF' },
        { name: 'Guest', email: 'guest@smarthotel.local', password, role: 'GUEST' }
      ]
    });

    // 2. Seed Tax Rules
    await prisma.taxRule.create({
      data: { name: 'Standard VAT', rate: 15.00, type: 'PERCENTAGE', applicableTo: ['ROOM', 'F_AND_B'] }
    });

    // 3. Seed Room Types & Rooms (100 total across 4 floors)
    const stdType = await prisma.roomType.create({
      data: { name: 'Standard King', code: 'STD-K', basePrice: 150.00, capacity: 2 }
    });

    const roomsToInsert = [];
    for (let floor = 1; floor <= 4; floor++) {
      for (let num = 1; num <= 25; num++) {
        roomsToInsert.push({
          number: `${floor}${(num < 10 ? '0' : '')}${num}`,
          floor: floor,
          roomTypeId: stdType.id,
          status: 'AVAILABLE'
        });
      }
    }
    await prisma.room.createMany({ data: roomsToInsert });

    // 4. Seed Inventory (50 Products)
    const category = await prisma.inventoryCategory.create({
      data: { name: 'Linens', type: 'HOUSEKEEPING' }
    });

    const productsToInsert = [];
    for (let i = 1; i <= 50; i++) {
      productsToInsert.push({
        sku: `ITEM-${i}`,
        name: `Test Product ${i}`,
        categoryId: category.id,
        currentStock: 100,
        minStock: 20,
        unit: 'PIECE'
      });
    }
    await prisma.inventoryItem.createMany({ data: productsToInsert });

    console.log('✅ Deterministic Test Hotel seeded successfully.');
  } catch (error) {
    console.error('❌ Failed to seed test hotel:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
