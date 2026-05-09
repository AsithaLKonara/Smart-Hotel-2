import { test, expect } from './fixtures'

test.describe('SmartHotel Comprehensive Audit Flow', () => {
  // Shared state to control mock user roles dynamically
  let currentSessionRole: 'GUEST' | 'MANAGER' = 'GUEST'

  // Setup standard routes before each test to prevent unwanted console/network errors
  test.beforeEach(async ({ page }) => {
    // Reset to GUEST default before each test run
    currentSessionRole = 'GUEST'

    // Mock general settings
    await page.route('**/api/settings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hotelName: 'SmartHotel Luxury',
          taxPercent: 5,
          serviceChargePercent: 10,
        }),
      })
    })

    // Mock settings contact
    await page.route('**/api/settings/contact*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: 'contact@smarthotel.com',
          phone: '+1 234 567 890',
        }),
      })
    })

    // Mock navigation links
    await page.route('**/api/navigation*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Mock social links
    await page.route('**/api/social-links*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Mock footer links
    await page.route('**/api/footer-links*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Mock general notifications
    await page.route('**/api/notifications*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Mock Socket.io requests to prevent connection failure logs on client
    await page.route('**/socket.io/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    })

    // Mock NextAuth session dynamically using the currentSessionRole state
    await page.route('**/api/auth/session*', async (route) => {
      const isGuest = currentSessionRole === 'GUEST'
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: isGuest ? 'guest-123' : 'admin-123',
            name: isGuest ? 'John Doe' : 'Chef Michel',
            email: isGuest ? 'john@example.com' : 'chef@smarthotel.com',
            role: currentSessionRole,
          },
          expires: new Date(Date.now() + 3600000).toISOString(),
        }),
      })
    })

    // Mock QR Menu Items API
    await page.route('**/api/restaurant/menu*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'menu-1',
            name: 'Deviled Chicken Rice',
            description: 'Spicy Sri Lankan style deviled chicken with aromatic rice',
            price: 1500,
            category: 'LUNCH',
            preparationTime: 25,
            available: true,
          },
          {
            id: 'menu-2',
            name: 'Sri Lankan Egg Hoppers',
            description: 'Crisp bowl-shaped rice pancakes with egg center',
            price: 800,
            category: 'BREAKFAST',
            preparationTime: 15,
            available: true,
          },
        ]),
      })
    })

    // Mock order placement
    await page.route('**/api/restaurant/orders*', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            order: {
              id: 'ord-999',
              roomNumber: '101',
              guestId: 'guest-123',
              totalAmount: 2300,
              specialRequests: '',
              status: 'PENDING',
              createdAt: new Date().toISOString(),
            },
          }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      }
    })
  })

  // ----------------------------------------------------
  // 1. GUEST FLOWS (QR Menu, Cart, and Order placement)
  // ----------------------------------------------------
  test.describe('Guest Flow', () => {
    test('browses menu items, adds to cart, and submits a room order successfully', async ({ page }) => {
      currentSessionRole = 'GUEST'
      
      // Navigate to order page directly
      await page.goto('/order')

      // Verify page loaded and displays menu items
      await expect(page.getByText('Deviled Chicken Rice')).toBeVisible()
      await expect(page.getByText('Sri Lankan Egg Hoppers')).toBeVisible()

      // Add "Deviled Chicken Rice" to the cart
      await page.getByRole('button', { name: 'Add' }).first().click()

      // Open checkout button
      const placeOrderBtn = page.getByRole('button', { name: 'Place Order' }).first()
      await expect(placeOrderBtn).toBeVisible()

      // Click Place Order
      await placeOrderBtn.click()

      // Verify success Toast or empty cart state is triggered
      await expect(page.getByText('Cart is empty')).toBeVisible()
    })

    test('validates and rejects orders with empty state', async ({ page }) => {
      currentSessionRole = 'GUEST'
      await page.goto('/order')
      
      // Ensure empty cart banner is rendered directly
      await expect(page.getByText('Cart is empty')).toBeVisible()
    })
  })

  // ----------------------------------------------------
  // 2. ADMIN/KITCHEN DASHBOARD & RBAC REDIRECTIONS
  // ----------------------------------------------------
  test.describe('Admin and Role-Based Access Flow', () => {
    test('enforces RBAC, redirecting unauthorized guests trying to enter kitchen dashboards', async ({ page }) => {
      currentSessionRole = 'GUEST'
      
      // Attempt to access kitchen panel as GUEST
      await page.goto('/kitchen/dashboard')

      // Because guest role is unauthorized, verify user gets redirected to homepage
      await expect(page).toHaveURL('/')
    })

    test('allows authorized MANAGER or STAFF to view and manage orders feed', async ({ page }) => {
      currentSessionRole = 'MANAGER'

      // Mock fetching kitchen orders
      await page.route('**/api/kitchen/orders*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            orders: [
              {
                id: 'ord-202',
                orderNumber: '1001',
                status: 'PENDING',
                totalAmount: 2300,
                createdAt: new Date().toISOString(),
                user: { name: 'Guest John' },
                items: [
                  {
                    id: 'item-1',
                    quantity: 1,
                    menu: { name: 'Deviled Chicken Rice', preparationTime: 25 },
                  }
                ]
              }
            ],
            ordersByStatus: {
              PENDING: [
                {
                  id: 'ord-202',
                  orderNumber: '1001',
                  status: 'PENDING',
                  totalAmount: 2300,
                  createdAt: new Date().toISOString(),
                  user: { name: 'Guest John' },
                  items: [
                    {
                      id: 'item-1',
                      quantity: 1,
                      menu: { name: 'Deviled Chicken Rice', preparationTime: 25 },
                    }
                  ]
                }
              ],
              CONFIRMED: [],
              PREPARING: [],
              READY: [],
              DELIVERED: [],
              CANCELLED: []
            },
            summary: {
              total: 1,
              pending: 1,
              preparing: 0,
              ready: 0,
              delivered: 0
            }
          }),
        })
      })

      // Navigate to kitchen dashboard
      await page.goto('/kitchen/dashboard')

      // Verify dashboard headings and orders are visible
      await expect(page.getByRole('heading', { name: 'Kitchen Dashboard' })).toBeVisible()
      await expect(page.getByText('#1001')).toBeVisible()
    })
  })
})
