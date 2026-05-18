const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function auditDatabaseReality() {
  console.log('--- PHASE 1: DATABASE REALITY AUDIT ---')
  
  const models = [
    'user', 'room', 'roomType', 'booking', 'event', 'bookingGuest', 
    'invoice', 'invoiceLineItem', 'payment', 'financialAdjustment',
    'task', 'maintenanceRequest', 'foodOrder', 'orderItem', 'foodMenu',
    'guestPreference', 'staff', 'roomReview', 'hotelReview', 'amenity',
    'knowledge', 'embeddingCache', 'notification', 'outbox', 'syncLog',
    'auditLog', 'channelConfig', 'roomMapping', 'gallery', 'heroSlide',
    'inventory', 'loyaltyPoint', 'loyaltyTransaction', 'navigationLink',
    'conversation', 'chatCustomer', 'setting', 'socialLink', 'tableBooking',
    'complaint', 'testimonial', 'footerLink'
  ]

  const liveDataMap = {}
  const emptyCollections = []

  for (const model of models) {
    try {
      const count = await prisma[model].count()
      liveDataMap[model] = count
      if (count === 0) emptyCollections.push(model)
    } catch (e) {
      console.error(`Error auditing ${model}:`, e.message)
    }
  }

  console.log('\n📊 Live Collection Status:')
  console.table(liveDataMap)

  console.log('\n⚠️ Empty Collections (Potential Zombies):')
  console.log(emptyCollections.join(', '))

  // Relation Integrity Check: Room <-> RoomType
  console.log('\n🔍 Relation Integrity: Room <-> RoomType')
  const roomsWithMissingType = await prisma.room.count({
    where: { roomTypeId: { equals: undefined } }
  }).catch(() => 'Query failed')
  console.log(`Rooms with undefined roomTypeId: ${roomsWithMissingType}`)

  // Relation Integrity Check: Booking <-> Room
  console.log('\n🔍 Relation Integrity: Booking <-> Room')
  const bookings = await prisma.booking.findMany({ take: 10, select: { id: true, roomId: true, primaryGuestId: true } })
  for (const b of bookings) {
    const room = await prisma.room.findUnique({ where: { id: b.roomId } })
    const user = await prisma.user.findUnique({ where: { id: b.primaryGuestId } })
    console.log(`Booking ${b.id}: Room Found: ${!!room}, Guest Found: ${!!user}`)
  }

  // Check for orphan bookings
  const orphanBookings = await prisma.booking.count({
    where: {
      AND: [
        { roomId: { notIn: (await prisma.room.findMany({ select: { id: true } })).map(r => r.id) } }
      ]
    }
  }).catch(() => 'Manual check required due to Mongo limitations')
  console.log(`Potential Orphan Bookings: ${orphanBookings}`)

  await prisma.$disconnect()
}

auditDatabaseReality()
