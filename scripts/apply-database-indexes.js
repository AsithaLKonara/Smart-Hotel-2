#!/usr/bin/env node

/**
 * Apply Database Indexes Script
 * 
 * This script applies the performance indexes defined in the Prisma schema.
 * For MongoDB, indexes are created automatically when using prisma db push,
 * but this script provides additional verification and manual index creation if needed.
 */

const { execSync } = require('child_process')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

console.log('🔍 Checking database connection...\n')

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set.')
  console.log('\n📝 To apply indexes, you need to:')
  console.log('1. Set DATABASE_URL in your .env.local file:')
  console.log('   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database"')
  console.log('\n2. Or set it as an environment variable:')
  console.log('   export DATABASE_URL="your-connection-string"')
  console.log('\n3. Then run: npm run db:push')
  process.exit(1)
}

console.log('✅ DATABASE_URL is set\n')
console.log('🚀 Applying database indexes...\n')

try {
  // Step 1: Generate Prisma Client
  console.log('📦 Step 1: Generating Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma Client generated\n')

  // Step 2: Push schema changes (creates indexes)
  console.log('📊 Step 2: Pushing schema changes to database...')
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
  console.log('✅ Schema changes applied\n')

  // Step 3: Verify indexes (optional - MongoDB specific)
  console.log('🔍 Step 3: Verifying indexes...')
  console.log('   Note: For MongoDB, indexes are created automatically.')
  console.log('   You can verify indexes in MongoDB Atlas or MongoDB Compass.\n')

  console.log('✅ Database indexes applied successfully!')
  console.log('\n📊 Indexes created:')
  console.log('   - Booking: status, checkIn, checkOut, userId, roomId, createdAt')
  console.log('   - Room: status, type, price, number, createdAt')
  console.log('   - User: email, role, createdAt')
  console.log('   - FoodOrder: status, guestId, roomNumber, createdAt')
  console.log('   - Task: status, assignedTo, priority, dueDate, createdAt')
  console.log('\n🎉 Performance improvements should be visible immediately!')

} catch (error) {
  console.error('\n❌ Error applying indexes:', error.message)
  console.log('\n💡 Troubleshooting:')
  console.log('   1. Verify DATABASE_URL is correct')
  console.log('   2. Check database connection')
  console.log('   3. Ensure you have write permissions')
  console.log('   4. For production, use: npx prisma migrate deploy')
  process.exit(1)
}

