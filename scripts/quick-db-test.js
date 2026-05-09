#!/usr/bin/env node

/**
 * Quick Database Connection Test
 * Run this after configuring MongoDB Atlas IP whitelist
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const { PrismaClient } = require('@prisma/client')

async function quickTest() {
  console.log('🚀 Quick Database Connection Test')
  console.log('=' .repeat(35))
  
  const prisma = new PrismaClient()
  
  try {
    console.log('⏰ Connecting to database...')
    await prisma.$connect()
    console.log('✅ Connection successful!')
    
    // Quick tests
    const userCount = await prisma.user.count()
    const roomCount = await prisma.room.count()
    const menuCount = await prisma.foodMenu.count()
    
    console.log(`👥 Users: ${userCount}`)
    console.log(`🏨 Rooms: ${roomCount}`)
    console.log(`🍽️ Menu items: ${menuCount}`)
    
    if (userCount === 0) {
      console.log('\n📝 Database is empty. Run seeding:')
      console.log('npm run db:seed:production')
    } else {
      console.log('\n✅ Database is populated and ready!')
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    
    if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
      console.error('\n🔧 IP Whitelist Issue:')
      console.error('1. Go to MongoDB Atlas → Security → Network Access')
      console.error('2. Add IP: 0.0.0.0/0 (allow all IPs)')
      console.error('3. Wait 2-3 minutes for changes to propagate')
      console.error('4. Run this test again')
    }
  } finally {
    await prisma.$disconnect()
  }
}

quickTest()
