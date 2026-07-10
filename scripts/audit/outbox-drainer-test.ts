/**
 * Outbox Drainer Test (Dual-Write / Transactional Event Verification)
 * Proves that events written to the Outbox table are correctly polled,
 * routed, and processed by the ReconciliationWorker.
 */

import { PrismaClient } from '@prisma/client';
import { ReconciliationWorker } from '../../lib/reconciliation-worker';
import { RealtimeEvents } from '../../lib/realtime';

const prisma = new PrismaClient();

async function testOutboxDrainer() {
  console.log('--- Outbox Drainer / Transactional Event Audit ---\n');

  // We will mock the RealtimeEvents static methods to prove they get called
  let bookingUpdatedFired = false;
  let opsMessageFired = false;

  // Save originals to restore later if needed
  const originalEmitBookingUpdated = RealtimeEvents.emitBookingUpdated;
  const originalEmitOpsMessage = RealtimeEvents.emitOpsMessage;

  // Mock
  RealtimeEvents.emitBookingUpdated = async (payload: any) => {
    console.log(`📡 Intercepted emitBookingUpdated! Payload:`, payload);
    bookingUpdatedFired = true;
  };

  RealtimeEvents.emitOpsMessage = async (payload: any) => {
    console.log(`📡 Intercepted emitOpsMessage! Payload:`, payload);
    opsMessageFired = true;
  };

  try {
    // 1. Manually insert mock events into the Outbox
    console.log('Inserting mock events into Outbox...');
    
    const mockBookingId = `TEST_BOOKING_${Date.now()}`;
    
    await prisma.outbox.createMany({
      data: [
        {
          topic: 'BOOKING_UPDATED',
          payload: { id: mockBookingId, paymentStatus: 'completed' },
          status: 'PENDING'
        },
        {
          topic: 'UNKNOWN_CUSTOM_TOPIC',
          payload: { message: 'Some generic ops message' },
          status: 'PENDING'
        }
      ]
    });

    console.log('✅ Mock events inserted.\n');

    // 2. Trigger the ReconciliationWorker drain function
    console.log('Triggering ReconciliationWorker.drainOutbox()...');
    await ReconciliationWorker.drainOutbox();
    console.log('✅ Drain cycle complete.\n');

    // 3. Verify the correct events fired
    if (bookingUpdatedFired && opsMessageFired) {
      console.log('✅ SUCCESS: The outbox drainer correctly routed BOOKING_UPDATED and generic topics.');
    } else {
      console.error('❌ CRITICAL FAILURE: The outbox drainer failed to route the mocked events.');
      if (!bookingUpdatedFired) console.error('   -> emitBookingUpdated was NOT fired.');
      if (!opsMessageFired) console.error('   -> emitOpsMessage was NOT fired.');
      process.exit(1);
    }

    // 4. Verify database state
    console.log('\nChecking Outbox table state...');
    
    const remainingPending = await prisma.outbox.count({
      where: {
        payload: {
          path: ['id'],
          equals: mockBookingId
        },
        status: 'PENDING'
      }
    });

    if (remainingPending === 0) {
       console.log('✅ SUCCESS: Events were marked as PROCESSED in the database.');
    } else {
       console.error(`❌ CRITICAL FAILURE: Found ${remainingPending} events stuck in PENDING status!`);
       process.exit(1);
    }

  } finally {
    // Cleanup mocks
    RealtimeEvents.emitBookingUpdated = originalEmitBookingUpdated;
    RealtimeEvents.emitOpsMessage = originalEmitOpsMessage;

    // Cleanup DB
    console.log('\nCleaning up test data...');
    const deleted = await prisma.outbox.deleteMany({
      where: {
        status: 'PROCESSED'
      }
    });
    console.log(`Deleted ${deleted.count} PROCESSED outbox events.`);

    await prisma.$disconnect();
    console.log('\n--- Audit Complete ---');
  }
}

testOutboxDrainer().catch(console.error);
