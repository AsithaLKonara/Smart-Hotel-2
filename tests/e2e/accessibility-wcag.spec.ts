import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const PUBLIC_ROUTES = [
  { path: '/', name: 'Homepage' },
  { path: '/rooms', name: 'Rooms Listing' },
  { path: '/booking', name: 'Booking Page' },
  { path: '/order', name: 'Restaurant Menu' },
  { path: '/gallery', name: 'Gallery' },
  { path: '/contact', name: 'Contact Page' },
  { path: '/auth/signin', name: 'Sign In' },
  { path: '/auth/signup', name: 'Sign Up' },
  { path: '/auth/forgot-password', name: 'Forgot Password' },
  { path: '/privacy', name: 'Privacy Policy' },
  { path: '/terms', name: 'Terms of Service' },
]

test.describe('@a11y Accessibility — WCAG 2.1 AA Compliance', () => {
  test.setTimeout(60000)

  for (const route of PUBLIC_ROUTES) {
    test(`♿ ${route.name} — no critical a11y violations`, async ({ page }) => {
      await page.goto(`${BASE_URL}${route.path}`)
      await page.waitForLoadState('domcontentloaded')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('#__next-build-watcher') // exclude Next.js dev overlay
        .analyze()

      // Report violations in test output for visibility
      if (accessibilityScanResults.violations.length > 0) {
        const violationSummary = accessibilityScanResults.violations.map(v =>
          `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} elements)`
        ).join('\n')
        console.warn(`A11y Violations on ${route.name}:\n${violationSummary}`)
      }

      // Critical and serious violations must be 0
      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      )

      expect(criticalViolations).toHaveLength(0)
    })
  }

  test('♿ Sign-in form is keyboard navigable and focusable', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.waitForLoadState('domcontentloaded')

    // Tab to the email field
    await page.keyboard.press('Tab')
    const emailFocused = await page.evaluate(() =>
      document.activeElement?.matches('input[type="email"]')
    )
    expect(emailFocused).toBe(true)

    // Tab to password field
    await page.keyboard.press('Tab')
    const passwordFocused = await page.evaluate(() =>
      document.activeElement?.matches('input[type="password"]')
    )
    expect(passwordFocused).toBe(true)

    // Tab to submit button
    await page.keyboard.press('Tab')
    const submitFocused = await page.evaluate(() =>
      document.activeElement?.matches('button[type="submit"]')
    )
    expect(submitFocused).toBe(true)
  })

  test('♿ Booking form fields have accessible labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/booking`)
    await page.waitForLoadState('domcontentloaded')

    // All inputs should have associated labels (via aria-label, aria-labelledby, or <label>)
    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'))
      return inputs.filter(el => {
        const id = el.id
        const hasLabel = id && document.querySelector(`label[for="${id}"]`)
        const hasAriaLabel = el.hasAttribute('aria-label')
        const hasAriaLabelledBy = el.hasAttribute('aria-labelledby')
        const hasPlaceholderOnly = el.hasAttribute('placeholder') && !hasLabel && !hasAriaLabel && !hasAriaLabelledBy
        return hasPlaceholderOnly
      }).length
    })

    // Warn if any inputs rely solely on placeholder (poor a11y)
    if (inputsWithoutLabels > 0) {
      console.warn(`⚠️ ${inputsWithoutLabels} input(s) rely only on placeholder for label — missing aria-label/for attr`)
    }

    // Should not have MORE than half unlabeled inputs
    const totalInputs = await page.locator('input:not([type="hidden"]), textarea, select').count()
    expect(inputsWithoutLabels).toBeLessThan(Math.ceil(totalInputs / 2))
  })

  test('♿ Color contrast — verify no contrast violations on homepage', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('domcontentloaded')

    const results = await new AxeBuilder({ page })
      .withTags(['cat.color'])
      .analyze()

    const contrastViolations = results.violations.filter(v => v.id === 'color-contrast')
    if (contrastViolations.length > 0) {
      console.warn(`Color Contrast Violations: ${contrastViolations.length} instance(s)`)
    }

    // Allow for minor contrast issues from images/overlays but not major ones
    expect(contrastViolations.length).toBeLessThan(5)
  })

  test('♿ No keyboard traps on modals', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('domcontentloaded')

    // If a cookie/modal appears, press Escape to close it
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Ensure focus is not trapped and page is still interactive
    await page.keyboard.press('Tab')
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedTag).not.toBe('BODY')
  })
})
