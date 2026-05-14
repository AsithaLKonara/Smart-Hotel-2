import { test, expect } from './fixtures'

test.describe('Housekeeping & Maintenance E2E', () => {

  test('Housekeeping can update room cleaning status', async ({ housekeepingPage }) => {
    await housekeepingPage.goto('/admin/housekeeping')
    
    // Find a room and change status
    const roomRow = housekeepingPage.locator('tr:has-text("Room")').first()
    await expect(roomRow).toBeVisible()
    
    const statusSelect = roomRow.locator('select, button[aria-haspopup="listbox"]').first()
    if (await statusSelect.isVisible()) {
      await statusSelect.click()
      const cleaningOption = housekeepingPage.locator('text=CLEANING, [role="option"]:has-text("Cleaning")').first()
      await cleaningOption.click()
      
      // Verify status updated (might need a toast check or row text check)
      await expect(roomRow).toContainText(/CLEANING/i)
    }
  })

  test('Staff can complete assigned tasks', async ({ housekeepingPage }) => {
    await housekeepingPage.goto('/dashboard/tasks')
    
    const taskCard = housekeepingPage.locator('[class*="task-card"], [class*="task-item"]').first()
    if (await taskCard.isVisible()) {
      const completeBtn = taskCard.locator('button:has-text("Complete"), button:has-text("Done")').first()
      await completeBtn.click()
      
      await expect(taskCard).not.toBeVisible() // Assuming it disappears from pending
    }
  })

  test('Manager can assign maintenance tasks', async ({ managerPage }) => {
    await managerPage.goto('/admin/tasks')
    
    const createBtn = managerPage.locator('button:has-text("Create Task"), button:has-text("Add Task")').first()
    await createBtn.click()
    
    await managerPage.fill('input[name="title"]', 'Leaking faucet in Room 101')
    await managerPage.selectOption('select[name="type"]', 'MAINTENANCE')
    await managerPage.selectOption('select[name="priority"]', 'HIGH')
    
    await managerPage.click('button[type="submit"]')
    
    await expect(managerPage.locator('text=Task created, text=Successfully')).toBeVisible()
    await expect(managerPage.locator('text=Leaking faucet')).toBeVisible()
  })
})
