import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Seeding mock data ---')
  const prop = await prisma.property.create({
    data: {
      name: 'Test Hotel',
      code: 'TEST' + Date.now(),
      address: '123 Test',
      city: 'Test City',
      country: 'Test Country'
    }
  })

  const roomType = await prisma.roomType.create({
    data: {
      propertyId: prop.id,
      name: 'Test Type',
      baseRate: 100,
      capacity: 2
    }
  })

  const room = await prisma.room.create({
    data: {
      propertyId: prop.id,
      roomTypeId: roomType.id,
      number: '999',
      floor: 1,
      status: 'AVAILABLE'
    }
  })

  const guest = await prisma.user.create({
    data: {
      name: 'Test Guest',
      email: 'guest' + Date.now() + '@test.com',
      password: 'password',
      propertyId: prop.id
    }
  })

  const booking = await prisma.booking.create({
    data: {
      confirmationCode: 'TEST001',
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000),
      status: 'CHECKED_IN',
      primaryGuestId: guest.id,
      propertyId: prop.id
    }
  })

  await prisma.roomAssignment.create({
    data: {
      bookingId: booking.id,
      roomId: room.id,
      status: 'ACTIVE'
    }
  })

  try {
    console.log('--- Verifying Night Audit Logic ---')
    await prisma.$transaction(async (tx) => {
      const activeBookings = await tx.booking.findMany({
        where: { status: 'CHECKED_IN' },
        include: { roomAssignments: { include: { room: { include: { roomType: true } } } } }
      });
      
      console.log('✓ Found active bookings:', activeBookings.length)
      
      for (const b of activeBookings) {
        let folio = await tx.folio.findFirst({
          where: { bookingId: b.id, type: 'MASTER' }
        });
        
        if (!folio) {
          folio = await tx.folio.create({
            data: {
              bookingId: b.id,
              type: 'MASTER',
              status: 'OPEN',
              propertyId: b.propertyId
            }
          });
          console.log('✓ Successfully executed Folio creation')
        }
        
        await tx.folioLineItem.create({
          data: {
            folioId: folio.id,
            description: `Test Charge`,
            category: 'ROOM_CHARGE',
            amount: 100
          }
        });
        console.log('✓ Successfully executed FolioLineItem creation')
      }
      throw new Error('ROLLBACK_TEST')
    })
  } catch (e: any) {
    if (e.message !== 'ROLLBACK_TEST') throw e
  }

  try {
    console.log('--- Verifying User Registration Logic ---')
    await prisma.$transaction(async (tx) => {
      const defaultProperty = await tx.property.findFirst()
      await tx.user.create({
        data: {
          name: 'Test User 2',
          email: 'test2' + Date.now() + '@example.com',
          password: 'hashed_password',
          phone: '',
          propertyId: defaultProperty!.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })
      console.log('✓ User creation payload valid.')
      throw new Error('ROLLBACK_TEST')
    })
  } catch (e: any) {
    if (e.message !== 'ROLLBACK_TEST') throw e
  }

  try {
    console.log('--- Verifying Booking Checkout Tasks ---')
    await prisma.$transaction(async (tx) => {
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
      console.log('✓ Housekeeping Task creation valid.')
      throw new Error('ROLLBACK_TEST')
    })
  } catch (e: any) {
    if (e.message !== 'ROLLBACK_TEST') throw e
  }

  console.log('--- Cleaning up ---')
  await prisma.roomAssignment.deleteMany({ where: { bookingId: booking.id } })
  await prisma.booking.delete({ where: { id: booking.id } })
  await prisma.user.delete({ where: { id: guest.id } })
  await prisma.room.delete({ where: { id: room.id } })
  await prisma.roomType.delete({ where: { id: roomType.id } })
  await prisma.property.delete({ where: { id: prop.id } })
  
  console.log('\n✅ All full integration tests passed!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
