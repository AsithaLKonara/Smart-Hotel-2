import { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class BookingPage extends BasePage {
  readonly checkInInput: Locator
  readonly checkOutInput: Locator
  readonly guestsSelect: Locator
  readonly searchButton: Locator
  readonly roomCards: Locator

  constructor(page: Page) {
    super(page)
    this.checkInInput = page.locator('input[name*="checkIn"], input[name*="check-in"]')
    this.checkOutInput = page.locator('input[name*="checkOut"], input[name*="check-out"]')
    this.guestsSelect = page.locator('select[name*="guest"]')
    this.searchButton = page.getByRole('button', { name: /Check Availability/i })
    this.roomCards = page.locator('[data-testid="room-card"]')
  }

  async searchAvailability(checkIn: string, checkOut: string, guests: string = '2') {
    await this.checkInInput.fill(checkIn)
    await this.checkOutInput.fill(checkOut)
    if (await this.guestsSelect.isVisible()) {
      await this.guestsSelect.selectOption(guests)
    }
    await this.searchButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async reserveFirstRoom() {
    const reserveBtn = this.page.locator('button:has-text("Reserve"), button:has-text("Book Now")').first()
    await reserveBtn.click()
  }
}
