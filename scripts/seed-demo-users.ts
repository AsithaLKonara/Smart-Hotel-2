import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface DemoUserConfig {
  email: string
  name: string
  password: string
  systemRole: string
  propertyCode?: string
  phone?: string
}

const DEMO_CREDENTIALS: DemoUserConfig[] = [
  // Primary Core Demo / QA Accounts
  { name: 'Super Admin', email: 'admin@smarthotel.com', password: 'SmartHotel@2025!Admin', systemRole: 'SUPER_ADMIN', propertyCode: 'GOR', phone: '+1-800-555-0001' },
  { name: 'Hotel Manager', email: 'manager@smarthotel.com', password: 'SmartHotel@2025!Manager', systemRole: 'MANAGER', propertyCode: 'GOR', phone: '+1-800-555-0002' },
  { name: 'Front Desk Receptionist', email: 'receptionist@smarthotel.com', password: 'SmartHotel@2025!Reception', systemRole: 'RECEPTIONIST', propertyCode: 'GOR', phone: '+1-800-555-0003' },
  { name: 'Kitchen Staff', email: 'kitchen@smarthotel.com', password: 'SmartHotel@2025!Kitchen', systemRole: 'KITCHEN', propertyCode: 'GOR', phone: '+1-800-555-0004' },
  { name: 'Housekeeping Staff', email: 'housekeeping@smarthotel.com', password: 'SmartHotel@2025!House', systemRole: 'HOUSEKEEPING', propertyCode: 'GOR', phone: '+1-800-555-0005' },
  { name: 'Maintenance Staff', email: 'maintenance@smarthotel.com', password: 'SmartHotel@2025!Maint', systemRole: 'MAINTENANCE', propertyCode: 'GOR', phone: '+1-800-555-0006' },
  { name: 'John Doe (Guest)', email: 'guest@example.com', password: 'SmartHotel@2025!Guest', systemRole: 'GUEST', propertyCode: 'GOR', phone: '+1-555-0104' },
  { name: 'Jane Smith (Guest B)', email: 'guestb@example.com', password: 'SmartHotel@2025!GuestB', systemRole: 'GUEST', propertyCode: 'GOR', phone: '+1-555-0105' },
  { name: 'Test Admin Local', email: 'admin@smarthotel.local', password: 'admin123', systemRole: 'SUPER_ADMIN', propertyCode: 'GOR', phone: '+1-800-555-0000' },

  // Property-Scoped Multi-Tenant Accounts
  { name: 'GOR Manager', email: 'manager.gor@smarthotel.com', password: 'SmartHotel@2025!', systemRole: 'MANAGER', propertyCode: 'GOR', phone: '+1-800-555-0010' },
  { name: 'GOR Reception', email: 'reception.gor@smarthotel.com', password: 'SmartHotel@2025!', systemRole: 'RECEPTIONIST', propertyCode: 'GOR', phone: '+1-800-555-0011' },
  { name: 'GOR Housekeeping', email: 'housekeeping.gor@smarthotel.com', password: 'SmartHotel@2025!', systemRole: 'HOUSEKEEPING', propertyCode: 'GOR', phone: '+1-800-555-0012' },
  { name: 'GOR Maintenance', email: 'maintenance.gor@smarthotel.com', password: 'SmartHotel@2025!', systemRole: 'MAINTENANCE', propertyCode: 'GOR', phone: '+1-800-555-0013' },
  { name: 'GOR Kitchen', email: 'kitchen.gor@smarthotel.com', password: 'SmartHotel@2025!', systemRole: 'KITCHEN', propertyCode: 'GOR', phone: '+1-800-555-0014' },

  { name: 'MVL Manager', email: 'manager.mvl@smarthotel.com', password: 'SmartHotel@2025!', systemRole: 'MANAGER', propertyCode: 'MVL', phone: '+1-800-555-0020' },
  { name: 'MVL Reception', email: 'reception.mvl@smarthotel.com', password: 'SmartHotel@2025!', systemRole: 'RECEPTIONIST', propertyCode: 'MVL', phone: '+1-800-555-0021' },
  { name: 'MVL Housekeeping', email: 'housekeeping.mvl@smarthotel.com', password: 'SmartHotel@2025!', systemRole: 'HOUSEKEEPING', propertyCode: 'MVL', phone: '+1-800-555-0022' },

  { name: 'CCH Manager', email: 'manager.cch@smarthotel.com', password: 'SmartHotel@2025!', systemRole: 'MANAGER', propertyCode: 'CCH', phone: '+1-800-555-0030' },
  { name: 'CCH Reception', email: 'reception.cch@smarthotel.com', password: 'SmartHotel@2025!', systemRole: 'RECEPTIONIST', propertyCode: 'CCH', phone: '+1-800-555-0031' },
  { name: 'CCH Housekeeping', email: 'housekeeping.cch@smarthotel.com', password: 'SmartHotel@2025!', systemRole: 'HOUSEKEEPING', propertyCode: 'CCH', phone: '+1-800-555-0032' },
]

async function main() {
  console.log('🚀 --- SEEDING COMPREHENSIVE DEV & DEMO CREDENTIALS ---')

  // 1. Ensure Properties exist
  let properties = await prisma.property.findMany()
  if (properties.length === 0) {
    console.log('Creating baseline properties...')
    await prisma.property.createMany({
      data: [
        { name: 'Grand Ocean Resort', code: 'GOR', address: '1 Ocean Dr', city: 'Miami', country: 'USA' },
        { name: 'Mountain View Lodge', code: 'MVL', address: '100 Summit Way', city: 'Aspen', country: 'USA' },
        { name: 'City Center Hotel', code: 'CCH', address: '500 Main St', city: 'New York', country: 'USA' },
      ]
    })
    properties = await prisma.property.findMany()
  }

  const propertyMap: Record<string, string> = {}
  for (const p of properties) {
    propertyMap[p.code] = p.id
  }
  const defaultPropertyId = propertyMap['GOR'] || properties[0].id

  // 2. Ensure Roles exist
  const requiredRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'KITCHEN', 'HOUSEKEEPING', 'MAINTENANCE', 'GUEST']
  const existingRoles = await prisma.role.findMany()
  const roleMap: Record<string, string> = {}
  for (const r of existingRoles) {
    roleMap[r.name] = r.id
  }

  for (const roleName of requiredRoles) {
    if (!roleMap[roleName]) {
      console.log(`Creating missing role: ${roleName}`)
      const newRole = await prisma.role.create({
        data: { name: roleName, description: `${roleName} Role` }
      })
      roleMap[roleName] = newRole.id
    }
  }

  // 3. Upsert Users & Related Profile/Employee records
  let createdCount = 0
  let updatedCount = 0

  for (const cred of DEMO_CREDENTIALS) {
    const roleId = roleMap[cred.systemRole] || roleMap['GUEST']
    const propertyId = (cred.propertyCode && propertyMap[cred.propertyCode]) || defaultPropertyId
    const hashedPassword = await bcrypt.hash(cred.password, 10)

    const existingUser = await prisma.user.findFirst({
      where: { email: cred.email }
    })

    let userId: string

    if (existingUser) {
      const updated = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: cred.name,
          password: hashedPassword,
          roleId,
          propertyId,
          phone: cred.phone || existingUser.phone,
          deletedAt: null
        }
      })
      userId = updated.id
      updatedCount++
      console.log(`✅ Updated: ${cred.email} (${cred.systemRole}) -> [${cred.propertyCode || 'GOR'}]`)
    } else {
      const created = await prisma.user.create({
        data: {
          email: cred.email,
          name: cred.name,
          password: hashedPassword,
          roleId,
          propertyId,
          phone: cred.phone
        }
      })
      userId = created.id
      createdCount++
      console.log(`➕ Created: ${cred.email} (${cred.systemRole}) -> [${cred.propertyCode || 'GOR'}]`)
    }

    // Staff: Ensure Employee record exists
    if (cred.systemRole !== 'GUEST') {
      const existingEmployee = await prisma.employee.findFirst({
        where: { OR: [{ userId }, { email: cred.email }] }
      })

      if (!existingEmployee) {
        await prisma.employee.create({
          data: {
            userId,
            email: cred.email,
            firstName: cred.name.split(' ')[0],
            lastName: cred.name.split(' ').slice(1).join(' ') || 'Staff',
            department: cred.systemRole,
            position: cred.name,
            baseSalary: 55000,
            hireDate: new Date('2024-01-15'),
            status: 'ACTIVE',
            propertyId
          }
        })
      } else {
        await prisma.employee.update({
          where: { id: existingEmployee.id },
          data: {
            userId,
            propertyId,
            status: 'ACTIVE'
          }
        })
      }
    } else {
      // Guest: Ensure GuestProfile record exists
      const existingProfile = await prisma.guestProfile.findUnique({
        where: { userAccountId: userId }
      })

      if (!existingProfile) {
        await prisma.guestProfile.create({
          data: {
            userAccountId: userId,
            preferences: { roomType: 'Luxury Suite', highFloor: true, quietRoom: true }
          }
        })
      }
    }
  }

  console.log('\n📊 Seeding Summary:')
  console.log(`   - Created Users: ${createdCount}`)
  console.log(`   - Updated Users: ${updatedCount}`)
  console.log(`   - Total Seeded Credentials: ${DEMO_CREDENTIALS.length}`)
  console.log('\n🔑 Quick Credential Matrix:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👑 Admin:           admin@smarthotel.com         / SmartHotel@2025!Admin (or SmartHotel@2025!)')
  console.log('👨‍💼 Manager:         manager@smarthotel.com       / SmartHotel@2025!Manager')
  console.log('👩‍💼 Receptionist:    receptionist@smarthotel.com  / SmartHotel@2025!Reception')
  console.log('🍳 Kitchen:         kitchen@smarthotel.com       / SmartHotel@2025!Kitchen')
  console.log('🧹 Housekeeping:    housekeeping@smarthotel.com  / SmartHotel@2025!House')
  console.log('🔧 Maintenance:     maintenance@smarthotel.com   / SmartHotel@2025!Maint')
  console.log('👤 Primary Guest:   guest@example.com            / SmartHotel@2025!Guest')
  console.log('👤 Secondary Guest: guestb@example.com           / SmartHotel@2025!GuestB')
  console.log('🧪 Local Test:      admin@smarthotel.local       / admin123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🏨 Multi-Property Team (GOR, MVL, CCH): Passwords are all "SmartHotel@2025!"')
  console.log('   - manager.gor@smarthotel.com, reception.gor@smarthotel.com, housekeeping.gor@smarthotel.com, etc.')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 Dev & Demo credentials seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during demo credential seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
