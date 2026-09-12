import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Clearing existing data (PostgreSQL truncate cascade)...')
  
  // Truncate all tables in PostgreSQL to cleanly wipe the database
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ')

  if (tables.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
      console.log('✅ All tables truncated.')
    } catch (error) {
      console.error('Error truncating tables:', error)
    }
  }

  console.log('🌱 Starting comprehensive database seed...')

  // 1. Create Properties
  const gor = await prisma.property.create({ data: { name: 'Grand Ocean Resort', code: 'GOR', address: '1 Ocean Dr', city: 'Miami', country: 'USA' } })
  const mvl = await prisma.property.create({ data: { name: 'Mountain View Lodge', code: 'MVL', address: '100 Summit Way', city: 'Aspen', country: 'USA' } })
  const cch = await prisma.property.create({ data: { name: 'City Center Hotel', code: 'CCH', address: '500 Main St', city: 'New York', country: 'USA' } })
  
  console.log('✅ Created 3 distinct Properties.')

  // 2. Create Roles
  const rolesData = [
    { name: 'SUPER_ADMIN' },
    { name: 'MANAGER' },
    { name: 'RECEPTIONIST' },
    { name: 'HOUSEKEEPING' },
    { name: 'MAINTENANCE' },
    { name: 'KITCHEN' },
    { name: 'GUEST' }
  ]
  const createdRoles: Record<string, string> = {}
  for (const r of rolesData) {
    const role = await prisma.role.create({ data: r })
    createdRoles[r.name] = role.id
  }

  // 3. Seed Users Matrix
  const hashedPassword = await bcrypt.hash('SmartHotel@2025!', 10)
  const usersToSeed = [
    // Super Admin (Global Access, technically bound to GOR to satisfy schema)
    { email: 'admin@smarthotel.com', name: 'Super Admin', role: 'SUPER_ADMIN', prop: gor.id },
    
    // Grand Ocean Resort Team
    { email: 'manager.gor@smarthotel.com', name: 'GOR Manager', role: 'MANAGER', prop: gor.id },
    { email: 'reception.gor@smarthotel.com', name: 'GOR Reception', role: 'RECEPTIONIST', prop: gor.id },
    { email: 'housekeeping.gor@smarthotel.com', name: 'GOR Housekeeping', role: 'HOUSEKEEPING', prop: gor.id },
    { email: 'maintenance.gor@smarthotel.com', name: 'GOR Maintenance', role: 'MAINTENANCE', prop: gor.id },
    { email: 'kitchen.gor@smarthotel.com', name: 'GOR Kitchen', role: 'KITCHEN', prop: gor.id },
    
    // Mountain View Lodge Team
    { email: 'manager.mvl@smarthotel.com', name: 'MVL Manager', role: 'MANAGER', prop: mvl.id },
    { email: 'reception.mvl@smarthotel.com', name: 'MVL Reception', role: 'RECEPTIONIST', prop: mvl.id },
    { email: 'housekeeping.mvl@smarthotel.com', name: 'MVL Housekeeping', role: 'HOUSEKEEPING', prop: mvl.id },
    
    // City Center Hotel Team
    { email: 'manager.cch@smarthotel.com', name: 'CCH Manager', role: 'MANAGER', prop: cch.id },
    { email: 'reception.cch@smarthotel.com', name: 'CCH Reception', role: 'RECEPTIONIST', prop: cch.id },
    { email: 'housekeeping.cch@smarthotel.com', name: 'CCH Housekeeping', role: 'HOUSEKEEPING', prop: cch.id },
  ]

  for (const u of usersToSeed) {
    await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        password: hashedPassword,
        roleId: createdRoles[u.role],
        propertyId: u.prop
      }
    })
  }

  console.log(`✅ Seeded ${usersToSeed.length} multi-property users.`)

  // 4. Seed basic Room Types & Rooms for each property
  for (const property of [gor, mvl, cch]) {
    const stdType = await prisma.roomType.create({
      data: {
        name: `Standard - ${property.code}`,
        description: `Standard Room at ${property.name}`,
        baseRate: 150.0,
        capacity: 2
      }
    })

    const luxType = await prisma.roomType.create({
      data: {
        name: `Luxury - ${property.code}`,
        description: `Luxury Suite at ${property.name}`,
        baseRate: 350.0,
        capacity: 4
      }
    })

    await prisma.room.createMany({
      data: [
        { number: '101', floor: 1, roomTypeId: stdType.id, status: 'AVAILABLE', propertyId: property.id },
        { number: '102', floor: 1, roomTypeId: stdType.id, status: 'OCCUPIED', propertyId: property.id },
        { number: '201', floor: 2, roomTypeId: luxType.id, status: 'MAINTENANCE', propertyId: property.id },
        { number: '202', floor: 2, roomTypeId: luxType.id, status: 'AVAILABLE', propertyId: property.id },
      ]
    })
  }
  
  console.log('✅ Created basic Room Types and Rooms for all properties.')

  console.log('🎉 Seeding Complete! The database is ready for the multi-property UI.')
}

main()
  .catch(e => {
    console.error('Fatal Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
