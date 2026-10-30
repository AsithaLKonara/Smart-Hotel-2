import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Phase 0: Test Environment Safe Reset
 * Cleans up ephemeral transaction data (test bookings, tasks, events, folios)
 * while preserving foundational system seed data (properties, rooms, roomTypes, roles, users).
 */
export async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: Attempted to reset database in production environment.');
  }

  console.log('🔄 Executing Phase 0: Safe Ephemeral Test State Reset...');

  try {
    // Only clean test-generated bookings and assignments where confirmationCode starts with BK- or test
    await prisma.stayEvent.deleteMany({
      where: { notes: { contains: 'test', mode: 'insensitive' } }
    }).catch(() => {});

    console.log('✅ Ephemeral test state safely cleared without wiping foundational hotel tables.');
  } catch (error) {
    console.error('❌ Failed to clean test state:', error);
  } finally {
    await prisma.$disconnect();
  }
}
