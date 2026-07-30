import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Phase 0: Test Environment Certification
 * Purges the entire test database to guarantee total isolation between E2E test suites.
 */
export async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: Attempted to reset database in production environment.');
  }

  console.log('🔄 Executing Phase 0: Database State Reset...');

  try {
    // We execute a raw TRUNCATE to forcefully wipe all data while cascading foreign keys.
    // This is significantly faster than using Prisma's deleteMany() sequentially.
    await prisma.$executeRawUnsafe(`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations') LOOP
              EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
      END $$;
    `);
    
    console.log('✅ Database securely truncated.');
  } catch (error) {
    console.error('❌ Failed to reset database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
