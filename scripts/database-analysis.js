#!/usr/bin/env node

/**
 * Comprehensive Database Analysis Script
 * Analyzes all collections, data, and relationships in the SmartHotel database
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function analyzeDatabase() {
  console.log('🔍 SmartHotel Database Analysis')
  console.log('=' .repeat(50))
  
  try {
    await prisma.$connect()
    console.log('✅ Connected to MongoDB Atlas')
    
    // Analyze each collection
    console.log('\n📊 COLLECTION ANALYSIS')
    console.log('=' .repeat(30))
    
    // Users Collection
    const userCount = await prisma.user.count()
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })
    console.log(`\n👥 USERS (${userCount} records):`)
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`)
    })
    
    // Staff Collection
    const staffCount = await prisma.staff.count()
    const staff = await prisma.staff.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true,
        isActive: true
      }
    })
    console.log(`\n👨‍💼 STAFF (${staffCount} records):`)
    if (staffCount > 0) {
      staff.forEach(member => {
        console.log(`  - ${member.name} (${member.email}) - ${member.position} in ${member.department}`)
      })
    } else {
      console.log('  ⚠️  No staff records found')
    }
    
    // Rooms Collection
    const roomCount = await prisma.room.count()
    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        number: true,
        capacity: true,
        status: true,
        floor: true,
        roomType: {
          select: {
            name: true,
            baseRate: true
          }
        }
      }
    })
    console.log(`\n🏨 ROOMS (${roomCount} records):`)
    rooms.forEach(room => {
      const type = room.roomType?.name || room.type;
      const price = room.roomType?.baseRate || room.price;
      const capacity = room.capacity;
      console.log(`  - Room ${room.number} (${type}) - $${price}/night - ${capacity} guests - Floor ${room.floor} - Status: ${room.status}`)
    })
    
    // Bookings Collection
    const bookingCount = await prisma.booking.count()
    const bookings = await prisma.booking.findMany({
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        guests: true,
        totalAmount: true,
        status: true,
        paymentStatus: true
      }
    })
    console.log(`\n📅 BOOKINGS (${bookingCount} records):`)
    if (bookingCount > 0) {
      bookings.forEach(booking => {
        console.log(`  - ${booking.checkIn.toDateString()} to ${booking.checkOut.toDateString()} - ${booking.guests} guests - $${booking.totalAmount} - Status: ${booking.status}`)
      })
    } else {
      console.log('  ⚠️  No booking records found')
    }
    
    // FoodMenu Collection
    const menuCount = await prisma.foodMenu.count()
    const menuItems = await prisma.foodMenu.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        available: true
      }
    })
    console.log(`\n🍽️ FOOD MENU (${menuCount} records):`)
    menuItems.forEach(item => {
      console.log(`  - ${item.name} (${item.category}) - $${item.price} - Available: ${item.available}`)
    })
    
    // FoodOrder Collection
    const orderCount = await prisma.foodOrder.count()
    const orders = await prisma.foodOrder.findMany({
      select: {
        id: true,
        roomNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true
      }
    })
    console.log(`\n🍴 FOOD ORDERS (${orderCount} records):`)
    if (orderCount > 0) {
      orders.forEach(order => {
        console.log(`  - Room ${order.roomNumber} - $${order.totalAmount} - Status: ${order.status}`)
      })
    } else {
      console.log('  ⚠️  No food order records found')
    }
    
    // Tasks Collection
    const taskCount = await prisma.task.count()
    const tasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        priority: true,
        status: true
      }
    })
    console.log(`\n📋 TASKS (${taskCount} records):`)
    if (taskCount > 0) {
      tasks.forEach(task => {
        console.log(`  - ${task.title} (${task.type}) - Priority: ${task.priority} - Status: ${task.status}`)
      })
    } else {
      console.log('  ⚠️  No task records found')
    }
    
    // Inventory Collection
    const inventoryCount = await prisma.inventory.count()
    const inventory = await prisma.inventory.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        quantity: true,
        status: true
      }
    })
    console.log(`\n📦 INVENTORY (${inventoryCount} records):`)
    if (inventoryCount > 0) {
      inventory.forEach(item => {
        console.log(`  - ${item.name} (${item.category}) - Qty: ${item.quantity} - Status: ${item.status}`)
      })
    } else {
      console.log('  ⚠️  No inventory records found')
    }
    
    // Gallery Collection
    const galleryCount = await prisma.gallery.count()
    const gallery = await prisma.gallery.findMany({
      select: {
        id: true,
        title: true,
        category: true
      }
    })
    console.log(`\n🖼️ GALLERY (${galleryCount} records):`)
    if (galleryCount > 0) {
      gallery.forEach(item => {
        console.log(`  - ${item.title} (${item.category})`)
      })
    } else {
      console.log('  ⚠️  No gallery records found')
    }
    
    // Settings Collection
    const settingsCount = await prisma.setting.count()
    const settings = await prisma.setting.findMany({
      select: {
        key: true,
        value: true
      }
    })
    console.log(`\n⚙️ SETTINGS (${settingsCount} records):`)
    settings.forEach(setting => {
      console.log(`  - ${setting.key}: ${setting.value}`)
    })
    
    // AuditLog Collection
    const auditCount = await prisma.auditLog.count()
    const auditLogs = await prisma.auditLog.findMany({
      select: {
        id: true,
        action: true,
        entityType: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    console.log(`\n📝 AUDIT LOGS (${auditCount} records):`)
    if (auditCount > 0) {
      console.log('  Recent logs:')
      auditLogs.forEach(log => {
        console.log(`  - ${log.action} on ${log.entityType} - ${log.createdAt.toDateString()}`)
      })
    } else {
      console.log('  ⚠️  No audit log records found')
    }
    
    // Summary
    console.log('\n📊 SUMMARY')
    console.log('=' .repeat(20))
    console.log(`Total Collections: 11`)
    console.log(`Users: ${userCount}`)
    console.log(`Staff: ${staffCount}`)
    console.log(`Rooms: ${roomCount}`)
    console.log(`Bookings: ${bookingCount}`)
    console.log(`Menu Items: ${menuCount}`)
    console.log(`Food Orders: ${orderCount}`)
    console.log(`Tasks: ${taskCount}`)
    console.log(`Inventory: ${inventoryCount}`)
    console.log(`Gallery: ${galleryCount}`)
    console.log(`Settings: ${settingsCount}`)
    console.log(`Audit Logs: ${auditCount}`)
    
    // Missing Collections Analysis
    console.log('\n⚠️ MISSING DATA ANALYSIS')
    console.log('=' .repeat(30))
    
    if (staffCount === 0) {
      console.log('❌ No Staff records - Consider adding staff members')
    }
    if (bookingCount === 0) {
      console.log('❌ No Bookings - Consider adding sample bookings')
    }
    if (taskCount === 0) {
      console.log('❌ No Tasks - Consider adding sample tasks')
    }
    if (inventoryCount === 0) {
      console.log('❌ No Inventory - Consider adding inventory items')
    }
    if (galleryCount === 0) {
      console.log('❌ No Gallery - Consider adding gallery images')
    }
    if (orderCount === 0) {
      console.log('❌ No Food Orders - Restaurant ordering system needs sample data')
    }
    
    console.log('\n✅ Database analysis completed!')
    
  } catch (error) {
    console.error('❌ Database analysis failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeDatabase()
