const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Permissions...');

  const modules = [
    {
      name: 'ORDERS & FULFILLMENT',
      permissions: [
        { action: 'ORDERS_VIEW', displayName: 'Orders — View', description: 'View all orders in the system' },
        { action: 'ORDERS_CREATE', displayName: 'Orders — Create', description: 'Create manual internal orders' },
        { action: 'ORDERS_EDIT', displayName: 'Orders — Edit Status', description: 'Change status of existing orders' },
        { action: 'ORDERS_CANCEL', displayName: 'Orders — Cancel / Refund', description: 'Cancel or refund orders' }
      ]
    },
    {
      name: 'POINT OF SALE (POS)',
      permissions: [
        { action: 'POS_OPEN_CLOSE', displayName: 'POS — Open / Close Shift', description: 'Open and close POS registers' },
        { action: 'POS_SALES', displayName: 'POS — Sales Mode', description: 'Process transactions in Sales mode' },
        { action: 'POS_RETURNS', displayName: 'POS — Returns Mode', description: 'Process returns in POS' },
        { action: 'POS_EXCHANGE', displayName: 'POS — Exchange Mode', description: 'Process exchanges in POS' }
      ]
    },
    {
      name: 'RESERVATIONS',
      permissions: [
        { action: 'BOOKING_VIEW', displayName: 'Bookings — View', description: 'View guest bookings' },
        { action: 'BOOKING_CREATE', displayName: 'Bookings — Create', description: 'Create new bookings' },
        { action: 'BOOKING_MODIFY', displayName: 'Bookings — Modify', description: 'Modify booking dates and rooms' },
        { action: 'BOOKING_CANCEL', displayName: 'Bookings — Cancel', description: 'Cancel existing bookings' }
      ]
    },
    {
      name: 'FRONT DESK',
      permissions: [
        { action: 'FRONTDESK_CHECKIN', displayName: 'Check-In Guests', description: 'Process guest check-ins' },
        { action: 'FRONTDESK_CHECKOUT', displayName: 'Check-Out Guests', description: 'Process guest check-outs and billing' },
        { action: 'FRONTDESK_ASSIGN_ROOM', displayName: 'Assign Rooms', description: 'Change room assignments' }
      ]
    },
    {
      name: 'INVENTORY & HOUSEKEEPING',
      permissions: [
        { action: 'HK_VIEW', displayName: 'Housekeeping — View Schedule', description: 'View cleaning tasks' },
        { action: 'HK_ASSIGN', displayName: 'Housekeeping — Assign Tasks', description: 'Assign tasks to staff' },
        { action: 'INV_MANAGE', displayName: 'Inventory — Manage Stock', description: 'Adjust inventory counts' }
      ]
    },
    {
      name: 'SYSTEM SETTINGS',
      permissions: [
        { action: 'SETTINGS_VIEW', displayName: 'Settings — View', description: 'View system configurations' },
        { action: 'SETTINGS_EDIT', displayName: 'Settings — Edit', description: 'Modify global configurations' },
        { action: 'RBAC_MANAGE', displayName: 'Authority — Manage Roles', description: 'Create and edit user roles' }
      ]
    }
  ];

  for (const mod of modules) {
    for (const perm of mod.permissions) {
      await prisma.permission.upsert({
        where: { action: perm.action },
        update: {
          module: mod.name,
          displayName: perm.displayName,
          description: perm.description
        },
        create: {
          action: perm.action,
          module: mod.name,
          displayName: perm.displayName,
          description: perm.description
        }
      });
    }
  }

  // Ensure SUPER_ADMIN role exists and has all permissions
  const allPerms = await prisma.permission.findMany();
  
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: { isCustom: false, status: 'ACTIVE' },
    create: {
      name: 'SUPER_ADMIN',
      description: 'System Administrator with full access',
      isCustom: false,
      status: 'ACTIVE'
    }
  });

  // Re-link all permissions to SUPER_ADMIN
  for (const p of allPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: p.id
        }
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: p.id
      }
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
