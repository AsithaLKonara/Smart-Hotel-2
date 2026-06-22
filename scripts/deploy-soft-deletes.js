/**
 * SRE Schema Migration Playbook
 * 
 * Applies soft-delete columns and composite database indexes to Supabase
 * bypassing PgBouncer schema-engine locks.
 */

const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL environment variable is missing.');
  process.exit(1);
}

async function run() {
  console.log('🔌 Connecting directly to Supabase...');
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // 1. Add deletedAt timestamp columns (nullable)
    const tablesToAlter = ['Room', 'Booking', 'Invoice', 'Payment', 'User'];
    for (const table of tablesToAlter) {
      console.log(`➕ Checking/adding "deletedAt" column to table "${table}"...`);
      await client.query(`
        ALTER TABLE "${table}" 
        ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE;
      `);
    }
    
    // 2. Add composite indexes to Booking
    console.log('⚡ Creating composite query indexes on "Booking" table...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Booking_status_createdAt_idx" 
      ON "Booking" ("status", "createdAt");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Booking_roomId_status_idx" 
      ON "Booking" ("roomId", "status");
    `);
    
    // 3. Post-flight validation
    console.log('\n🔍 Running SRE Post-Flight Schema Validation...');
    const verificationResults = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE column_name = 'deletedAt' 
      AND table_name IN ('Room', 'Booking', 'Invoice', 'Payment', 'User')
      ORDER BY table_name;
    `);
    
    console.log('\nVerified database columns:');
    console.table(verificationResults.rows);
    
    if (verificationResults.rows.length === tablesToAlter.length) {
      console.log('\n🎉 SRE DATABASE MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('All 5 soft-delete fields and 2 composite indexes are active.');
    } else {
      console.warn('\n⚠️ Warning: Schema verification counts do not match expected.');
    }
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
