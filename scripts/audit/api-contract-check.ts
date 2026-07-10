/**
 * API Contract Check
 * Tests webhook boundaries for security and error handling vulnerabilities.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function auditApiContracts() {
  console.log('--- API Contract Audit ---\n');
  let hasErrors = false;

  // 1. OTA Webhook Authentication & Validation Bypass
  console.log('Testing Booking.com Webhook Authentication...');
  try {
    const maliciousPayload = `<?xml version="1.0" encoding="UTF-8"?>
      <OTA_HotelResNotifRS>
        <MaliciousPayload>true</MaliciousPayload>
      </OTA_HotelResNotifRS>`;
      
    const res = await fetch(`${BASE_URL}/api/integrations/booking-com/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml'
      },
      body: maliciousPayload
    });

    if (res.status === 200 || res.status === 201) {
      console.error('❌ CRITICAL: Booking.com webhook accepted an unauthenticated, arbitrary XML payload with a 200 OK.');
      hasErrors = true;
    } else if (res.status === 500) {
      console.error('❌ CRITICAL: Booking.com webhook crashed (500) instead of rejecting the invalid payload (400) or unauthorized request (401).');
      hasErrors = true;
    } else {
      console.log(`✅ Booking.com webhook rejected payload safely (Status: ${res.status}).`);
    }
  } catch (err: any) {
    console.error('Failed to reach webhook endpoint:', err.message);
  }

  // 2. Stripe Webhook Empty Payload Handling
  console.log('\nTesting Stripe Webhook Error Handling...');
  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'fake-signature'
      },
      body: JSON.stringify({})
    });

    // Should return 400 Bad Request because of invalid signature
    if (res.status === 400) {
      console.log('✅ Stripe webhook correctly rejected invalid signature with 400.');
    } else if (res.status === 500) {
      console.error('❌ CRITICAL: Stripe webhook threw a 500 error on invalid signature. This will trigger endless Stripe retries.');
      hasErrors = true;
    } else {
      console.warn(`⚠️ Unexpected Stripe webhook status: ${res.status}`);
    }
  } catch (err: any) {
    console.error('Failed to reach Stripe webhook endpoint:', err.message);
  }

  console.log('\n--- Audit Complete ---');
  if (hasErrors) {
    process.exit(1);
  }
}

auditApiContracts().catch(console.error);
