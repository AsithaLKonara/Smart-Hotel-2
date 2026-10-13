import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const rooms = await prisma.room.findMany({
    include: { roomImages: true }
  })
  console.log('Rooms with images:')
  rooms.filter(r => r.roomImages.length > 0).forEach(r => console.log(r.number, r.roomImages))
}

main().catch(console.error).finally(() => prisma.$disconnect())
