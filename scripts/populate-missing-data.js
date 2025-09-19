#!/usr/bin/env node

/**
 * Populate Missing Critical Data
 * Adds staff, tasks, inventory, and gallery data to make the system fully functional
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function populateMissingData() {
  console.log('🌱 Populating Missing Critical Data...')
  console.log('=' .repeat(50))
  
  try {
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Check existing data
    const existingStaff = await prisma.staff.count()
    const existingTasks = await prisma.task.count()
    const existingInventory = await prisma.inventory.count()
    const existingGallery = await prisma.gallery.count()
    const existingOrders = await prisma.foodOrder.count()
    
    console.log(`\n📊 Current Data Status:`)
    console.log(`Staff: ${existingStaff}`)
    console.log(`Tasks: ${existingTasks}`)
    console.log(`Inventory: ${existingInventory}`)
    console.log(`Gallery: ${existingGallery}`)
    console.log(`Food Orders: ${existingOrders}`)
    
    // Get existing users for task assignments
    const users = await prisma.user.findMany({
      select: { id: true, name: true, role: true }
    })
    
    console.log(`\n👥 Available Users: ${users.length}`)
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.role})`)
    })
    
    // 1. Create Staff Members
    console.log(`\n👨‍💼 Creating Staff Members...`)
    if (existingStaff === 0) {
      const staffMembers = [
        {
          employeeId: 'EMP001',
          name: 'John Smith',
          email: 'john.smith@smarthotel.com',
          phone: '+1-555-0101',
          position: 'Hotel Manager',
          department: 'Management',
          hireDate: new Date('2023-01-15'),
          salary: 5500.00,
          isActive: true,
        },
        {
          employeeId: 'EMP002',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@smarthotel.com',
          phone: '+1-555-0102',
          position: 'Front Desk Manager',
          department: 'Front Office',
          hireDate: new Date('2023-02-01'),
          salary: 4200.00,
          isActive: true,
        },
        {
          employeeId: 'EMP003',
          name: 'Mike Davis',
          email: 'mike.davis@smarthotel.com',
          phone: '+1-555-0103',
          position: 'Housekeeping Supervisor',
          department: 'Housekeeping',
          hireDate: new Date('2023-01-20'),
          salary: 3800.00,
          isActive: true,
        },
        {
          employeeId: 'EMP004',
          name: 'Lisa Chen',
          email: 'lisa.chen@smarthotel.com',
          phone: '+1-555-0104',
          position: 'Maintenance Engineer',
          department: 'Maintenance',
          hireDate: new Date('2023-03-01'),
          salary: 4500.00,
          isActive: true,
        },
        {
          employeeId: 'EMP005',
          name: 'Robert Wilson',
          email: 'robert.wilson@smarthotel.com',
          phone: '+1-555-0105',
          position: 'Restaurant Manager',
          department: 'Food & Beverage',
          hireDate: new Date('2023-02-15'),
          salary: 4800.00,
          isActive: true,
        },
        {
          employeeId: 'EMP006',
          name: 'Maria Garcia',
          email: 'maria.garcia@smarthotel.com',
          phone: '+1-555-0106',
          position: 'Housekeeping Staff',
          department: 'Housekeeping',
          hireDate: new Date('2023-04-01'),
          salary: 2800.00,
          isActive: true,
        },
        {
          employeeId: 'EMP007',
          name: 'David Brown',
          email: 'david.brown@smarthotel.com',
          phone: '+1-555-0107',
          position: 'Receptionist',
          department: 'Front Office',
          hireDate: new Date('2023-05-01'),
          salary: 3200.00,
          isActive: true,
        },
        {
          employeeId: 'EMP008',
          name: 'Emma Taylor',
          email: 'emma.taylor@smarthotel.com',
          phone: '+1-555-0108',
          position: 'Concierge',
          department: 'Guest Services',
          hireDate: new Date('2023-03-15'),
          salary: 3500.00,
          isActive: true,
        }
      ]
      
      const createdStaff = await Promise.all(
        staffMembers.map(staff => prisma.staff.create({ data: staff }))
      )
      
      console.log(`✅ Created ${createdStaff.length} staff members`)
    } else {
      console.log(`⚠️ Staff data already exists (${existingStaff} records)`)
    }
    
    // Get staff for task assignments
    const staff = await prisma.staff.findMany({
      select: { id: true, name: true, department: true }
    })
    
    // 2. Create Tasks
    console.log(`\n📋 Creating Tasks...`)
    if (existingTasks === 0) {
      const tasks = [
        {
          title: 'Clean Room 101',
          description: 'Standard cleaning and restocking for check-out',
          type: 'HOUSEKEEPING',
          priority: 'HIGH',
          assignedTo: staff.find(s => s.department === 'Housekeeping')?.id,
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          createdBy: users.find(u => u.role === 'MANAGER')?.id || users[0].id,
          status: 'PENDING',
        },
        {
          title: 'Fix TV in Room 201',
          description: 'TV remote not working, needs replacement',
          type: 'MAINTENANCE',
          priority: 'MEDIUM',
          assignedTo: staff.find(s => s.department === 'Maintenance')?.id,
          dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
          createdBy: users.find(u => u.role === 'MANAGER')?.id || users[0].id,
          status: 'PENDING',
        },
        {
          title: 'Prepare Welcome Amenities',
          description: 'Prepare welcome basket for VIP guests in Room 301',
          type: 'GUEST_REQUEST',
          priority: 'HIGH',
          assignedTo: staff.find(s => s.department === 'Guest Services')?.id,
          dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
          createdBy: users.find(u => u.role === 'RECEPTIONIST')?.id || users[0].id,
          status: 'IN_PROGRESS',
        },
        {
          title: 'Inventory Check - Towels',
          description: 'Weekly inventory check for bathroom towels',
          type: 'ADMINISTRATIVE',
          priority: 'LOW',
          assignedTo: staff.find(s => s.department === 'Housekeeping')?.id,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          createdBy: users.find(u => u.role === 'MANAGER')?.id || users[0].id,
          status: 'PENDING',
        },
        {
          title: 'Room Service Order - Room 202',
          description: 'Deliver continental breakfast to Room 202',
          type: 'ROOM_SERVICE',
          priority: 'MEDIUM',
          assignedTo: staff.find(s => s.department === 'Food & Beverage')?.id,
          dueDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
          createdBy: users.find(u => u.role === 'RECEPTIONIST')?.id || users[0].id,
          status: 'PENDING',
        },
        {
          title: 'AC Maintenance - Room 102',
          description: 'AC unit making noise, needs inspection',
          type: 'MAINTENANCE',
          priority: 'HIGH',
          assignedTo: staff.find(s => s.department === 'Maintenance')?.id,
          dueDate: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
          createdBy: users.find(u => u.role === 'MANAGER')?.id || users[0].id,
          status: 'PENDING',
        },
        {
          title: 'Guest Check-in Assistance',
          description: 'Assist with check-in for family of 4 in Room 301',
          type: 'GUEST_REQUEST',
          priority: 'MEDIUM',
          assignedTo: staff.find(s => s.department === 'Front Office')?.id,
          dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
          createdBy: users.find(u => u.role === 'RECEPTIONIST')?.id || users[0].id,
          status: 'COMPLETED',
          completedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
        {
          title: 'Restaurant Menu Update',
          description: 'Update seasonal menu items for restaurant',
          type: 'ADMINISTRATIVE',
          priority: 'LOW',
          assignedTo: staff.find(s => s.department === 'Food & Beverage')?.id,
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
          createdBy: users.find(u => u.role === 'MANAGER')?.id || users[0].id,
          status: 'PENDING',
        },
        {
          title: 'Deep Clean Suite 401',
          description: 'Deep cleaning for presidential suite after checkout',
          type: 'HOUSEKEEPING',
          priority: 'HIGH',
          assignedTo: staff.find(s => s.department === 'Housekeeping')?.id,
          dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
          createdBy: users.find(u => u.role === 'MANAGER')?.id || users[0].id,
          status: 'PENDING',
        },
        {
          title: 'Guest Concierge Request',
          description: 'Book theater tickets for guests in Room 201',
          type: 'GUEST_REQUEST',
          priority: 'MEDIUM',
          assignedTo: staff.find(s => s.department === 'Guest Services')?.id,
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          createdBy: users.find(u => u.role === 'RECEPTIONIST')?.id || users[0].id,
          status: 'IN_PROGRESS',
        }
      ]
      
      const createdTasks = await Promise.all(
        tasks.map(task => prisma.task.create({ data: task }))
      )
      
      console.log(`✅ Created ${createdTasks.length} tasks`)
    } else {
      console.log(`⚠️ Task data already exists (${existingTasks} records)`)
    }
    
    // 3. Create Inventory Items
    console.log(`\n📦 Creating Inventory Items...`)
    if (existingInventory === 0) {
      const inventoryItems = [
        {
          name: 'Bath Towels',
          description: 'Premium white bath towels',
          category: 'Linens',
          quantity: 150,
          unit: 'pieces',
          minQuantity: 50,
          status: 'IN_STOCK',
        },
        {
          name: 'Hand Towels',
          description: 'Premium white hand towels',
          category: 'Linens',
          quantity: 200,
          unit: 'pieces',
          minQuantity: 75,
          status: 'IN_STOCK',
        },
        {
          name: 'Washcloths',
          description: 'Premium white washcloths',
          category: 'Linens',
          quantity: 300,
          unit: 'pieces',
          minQuantity: 100,
          status: 'IN_STOCK',
        },
        {
          name: 'Toilet Paper',
          description: 'Premium 2-ply toilet paper',
          category: 'Bathroom',
          quantity: 500,
          unit: 'rolls',
          minQuantity: 150,
          status: 'IN_STOCK',
        },
        {
          name: 'Shampoo',
          description: 'Premium hotel shampoo',
          category: 'Bathroom',
          quantity: 200,
          unit: 'bottles',
          minQuantity: 50,
          status: 'IN_STOCK',
        },
        {
          name: 'Body Lotion',
          description: 'Premium hotel body lotion',
          category: 'Bathroom',
          quantity: 180,
          unit: 'bottles',
          minQuantity: 45,
          status: 'IN_STOCK',
        },
        {
          name: 'Coffee Beans',
          description: 'Premium arabica coffee beans',
          category: 'Food & Beverage',
          quantity: 25,
          unit: 'kg',
          minQuantity: 10,
          status: 'IN_STOCK',
        },
        {
          name: 'Tea Bags',
          description: 'Assorted premium tea bags',
          category: 'Food & Beverage',
          quantity: 1000,
          unit: 'bags',
          minQuantity: 200,
          status: 'IN_STOCK',
        },
        {
          name: 'Cleaning Supplies',
          description: 'Multi-purpose cleaning solution',
          category: 'Cleaning',
          quantity: 50,
          unit: 'bottles',
          minQuantity: 15,
          status: 'IN_STOCK',
        },
        {
          name: 'Vacuum Cleaner Bags',
          description: 'Disposable vacuum cleaner bags',
          category: 'Cleaning',
          quantity: 100,
          unit: 'bags',
          minQuantity: 25,
          status: 'IN_STOCK',
        },
        {
          name: 'Light Bulbs',
          description: 'LED light bulbs for guest rooms',
          category: 'Maintenance',
          quantity: 75,
          unit: 'pieces',
          minQuantity: 20,
          status: 'IN_STOCK',
        },
        {
          name: 'Batteries',
          description: 'AA batteries for remote controls',
          category: 'Maintenance',
          quantity: 200,
          unit: 'packs',
          minQuantity: 50,
          status: 'IN_STOCK',
        }
      ]
      
      const createdInventory = await Promise.all(
        inventoryItems.map(item => prisma.inventory.create({ data: item }))
      )
      
      console.log(`✅ Created ${createdInventory.length} inventory items`)
    } else {
      console.log(`⚠️ Inventory data already exists (${existingInventory} records)`)
    }
    
    // 4. Create Gallery Items
    console.log(`\n🖼️ Creating Gallery Items...`)
    if (existingGallery === 0) {
      const galleryItems = [
        {
          title: 'Hotel Lobby',
          imageUrl: '/images/gallery/lobby.jpg',
          category: 'EXTERIOR',
        },
        {
          title: 'Deluxe Suite',
          imageUrl: '/images/gallery/deluxe-suite.jpg',
          category: 'ROOM',
        },
        {
          title: 'Swimming Pool',
          imageUrl: '/images/gallery/pool.jpg',
          category: 'AMENITY',
        },
        {
          title: 'Restaurant Interior',
          imageUrl: '/images/gallery/restaurant.jpg',
          category: 'FOOD',
        },
        {
          title: 'Presidential Suite',
          imageUrl: '/images/gallery/presidential-suite.jpg',
          category: 'ROOM',
        },
        {
          title: 'Fitness Center',
          imageUrl: '/images/gallery/fitness.jpg',
          category: 'AMENITY',
        },
        {
          title: 'Hotel Exterior',
          imageUrl: '/images/gallery/exterior.jpg',
          category: 'EXTERIOR',
        },
        {
          title: 'Standard Room',
          imageUrl: '/images/gallery/standard-room.jpg',
          category: 'ROOM',
        },
        {
          title: 'Spa Area',
          imageUrl: '/images/gallery/spa.jpg',
          category: 'AMENITY',
        },
        {
          title: 'Conference Room',
          imageUrl: '/images/gallery/conference.jpg',
          category: 'AMENITY',
        }
      ]
      
      const createdGallery = await Promise.all(
        galleryItems.map(item => prisma.gallery.create({ data: item }))
      )
      
      console.log(`✅ Created ${createdGallery.length} gallery items`)
    } else {
      console.log(`⚠️ Gallery data already exists (${existingGallery} records)`)
    }
    
    // 5. Create Sample Food Orders
    console.log(`\n🍴 Creating Sample Food Orders...`)
    if (existingOrders === 0) {
      const foodOrders = [
        {
          roomNumber: '101',
          guestId: users.find(u => u.role === 'GUEST')?.id || users[0].id,
          status: 'DELIVERED',
          totalAmount: 45.97,
          specialRequests: 'Extra coffee and no onions',
          deliveryTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          roomNumber: '201',
          guestId: users.find(u => u.role === 'GUEST')?.id || users[0].id,
          status: 'READY',
          totalAmount: 32.98,
          specialRequests: 'Vegetarian options only',
          deliveryTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        },
        {
          roomNumber: '301',
          guestId: users.find(u => u.role === 'GUEST')?.id || users[0].id,
          status: 'PREPARING',
          totalAmount: 28.99,
          specialRequests: 'Medium rare steak',
          deliveryTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        }
      ]
      
      const createdOrders = await Promise.all(
        foodOrders.map(order => prisma.foodOrder.create({ data: order }))
      )
      
      console.log(`✅ Created ${createdOrders.length} food orders`)
    } else {
      console.log(`⚠️ Food order data already exists (${existingOrders} records)`)
    }
    
    // Final Summary
    console.log(`\n🎉 DATA POPULATION COMPLETED!`)
    console.log('=' .repeat(40))
    
    const finalCounts = {
      staff: await prisma.staff.count(),
      tasks: await prisma.task.count(),
      inventory: await prisma.inventory.count(),
      gallery: await prisma.gallery.count(),
      orders: await prisma.foodOrder.count(),
    }
    
    console.log(`📊 Final Database Status:`)
    console.log(`👥 Staff: ${finalCounts.staff}`)
    console.log(`📋 Tasks: ${finalCounts.tasks}`)
    console.log(`📦 Inventory: ${finalCounts.inventory}`)
    console.log(`🖼️ Gallery: ${finalCounts.gallery}`)
    console.log(`🍴 Food Orders: ${finalCounts.orders}`)
    
    console.log(`\n✅ SmartHotel is now fully functional with complete sample data!`)
    
  } catch (error) {
    console.error('❌ Error populating data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateMissingData()
