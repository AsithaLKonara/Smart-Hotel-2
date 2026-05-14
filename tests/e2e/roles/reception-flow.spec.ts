import { test, expect } from '../fixtures'

test.describe('Receptionist Flow - Operational Control', () => {
  
  test.beforeEach(async ({ receptionistPage }) => {
    await receptionistPage.goto('/admin/receptionist')
  })

  test('Dashboard Overview & Stats', async ({ receptionistPage }) => {
    await expect(receptionistPage.locator('h1')).toContainText(/Reception/i)
    
    // Check KPI cards
    await expect(receptionistPage.locator('text=Daily Arrivals')).toBeVisible()
    await expect(receptionistPage.locator('text=Occupancy')).toBeVisible()
    await expect(receptionistPage.locator('text=VIP Arrivals')).toBeVisible()
  })

  test('Arrivals Timeline & Check-in Flow', async ({ receptionistPage }) => {
    const arrivalsSection = receptionistPage.locator('section:has-text("Arrivals Timeline")')
    await expect(arrivalsSection).toBeVisible()
    
    // Check if there are arrivals and try check-in if possible
    const checkInBtn = arrivalsSection.locator('button:has-text("Check-In")').first()
    if (await checkInBtn.isVisible()) {
      await checkInBtn.click()
      // Success toast check
      await expect(receptionistPage.locator('text=checked in successfully')).toBeVisible()
    }
  })

  test('Departures & Check-out Flow', async ({ receptionistPage }) => {
    const departuresSection = receptionistPage.locator('section:has-text("Departures List")')
    await expect(departuresSection).toBeVisible()
    
    const checkOutBtn = departuresSection.locator('button:has-text("Check-Out")').first()
    if (await checkOutBtn.isVisible()) {
      await checkOutBtn.click()
      await expect(receptionistPage.locator('text=checked out')).toBeVisible()
    }
  })

  test('Room Status Management', async ({ receptionistPage }) => {
    await expect(receptionistPage.locator('text=Room Status Matrix')).toBeVisible()
    
    // Click on a room card to open the action desk
    const roomCard = receptionistPage.locator('.grid >> div:has-text("Room")').first()
    await roomCard.click()
    
    // Action Desk should open
    await expect(receptionistPage.locator('text=Room Action Desk')).toBeVisible()
    
    // Try a status transition (e.g., to Maintenance)
    const maintenanceBtn = receptionistPage.locator('button:has-text("Maintenance")')
    if (await maintenanceBtn.isVisible()) {
      await maintenanceBtn.click()
      await expect(receptionistPage.locator('text=updated to MAINTENANCE')).toBeVisible()
    }
  })

  test('Booking Lookup & Calendar', async ({ receptionistPage }) => {
    // Switch to calendar tab
    await receptionistPage.locator('button:has-text("Booking Calendar")').click()
    
    // Verify calendar is visible
    await expect(receptionistPage.locator('.rbc-calendar')).toBeVisible()
  })
})
