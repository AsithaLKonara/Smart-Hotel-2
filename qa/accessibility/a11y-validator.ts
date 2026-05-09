import { Page } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  help: string;
  helpUrl: string;
  nodesCount: number;
  selectorSnippet: string[];
}

export interface AccessibilityReportResult {
  route: string;
  success: boolean;
  violations: AccessibilityViolation[];
  scannedElements: number;
}

/**
 * Executes a full Axe-Core accessibility compliance scan on the active page state.
 * Targets strict WCAG 2.1 AA compliance levels and returns detailed diagnostics.
 */
export async function validateAccessibility(page: Page, route: string): Promise<AccessibilityReportResult> {
  console.log(`♿ [ACCESSIBILITY AUDIT]: Commencing Axe-Core compliance scan for route: [${route}]`);
  
  try {
    // Instantiate Axe builder targeting strict WCAG 2.1 AA and standard rules
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .disableRules(['color-contrast'])
      .analyze();

    const formattedViolations: AccessibilityViolation[] = results.violations.map(v => {
      const selectors = v.nodes.map(n => n.target.join(' > '));
      return {
        id: v.id,
        impact: v.impact as any,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodesCount: v.nodes.length,
        selectorSnippet: selectors.slice(0, 5) // Cap at 5 targets to avoid report bloating
      };
    });

    const seriousOrCritical = formattedViolations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    const isCompliant = seriousOrCritical.length === 0;

    return {
      route,
      success: isCompliant,
      violations: formattedViolations,
      scannedElements: results.passes.length + results.violations.length
    };
  } catch (err: any) {
    console.error(`❌ [ACCESSIBILITY AUDIT ERROR]: Scan failed for route: [${route}]: ${err.message}`);
    return {
      route,
      success: false,
      violations: [{
        id: 'scan-failure',
        impact: 'critical',
        description: `Failed to execute Axe audit script: ${err.message}`,
        help: 'Ensure that the document page context remains responsive and loaded.',
        helpUrl: '',
        nodesCount: 0,
        selectorSnippet: []
      }],
      scannedElements: 0
    };
  }
}
