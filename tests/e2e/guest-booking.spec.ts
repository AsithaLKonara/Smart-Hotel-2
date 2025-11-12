import { test, expect } from './fixtures'

test.describe('Guest Journeys', () => {
  test('allows navigation from the homepage to rooms and booking pages', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Rooms', exact: true }).first().click()
    await expect(page).toHaveURL(/\/rooms$/)
    await expect(page.getByRole('heading', { name: 'Our Rooms' })).toBeVisible()

    await page.getByRole('link', { name: 'Book Now' }).first().click()
    await expect(page).toHaveURL(/\/booking/)
    await expect(page.getByRole('heading', { name: 'Book Your Stay' })).toBeVisible()
  })

  test('submits the contact form successfully', async ({ page }) => {
    await page.route('**/api/contact', route => {
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })

    await page.goto('/contact')
    
    await page.getByLabel('Full Name').fill('QA Guest')
    await page.getByLabel('Email').fill('qa.guest@example.com')
    await page.getByLabel('Subject').fill('Playwright smoke test')
    await page.getByLabel('Message').fill('Confirming that the contact form works as expected.')
    await page.getByRole('button', { name: /send message/i }).click()

    await expect(page.getByText(/Your message has been sent/i)).toBeVisible()
  })

  test('mobile navigation menu toggles correctly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    
    const menuButton = page.getByTestId('mobile-menu-toggle')
    await menuButton.waitFor({ state: 'visible' })
    await expect(menuButton).toBeVisible()
    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-label', /close menu/i)
    await expect(page.getByTestId('mobile-menu')).toBeVisible()

    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-label', /open menu/i)
  })
})
