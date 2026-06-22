#!/usr/bin/env node

/**
 * Simple Database Indexes Application
 * 
 * Applies indexes using DATABASE_URL from environment or manual input
 */

const { execSync } = require('child_process')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('🚀 Apply Database Indexes to Production\n')

  // Check for DATABASE_URL in environment
  let databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.log('📝 DATABASE_URL not found in environment.\n')
    console.log('Options:')
    console.log('1. Set DATABASE_URL environment variable')
    console.log('2. Enter it manually (will not be saved)\n')
    
    const choice = await question('Choose option (1 or 2): ')
    
    if (choice === '2') {
      databaseUrl = await question('\nEnter DATABASE_URL (hidden): ')
      if (!databaseUrl) {
        console.error('❌ DATABASE_URL is required')
        rl.close()
        process.exit(1)
      }
    } else {
      console.log('\n💡 To set DATABASE_URL:')
      console.log('   export DATABASE_URL="mongodb+srv://..."')
      console.log('   Then run this script again\n')
      rl.close()
      process.exit(1)
    }
  }

  console.log('\n✅ DATABASE_URL found')
  console.log('📦 Generating Prisma Client...\n')

  try {
    // Generate Prisma Client
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma Client generated\n')
  } catch (error) {
    console.error('❌ Error generating Prisma Client')
    rl.close()
    process.exit(1)
  }

  console.log('📊 Applying indexes to database...')
  console.log('   ⚠️  This will create indexes on your database')
  console.log('   ⚠️  Safe operation - no data will be modified\n')

  const confirm = await question('Continue? (yes/no): ')
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Cancelled')
    rl.close()
    process.exit(0)
  }

  try {
    // Apply indexes
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl
      }
    })
    
    console.log('\n✅ Indexes applied successfully!')
    console.log('\n📊 Indexes created:')
    console.log('   ✅ Booking: status, checkIn, checkOut, userId, roomId, createdAt')
    console.log('   ✅ Room: status, type, price, number, createdAt')
    console.log('   ✅ User: email, role, createdAt')
    console.log('   ✅ FoodOrder: status, guestId, roomNumber, createdAt')
    console.log('   ✅ Task: status, assignedTo, priority, dueDate, createdAt')
    console.log('\n📈 Performance improvements should be visible immediately!')
    
  } catch (error) {
    console.error('\n❌ Error applying indexes:', error.message)
    console.log('\n💡 Troubleshooting:')
    console.log('   1. Verify DATABASE_URL is correct')
    console.log('   2. Check database connection')
    console.log('   3. Ensure database user has write permissions')
    console.log('   4. Check MongoDB Atlas network access\n')
    rl.close()
    process.exit(1)
  }

  rl.close()
}

main()

