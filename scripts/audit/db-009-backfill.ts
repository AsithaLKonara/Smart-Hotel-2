import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting DB-009 Backfill...')

  // Get the default property (or create one if it doesn't exist)
  let defaultProperty = await prisma.property.findFirst()
  if (!defaultProperty) {
    console.log('⚠️ No property found. Creating a default property...')
    defaultProperty = await prisma.property.create({
      data: {
        name: 'Default Hotel',
        timezone: 'UTC',
        country: 'US',
        code: 'DEF',
        address: '123 Default St',
        city: 'Default City',
      }
    })
  }

  const propertyId = defaultProperty.id
  console.log(`✅ Using Property ID: ${propertyId} for backfill`)

  // 1. Backfill Rooms
  const roomsResult = await prisma.room.updateMany({
    where: { propertyId: null },
    data: { propertyId }
  })
  console.log(`✅ Backfilled ${roomsResult.count} Rooms`)

  // 2. Backfill Bookings
  const bookingsResult = await prisma.booking.updateMany({
    where: { propertyId: null },
    data: { propertyId }
  })
  console.log(`✅ Backfilled ${bookingsResult.count} Bookings`)

  // 3. Backfill Folios
  const foliosResult = await prisma.folio.updateMany({
    where: { propertyId: null },
    data: { propertyId }
  })
  console.log(`✅ Backfilled ${foliosResult.count} Folios`)

  // 4. Backfill Tasks
  const tasksResult = await prisma.task.updateMany({
    where: { propertyId: null },
    data: { propertyId }
  })
  console.log(`✅ Backfilled ${tasksResult.count} Tasks`)

  // 5. Backfill Users
  const usersResult = await prisma.user.updateMany({
    where: { propertyId: null },
    data: { propertyId }
  })
  console.log(`✅ Backfilled ${usersResult.count} Users`)

  console.log('🎉 DB-009 Backfill Completed Successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
