import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { isDatabaseConfigured } from '@/lib/db-helpers'

interface TestResult {
  name: string
  status: 'success' | 'failed' | 'skipped'
  duration: number
  error?: string
  data?: any
}

interface CollectionTest {
  name: string
  count: number
  sample?: any
  error?: string
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const results: TestResult[] = []
  const collectionTests: CollectionTest[] = []

  // Check if database is configured
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message: 'DATABASE_URL is not configured',
        error: 'Database connection string is missing',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }

  try {
    // Test 1: Prisma Client Connection
    const test1Start = Date.now()
    try {
      await prisma.$connect()
      results.push({
        name: 'Prisma Client Connection',
        status: 'success',
        duration: Date.now() - test1Start,
      })
    } catch (error: any) {
      results.push({
        name: 'Prisma Client Connection',
        status: 'failed',
        duration: Date.now() - test1Start,
        error: error.message,
      })
      throw error // Stop if connection fails
    }

    // Test 2: Database Ping
    const test2Start = Date.now()
    try {
      await prisma.$runCommandRaw({ ping: 1 })
      results.push({
        name: 'Database Ping',
        status: 'success',
        duration: Date.now() - test2Start,
      })
    } catch (error: any) {
      results.push({
        name: 'Database Ping',
        status: 'failed',
        duration: Date.now() - test2Start,
        error: error.message,
      })
    }

    // Test 3: Test All Collections/Models
    const models = [
      { name: 'User', model: prisma.user },
      { name: 'Room', model: prisma.room },
      { name: 'Booking', model: prisma.booking },
      { name: 'FoodMenu', model: prisma.foodMenu },
      { name: 'FoodOrder', model: prisma.foodOrder },
      { name: 'Staff', model: prisma.staff },
      { name: 'Task', model: prisma.task },
      { name: 'Inventory', model: prisma.inventory },
      { name: 'Gallery', model: prisma.gallery },
      { name: 'Setting', model: prisma.setting },
    ]

    for (const { name, model } of models) {
      const testStart = Date.now()
      try {
        const count = await (model as any).count()
        const sample = count > 0 
          ? await (model as any).findFirst().catch(() => null)
          : null

        collectionTests.push({
          name,
          count,
          sample: sample ? {
            id: sample.id,
            ...(sample.name && { name: sample.name }),
            ...(sample.email && { email: sample.email }),
            ...(sample.number && { number: sample.number }),
            ...(sample.title && { title: sample.title }),
            ...(sample.key && { key: sample.key }),
          } : null,
        })

        results.push({
          name: `Collection: ${name}`,
          status: 'success',
          duration: Date.now() - testStart,
          data: { count, hasData: count > 0 },
        })
      } catch (error: any) {
        collectionTests.push({
          name,
          count: 0,
          error: error.message,
        })

        results.push({
          name: `Collection: ${name}`,
          status: 'failed',
          duration: Date.now() - testStart,
          error: error.message,
        })
      }
    }

    // Test 4: Complex Query Test
    const test4Start = Date.now()
    try {
      // Test a join-like query (fetch booking with related data)
      const bookings = await prisma.booking.findMany({
        take: 1,
        orderBy: { createdAt: 'desc' },
      })

      if (bookings.length > 0) {
        const booking = bookings[0]
        // Fetch related data separately (since relations aren't defined)
        const [room, user] = await Promise.all([
          prisma.room.findFirst({ where: { id: booking.roomId } }).catch(() => null),
          prisma.user.findFirst({ where: { id: booking.userId } }).catch(() => null),
        ])

        results.push({
          name: 'Complex Query (Booking with Relations)',
          status: 'success',
          duration: Date.now() - test4Start,
          data: {
            bookingId: booking.id,
            hasRoom: !!room,
            hasUser: !!user,
          },
        })
      } else {
        results.push({
          name: 'Complex Query (Booking with Relations)',
          status: 'skipped',
          duration: Date.now() - test4Start,
          data: { message: 'No bookings found to test' },
        })
      }
    } catch (error: any) {
      results.push({
        name: 'Complex Query (Booking with Relations)',
        status: 'failed',
        duration: Date.now() - test4Start,
        error: error.message,
      })
    }

    // Test 5: Write Test (if possible)
    const test5Start = Date.now()
    try {
      // Try to read a setting (safe read operation)
      const settings = await prisma.setting.findMany({ take: 1 })
      results.push({
        name: 'Read Operation Test',
        status: 'success',
        duration: Date.now() - test5Start,
        data: { settingsFound: settings.length },
      })
    } catch (error: any) {
      results.push({
        name: 'Read Operation Test',
        status: 'failed',
        duration: Date.now() - test5Start,
        error: error.message,
      })
    }

    // Test 6: Aggregation Test
    const test6Start = Date.now()
    try {
      const stats = {
        totalUsers: await prisma.user.count().catch(() => 0),
        totalRooms: await prisma.room.count().catch(() => 0),
        totalBookings: await prisma.booking.count().catch(() => 0),
        totalMenuItems: await prisma.foodMenu.count().catch(() => 0),
        totalStaff: await prisma.staff.count().catch(() => 0),
        totalTasks: await prisma.task.count().catch(() => 0),
        totalInventory: await prisma.inventory.count().catch(() => 0),
        totalGallery: await prisma.gallery.count().catch(() => 0),
        totalSettings: await prisma.setting.count().catch(() => 0),
      }

      results.push({
        name: 'Database Statistics',
        status: 'success',
        duration: Date.now() - test6Start,
        data: stats,
      })
    } catch (error: any) {
      results.push({
        name: 'Database Statistics',
        status: 'failed',
        duration: Date.now() - test6Start,
        error: error.message,
      })
    }

    // Test 7: Connection Pool Test
    const test7Start = Date.now()
    try {
      // Test multiple concurrent queries
      const concurrentQueries = await Promise.all([
        prisma.user.count(),
        prisma.room.count(),
        prisma.booking.count(),
      ])

      results.push({
        name: 'Concurrent Queries Test',
        status: 'success',
        duration: Date.now() - test7Start,
        data: {
          queriesExecuted: concurrentQueries.length,
          results: concurrentQueries,
        },
      })
    } catch (error: any) {
      results.push({
        name: 'Concurrent Queries Test',
        status: 'failed',
        duration: Date.now() - test7Start,
        error: error.message,
      })
    }

    // Calculate summary
    const totalDuration = Date.now() - startTime
    const successfulTests = results.filter(r => r.status === 'success').length
    const failedTests = results.filter(r => r.status === 'failed').length
    const skippedTests = results.filter(r => r.status === 'skipped').length

    const response = {
      success: failedTests === 0,
      message: failedTests === 0 
        ? 'All database tests passed successfully'
        : `${failedTests} test(s) failed`,
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: results.length,
        successful: successfulTests,
        failed: failedTests,
        skipped: skippedTests,
        totalDuration: `${totalDuration}ms`,
      },
      collections: collectionTests,
      tests: results,
      databaseInfo: {
        connectionString: process.env.DATABASE_URL 
          ? process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@')
          : 'NOT SET',
        databaseName: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'unknown',
      },
    }

    return NextResponse.json(response, {
      status: failedTests === 0 ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })

  } catch (error: any) {
    const totalDuration = Date.now() - startTime

    return NextResponse.json(
      {
        success: false,
        message: 'Database connection test failed',
        error: error.message,
        errorType: error.constructor.name,
        timestamp: new Date().toISOString(),
        summary: {
          totalTests: results.length,
          successful: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'failed').length + 1,
          skipped: results.filter(r => r.status === 'skipped').length,
          totalDuration: `${totalDuration}ms`,
        },
        tests: results,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  } finally {
    try {
      await prisma.$disconnect()
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

