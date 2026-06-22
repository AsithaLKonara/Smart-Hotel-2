import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHashes = {
    admin: await bcrypt.hash('SmartHotel@2025!Admin', 12),
    manager: await bcrypt.hash('SmartHotel@2025!Manager', 12),
    receptionist: await bcrypt.hash('SmartHotel@2025!Reception', 12),
    guest: await bcrypt.hash('SmartHotel@2025!Guest', 12),
  }

  const roles = await prisma.role.findMany()
  const roleMap: Record<string, string> = {}
  for (const role of roles) {
    roleMap[role.name] = role.id
  }

  const users = [
    { email: 'admin@smarthotel.com', name: 'Super Admin', pass: passwordHashes.admin, role: 'SUPER_ADMIN' },
    { email: 'manager@smarthotel.com', name: 'Hotel Manager', pass: passwordHashes.manager, role: 'MANAGER' },
    { email: 'receptionist@smarthotel.com', name: 'Receptionist', pass: passwordHashes.receptionist, role: 'RECEPTIONIST' },
    { email: 'emily.carter@example.com', name: 'Emily Carter', pass: passwordHashes.guest, role: 'GUEST' },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { password: u.pass, roleId: roleMap[u.role] || null },
      create: {
        email: u.email,
        name: u.name,
        password: u.pass,
        roleId: roleMap[u.role] || null,
      }
    })
  }
  console.log("Users seeded.")
}
main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); })
