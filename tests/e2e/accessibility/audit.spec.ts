import { test, expect } from '../fixtures'
import AxeBuilder from '@axe-core/playwright'


test.describe('Accessibility Compliance (WCAG 2.1)', () => {

  const criticalRoutes = [
    '/',
    '/auth/signin',
    '/booking',
    '/rooms',
    '/dining',
    '/dashboard',
  ]

  for (const route of criticalRoutes) {
    test(`Route ${route} should meet basic a11y standards`, async ({ page }) => {
      await page.goto(route)
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
        
      expect(accessibilityScanResults.violations).toEqual([])
    })
  }


  test('Admin dashboard should be keyboard navigable', async ({ adminPage }) => {
    await adminPage.goto('/admin/dashboard')
    await adminPage.keyboard.press('Tab')
    
    // Ensure focus is on a logical element
    const activeElement = await adminPage.evaluate(() => document.activeElement?.tagName)
    expect(activeElement).not.toBe('BODY')
    
    // Cycle through main navigation
    for (let i = 0; i < 5; i++) {
      await adminPage.keyboard.press('Tab')
    }
  })
})
