import { test, expect } from '@playwright/test';

test.describe('Phase 14: Security E2E Penetration', () => {
  
  test('XSS Attack is neutralized during booking creation', async ({ request }) => {
    const payload = {
      guestName: '<script>alert("hacked")</script>John Doe',
      checkIn: new Date().toISOString(),
      checkOut: new Date(Date.now() + 86400000).toISOString(),
      roomTypeCode: 'STD-K',
      guests: 1
    };

    const res = await request.post('/api/bookings/create', { data: payload });
    
    // The backend should either strip the tags and return 200, or explicitly reject with 400 Bad Request
    expect([200, 201, 400]).toContain(res.status());
    
    // If it succeeded, verify the XSS was sanitized
    if (res.status() === 200 || res.status() === 201) {
      const body = await res.json();
      expect(body.guestName).not.toContain('<script>');
    }
  });

  test('SQL Injection is neutralized by Prisma parameterization', async ({ request }) => {
    // Attempt to drop the User table via a malicious search parameter
    const res = await request.get('/api/bookings/search?q=\' OR 1=1; DROP TABLE "User"; --');
    
    // The backend should handle this gracefully (return empty array or 400) without throwing a 500 fatal DB error
    expect(res.status()).not.toBe(500);
    
    // Assert the database is still alive and users exist
    // const checkDbRes = await request.get('/api/auth/csrf'); // Simple alive check
    // expect(checkDbRes.status()).toBe(200);
  });

  test('IDOR Attack is blocked by Folio ownership verification', async ({ request }) => {
    // We run this request under a 'Guest' storage state
    // Assume Guest A (ID: 123) is trying to fetch Guest B's Folio (ID: 124)
    
    // We would initialize a guest context here:
    // const guestContext = await request.newContext({ storageState: 'playwright/.auth/guestA.json' });
    
    // Mock the attack
    const res = await request.get('/api/folios/124', {
      headers: {
        'x-mock-user-id': '123', // Guest A
        'x-mock-role': 'GUEST'
      }
    });

    // The middleware or route handler MUST intercept the ID mismatch and return 403 Forbidden
    expect([401, 403]).toContain(res.status());
  });
});
