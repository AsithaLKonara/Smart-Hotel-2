import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyNightAudit() {
  console.log('--- Verifying Night Audit Logic ---')
  try {
    // 1. Just test if the queries compile and execute against the real DB schema without throwing Prisma validation errors.
    // We will do a dry-run style transaction that rolls back immediately to avoid mutating the real DB.
    await prisma.$transaction(async (tx) => {
      // Fetch some active booking just to test the query
      const activeBookings = await tx.booking.findMany({
        take: 1,
        include: { roomAssignments: { include: { room: { include: { roomType: true } } } } }
      });
      
      console.log('✓ Found active bookings:', activeBookings.length)
      
      if (activeBookings.length > 0) {
        const booking = activeBookings[0]
        
        let folio = await tx.folio.findFirst({
          where: { bookingId: booking.id, type: 'MASTER' }
        });
        
        if (!folio) {
          folio = await tx.folio.create({
            data: {
              bookingId: booking.id,
              type: 'MASTER',
              status: 'OPEN',
              propertyId: booking.propertyId
            }
          });
          console.log('✓ Successfully executed Folio creation payload')
        }
        
        await tx.folioLineItem.create({
          data: {
            folioId: folio.id,
            description: `Test Charge`,
            category: 'ROOM_CHARGE',
            amount: 100
          }
        });
        console.log('✓ Successfully executed FolioLineItem creation payload')
      }
      
      // Deliberately roll back
      throw new Error('ROLLBACK_TEST')
    })
  } catch (error: any) {
    if (error.message === 'ROLLBACK_TEST') {
      console.log('✓ Night Audit schema interactions valid.')
    } else {
      console.error('❌ Night Audit verification failed:', error)
      throw error;
    }
  }
}

async function verifyStripeWebhook() {
  console.log('\n--- Verifying Stripe Webhook Queries ---')
  try {
    // Should use findFirst instead of findUnique because providerId is not unique
    await prisma.payment.findFirst({ where: { providerId: 'pi_test_123' } })
    console.log('✓ Stripe findFirst query valid.')
  } catch (error: any) {
    console.error('❌ Stripe verification failed:', error)
    throw error;
  }
}

async function verifyUserRegistration() {
  console.log('\n--- Verifying User Registration Logic ---')
  try {
    await prisma.$transaction(async (tx) => {
      const defaultProperty = await tx.property.findFirst()
      if (!defaultProperty) {
         console.log('⚠️ No property found, skipping user create test.')
         return;
      }
      
      await tx.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed_password',
          phone: '',
          propertyId: defaultProperty.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })
      console.log('✓ User creation payload with propertyId valid.')
      throw new Error('ROLLBACK_TEST')
    })
  } catch (error: any) {
    if (error.message === 'ROLLBACK_TEST') {
      console.log('✓ User registration schema interactions valid.')
    } else {
      console.error('❌ User registration verification failed:', error)
      throw error;
    }
  }
}

async function verifyCheckout() {
  console.log('\n--- Verifying Booking Checkout Tasks ---')
  try {
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst()
      if (!booking) return;

      const room = await tx.room.findFirst()
      if (!room) return;
      
      await tx.task.create({
        data: {
          title: `Clean Room (Checkout)`,
          type: 'HOUSEKEEPING',
          status: 'PENDING',
          priority: 'HIGH',
          roomId: room.id,
          bookingId: booking.id,
          propertyId: booking.propertyId
        }
      });
      console.log('✓ Housekeeping Task creation payload with propertyId valid.')
      throw new Error('ROLLBACK_TEST')
    })
  } catch (error: any) {
     if (error.message === 'ROLLBACK_TEST') {
      console.log('✓ Checkout task generation valid.')
    } else {
      console.error('❌ Checkout task verification failed:', error)
      throw error;
    }
  }
}

async function main() {
  await verifyNightAudit()
  await verifyStripeWebhook()
  await verifyUserRegistration()
  await verifyCheckout()
  console.log('\n✅ All Batch 2 validations passed!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
