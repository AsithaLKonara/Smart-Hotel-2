#!/usr/bin/env node

/**
 * Test MongoDB Atlas Connection
 * Simple script to test the database connection
 */

const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  console.log('🔌 Testing MongoDB Atlas Connection...')
  
  const prisma = new PrismaClient()
  
  try {
    // Test basic connection
    console.log('📡 Attempting to connect to MongoDB...')
    await prisma.$connect()
    console.log('✅ Successfully connected to MongoDB Atlas!')
    
    // Test a simple query
    console.log('🔍 Testing database query...')
    const userCount = await prisma.user.count()
    console.log(`📊 Found ${userCount} users in database`)
    
    // Test if we can create a simple record
    console.log('✍️ Testing write operation...')
    const testSetting = await prisma.setting.upsert({
      where: { key: 'connection_test' },
      update: { value: new Date().toISOString() },
      create: { key: 'connection_test', value: new Date().toISOString() }
    })
    console.log('✅ Write operation successful!')
    
    console.log('🎉 Database connection test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    
    if (error.message.includes('authentication')) {
      console.error('🔑 Authentication failed. Please check your MongoDB credentials.')
    } else if (error.message.includes('network')) {
      console.error('🌐 Network error. Please check your internet connection and MongoDB Atlas settings.')
    } else if (error.message.includes('timeout')) {
      console.error('⏰ Connection timeout. Please check your MongoDB Atlas cluster settings.')
    } else {
      console.error('🔧 Unknown error. Please check your connection string and database settings.')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
