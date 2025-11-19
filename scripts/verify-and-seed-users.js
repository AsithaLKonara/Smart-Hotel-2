#!/usr/bin/env node

/**
 * Verify and Seed Test Users in Production Database
 * This script checks if test users exist and creates them if needed
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const TEST_USERS = [
  {
    email: 'admin@smarthotel.com',
    name: 'Super Admin',
    password: 'admin123',
    role: 'SUPER_ADMIN',
    phone: '+1-800-555-0001'
  },
  {
    email: 'manager@smarthotel.com',
    name: 'Hotel Manager',
    password: 'manager123',
    role: 'MANAGER',
    phone: '+1-800-555-0002'
  },
  {
    email: 'receptionist@smarthotel.com',
    name: 'Front Desk Receptionist',
    password: 'receptionist123',
    role: 'RECEPTIONIST',
    phone: '+1-800-555-0003'
  },
  {
    email: 'guest@example.com',
    name: 'John Doe',
    password: 'guest123',
    role: 'GUEST',
    phone: '+1-555-0104'
  }
]

async function verifyAndSeedUsers() {
  console.log('🔍 Verifying test users in database...\n')
  
  try {
    let created = 0
    let existing = 0
    
    for (const userData of TEST_USERS) {
      const existingUser = await prisma.user.findFirst({
        where: { email: userData.email }
      })
      
      if (existingUser) {
        console.log(`✅ User exists: ${userData.email} (${userData.role})`)
        existing++
        
        // Update password if needed (in case it was changed)
        const passwordHash = await bcrypt.hash(userData.password, 12)
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { password: passwordHash }
        })
        console.log(`   ↳ Password updated`)
      } else {
        console.log(`➕ Creating user: ${userData.email} (${userData.role})`)
        const passwordHash = await bcrypt.hash(userData.password, 12)
        
        await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: passwordHash,
            role: userData.role,
            phone: userData.phone
          }
        })
        created++
        console.log(`   ↳ User created successfully`)
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   - Existing users: ${existing}`)
    console.log(`   - Created users: ${created}`)
    console.log(`   - Total test users: ${TEST_USERS.length}`)
    
    if (created > 0) {
      console.log(`\n✅ Database seeding complete!`)
    } else {
      console.log(`\n✅ All test users already exist!`)
    }
    
    // Verify all users can be found
    console.log(`\n🔍 Verification:`)
    for (const userData of TEST_USERS) {
      const user = await prisma.user.findFirst({
        where: { email: userData.email }
      })
      if (user) {
        console.log(`   ✅ ${userData.email} - ${user.role}`)
      } else {
        console.log(`   ❌ ${userData.email} - NOT FOUND`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAndSeedUsers()

