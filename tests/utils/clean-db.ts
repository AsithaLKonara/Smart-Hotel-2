import prisma from '@/lib/prisma';

export async function cleanDatabase() {
  const tableNames = [
    'Property', 'RoomType', 'Room', 'User', 'Booking', 'Stay', 'Folio', 'Payment',
    'InventoryItem', 'Vendor', 'PurchaseOrder', 'FoodMenu', 'InternalOrder', 'Task',
    'Employee', 'Shift', 'Attendance', 'CorporateAccount', 'LoyaltyPoint',
    'Role', 'Permission', 'RolePermission', 'FolioLineItem', 'RoutingRule',
    'RoomImage', 'RoomStatusHistory', 'EventSpace', 'BanquetingEvent'
  ];

  try {
    for (const table of tableNames) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }
    console.log('Database cleaned successfully.');
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}
