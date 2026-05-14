import { Page, expect, Locator } from '@playwright/test'

export class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(path: string) {
    await this.page.goto(path)
    await this.page.waitForLoadState('networkidle')
  }

  async waitForToast(message: string | RegExp) {
    const toast = this.page.locator('[role="status"], .hot-toast, .toast').filter({ hasText: message })
    await expect(toast).toBeVisible({ timeout: 10000 })
  }

  async clickButton(label: string | RegExp) {
    await this.page.getByRole('button', { name: label }).first().click()
  }

  async fillInput(label: string | RegExp, value: string) {
    await this.page.getByLabel(label).fill(value)
  }

  async verifyHeading(text: string | RegExp) {
    await expect(this.page.getByRole('heading', { name: text })).toBeVisible()
  }

  async verifyUrl(path: string | RegExp) {
    await expect(this.page).toHaveURL(path)
  }
}
