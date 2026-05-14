import { test, expect } from '../fixtures'
import { generateTaskData } from '../utils/test-data'

test.describe('Housekeeping & Maintenance Operations', () => {

  test('Housekeeping staff should update room status after cleaning', async ({ housekeepingPage }) => {
    await housekeepingPage.goto('/admin/housekeeping')
    
    const roomRow = housekeepingPage.locator('tr:has-text("Room")').first()
    await roomRow.locator('select, button[aria-haspopup="listbox"]').click()
    
    await housekeepingPage.locator('text=CLEANING, [role="option"]:has-text("Cleaning")').first().click()
    await expect(roomRow).toContainText(/CLEANING/i)
    
    // Complete cleaning
    await roomRow.locator('select, button[aria-haspopup="listbox"]').click()
    await housekeepingPage.locator('text=AVAILABLE, [role="option"]:has-text("Available")').first().click()
    await expect(roomRow).toContainText(/AVAILABLE/i)
  })

  test('Maintenance staff should resolve assigned incidents', async ({ maintenancePage }) => {
    // Note: Reusing housekeepingPage logic if maintenance role fixture is similar
    await maintenancePage.goto('/dashboard/tasks')
    
    const task = maintenancePage.locator('[class*="task-card"]').first()
    await expect(task).toBeVisible()
    
    await task.getByRole('button', { name: /Start/i }).click()
    await expect(task).toContainText(/In Progress/i)
    
    await task.getByRole('button', { name: /Complete/i }).click()
    await expect(task).not.toBeVisible()
  })

  test('Manager should assign a new maintenance task', async ({ managerPage }) => {
    const taskData = generateTaskData()
    await managerPage.goto('/admin/tasks')
    
    await managerPage.getByRole('button', { name: /Create Task/i }).click()
    await managerPage.getByLabel(/Title/i).fill(taskData.title)
    await managerPage.getByLabel(/Description/i).fill(taskData.description)
    await managerPage.selectOption('select[name="priority"]', taskData.priority)
    
    await managerPage.getByRole('button', { name: /Save/i }).click()
    await expect(managerPage.locator(`text=${taskData.title}`)).toBeVisible()
  })
})
