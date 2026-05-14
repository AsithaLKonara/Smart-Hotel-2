import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class RestaurantPage extends BasePage {
  readonly menuItems: Locator
  readonly cartItems: Locator
  readonly checkoutButton: Locator

  constructor(page: Page) {
    super(page)
    this.menuItems = page.locator('[data-testid="menu-item"]')
    this.cartItems = page.locator('[data-testid="cart-item"]')
    this.checkoutButton = page.getByRole('button', { name: /Place Order|Checkout/i })
  }

  async addItemToCart(name: string | RegExp) {
    const item = this.menuItems.filter({ hasText: name }).first()
    await item.getByRole('button', { name: /Add/i }).click()
  }

  async placeOrder() {
    await this.checkoutButton.click()
    await this.page.waitForLoadState('networkidle')
  }
}
