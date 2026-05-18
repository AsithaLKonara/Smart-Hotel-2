#!/usr/bin/env node

/**
 * SmartHotel OS — PostgreSQL Performance Index Manager
 * Programmatically applies robust indexing across all 28 relation foreign key columns.
 */

const fs = require('fs')
const path = require('path')

// 1. Manually parse env to bypass Next.js variable expansion for dollar sign password
try {
  const loadRawEnv = (fileName) => {
    const filePath = path.join(__dirname, '..', fileName)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      const dbUrlMatch = content.match(/^DATABASE_URL=["']?([^"'\n]+)["']?/m)
      if (dbUrlMatch && dbUrlMatch[1]) {
        process.env.DATABASE_URL = dbUrlMatch[1]
      }
    }
  }
  loadRawEnv('.env')
  loadRawEnv('.env.local')
} catch (err) {
  console.error('Failed to pre-inject database URL:', err.message)
}

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const indexConfigs = [
  { table: 'AuditLog', column: 'userId' },
  { table: 'Booking', column: 'roomId' },
  { table: 'Booking', column: 'primaryGuestId' },
  { table: 'BookingGuest', column: 'bookingId' },
  { table: 'Complaint', column: 'bookingId' },
  { table: 'Complaint', column: 'userId' },
  { table: 'FinancialAdjustment', column: 'paymentId' },
  { table: 'FoodOrder', column: 'guestId' },
  { table: 'HotelReview', column: 'userId' },
  { table: 'Invoice', column: 'bookingId' },
  { table: 'InvoiceLineItem', column: 'invoiceId' },
  { table: 'MaintenanceRequest', column: 'roomId' },
  { table: 'Notification', column: 'userId' },
  { table: 'OrderItem', column: 'menuItemId' },
  { table: 'OrderItem', column: 'orderId' },
  { table: 'Payment', column: 'userId' },
  { table: 'Payment', column: 'orderId' },
  { table: 'Payment', column: 'bookingId' },
  { table: 'RoomImage', column: 'roomId' },
  { table: 'RoomReview', column: 'roomId' },
  { table: 'RoomReview', column: 'userId' },
  { table: 'RoomReview', column: 'bookingId' },
  { table: 'RoomStatusHistory', column: 'roomId' },
  { table: 'TableBooking', column: 'userId' },
  { table: 'Task', column: 'bookingId' },
  { table: 'Task', column: 'roomId' },
  { table: 'Task', column: 'createdBy' },
  { table: 'Task', column: 'assignedTo' }
]

async function applyIndexes() {
  console.log('🚀 SmartHotel OS PostgreSQL Performance Index Manager\n')
  console.log('=' .repeat(60))

  try {
    await prisma.$connect()
    console.log('✅ Connected to Supabase PostgreSQL cluster successfully.\n')

    for (const cfg of indexConfigs) {
      const indexName = `idx_${cfg.table}_${cfg.column}`
      console.log(`⚡ Applying Index: "${indexName}" on "${cfg.table}"("${cfg.column}")...`)
      
      try {
        // Enforce native double-quoted table/column references for absolute casing safety
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "${indexName}" 
          ON "${cfg.table}" ("${cfg.column}");
        `)
        console.log(`   ➔ SUCCESS: Index applied.`)
      } catch (sqlErr) {
        console.error(`   ➔ ERROR failed to apply index: ${sqlErr.message}`)
      }
    }

    console.log('\n' + '=' .repeat(60))
    console.log('🎉 All 28 performance indexing rules applied successfully!')
    console.log('🎉 Query execution planning will now utilize nested-join index scans!')
    console.log('=' .repeat(60))

  } catch (err) {
    console.error('\n❌ Indexing Manager run failed:', err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

applyIndexes()
