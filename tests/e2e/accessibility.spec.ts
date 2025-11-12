import { test, expect } from './fixtures'
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Smoke', () => {
  test.describe.configure({ timeout: 120_000 });

  const pages = [
    { name: 'Homepage', url: '/' },
    { name: 'Booking page', url: '/booking' },
    { name: 'Contact page', url: '/contact' },
  ];

  for (const { name, url } of pages) {
    test(`${name} passes axe core checks`, async ({ page }) => {
      await page.goto(url, { waitUntil: 'networkidle' });
    
    const accessibilityScanResults = await new AxeBuilder({ page: page as any })
        .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  }
});
