#!/usr/bin/env node

/**
 * Debug MongoDB Atlas Connection Issues
 * Comprehensive test to identify database connection problems
 */

const { PrismaClient } = require('@prisma/client')
const { MongoClient } = require('mongodb')

async function testMongoDirect() {
  console.log('🔌 Testing Direct MongoDB Connection...')
  
  const connectionString = process.env.DATABASE_URL || "mongodb+srv://asviaai2025_db_user:1234@cluster0.1tpj8te.mongodb.net/smarthotel?retryWrites=true&w=majority"
  
  console.log('📡 Connection String:', connectionString.replace(/\/\/.*@/, '//***:***@'))
  
  const client = new MongoClient(connectionString)
  
  try {
    console.log('⏰ Starting connection (with 10s timeout)...')
    
    // Set connection timeout
    await Promise.race([
      client.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      )
    ])
    
    console.log('✅ Direct MongoDB connection successful!')
    
    // Test database access
    const db = client.db('smarthotel')
    console.log('📊 Testing database access...')
    
    // Test collections
    const collections = await db.listCollections().toArray()
    console.log('📁 Available collections:', collections.map(c => c.name))
    
    // Test a simple operation
    const result = await db.collection('users').countDocuments()
    console.log(`👥 User count: ${result}`)
    
    await client.close()
    console.log('🎉 Direct MongoDB test completed successfully!')
    
  } catch (error) {
    console.error('❌ Direct MongoDB connection failed:', error.message)
    console.error('🔍 Error details:', error)
    await client.close()
    throw error
  }
}

async function testPrismaConnection() {
  console.log('\n🔌 Testing Prisma Connection...')
  
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
  
  try {
    // Test DNS resolution
    console.log('🔍 Testing DNS resolution...')
    const dnsResult = await execAsync('nslookup cluster0.1tpj8te.mongodb.net')
    console.log('✅ DNS resolution successful')
    
    // Test ping
    console.log('🏓 Testing ping to MongoDB cluster...')
    const pingResult = await execAsync('ping -c 3 cluster0.1tpj8te.mongodb.net')
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
    
    // Test direct MongoDB connection
    await testMongoDirect()
    
    // Test Prisma connection
    await testPrismaConnection()
    
    console.log('\n🎉 All database connection tests passed!')
    console.log('✅ Database is working correctly')
    
  } catch (error) {
    console.error('\n💥 Database connection test failed!')
    console.error('🔧 Troubleshooting suggestions:')
    
    if (error.message.includes('authentication')) {
      console.error('🔑 Authentication failed - Check MongoDB username/password')
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      console.error('🌐 Network issue - Check internet connection and MongoDB Atlas IP whitelist')
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🔍 DNS resolution failed - Check MongoDB cluster URL')
    } else {
      console.error('🔧 Unknown error - Check MongoDB Atlas cluster status')
    }
    
    console.error('\n📋 Next steps:')
    console.error('1. Verify MongoDB Atlas cluster is running')
    console.error('2. Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for testing)')
    console.error('3. Verify database user has correct permissions')
    console.error('4. Check connection string format')
    
    process.exit(1)
  }
}

main()
