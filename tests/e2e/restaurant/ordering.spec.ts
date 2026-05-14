import { test, expect } from '../fixtures'
import { RestaurantPage } from '../page-objects/RestaurantPage'

test.describe('Restaurant & Kitchen Workflow', () => {

  test('Guest should be able to place a food order', async ({ guestPage }) => {
    const restaurantPage = new RestaurantPage(guestPage)
    
    await restaurantPage.goto('/order')
    await restaurantPage.addItemToCart(/Hopper/i)
    await restaurantPage.addItemToCart(/Tea/i)
    
    await restaurantPage.placeOrder()
    await expect(guestPage.locator('text=Order Placed, text=Successful')).toBeVisible()
    await expect(guestPage.locator('[data-testid="order-status"]')).toContainText(/Pending|Confirmed/i)
  })

  test('Kitchen staff should fulfill a pending order', async ({ kitchenPage }) => {
    await kitchenPage.goto('/kitchen/dashboard')
    
    const orderCard = kitchenPage.locator('[data-testid="order-card"]').first()
    await expect(orderCard).toBeVisible()
    
    // Accept order
    await orderCard.getByRole('button', { name: /Accept|Prepare/i }).click()
    await expect(orderCard).toContainText(/Preparing/i)
    
    // Complete order
    await orderCard.getByRole('button', { name: /Complete|Ready/i }).click()
    await expect(orderCard).not.toBeVisible() // Assuming it moves to history
  })
})
