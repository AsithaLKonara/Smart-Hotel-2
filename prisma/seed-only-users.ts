/// <reference types="node" />
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Truncating all tables with CASCADE...')
  
  // Get all tables in the public schema
  const tablenames = await prisma.$queryRaw<Array<{tablename: string}>>`SELECT tablename FROM pg_tables WHERE schemaname='public'`
  
  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ')
    
  if (tables.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
      console.log('Successfully truncated all tables.')
    } catch (error) {
      console.error('Error truncating tables:', error)
      throw error
    }
  }

  console.log('🌱 Starting user & credentials database seed...')

  // ==========================================
  // 1. RBAC: PERMISSIONS & ROLES
  // ==========================================
  console.log('Seeding Permissions & Roles...')
  const permissions = [
    { action: '*', description: 'Super Admin wildcard' },
    { action: 'booking:read', description: 'Read bookings' },
    { action: 'booking:write', description: 'Create and update bookings' },
    { action: 'payment:write', description: 'Process payments' },
    { action: 'invoice:read', description: 'Read invoices' },
    { action: 'invoice:write', description: 'Modify invoices' },
    { action: 'order:write', description: 'Place F&B orders' },
  ]

  for (const perm of permissions) {
    await prisma.permission.upsert({ where: { action: perm.action }, update: {}, create: perm })
  }

  const rolesToCreate = [
    { name: 'SUPER_ADMIN', description: 'Full system access' },
    { name: 'MANAGER', description: 'Hotel manager' },
    { name: 'RECEPTIONIST', description: 'Front desk operations' },
    { name: 'KITCHEN', description: 'Kitchen and F&B operations' },
    { name: 'HOUSEKEEPING', description: 'Housekeeping operations' },
    { name: 'MAINTENANCE', description: 'Maintenance operations' },
    { name: 'GUEST', description: 'Default guest role' },
  ]

  const createdRoles: Record<string, any> = {}
  for (const role of rolesToCreate) {
    createdRoles[role.name] = await prisma.role.upsert({ where: { name: role.name }, update: {}, create: role })
  }

  const adminPerm = await prisma.permission.findUnique({ where: { action: '*' } })
  if (adminPerm) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: createdRoles['SUPER_ADMIN'].id, permissionId: adminPerm.id } },
      update: {},
      create: { roleId: createdRoles['SUPER_ADMIN'].id, permissionId: adminPerm.id }
    })
  }

  // ==========================================
  // 2. USERS
  // ==========================================
  console.log('Seeding Users...')
  const demoUsers = [
    { email: 'admin@smarthotel.com', password: 'SmartHotel@2025!Admin', roleName: 'SUPER_ADMIN', name: 'System Admin' },
    { email: 'manager@smarthotel.com', password: 'SmartHotel@2025!Manager', roleName: 'MANAGER', name: 'Sarah Manager' },
    { email: 'receptionist@smarthotel.com', password: 'SmartHotel@2025!Reception', roleName: 'RECEPTIONIST', name: 'John Frontdesk' },
    { email: 'kitchen@smarthotel.com', password: 'SmartHotel@2025!Kitchen', roleName: 'KITCHEN', name: 'Chef Gordon' },
    { email: 'housekeeping@smarthotel.com', password: 'SmartHotel@2025!House', roleName: 'HOUSEKEEPING', name: 'Maria Clean' },
    { email: 'maintenance@smarthotel.com', password: 'SmartHotel@2025!Maint', roleName: 'MAINTENANCE', name: 'Bob Fixit' },
    { email: 'guest@example.com', password: 'SmartHotel@2025!Guest', roleName: 'GUEST', name: 'Alice Traveler' },
    { email: 'guestb@example.com', password: 'SmartHotel@2025!GuestB', roleName: 'GUEST', name: 'Charlie Voyager' },
  ]

  const createdUsers: Record<string, any> = {}
  for (const user of demoUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10)
    createdUsers[user.email] = await prisma.user.upsert({
      where: { email: user.email },
      update: { roleId: createdRoles[user.roleName].id },
      create: { email: user.email, name: user.name, password: hashedPassword, roleId: createdRoles[user.roleName].id }
    })
  }

  console.log('✅ Database cleared and only credentials seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
