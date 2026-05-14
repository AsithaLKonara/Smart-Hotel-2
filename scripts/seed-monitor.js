import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const bookings = await prisma.booking.count()
  const payments = await prisma.payment.count()
  const rooms = await prisma.room.count()
  console.log(`Progress: Rooms=${rooms}, Bookings=${bookings}, Payments=${payments}`)
}
main().finally(() => prisma.$disconnect())
