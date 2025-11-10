import { test, expect } from '@playwright/test'

test.describe('Authenticated Journeys', () => {
  test('admin dashboard renders with analytics summary', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
      'x-test-role': 'SUPER_ADMIN',
      'x-test-user-id': 'admin-1',
    })

    await page.route('**/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'admin-1',
            email: 'admin@example.com',
            name: 'Test Admin',
            role: 'SUPER_ADMIN',
          },
        }),
      })
    })

    await page.route('**/api/analytics/dashboard', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          summary: {
            occupancyRate: 82,
            averageOccupancyRate: 78,
            bookingGrowthRate: 5,
            revenueGrowthRate: 7,
            todayRevenue: 18500,
            monthlyRevenue: 220000,
            todayBookings: 18,
            monthlyBookings: 320,
            restaurantOrdersToday: 45,
            restaurantRevenueToday: 3800,
            averageOrderValueToday: 84,
            taskStats: {
              total: 42,
              completed: 30,
              pending: 10,
              overdue: 2,
              completionRate: 71,
            },
            guestSatisfaction: {
              rating: 4.7,
              reviews: 128,
            },
          },
          recentActivity: {
            bookings: [
              {
                id: 'booking-1',
                roomNumber: '701',
                guestName: 'Jordan Carter',
                status: 'CONFIRMED',
                totalAmount: 1299,
                createdAt: new Date().toISOString(),
              },
            ],
            orders: [
              {
                id: 'order-1',
                roomNumber: '305',
                status: 'DELIVERED',
                totalAmount: 120,
                items: [{ name: 'Seared Salmon' }],
                createdAt: new Date().toISOString(),
              },
            ],
            tasks: [
              {
                id: 'task-1',
                title: 'Prepare Presidential Suite',
                assignedTo: 'Alex Morgan',
                priority: 'HIGH',
                status: 'IN_PROGRESS',
                createdAt: new Date().toISOString(),
              },
            ],
          },
        }),
      })
    })

    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible()
    await expect(page.getByText("Today's Revenue")).toBeVisible()
    await expect(page.getByText('Restaurant Orders')).toBeVisible()
    await expect(page.getByText('Guest Satisfaction')).toBeVisible()
  })

  test('my bookings page lists bookings for authenticated users', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
      'x-test-role': 'GUEST',
      'x-test-user-id': 'guest-123',
    })

    await page.route('**/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'guest-123',
            email: 'guest@example.com',
            name: 'QA Guest',
            role: 'GUEST',
          },
        }),
      })
    })

    await page.route('**/api/bookings*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'booking-001',
            checkIn: '2025-06-12',
            checkOut: '2025-06-15',
            guests: 2,
            totalAmount: 1450,
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            room: {
              id: 'room-201',
              number: '201',
              type: 'Deluxe Suite',
              price: 725,
            },
            invoice: {
              id: 'invoice-001',
              total: 1450,
              status: 'PAID',
            },
            createdAt: new Date().toISOString(),
          },
        ]),
      })
    })

    await page.goto('/my-bookings')

    await expect(page.getByRole('heading', { name: 'My Bookings' })).toBeVisible()
    await expect(page.getByText('Deluxe Suite')).toBeVisible()
    await expect(page.getByText('CONFIRMED')).toBeVisible()
    await expect(page.getByText(/\$1,450/)).toBeVisible()
  })
})
