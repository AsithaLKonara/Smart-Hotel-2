import { test, expect } from '../fixtures'
import { faker } from '@faker-js/faker'

test.describe('Admin Management & Configuration', () => {

  test('Super Admin should onboard a new staff member', async ({ adminPage }) => {
    const staffName = faker.person.fullName()
    const staffEmail = faker.internet.email()
    
    await adminPage.goto('/admin/staff')
    await adminPage.getByRole('button', { name: /Add Staff/i }).click()
    
    await adminPage.getByLabel(/Full Name/i).fill(staffName)
    await adminPage.getByLabel(/Email/i).fill(staffEmail)
    await adminPage.selectOption('select[name="role"]', 'RECEPTIONIST')
    
    await adminPage.getByRole('button', { name: /Create/i }).click()
    await expect(adminPage.locator(`text=${staffName}`)).toBeVisible()
  })

  test('Super Admin should update global hotel settings', async ({ adminPage }) => {
    await adminPage.goto('/admin/settings')
    
    const hotelNameInput = adminPage.getByLabel(/Hotel Name/i)
    const originalName = await hotelNameInput.inputValue()
    const newName = `${originalName} - Premium`
    
    await hotelNameInput.fill(newName)
    await adminPage.getByRole('button', { name: /Save Changes/i }).click()
    
    await adminPage.reload()
    await expect(hotelNameInput).toHaveValue(newName)
    
    // Revert for stability
    await hotelNameInput.fill(originalName)
    await adminPage.getByRole('button', { name: /Save Changes/i }).click()
  })
})
