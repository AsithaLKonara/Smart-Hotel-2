#!/usr/bin/env node

/**
 * Debug PostgreSQL Connection Issues
 * Comprehensive test to identify database connection problems
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const { PrismaClient } = require('@prisma/client')
  
async function testPrismaConnection() {
  console.log('🔌 Testing Prisma Connection...')
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })
  
  try {
    console.log('⏰ Starting Prisma connection (with 10s timeout)...')
    
    // Set connection timeout
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Prisma connection timeout after 10 seconds')), 10000)
      )
    ])
    
    console.log('✅ Prisma connection successful!')
    
    // Test database operations
    console.log('🔍 Testing database operations...')
    
    // Test user count
    const userCount = await prisma.user.count()
    console.log(`👥 Users in database: ${userCount}`)
    
    // Test room count
    const roomCount = await prisma.room.count()
    console.log(`🏨 Rooms in database: ${roomCount}`)
    
    // Test menu count
    const menuCount = await prisma.foodMenu.count()
    console.log(`🍽️ Menu items in database: ${menuCount}`)
    
    console.log('🎉 Prisma test completed successfully!')
    
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message)
    console.error('🔍 Error details:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function testNetworkConnectivity() {
  console.log('\n🌐 Testing Network Connectivity...')
  
  const { exec } = require('child_process')
  const { promisify } = require('util')
  const execAsync = promisify(exec)
  
  const connectionString = process.env.DATABASE_URL || ''
  let host = 'localhost'
  
  try {
    if (connectionString) {
      const match = connectionString.match(/@([^/\s?]+)/)
      if (match && match[1]) {
        host = match[1]
      }
    }
    
    // Test DNS resolution
    console.log(`🔍 Testing DNS resolution for ${host}...`)
    await execAsync(`nslookup ${host}`)
    console.log('✅ DNS resolution successful')
    
    // Test ping
    console.log(`🏓 Testing ping to Database host: ${host}...`)
    await execAsync(`ping -c 3 ${host}`)
    console.log('✅ Ping successful')
    
  } catch (error) {
    console.error('❌ Network connectivity test failed:', error.message)
  }
}

async function main() {
  console.log('🚀 SmartHotel Database Connection Debug Tool')
  console.log('=' .repeat(50))
  
  try {
    // Test network connectivity first
    await testNetworkConnectivity()
    
    // Test Prisma connection
    await testPrismaConnection()
    
    console.log('\n🎉 All database connection tests passed!')
    console.log('✅ Database is working correctly')
    
  } catch (error) {
    console.error('\n💥 Database connection test failed!')
    console.error('🔧 Troubleshooting suggestions:')
    
    if (error.message.includes('authentication') || error.message.includes('password')) {
      console.error('🔑 Authentication failed - Check database username/password')
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      console.error('🌐 Network issue - Check internet connection and database provider IP whitelist')
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🔍 DNS resolution failed - Check database host URL')
    } else {
      console.error('🔧 Unknown error - Check database provider status')
    }
    
    console.error('\n📋 Next steps:')
    console.error('1. Verify database is running')
    console.error('2. Check IP whitelist in provider dashboard (add 0.0.0.0/0 for testing)')
    console.error('3. Verify database user has correct permissions')
    console.error('4. Check connection string format')
    
    process.exit(1)
  }
}

main()
