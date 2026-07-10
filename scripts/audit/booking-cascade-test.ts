import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runTest() {
  console.log('🔄 Starting Cascade Deletion Regression Test...')
  let testBookingId;
  let testRoomId;
  
  try {
    // 1. Setup Data: Create a room, booking, and related entities
    const roomType = await prisma.roomType.findFirst()
    if (!roomType) throw new Error('No RoomType found')
    
    const user = await prisma.user.findFirst()
    if (!user) throw new Error('No User found')

    const room = await prisma.room.create({
      data: {
        number: `TEST-CASC-${Date.now()}`,
        floor: 1,
        roomTypeId: roomType.id,
      }
    })
    testRoomId = room.id;

    const booking = await prisma.booking.create({
      data: {
        confirmationCode: `TCASC${Date.now()}`,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        primaryGuestId: user.id,
        totalAmount: 100,
        status: 'PENDING',
        stay: {
          create: {
            roomId: room.id,
            status: 'EXPECTED'
          }
        },
        additionalGuests: {
          create: {
            name: 'John Test',
          }
        },
        roomAssignments: {
          create: {
            roomId: room.id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000),
          }
        },
        stayEvents: {
          create: {
            type: 'NOTE',
            notes: 'Test event'
          }
        }
      },
      include: {
        stay: true,
        additionalGuests: true,
        roomAssignments: true,
        stayEvents: true
      }
    })
    
    testBookingId = booking.id;
    console.log(`✅ Created test booking ${booking.id} with related entities.`)

    // 2. Perform Deletion
    await prisma.booking.delete({
      where: { id: booking.id }
    })
    console.log(`✅ Deleted booking ${booking.id}`)

    // 3. Verify Deletion Cascaded
    const stay = await prisma.stay.findFirst({ where: { bookingId: booking.id } })
    const guest = await prisma.bookingGuest.findFirst({ where: { bookingId: booking.id } })
    const assignment = await prisma.roomAssignment.findFirst({ where: { bookingId: booking.id } })
    const event = await prisma.stayEvent.findFirst({ where: { bookingId: booking.id } })

    if (stay || guest || assignment || event) {
      console.error('❌ CASCADE TEST FAILED: Related entities still exist!')
      if (stay) console.error('- Stay still exists')
      if (guest) console.error('- BookingGuest still exists')
      if (assignment) console.error('- RoomAssignment still exists')
      if (event) console.error('- StayEvent still exists')
      process.exit(1)
    }

    console.log('🎉 CASCADE TEST PASSED: All related entities were successfully deleted.')
  } catch (err) {
    console.error('❌ Test encountered an error:', err)
    process.exit(1)
  } finally {
    // Cleanup
    if (testRoomId) {
      await prisma.room.delete({ where: { id: testRoomId } }).catch(() => {})
    }
    await prisma.$disconnect()
  }
}

runTest()
