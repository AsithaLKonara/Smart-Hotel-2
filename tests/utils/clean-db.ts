import prisma from '@/lib/prisma';

export async function cleanDatabase() {
  const tableNames = [
    'Property', 'RoomType', 'Room', 'User', 'Booking', 'Stay', 'Folio', 'Payment',
    'Inventory', 'Vendor', 'PurchaseOrder', 'FoodMenu', 'InternalOrder', 'Task',
    'Employee', 'Shift', 'Attendance', 'CorporateAccount', 'LoyaltyPoint',
    'Role', 'Permission', 'RolePermission', 'FolioLineItem', 'RoutingRule',
    'RoomImage', 'RoomStatusHistory', 'EventSpace', 'BanquetingEvent'
  ];

  try {
    const tableString = tableNames.map(t => `"${t}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableString} CASCADE;`);
    console.log('Database cleaned successfully.');
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}
