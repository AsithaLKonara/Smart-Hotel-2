import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Phase 3 DDD Backfill...')

  // 1. Backfill Folios and FolioLineItems from Invoices
  console.log('Backfilling Folios from Invoices...')
  const invoices = await prisma.invoice.findMany({
    include: { lineItems: true }
  })
  
  for (const invoice of invoices) {
    const existingFolio = await prisma.folio.findFirst({
      where: { bookingId: invoice.bookingId }
    })
    
    if (!existingFolio) {
      const newFolio = await prisma.folio.create({
        data: {
          bookingId: invoice.bookingId,
          type: invoice.folioType || 'MASTER',
          status: invoice.status === 'PAID' ? 'SETTLED' : 'OPEN'
        }
      })
      
      for (const item of invoice.lineItems) {
        await prisma.folioLineItem.create({
          data: {
            folioId: newFolio.id,
            description: item.description,
            amount: item.totalPrice,
            category: item.category
          }
        })
      }
    }
  }
  console.log(`Folios backfilled for ${invoices.length} invoices.`)

  // 2. Backfill RoomAssignments and StayEvents from Bookings
  console.log('Backfilling RoomAssignments from Bookings...')
  const bookings = await prisma.booking.findMany()
  
  for (const booking of bookings) {
    const existingAssignment = await prisma.roomAssignment.findFirst({
      where: { bookingId: booking.id }
    })
    
    if (!existingAssignment) {
      await prisma.roomAssignment.create({
        data: {
          bookingId: booking.id,
          roomId: booking.roomId,
          startDate: booking.checkIn,
          endDate: booking.checkOut,
          status: ['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(booking.status) ? 'COMPLETED' : 'ACTIVE'
        }
      })
      
      await prisma.stayEvent.create({
        data: {
          bookingId: booking.id,
          type: 'BOOKED',
          notes: 'Legacy booking backfill'
        }
      })
    }
  }
  console.log(`RoomAssignments backfilled for ${bookings.length} bookings.`)

  // 3. Backfill InventoryItem and InventoryMovement
  console.log('Backfilling InventoryItems from legacy Inventory...')
  const inventoryItems = await prisma.inventory.findMany()
  
  for (const item of inventoryItems) {
    const existingDDDItem = await prisma.inventoryItem.findUnique({
      where: { id: item.id }
    })
    
    if (!existingDDDItem) {
      await prisma.inventoryItem.create({
        data: {
          id: item.id,
          name: item.name,
          category: item.category,
          unit: item.unit,
          unitPrice: 0
        }
      })
      
      await prisma.inventoryMovement.create({
        data: {
          itemId: item.id,
          type: 'RECEIPT',
          quantity: Number(item.quantity),
          notes: 'Legacy inventory initial backfill'
        }
      })
    }
  }
  console.log(`Inventory backfilled for ${inventoryItems.length} items.`)

  console.log('Phase 3 DDD Backfill Completed Successfully.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
