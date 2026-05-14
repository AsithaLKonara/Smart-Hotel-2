import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class AdminDashboardPage extends BasePage {
  readonly sidebar: Locator
  readonly statsCards: Locator

  constructor(page: Page) {
    super(page)
    this.sidebar = page.locator('nav.sidebar, [data-testid="admin-sidebar"]')
    this.statsCards = page.locator('.stats-card, [data-testid="stats-card"]')
  }

  async navigateTo(menuItem: string) {
    await this.page.getByRole('link', { name: menuItem, exact: true }).click()
    await this.page.waitForLoadState('networkidle')
  }

  async getStatValue(label: string) {
    return this.statsCards.filter({ hasText: label }).locator('.value').textContent()
  }
}
