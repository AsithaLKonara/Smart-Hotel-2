import { test, expect } from '@playwright/test'

test.describe('Staff Journeys', () => {
  test('receptionist manages booking board actions', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
      'x-test-role': 'RECEPTIONIST',
      'x-test-user-id': 'staff-reception-1',
    })

    await page.route('**/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'staff-reception-1',
            email: 'reception@example.com',
            name: 'Front Desk QA',
            role: 'RECEPTIONIST',
          },
        }),
      })
    })

    const bookings = [
      {
        id: 'booking-101',
        confirmationCode: 'CONF-101',
        checkIn: '2025-06-20',
        checkOut: '2025-06-22',
        guests: 2,
        totalAmount: 680,
        status: 'PENDING',
        paymentStatus: 'PAID',
        user: {
          id: 'guest-42',
          name: 'Jordan Carter',
          email: 'jordan@example.com',
        },
        room: {
          id: 'room-301',
          number: '301',
          type: 'Executive Suite',
          price: 340,
        },
      },
    ]

    await page.route('**/api/bookings', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(bookings),
        })
        return
      }

      route.fallback()
    })

    await page.route('**/api/bookings/**', route => {
      if (route.request().method() === 'PATCH') {
        const payload = JSON.parse(route.request().postData() ?? '{}')
        bookings[0] = {
          ...bookings[0],
          status: payload.status ?? bookings[0].status,
        }

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ booking: bookings[0] }),
        })
        return
      }

      route.fallback()
    })

    await page.goto('/admin/bookings')

    await expect(page.getByRole('heading', { name: 'Booking Management' })).toBeVisible()
    await expect(page.getByText('Total Bookings')).toBeVisible()
    const bookingRow = page.locator('tr', { hasText: 'CONF-101' })
    await expect(bookingRow).toBeVisible()
    await expect(bookingRow.getByText('PENDING', { exact: true })).toBeVisible()

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/bookings/booking-101') && resp.request().method() === 'PATCH'),
      page.getByRole('button', { name: 'Confirm' }).click(),
    ])

    await expect(bookingRow.getByText('CONFIRMED', { exact: true })).toBeVisible()
  })

  test('housekeeping updates task progress', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
      'x-test-role': 'HOUSEKEEPING',
      'x-test-user-id': 'staff-housekeeping-1',
    })

    await page.route('**/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'staff-housekeeping-1',
            email: 'housekeeping@example.com',
            name: 'Housekeeping QA',
            role: 'HOUSEKEEPING',
          },
        }),
      })
    })

    const tasks = [
      {
        id: 'task-001',
        title: 'Prepare Presidential Suite',
        description: 'Restock minibar and refresh linens',
        type: 'HOUSEKEEPING',
        priority: 'HIGH',
        status: 'PENDING',
        assignedTo: 'staff-housekeeping-1',
        dueDate: '2025-06-18T15:00:00.000Z',
        createdAt: '2025-06-17T09:00:00.000Z',
        staff: {
          id: 'staff-housekeeping-1',
          name: 'Housekeeping QA',
        },
      },
    ]

    await page.route('**/api/tasks', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(tasks),
        })
        return
      }

      route.fallback()
    })

    await page.route('**/api/tasks/**', route => {
      if (route.request().method() === 'PATCH') {
        const payload = JSON.parse(route.request().postData() ?? '{}')
        tasks[0] = {
          ...tasks[0],
          status: payload.status ?? tasks[0].status,
        }

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ task: tasks[0] }),
        })
        return
      }

      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204 })
        return
      }

      route.fallback()
    })

    await page.route('**/api/staff', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'staff-housekeeping-1', name: 'Housekeeping QA', isActive: true, role: 'HOUSEKEEPING' },
        ]),
      })
    })

    await page.goto('/admin/tasks')

    await expect(page.getByRole('heading', { name: 'Task Management' })).toBeVisible()
    const taskHeading = page.getByRole('heading', { name: 'Prepare Presidential Suite' })
    const taskCard = taskHeading.locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]')
    await expect(taskCard).toBeVisible()
    await expect(taskCard.getByText('PENDING', { exact: true })).toBeVisible()

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/tasks/task-001') && resp.request().method() === 'PATCH'),
      taskCard.getByRole('button', { name: 'Start' }).click(),
    ])

    await expect(taskCard.getByText('IN PROGRESS', { exact: true })).toBeVisible()

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/tasks/task-001') && resp.request().method() === 'PATCH'),
      taskCard.getByRole('button', { name: 'Complete' }).click(),
    ])

    await expect(taskCard.getByText('COMPLETED', { exact: true })).toBeVisible()
  })
})

