import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- FORCING DATABASE CLEANUP ---')
  const collections = [
    'AuditLog', 'SyncLog', 'Outbox', 'Task', 'InvoiceLineItem', 'Invoice', 
    'FinancialAdjustment', 'Payment', 'BookingGuest', 'Booking', 
    'RoomStatusHistory', 'Room', 'RoomType', 'Staff', 'LoyaltyAccount', 
    'User', 'MaintenanceRequest', 'FoodOrder', 'OrderItem', 'FoodMenu',
    'RoomImage', 'RoomReview', 'HotelReview', 'GuestPreference', 'Notification'
  ]

  for (const collection of collections) {
    try {
      // @ts-ignore
      await prisma[collection.charAt(0).toLowerCase() + collection.slice(1)].deleteMany()
      console.log(`- Cleared ${collection}`)
    } catch (e) {
      console.log(`- Skipping ${collection} (not found or already clear)`)
    }
  }
  console.log('--- CLEANUP COMPLETE ---')
}

main().finally(() => prisma.$disconnect())
