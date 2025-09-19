import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🔌 Testing database connection from Vercel...')
    
    // Set a timeout for the database operation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 10000)
    )
    
    const dbPromise = prisma.$connect()
    
    await Promise.race([dbPromise, timeoutPromise])
    
    // Test basic operations
    const userCount = await prisma.user.count()
    const roomCount = await prisma.room.count()
    const menuCount = await prisma.foodMenu.count()
    
    await prisma.$disconnect()
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        users: userCount,
        rooms: roomCount,
        menuItems: menuCount,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    
    await prisma.$disconnect()
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
