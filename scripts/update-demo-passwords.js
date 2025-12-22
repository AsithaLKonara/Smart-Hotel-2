#!/usr/bin/env node

/**
 * Update Demo User Passwords
 * 
 * This script updates all demo user passwords to new secure passwords
 * that won't trigger Chrome's compromised password warnings.
 * 
 * Run: DATABASE_URL="your-connection-string" node scripts/update-demo-passwords.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const NEW_PASSWORDS = {
  'admin@smarthotel.com': 'SmartHotel@2025!Admin',
  'manager@smarthotel.com': 'SmartHotel@2025!Manager',
  'receptionist@smarthotel.com': 'SmartHotel@2025!Reception',
  'guest@example.com': 'SmartHotel@2025!Guest',
}

async function updatePasswords() {
  console.log('🔐 Updating demo user passwords...\n')
  
  try {
    let updated = 0
    let notFound = 0
    
    for (const [email, newPassword] of Object.entries(NEW_PASSWORDS)) {
      const user = await prisma.user.findFirst({
        where: { email }
      })
      
      if (!user) {
        console.log(`⚠️  User not found: ${email}`)
        notFound++
        continue
      }
      
      const passwordHash = await bcrypt.hash(newPassword, 12)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: passwordHash }
      })
      
      console.log(`✅ Updated password for: ${email}`)
      updated++
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   - Updated: ${updated}`)
    console.log(`   - Not found: ${notFound}`)
    console.log(`\n✅ Password update complete!`)
    console.log(`\n🔑 New Demo Credentials:`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`👑 Admin: admin@smarthotel.com / SmartHotel@2025!Admin`)
    console.log(`👨‍💼 Manager: manager@smarthotel.com / SmartHotel@2025!Manager`)
    console.log(`👩‍💼 Receptionist: receptionist@smarthotel.com / SmartHotel@2025!Reception`)
    console.log(`👤 Guest: guest@example.com / SmartHotel@2025!Guest`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updatePasswords()
