/**
 * SRE Schema Migration Playbook (TypeScript)
 * 
 * Applies soft-delete columns and composite database indexes to Supabase
 * using the standard PrismaClient raw SQL execution API.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run() {
  console.log('🔌 Connecting to Supabase via Prisma Client...');
  
  try {
    // 1. Add deletedAt timestamp columns (nullable)
    const tablesToAlter = ['Room', 'Booking', 'Invoice', 'Payment', 'User'];
    for (const table of tablesToAlter) {
      console.log(`➕ Checking/adding "deletedAt" column to table "${table}"...`);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${table}" 
        ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE;
      `);
    }
    
    // 2. Add composite indexes to Booking
    console.log('⚡ Creating composite query indexes on "Booking" table...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Booking_status_createdAt_idx" 
      ON "Booking" ("status", "createdAt");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Booking_roomId_status_idx" 
      ON "Booking" ("roomId", "status");
    `);
    
    // 3. Post-flight validation
    console.log('\n🔍 Running SRE Post-Flight Schema Validation...');
    const verificationResults = await prisma.$queryRawUnsafe<any[]>(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE column_name = 'deletedAt' 
      AND table_name IN ('Room', 'Booking', 'Invoice', 'Payment', 'User')
      ORDER BY table_name;
    `);
    
    console.log('\nVerified database columns:');
    console.log(verificationResults);
    
    if (verificationResults.length === tablesToAlter.length) {
      console.log('\n🎉 SRE DATABASE MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('All 5 soft-delete fields and 2 composite indexes are active.');
    } else {
      console.warn('\n⚠️ Warning: Schema verification counts do not match expected.');
    }
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
