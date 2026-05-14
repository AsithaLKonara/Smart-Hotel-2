import { test, expect } from '@playwright/test'
import { loginAs, dbAssert } from '../helpers/e2e-utils'
import { prisma } from '@/lib/db'

test.describe('Operational Excellence: Reception & Housekeeping', () => {

  /**
   * Flow: Receptionist Check-In -> Status Update
   */
  test('should handle receptionist check-in and update room status', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST')
    
    // 1. Find a CONFIRMED booking for today
    const booking = await prisma.booking.findFirst({
      where: { status: 'CONFIRMED' },
      include: { room: true }
    })
    if (!booking) {
      console.log('Skipping test: No CONFIRMED booking found.')
      return
    }
    
    await page.goto(`/admin/reception/bookings/${booking?.id}`)
    
    // 2. Perform Check-In
    await page.click('button:has-text("Check In Guest")')
    await expect(page.locator('text=CHECKED_IN')).toBeVisible()
    
    // 3. DB ASSERTION: Room must be OCCUPIED
    await dbAssert.roomStatusMatches(booking!.room.number, 'OCCUPIED')
    
    // 4. AUDIT LOG: Verify action recorded
    const log = await prisma.auditLog.findFirst({
      where: { action: 'CHECK_IN', resourceId: booking?.id },
      orderBy: { createdAt: 'desc' }
    })
    expect(log).not.toBeNull()
  })

  /**
   * Flow: Checkout -> Auto Task -> Housekeeping Completion
   */
  test('should trigger housekeeping task on checkout and restore availability', async ({ page, browser }) => {
    // STEP 1: RECEPTIONIST CHECKOUT
    await loginAs(page, 'RECEPTIONIST')
    
    const booking = await prisma.booking.findFirst({
      where: { status: 'CHECKED_IN' },
      include: { room: true }
    })
    if (!booking) {
      console.log('Skipping test: No CHECKED_IN booking found.')
      return
    }
    
    await page.goto(`/admin/reception/bookings/${booking?.id}`)
    await page.click('button:has-text("Check Out")')
    await page.click('button:has-text("Confirm Checkout & Generate Invoice")')
    
    // DB ASSERTION: Room is now DIRTY and Task is created
    await dbAssert.roomStatusMatches(booking!.room.number, 'DIRTY')
    const task = await dbAssert.taskCreatedForRoom(booking!.room.number, 'HOUSEKEEPING')
    if (!task) {
      throw new Error('Housekeeping task was not created automatically!')
    }
    expect(task.status).toBe('PENDING')

    // STEP 2: HOUSEKEEPING STAFF COMPLETES TASK
    const hkContext = await browser.newContext()
    const hkPage = await hkContext.newPage()
    await loginAs(hkPage, 'HOUSEKEEPING')
    
    await hkPage.goto(`/admin/housekeeping/tasks/${task.id}`)
    await hkPage.click('button:has-text("Accept Task")')
    await hkPage.click('button:has-text("Mark as Completed")')
    
    // STEP 3: FINAL STATE VALIDATION
    // Room should now be AVAILABLE or INSPECTION_PENDING depending on policy
    const finalRoom = await prisma.room.findUnique({ where: { id: booking!.roomId } })
    expect(['AVAILABLE', 'INSPECTION_PENDING']).toContain(finalRoom?.status)
    
    const finalTask = await prisma.task.findUnique({ where: { id: task.id } })
    expect(finalTask?.status).toBe('COMPLETED')
    expect(finalTask?.completedAt).not.toBeNull()
  })
})
