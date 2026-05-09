import { Page } from 'playwright';
import fs from 'fs';
import path from 'path';

export interface Breakpoint {
  name: 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide';
  width: number;
  height: number;
}

export const BREAKPOINTS: Breakpoint[] = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'ultrawide', width: 2560, height: 1440 }
];

export interface VisualValidationResult {
  route: string;
  breakpoint: string;
  theme: 'light' | 'dark';
  screenshotPath: string;
  hasOverflow: boolean;
  errors: string[];
}

/**
 * Executes full responsive visual layouts, dark/light theme shifts, and overflow scanning.
 */
export async function validateVisualLayout(page: Page, route: string, outputDir: string = './qa/visual/screenshots'): Promise<VisualValidationResult[]> {
  const results: VisualValidationResult[] = [];
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Iterate over both themes for maximum design coverage
  for (const theme of ['light', 'dark'] as const) {
    try {
      // Toggle dark theme inside Next.js application (if supported via class or media query)
      await page.evaluate((t) => {
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, theme);
      
      await page.waitForTimeout(200);

      for (const bp of BREAKPOINTS) {
        console.log(`📸 [VISUAL AUDIT]: Capturing viewport layout: [${bp.name}] at [${theme}] mode for route: [${route}]`);
        
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await page.waitForTimeout(300); // Wait for animations to settle

        const cleanRoute = route.replace(/\//g, '_') || 'home';
        const fileName = `${cleanRoute}_${bp.name}_${theme}.png`;
        const screenshotPath = path.join(outputDir, fileName);

        await page.screenshot({ path: screenshotPath, fullPage: false });

        // Check for layout overflow (such as elements with width wider than viewport width)
        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth || 
                 document.body.scrollWidth > window.innerWidth;
        });

        results.push({
          route,
          breakpoint: bp.name,
          theme,
          screenshotPath,
          hasOverflow,
          errors: hasOverflow ? [`Horizontal scroll/overflow detected at viewport breakpoint [${bp.name}] in [${theme}] mode.`] : []
        });
      }
    } catch (err: any) {
      console.error(`❌ [VISUAL AUDIT ERROR]: Failed visual test for route: [${route}], theme: [${theme}]: ${err.message}`);
    }
  }

  return results;
}
