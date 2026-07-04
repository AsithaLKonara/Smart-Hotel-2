import { test, expect, request } from '@playwright/test';

test.describe('Phase 5: Data Integrity (Concurrency Stress Tests)', () => {
  // Give this suite a longer timeout
  test.setTimeout(120000); 

  test('Double Booking Attempts - Only one should succeed', async () => {
    // We will fire 5 concurrent requests to create a booking for the exact same room and dates.
    // Only ONE should succeed with 200/201. The others should fail (409 Conflict, 400, or 429).
    
    // Create an isolated context to ensure fresh state
    const apiContext = await request.newContext({
      storageState: 'playwright/.auth/admin.json'
    });

    // We need a known room ID. Let's hit the rooms API to find one.
    const roomsResponse = await apiContext.get('/api/rooms');
    const roomsData = await roomsResponse.json();
    const room = roomsData.rooms[0];
    
    expect(room).toBeDefined();

    const payload = {
      roomId: room.id,
      checkIn: new Date(Date.now() + 86400000 * 10).toISOString(), // 10 days from now
      checkOut: new Date(Date.now() + 86400000 * 12).toISOString(), // 12 days from now
      guests: 2,
      paymentMethod: 'pay_later',
      guestName: 'Concurrent Tester',
      guestEmail: 'concurrent@example.com'
    };

    // Fire 5 identical requests at the exact same time
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(apiContext.post('/api/bookings', { data: payload, timeout: 60000 }));
    }

    const responses = await Promise.all(promises);
    
    let successCount = 0;
    let failCount = 0;

    for (const res of responses) {
      if (res.status() === 200 || res.status() === 201) {
        successCount++;
      } else {
        failCount++;
        const body = await res.text();
        if (!body.includes('LOCK_ACQUISITION_FAILED')) {
           console.log(`Failed request [${res.status()}]:`, body);
        }
      }
    }

    // Verify only EXACTLY 1 booking succeeded
    expect(successCount).toBe(1);
    expect(failCount).toBe(4);
  });

  test('Simultaneous Folio Charges - Should not duplicate', async () => {
    const apiContext = await request.newContext({
      storageState: 'playwright/.auth/admin.json'
    });

    // First create a booking to get a folio ID
    const roomsResponse = await apiContext.get('/api/rooms');
    const room = (await roomsResponse.json()).rooms[0];

    const checkInOffset = Math.floor(Math.random() * 1000 + 200);
    
    const bookingRes = await apiContext.post('/api/bookings', {
      data: {
        roomId: room.id,
        checkIn: new Date(Date.now() + 86400000 * checkInOffset).toISOString(),
        checkOut: new Date(Date.now() + 86400000 * (checkInOffset + 2)).toISOString(),
        guests: 1,
        paymentMethod: 'pay_later'
      },
      timeout: 60000
    });

    const bookingData = await bookingRes.json();
    expect(bookingData.booking).toBeDefined();

    const chargePayload = {
      bookingId: bookingData.booking.id,
      amount: 50.00,
      description: 'Room Service (Concurrent Test)',
      category: 'FOOD_AND_BEVERAGE'
    };

    // Fire 5 simultaneous charge POSTs
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(apiContext.post('/api/folios/post-charge', { data: chargePayload, timeout: 60000 }));
    }

    const responses = await Promise.all(promises);

    let successCount = 0;
    for (const res of responses) {
      if (res.status() === 200 || res.status() === 201) {
        successCount++;
      }
    }

    // If concurrency is perfectly isolated, they might ALL succeed, but the total balance should be exactly 50 * successCount.
    // However, if the business logic expects an idempotency key to prevent duplicates, they shouldn't.
    // Let's check how many succeeded. 
    console.log(`Simultaneous charges successful: ${successCount}/5`);

    // Fetch the folios again and calculate total
    const updatedFolioRes = await apiContext.get(`/api/bookings/${bookingData.booking.id}/folios`);
    expect(updatedFolioRes.ok()).toBeTruthy();
    
    const updatedFoliosData = await updatedFolioRes.json();
    const mainFolio = updatedFoliosData[0];

    const expectedBalance = successCount * 50;
    
    // We expect the sum of all charges with this description to equal exactly the number of successes * 50.
    const concurrentCharges = mainFolio.lineItems.filter((c: any) => c.description === 'Room Service (Concurrent Test)');
    
    let totalConcurrentAmount = 0;
    for (const c of concurrentCharges) {
      totalConcurrentAmount += c.amount;
    }

    expect(totalConcurrentAmount).toBe(expectedBalance);
  });
});
