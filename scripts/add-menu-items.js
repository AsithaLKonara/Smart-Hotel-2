#!/usr/bin/env node

/**
 * Add Restaurant Menu Items
 * Adds menu items to the existing database
 */

const { PrismaClient } = require('@prisma/client')

async function addMenuItems() {
  console.log('🍽️ Adding Restaurant Menu Items...')
  
  const prisma = new PrismaClient()
  
  try {
    await prisma.$connect()
    
    // Check if menu items already exist
    const existingCount = await prisma.foodMenu.count()
    if (existingCount > 0) {
      console.log(`✅ Menu items already exist (${existingCount} items)`)
      return
    }
    
    // Create menu items
    const menuItems = await Promise.all([
      prisma.foodMenu.create({
        data: {
          name: 'Continental Breakfast',
          description: 'Fresh croissants, butter, jam, coffee, and orange juice',
          price: 15.99,
          category: 'BREAKFAST',
          available: true,
          preparationTime: 10,
        },
      }),
      prisma.foodMenu.create({
        data: {
          name: 'Full English Breakfast',
          description: 'Eggs, bacon, sausage, beans, toast, and coffee',
          price: 18.99,
          category: 'BREAKFAST',
          available: true,
          preparationTime: 15,
        },
      }),
      prisma.foodMenu.create({
        data: {
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce, parmesan cheese, croutons, and Caesar dressing',
          price: 12.99,
          category: 'LUNCH',
          available: true,
          preparationTime: 8,
        },
      }),
      prisma.foodMenu.create({
        data: {
          name: 'Club Sandwich',
          description: 'Turkey, bacon, lettuce, tomato, and mayo on toasted bread',
          price: 14.99,
          category: 'LUNCH',
          available: true,
          preparationTime: 12,
        },
      }),
      prisma.foodMenu.create({
        data: {
          name: 'Grilled Salmon',
          description: 'Fresh Atlantic salmon with herbs, served with vegetables and rice',
          price: 24.99,
          category: 'DINNER',
          available: true,
          preparationTime: 20,
        },
      }),
      prisma.foodMenu.create({
        data: {
          name: 'Beef Tenderloin',
          description: '8oz beef tenderloin with red wine reduction and mashed potatoes',
          price: 32.99,
          category: 'DINNER',
          available: true,
          preparationTime: 25,
        },
      }),
      prisma.foodMenu.create({
        data: {
          name: 'Fresh Orange Juice',
          description: 'Freshly squeezed orange juice',
          price: 4.99,
          category: 'BEVERAGES',
          available: true,
          preparationTime: 2,
        },
      }),
      prisma.foodMenu.create({
        data: {
          name: 'Premium Coffee',
          description: 'Freshly brewed premium coffee',
          price: 3.99,
          category: 'BEVERAGES',
          available: true,
          preparationTime: 3,
        },
      }),
    ])
    
    console.log(`✅ Successfully added ${menuItems.length} menu items!`)
    
  } catch (error) {
    console.error('❌ Error adding menu items:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addMenuItems()
