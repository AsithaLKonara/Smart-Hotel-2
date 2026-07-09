import { prisma } from './lib/db';

async function main() {
  try {
    const room = await prisma.room.findFirst({
      where: { status: 'AVAILABLE' }
    });

    if (!room) {
      console.log('No available rooms to test booking.');
      return;
    }

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);

    const res = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: room.id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guests: 1,
        guestName: 'E2E Test Guest',
        guestEmail: 'e2e@test.com',
        paymentMethod: 'pay_later'
      })
    });

    const data = await res.json();
    console.log('Status:', res.status);
    if (res.status !== 201 && res.status !== 401) {
       console.log('Response:', data);
    } else {
       console.log('Result:', data);
    }
  } catch (e) {
    console.error(e);
  }
}

main();
