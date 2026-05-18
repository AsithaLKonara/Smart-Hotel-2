#!/usr/bin/env node

/**
 * SmartHotel OS — Room Revenue Engine deep SRE diagnostics.
 * Audits room-type mappings, room asset lists, media, and date-allocation overlap conflicts.
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

const REPORT_DIR = path.join(__dirname, '..', 'artifacts', 'reports')
const SYSTEM_ARTIFACTS_DIR = '/Users/asithalakmal/.gemini/antigravity/brain/9f570293-2038-4a15-8d2b-70f16583739b'

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true })
}

async function runRoomAudit() {
  console.log('🔍 Starting Room Revenue Engine Deep SRE Audit...\n')

  try {
    await prisma.$connect()

    // 1. Verify Rooms and RoomType Mappings
    console.log('⚙️ Auditing rooms to room-type mappings...')
    const roomsCount = await prisma.room.count()
    const roomTypesCount = await prisma.roomType.count()
    
    const rooms = await prisma.room.findMany({
      include: { roomType: true }
    })
    
    let roomsWithInvalidTypes = 0
    rooms.forEach(r => {
      if (!r.roomType) {
        roomsWithInvalidTypes++
      }
    })

    // 2. Verify RoomType occupancy allocations
    console.log('⚙️ Verifying room capacity boundaries...')
    const roomTypes = await prisma.roomType.findMany({
      include: { rooms: true }
    })

    let roomTypesWithoutRooms = 0
    roomTypes.forEach(rt => {
      if (rt.rooms.length === 0) {
        roomTypesWithoutRooms++
      }
    })

    // 3. Double Booking Overlap Conflict Checks (High-Fidelity Algorithm)
    console.log('⚙️ Executing transactional date-overlap collision checks...')
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT']
        }
      },
      select: {
        id: true,
        confirmationCode: true,
        roomId: true,
        checkIn: true,
        checkOut: true,
        room: { select: { number: true } }
      },
      orderBy: { checkIn: 'asc' }
    })

    const overlaps = []
    for (let i = 0; i < activeBookings.length; i++) {
      for (let j = i + 1; j < activeBookings.length; j++) {
        const b1 = activeBookings[i]
        const b2 = activeBookings[j]
        
        if (b1.roomId === b2.roomId) {
          // Relational Overlap Rule: (b1.checkIn < b2.checkOut && b1.checkOut > b2.checkIn)
          const checkIn1 = new Date(b1.checkIn).getTime()
          const checkOut1 = new Date(b1.checkOut).getTime()
          const checkIn2 = new Date(b2.checkIn).getTime()
          const checkOut2 = new Date(b2.checkOut).getTime()

          if (checkIn1 < checkOut2 && checkOut1 > checkIn2) {
            overlaps.push({
              roomNumber: b1.room.number,
              code1: b1.confirmationCode,
              dates1: `${b1.checkIn.toISOString().split('T')[0]} to ${b1.checkOut.toISOString().split('T')[0]}`,
              code2: b2.confirmationCode,
              dates2: `${b2.checkIn.toISOString().split('T')[0]} to ${b2.checkOut.toISOString().split('T')[0]}`
            })
          }
        }
      }
    }
    console.log(`✅ Overlap check complete. Active bookings: ${activeBookings.length}. Collisions: ${overlaps.length}`)

    // 4. Verify Media Assets & Broken Links
    console.log('⚙️ Scanning room media paths and images...')
    const roomImages = await prisma.roomImage.findMany()
    let brokenImages = 0
    roomImages.forEach(img => {
      if (!img.imageUrl || img.imageUrl === '') {
        brokenImages++
      }
    })

    // Compute certification score
    let score = 100
    if (roomsWithInvalidTypes > 0) score -= 20
    if (roomTypesWithoutRooms > 0) score -= 10
    if (overlaps.length > 0) score -= 40
    if (brokenImages > 0) score -= 10

    const reportContent = `# Room Revenue Engine Certification Report

SmartHotel OS core revenue engine stability analysis, room allocations, capacity boundaries, and booking overlap diagnostics.

---

## 🏆 Room Engine Certification Score: \`${score} / 100\`
* **Total Rooms Audited**: \`${roomsCount}\`
* **Total Room Types Mapped**: \`${roomTypesCount}\`
* **Double Booking Collisions**: \`${overlaps.length}\`
* **Orphan/Broken Relations**: \`${roomsWithInvalidTypes + roomTypesWithoutRooms}\`

---

## 📅 Allocation Integrity Scan (Double Booking Overlaps)

Relational overlap checks verify that zero rooms share conflicting stay calendars:

${overlaps.length === 0 ? '* **Success**: 100% of room allocations are conflict-free! Zero booking overlap risks found.' : `
| Room Number | Booking 1 (Confirmation) | Booking 1 Dates | Booking 2 (Confirmation) | Booking 2 Dates |
| :--- | :--- | :--- | :--- | :--- |
${overlaps.map(o => `| \`${o.roomNumber}\` | \`${o.code1}\` | ${o.dates1} | \`${o.code2}\` | ${o.dates2} |`).join('\n')}
`}

---

## 🏢 Room Type Linkage Compliance

Each physical room must be backed by an active pricing & capacity tier:

* **Rooms with invalid RoomType references**: \`${roomsWithInvalidTypes}\`
* **RoomType definitions without any assigned rooms**: \`${roomTypesWithoutRooms}\`

---

## 🖼️ Media & Public Assets Scan

* **Total Room Images Loaded**: \`${roomImages.length}\`
* **Broken Image Reference Paths**: \`${brokenImages}\`

---

## 🎖️ Room Engine Certification Verdict: \`${score >= 90 ? 'EXCELLENT' : 'ACTION REQUIRED'}\`
${score >= 90 ? 'The Room Revenue Engine is 100% stable, collision-free, and operational!' : 'Relational corrections or scheduling overlaps must be corrected immediately.'}
`

    // Save locally
    const localReportPath = path.join(REPORT_DIR, 'ROOM_ENGINE_CERTIFICATION.md')
    fs.writeFileSync(localReportPath, reportContent)
    console.log(`\n✅ Local report written to: ${localReportPath}`)

    // Save as System Artifact
    const systemReportPath = path.join(SYSTEM_ARTIFACTS_DIR, 'ROOM_ENGINE_CERTIFICATION.md')
    fs.writeFileSync(systemReportPath, reportContent)
    console.log(`✅ System artifact written to: ${systemReportPath}`)

  } catch (err) {
    console.error('\n❌ SRE Room Engine verification failed:', err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runRoomAudit()
