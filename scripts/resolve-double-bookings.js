#!/usr/bin/env node

/**
 * SmartHotel OS — Double Booking SRE Resolution Engine
 * Programmatically reassigns overlapping seeded bookings to vacant alternative rooms of the same type,
 * or marks them CANCELLED to restore 100% database calendar integrity.
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

async function resolveDoubleBookings() {
  console.log('🧹 SmartHotel OS — Double Booking SRE Resolution Engine\n')
  console.log('=' .repeat(60))

  try {
    await prisma.$connect()
    console.log('✅ Connected to Supabase PostgreSQL cluster successfully.\n')

    // Find all active bookings
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT']
        }
      },
      include: {
        room: {
          include: {
            roomType: true
          }
        }
      },
      orderBy: { checkIn: 'asc' }
    })

    console.log(`⚙️ Auditing calendar schedules across ${activeBookings.length} bookings...`)

    let resolvedCount = 0

    for (let i = 0; i < activeBookings.length; i++) {
      for (let j = i + 1; j < activeBookings.length; j++) {
        const b1 = activeBookings[i]
        const b2 = activeBookings[j]

        // If they share the same room and their dates overlap
        if (b1.roomId === b2.roomId && b1.status !== 'CANCELLED' && b2.status !== 'CANCELLED') {
          const checkIn1 = new Date(b1.checkIn).getTime()
          const checkOut1 = new Date(b1.checkOut).getTime()
          const checkIn2 = new Date(b2.checkIn).getTime()
          const checkOut2 = new Date(b2.checkOut).getTime()

          if (checkIn1 < checkOut2 && checkOut1 > checkIn2) {
            console.log(`\n⚠️ COLLISION DETECTED on Room "${b1.room.number}":`)
            console.log(`   - Booking 1: ${b1.confirmationCode} (${b1.checkIn.toISOString().split('T')[0]} to ${b1.checkOut.toISOString().split('T')[0]})`)
            console.log(`   - Booking 2: ${b2.confirmationCode} (${b2.checkIn.toISOString().split('T')[0]} to ${b2.checkOut.toISOString().split('T')[0]})`)

            // Attempt to reassign Booking 2 to an empty room of the same RoomType
            const targetRoomTypeId = b1.room.roomTypeId
            const candidateRooms = await prisma.room.findMany({
              where: {
                roomTypeId: targetRoomTypeId,
                id: { not: b1.roomId }
              }
            })

            let foundAlternative = false

            for (const candidate of candidateRooms) {
              // Check if candidate room is vacant during Booking 2 dates
              const candidateBookings = await prisma.booking.findMany({
                where: {
                  roomId: candidate.id,
                  status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
                  NOT: { id: b2.id }
                }
              })

              let vacant = true
              for (const cb of candidateBookings) {
                const cbIn = new Date(cb.checkIn).getTime()
                const cbOut = new Date(cb.checkOut).getTime()
                if (checkIn2 < cbOut && checkOut2 > cbIn) {
                  vacant = false
                  break
                }
              }

              if (vacant) {
                // Reassign Booking 2 to candidate room
                await prisma.booking.update({
                  where: { id: b2.id },
                  data: { roomId: candidate.id }
                })
                console.log(`   ➔ RESOLUTION: Reassigned Booking "${b2.confirmationCode}" to Room "${candidate.number}" (Vacant upgrade).`)
                b2.roomId = candidate.id // Update reference in our running memory array
                resolvedCount++
                foundAlternative = true
                break
              }
            }

            if (!foundAlternative) {
              // If no alternative room exists, mark Booking 2 as CANCELLED
              await prisma.booking.update({
                where: { id: b2.id },
                data: { status: 'CANCELLED' }
              })
              console.log(`   ➔ RESOLUTION: No vacant alternatives. Marked Booking "${b2.confirmationCode}" as CANCELLED.`)
              b2.status = 'CANCELLED' // Update reference in memory
              resolvedCount++
            }
          }
        }
      }
    }

    console.log('\n' + '=' .repeat(60))
    console.log(`🎉 Calendar Stabilization completed! Resolved ${resolvedCount} booking overlaps.`)
    console.log('=' .repeat(60))

  } catch (err) {
    console.error('\n❌ Double Booking Resolution failed:', err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resolveDoubleBookings()
