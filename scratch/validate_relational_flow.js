const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING RELATIONAL FLOW VALIDATION (POSTGRESQL) ---');

  try {
    // 1. Create Room Type
    console.log('1. Creating Room Type...');
    const roomType = await prisma.roomType.create({
      data: {
        name: 'Presidential Suite - Test',
        description: 'Elite testing suite',
        baseRate: 500.0,
        capacity: 4,
        amenities: ['Private Pool', 'Butler Service']
      }
    });
    console.log(`✅ Room Type created: ${roomType.id}`);

    // 2. Create Room
    console.log('2. Creating Room...');
    const room = await prisma.room.create({
      data: {
        number: 'T-999',
        floor: 99,
        roomTypeId: roomType.id,
        status: 'AVAILABLE'
      }
    });
    console.log(`✅ Room created: ${room.id}`);

    // 3. Create User (Guest)
    console.log('3. Creating Guest...');
    const guest = await prisma.user.create({
      data: {
        email: 'test.guest@example.com',
        name: 'Test Guest',
        password: 'hashed_password_placeholder',
        role: 'GUEST'
      }
    });
    console.log(`✅ Guest created: ${guest.id}`);

    // 4. Create Booking
    console.log('4. Creating Booking...');
    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkIn.getDate() + 2);

    const booking = await prisma.booking.create({
      data: {
        confirmationCode: 'TST-VFY-001',
        checkIn: checkIn,
        checkOut: checkOut,
        roomId: room.id,
        primaryGuestId: guest.id,
        totalAmount: 1000.0,
        status: 'CONFIRMED'
      }
    });
    console.log(`✅ Booking created: ${booking.id}`);

    // 5. Create Invoice (The "Zombie" Test)
    console.log('5. Creating Invoice (Relational Test)...');
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: 'INV-TST-001',
        bookingId: booking.id,
        subtotal: 900.0,
        taxAmount: 100.0,
        grandTotal: 1000.0,
        status: 'PAID',
        lineItems: {
          create: [
            {
              description: 'Suite Stay (2 Nights)',
              quantity: 1,
              unitPrice: 900.0,
              totalPrice: 900.0,
              category: 'ROOM'
            }
          ]
        }
      }
    });
    console.log(`✅ Invoice created: ${invoice.id}`);

    // 6. Test Complex Inclusion (The "Spending" API Test)
    console.log('6. Testing Complex Inclusion...');
    const spendingData = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        room: {
          include: {
            roomType: true
          }
        },
        invoices: {
          include: {
            lineItems: true
          }
        }
      }
    });
    
    if (spendingData && spendingData.invoices.length > 0 && spendingData.invoices[0].lineItems.length > 0) {
      console.log('✅ Complex relational query successful.');
    } else {
      throw new Error('Relation inclusion failed');
    }

    console.log('--- CLEANING UP TEST DATA ---');
    // Cascade delete test (if configured) or manual cleanup
    await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: invoice.id } });
    await prisma.invoice.delete({ where: { id: invoice.id } });
    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.user.delete({ where: { id: guest.id } });
    await prisma.room.delete({ where: { id: room.id } });
    await prisma.roomType.delete({ where: { id: roomType.id } });
    console.log('✅ Cleanup successful.');

    console.log('--- RELATIONAL FLOW VALIDATION PASSED ---');

  } catch (error) {
    console.error('❌ VALIDATION FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
