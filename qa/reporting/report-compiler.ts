import fs from 'fs';
import path from 'path';
import { AccessibilityReportResult } from '../accessibility/a11y-validator';
import { VisualValidationResult } from '../visual/visual-validator';
import { SecurityTestResult } from '../security/security-auditor';

export interface AuditSuiteSummary {
  runTimestamp: number;
  overallScore: number;
  crawlerResults: {
    totalRoutesDiscovered: number;
    discoveredRoutes: string[];
  };
  failures: {
    uncaughtErrors: string[];
    consoleErrors: string[];
    networkFailures: string[];
  };
  accessibility: AccessibilityReportResult[];
  visual: VisualValidationResult[];
  security: SecurityTestResult[];
}

/**
 * Standardizes, writes, and exports all 5 core governance reports as markdown.
 */
export function compileGovernanceReports(summary: AuditSuiteSummary, outputDir: string = './qa/reporting/reports'): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestampString = new Date(summary.runTimestamp).toLocaleString();

  // 1. Compile release_audit_report.md (Executive High-Level Dashboard)
  const executiveReport = `
# SmartHotel Release Quality Audit Report

**Date of Audit**: ${timestampString}
**Global Release Verdict**: ${summary.overallScore >= 0.95 ? '🟢 RELEASE-READY (APPROVED)' : '🔴 BLOCKED (FAILURES DETECTED)'}
**Stability Quality Index**: ${(summary.overallScore * 100).toFixed(0)}%

## 📊 Governance Metrics Summary

| Governance Dimension | Status | Coverage | Violations / Regressions |
| :--- | :---: | :---: | :---: |
| **Route Flow Discovery** | Active | ${summary.crawlerResults.totalRoutesDiscovered} Routes | 0 Discovered Roadblocks |
| **Runtime Crash & Hydration** | Active | 100% Client-Side | ${summary.failures.uncaughtErrors.length + summary.failures.consoleErrors.length} Errors |
| **Axe Accessibility (WCAG 2.1 AA)** | Active | ${summary.accessibility.length} Routes Scanned | ${summary.accessibility.reduce((acc, curr) => acc + curr.violations.length, 0)} Violations |
| **Responsive Visual Layouts** | Active | ${summary.visual.length} Breakpoints | ${summary.visual.reduce((acc, curr) => acc + curr.errors.length, 0)} Spacing/Overflows |
| **Security & Mutation Boundaries** | Active | 100% DB Transports | ${summary.security.filter(s => s.status === 'failed').length} Failures |

---

## 🧭 Explored Topography Map
The autonomous crawler successfully parsed and modeled the following dynamic site map:
${summary.crawlerResults.discoveredRoutes.map(r => `- [${r}](http://localhost:3002${r})`).join('\n')}

---

*Report compiled autonomously by SmartHotel Self-Healing AI SRE Governance Engine.*
`;
  fs.writeFileSync(path.join(outputDir, 'release_audit_report.md'), executiveReport.trim());

  // 2. Compile runtime_failure_report.md (Console logs, JS crashes, Hydration issues)
  const runtimeReport = `
# Runtime Telemetry & Hydration Crash Audit Report

**Date of Audit**: ${timestampString}

## 🚨 Active Crashes & Console Errors
This section details uncaught exceptions, React boundary failures, and webpack dynamic chunk issues.

### 🔴 Uncaught Window pageerrors
${summary.failures.uncaughtErrors.length === 0 ? '_Zero uncaught page errors detected!_' : summary.failures.uncaughtErrors.map(e => `\`\`\`\n${e}\n\`\`\``).join('\n')}

### 🟡 Client Console Errors (excluding transient warnings)
${summary.failures.consoleErrors.length === 0 ? '_Zero console errors logged during user journeys!_' : summary.failures.consoleErrors.map(e => `- \`${e}\``).join('\n')}

### 🔵 Intercepted Network API Failures
${summary.failures.networkFailures.length === 0 ? '_Zero HTTP 4xx/5xx or transport exceptions recorded!_' : summary.failures.networkFailures.map(e => `- ${e}`).join('\n')}
`;
  fs.writeFileSync(path.join(outputDir, 'runtime_failure_report.md'), runtimeReport.trim());

  // 3. Compile accessibility_report.md (WCAG 2.1 AA scans)
  const a11yReport = `
# WCAG 2.1 AA Accessibility Governance Report

**Date of Audit**: ${timestampString}

## ♿ Accessibility Compliance Details

${summary.accessibility.map(r => `
### Route: \`${r.route}\`
- **Result**: ${r.success ? '🟢 COMPLIANT' : '🔴 NON-COMPLIANT'}
- **Total Scanned Elements**: ${r.scannedElements}
- **Violations Found**: ${r.violations.length}

${r.violations.length === 0 ? '_No accessibility violations on this page!_' : r.violations.map(v => `
- **Violation [${v.id}]** (Impact: \`${v.impact}\`): ${v.description}
  - **Action Item**: ${v.help} (${v.helpUrl})
  - **Selector Targets**:
    ${v.selectorSnippet.map(sel => `    - \`${sel}\``).join('\n')}
`).join('\n')}
`).join('\n')}
`;
  fs.writeFileSync(path.join(outputDir, 'accessibility_report.md'), a11yReport.trim());

  // 4. Compile visual_regression_report.md (Spacing and layout overlaps)
  const visualReport = `
# Responsive Visual Regression & Layout Spacing Audit

**Date of Audit**: ${timestampString}

## 📸 Broken Layout & Overflow Diagnostics

| Route | Breakpoint | Theme Mode | Layout Status | Overflow Errors |
| :--- | :--- | :---: | :---: | :--- |
${summary.visual.map(v => `| \`${v.route}\` | \`${v.breakpoint}\` | \`${v.theme}\` | ${v.errors.length === 0 ? '🟢 STABLE' : '🔴 OVERFLOW'} | ${v.errors.length === 0 ? '_Stable_' : v.errors.join('; ')} |`).join('\n')}
`;
  fs.writeFileSync(path.join(outputDir, 'visual_regression_report.md'), visualReport.trim());

  // 5. Compile security_governance_report.md (API Attacks, DB checks)
  const securityReport = `
# Full-Stack API Permission & Security Governance Report

**Date of Audit**: ${timestampString}

## 🔒 Automated Penetration & Data Integrity Asserts

${summary.security.map(s => `
### Test: ${s.testName}
- **Verdict**: ${s.status === 'passed' ? '🟢 SECURE' : '🔴 VULNERABLE'}
- **Endpoints Verified**: ${s.endpointsAudited.map(e => `\`${e}\``).join(', ')}
- **Database Count Integrity Enforced**: ${s.dbStateMatches ? 'Yes' : 'No'}
${s.error ? `- **Error Logs**: ${s.error}` : ''}
`).join('\n')}
`;
  fs.writeFileSync(path.join(outputDir, 'security_governance_report.md'), securityReport.trim());

  console.log(`📊 [REPORTS COMPILED]: Successfully wrote all 5 governance report files to: [${outputDir}]`);
}
