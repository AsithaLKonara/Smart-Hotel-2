import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@smarthotel.com';
const ADMIN_PASSWORD = 'SmartHotel@2025!';

async function measureEndpoint(name: string, url: string, method: string, headers: Record<string, string> = {}, body: any = null) {
  const start = performance.now();
  const options: RequestInit = { method, headers: { ...headers } };
  if (body) {
    options.body = JSON.stringify(body);
    (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, options);
  const duration = performance.now() - start;
  
  if (!response.ok) {
    console.error(`❌ ${name} failed with status ${response.status}`);
    try {
      console.error(await response.json());
    } catch (e) {
      console.error(await response.text());
    }
  } else {
    console.log(`✅ ${name} completed in ${duration.toFixed(2)}ms (Status: ${response.status})`);
  }
  return duration;
}

async function main() {
  console.log('--- Phase 7 Backend Actions Measurement ---\n');

  // Authenticate
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfCookie = csrfRes.headers.get('set-cookie')?.split(';')[0];
  
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookie || ''
    } as Record<string, string>,
    body: new URLSearchParams({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      csrfToken: csrfData.csrfToken,
      redirect: 'false',
      json: 'true'
    })
  });

  const sessionTokenCookie = loginRes.headers.get('set-cookie')
    ?.split(',')
    .map(c => c.trim())
    .find(c => c.startsWith('next-auth.session-token=') || c.startsWith('__Secure-next-auth.session-token='))
    ?.split(';')[0];

  if (!sessionTokenCookie) {
    throw new Error('Failed to login and get session token');
  }

  const headers = { 'Cookie': sessionTokenCookie };

  // 1. Report Generation (Analytics Dashboard)
  await measureEndpoint(
    'Report Generation (Analytics)', 
    `${BASE_URL}/api/analytics/dashboard`, 
    'GET', 
    headers
  );

  // 2. Check-in (We need a booking ID, we'll try to find an EXPECTED booking first)
  const bookingsRes = await fetch(`${BASE_URL}/api/bookings?status=CONFIRMED&limit=1`, { headers });
  if (bookingsRes.ok) {
    const data = await bookingsRes.json();
    const booking = data.bookings?.[0];
    if (booking) {
      // Adjusted based on standard REST
      await measureEndpoint(
        'Check-in Action', 
        `${BASE_URL}/api/bookings/${booking.id}`, 
        'PATCH', 
        headers,
        { status: 'CHECKED_IN' }
      );
    } else {
      console.log('⚠️ No confirmed booking found for check-in test.');
    }
  }

  // 3. Checkout (We need an active booking)
  const activeRes = await fetch(`${BASE_URL}/api/bookings?status=CHECKED_IN&limit=1`, { headers });
  if (activeRes.ok) {
    const data = await activeRes.json();
    const booking = data.bookings?.[0];
    if (booking) {
      await measureEndpoint(
        'Checkout Action', 
        `${BASE_URL}/api/admin/bookings/${booking.id}/checkout`, 
        'POST', 
        headers
      );
    } else {
      console.log('⚠️ No checked-in booking found for checkout test.');
    }
  }

  // 4. Night Audit
  await measureEndpoint(
    'Night Audit Run', 
    `${BASE_URL}/api/night-audit/run`, 
    'POST', 
    headers,
    { date: new Date().toISOString() }
  );

  console.log('\n--- Measurement Complete ---');
}

main().catch(console.error);
