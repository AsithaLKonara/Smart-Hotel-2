import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fetching rooms...')
  const start = Date.now()
  try {
    const rooms = await prisma.room.findMany()
    console.log(`Fetched ${rooms.length} rooms in ${Date.now() - start}ms`)
  } catch (err) {
    console.error('Error fetching rooms:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
