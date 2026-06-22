import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHashes = {
    kitchen: await bcrypt.hash('SmartHotel@2025!Kitchen', 12),
    guestB: await bcrypt.hash('SmartHotel@2025!GuestB', 12),
  }

  // Ensure KITCHEN role exists
  let kitchenRole = await prisma.role.findUnique({ where: { name: 'KITCHEN' } })
  if (!kitchenRole) {
    kitchenRole = await prisma.role.create({ data: { name: 'KITCHEN', description: 'Kitchen Staff' } })
  }

  const guestRole = await prisma.role.findUnique({ where: { name: 'GUEST' } })

  const users = [
    { email: 'kitchen@smarthotel.com', name: 'Kitchen Staff', pass: passwordHashes.kitchen, roleId: kitchenRole.id },
    { email: 'guestb@example.com', name: 'Guest B', pass: passwordHashes.guestB, roleId: guestRole?.id || null },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { password: u.pass, roleId: u.roleId },
      create: {
        email: u.email,
        name: u.name,
        password: u.pass,
        roleId: u.roleId,
      }
    })
  }

  // Also make sure RECEPTIONIST role exists as it might not be in the initial DB seed
  let recRole = await prisma.role.findUnique({ where: { name: 'RECEPTIONIST' } })
  if (!recRole) {
    recRole = await prisma.role.create({ data: { name: 'RECEPTIONIST', description: 'Front Desk' } })
    await prisma.user.update({
      where: { email: 'receptionist@smarthotel.com' },
      data: { roleId: recRole.id }
    })
  }

  console.log("Updated demo users.")
}
main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); })
