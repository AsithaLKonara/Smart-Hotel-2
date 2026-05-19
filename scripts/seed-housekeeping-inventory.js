const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INVENTORY_DATA = [
  {
    name: 'Egyptian Cotton Bed Sheets (King)',
    description: 'Ultra-premium 800 thread count cotton sheets for king beds',
    category: 'Linen',
    quantity: 120,
    unit: 'pcs',
    minQuantity: 30,
    status: 'IN_STOCK'
  },
  {
    name: 'Egyptian Cotton Pillowcases',
    description: 'Ultra-premium 800 thread count cotton pillowcases',
    category: 'Linen',
    quantity: 250,
    unit: 'pcs',
    minQuantity: 50,
    status: 'IN_STOCK'
  },
  {
    name: 'Luxury Velvet Bath Towels',
    description: 'Heavyweight premium plush guest bath towels',
    category: 'Linen',
    quantity: 180,
    unit: 'pcs',
    minQuantity: 40,
    status: 'IN_STOCK'
  },
  {
    name: 'Hermès Toiletries Set (Shampoo & Body Wash)',
    description: 'Designer guest bathroom toiletries replenishment pack',
    category: 'Toiletries',
    quantity: 15,
    unit: 'sets',
    minQuantity: 25,
    status: 'LOW_STOCK'
  },
  {
    name: 'SmartHotel Custom Slippers',
    description: 'Comfy guest room slippers with gold monogram embroidery',
    category: 'Toiletries',
    quantity: 300,
    unit: 'pairs',
    minQuantity: 60,
    status: 'IN_STOCK'
  },
  {
    name: 'Veuve Clicquot Champagne (750ml)',
    description: 'VIP mini-bar inventory replenishment bottles',
    category: 'Food & Beverage',
    quantity: 0,
    unit: 'bottles',
    minQuantity: 10,
    status: 'OUT_OF_STOCK'
  },
  {
    name: 'Acqua Panna Still Water (1L)',
    description: 'Premium glass bottled still mineral water',
    category: 'Food & Beverage',
    quantity: 140,
    unit: 'bottles',
    minQuantity: 30,
    status: 'IN_STOCK'
  },
  {
    name: 'Artisanal Nespresso Pods (Variety Pack)',
    description: 'Premium coffee replenishment pods for guest rooms',
    category: 'Food & Beverage',
    quantity: 450,
    unit: 'pods',
    minQuantity: 100,
    status: 'IN_STOCK'
  }
];

const TASK_DATA = [
  {
    title: 'Deep Clean Penthouse Suite',
    description: 'Complete detail clean of VIP Penthouse suite, carpet steam, and window polish.',
    type: 'HOUSEKEEPING',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
  },
  {
    title: 'HVAC Vent Cleaning (Floor 3)',
    description: 'Routine maintenance and filter replacement of central HVAC vents on Floor 3.',
    type: 'MAINTENANCE',
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
  },
  {
    title: 'Guest Bathroom Plumbing Repair',
    description: 'Repair slow-draining bath shower block in Room 204.',
    type: 'MAINTENANCE',
    priority: 'URGENT',
    status: 'PENDING',
    dueDate: new Date()
  },
  {
    title: 'Replace Hallway Bulb (Floor 1)',
    description: 'Replace flickering LED bulb near receptionist main desk elevator.',
    type: 'MAINTENANCE',
    priority: 'LOW',
    status: 'COMPLETED',
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
  },
  {
    title: 'Replenish Room 405 Mini-Bar',
    description: 'Restock premium snacks and spirits for arriving VIP guest.',
    type: 'HOUSEKEEPING',
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: new Date()
  }
];

async function runWithRetry(fn, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed. Error: ${err.message}. Retrying in ${delay}ms...`);
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

async function main() {
  console.log('Starting seed script for Housekeeping & Inventory...');

  // 1. Seed Inventory
  console.log('\n--- Seeding Inventory ---');
  for (const item of INVENTORY_DATA) {
    await runWithRetry(async () => {
      // Check if item already exists to prevent duplicate seeding
      const existing = await prisma.inventory.findFirst({
        where: { name: item.name }
      });

      if (!existing) {
        const created = await prisma.inventory.create({
          data: {
            name: item.name,
            description: item.description,
            category: item.category,
            quantity: BigInt(item.quantity),
            unit: item.unit,
            minQuantity: BigInt(item.minQuantity),
            status: item.status
          }
        });
        console.log(`Created inventory item: "${created.name}"`);
      } else {
        console.log(`Inventory item already exists: "${item.name}"`);
      }
    });
  }

  // 2. Fetch Rooms to update states to DIRTY / CLEANING
  console.log('\n--- Updating Room Statuses for Housekeeping Hub ---');
  await runWithRetry(async () => {
    const rooms = await prisma.room.findMany({ take: 4 });
    if (rooms.length > 0) {
      // Set status to DIRTY, CLEANING, INSPECTION_PENDING respectively for realistic dashboard display
      const statuses = ['DIRTY', 'CLEANING', 'INSPECTION_PENDING', 'MAINTENANCE'];
      for (let idx = 0; idx < Math.min(rooms.length, statuses.length); idx++) {
        const room = rooms[idx];
        const status = statuses[idx];
        await prisma.room.update({
          where: { id: room.id },
          data: { status }
        });
        console.log(`Updated Room ${room.number} status to "${status}"`);
      }
    } else {
      console.log('No rooms found in database to update status.');
    }
  });

  // 3. Seed Tasks
  console.log('\n--- Seeding Tasks ---');
  // Let's grab a staff member to assign tasks if possible
  const staffMember = await runWithRetry(async () => {
    return await prisma.staff.findFirst();
  });

  for (const task of TASK_DATA) {
    await runWithRetry(async () => {
      const existing = await prisma.task.findFirst({
        where: { title: task.title }
      });

      if (!existing) {
        const created = await prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            type: task.type,
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDate,
            assignedTo: staffMember ? staffMember.id : null
          }
        });
        console.log(`Created task: "${created.title}"${staffMember ? ` (assigned to ${staffMember.name})` : ''}`);
      } else {
        console.log(`Task already exists: "${task.title}"`);
      }
    });
  }

  console.log('\nDatabase seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error running seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
