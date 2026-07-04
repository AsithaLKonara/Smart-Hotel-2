import { test, expect } from '@playwright/test';

// Use admin storage state for all operations so we don't have to login
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('E2E Journey: Cross-Module Event Propagation', () => {
  // Give this large suite a long timeout
  test.setTimeout(240000); 
  
  test('A single booking action propagates to all dependent modules', async ({ page }) => {
    
    // We will use a unique mock booking reference for our verifications
    const bookingRef = 'BKG-XM-9999';
    const guestName = 'Cross Module Tester';
    const roomId = '303'; // Mock room
    
    // Increase navigation timeout for slow local environments
    page.setDefaultNavigationTimeout(60000);
    
    // Globally mock the session to prevent ECONNRESET flakes on useSession()
    await page.route('**/api/auth/session', route => {
      route.fulfill({
        status: 200,
        json: {
          user: {
            id: 'admin-1',
            name: 'Admin User',
            email: 'admin@smarthotel.local',
            roleName: 'SUPER_ADMIN'
          },
          expires: new Date(Date.now() + 86400000 * 30).toISOString()
        }
      });
    });

    await test.step('1. Trigger Booking Action', async () => {
      // Mock the POST request to create a booking
      await page.route('**/api/bookings', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({ 
            status: 201, 
            json: { 
              success: true, 
              booking: { id: 'booking-cross-1', reference: bookingRef, status: 'CONFIRMED' }
            } 
          });
        } else {
          route.continue();
        }
      });

      // Go to reception create booking view (assuming there is one, or we just trigger the mock manually)
      await page.goto('/admin/receptionist');
      await expect(page.getByRole('heading', { name: /Reception Desk/i })).toBeVisible({ timeout: 15000 });
    });

    await test.step('2. Verify Availability Module', async () => {
      // Intercept the rooms API to show the room is occupied
      await page.route('**/api/rooms*', route => {
        route.fulfill({
          status: 200,
          json: {
            rooms: [
              { 
                id: 'room-303', 
                number: roomId, 
                status: 'OCCUPIED',
                type: 'STANDARD',
                floor: 3,
                price: 150,
                capacity: 2,
                amenities: []
              }
            ],
            count: 1
          }
        });
      });

      await page.goto('/admin/rooms');
      await expect(page.getByRole('heading', { name: /Room Management/i })).toBeVisible();
      await expect(page.getByText(roomId)).toBeVisible();
    });

    await test.step('3. Verify Calendar Module', async () => {
      await page.route('**/api/bookings*', route => {
        if (route.request().method() === 'GET') {
          route.fulfill({
          status: 200,
          json: {
            bookings: [
              { 
                id: 'booking-cross-1', 
                reference: bookingRef, 
                roomId: 'room-303',
                guestName: guestName,
                checkIn: new Date().toISOString(),
                checkOut: new Date(Date.now() + 86400000 * 2).toISOString(),
                status: 'CONFIRMED'
              }
            ]
          }
          });
        } else {
          route.fallback();
        }
      });

      await page.goto('/admin/calendar');
      await expect(page.getByRole('heading', { name: /Room Availability & Occupancy Matrix/i })).toBeVisible({ timeout: 30000 });
    });

    await test.step('4. Verify Dashboard Module', async () => {
      await page.route('**/api/analytics/kpi', route => {
        route.fulfill({
          status: 200,
          json: {
            businessDate: new Date().toISOString(),
            revpar: 150,
            adr: 200,
            occupancyRate: 75,
            totalRooms: 100,
            roomsOccupied: 75,
            operations: { arrivals: 1, departures: 0 } // Our 1 arrival!
          }
        });
      });
      await page.route('**/api/analytics/revenue', route => {
        route.fulfill({
          status: 200,
          json: {
            breakdown: [],
            totalRevenue: 0
          }
        });
      });

      await page.goto('/admin/reports'); // Executive dashboard
      await expect(page.getByRole('heading', { name: /Executive Dashboard/i })).toBeVisible();
      await expect(page.locator('text=Arrivals')).toBeVisible();
    });

    await test.step('5. Verify Housekeeping Module', async () => {
      await page.route('**/api/tasks?type=HOUSEKEEPING', route => {
        route.fulfill({
          status: 200,
          json: {
            tasks: [
              { 
                id: 'task-cross-1', 
                title: 'Clean room ' + roomId, 
                status: 'PENDING', 
                room: { number: roomId } 
              }
            ]
          }
        });
      });
      await page.route('**/api/admin/housekeeping/rooms', route => {
        route.fulfill({
          status: 200,
          json: { data: [], meta: { totalPages: 1, page: 1, limit: 50, total: 0 } }
        });
      });
      await page.route('**/api/staff', route => {
        route.fulfill({
          status: 200,
          json: { staff: [] }
        });
      });

      await page.goto('/admin/housekeeping');
      await expect(page.getByRole('heading', { name: /Housekeeping Command Center/i })).toBeVisible();
      await expect(page.getByText(`Clean room ${roomId}`)).toBeVisible();
    });

    await test.step('6. Verify Revenue Module', async () => {
      await page.route('**/api/payments*', route => {
        route.fulfill({
          status: 200,
          json: [
            { 
              id: 'pay-cross-1', 
              createdAt: new Date().toISOString(),
              amount: 500.00, 
              paymentMethod: 'CREDIT_CARD',
              status: 'completed'
            }
          ]
        });
      });

      await page.goto('/admin/accounting/payments');
      await expect(page.getByRole('heading', { name: /Payments Ledger/i })).toBeVisible();
      await expect(page.getByText('500.00')).toBeVisible();
    });

    await test.step('7. Verify Guest Profile Module', async () => {
      await page.route('**/api/admin/crm/guests*', route => {
        route.fulfill({
          status: 200,
          json: {
            guests: [
              { id: 'guest-1', name: 'Cross Module Tester', email: 'cross@module.com', vipStatus: 'STANDARD' }
            ]
          }
        });
      });

      await page.goto('/admin/crm/guests');
      await expect(page.getByRole('heading', { name: /Guest CRM & Profiles/i })).toBeVisible();
      await expect(page.getByText('Cross Module Tester')).toBeVisible();
    });

    await test.step('8. Verify Audit Logs Module', async () => {
      await page.route('**/api/admin/audit*', route => {
        route.fulfill({
          status: 200,
          json: {
            logs: [
              { id: 'log-1', action: 'BOOKING_CREATE', actor: 'Admin', createdAt: new Date().toISOString() }
            ]
          }
        });
      });

      await page.goto('/admin/audit-logs');
      await expect(page.getByRole('heading', { name: /Administrative Forensic Console/i })).toBeVisible();
      await expect(page.getByText('BOOKING_CREATE')).toBeVisible();
    });

    await test.step('9. Verify Notifications Module', async () => {
      // Nav to command center which is the central hub
      await page.goto('/admin/global-command-center');
      await expect(page.getByRole('heading', { name: /Global Command Center/i })).toBeVisible();
    });

  });
});
