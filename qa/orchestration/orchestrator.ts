import { exec, ChildProcess } from 'child_process';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load local Next.js environment configurations
dotenv.config({ path: '.env.local' });
import { setupFailureListeners } from '../runtime/failure-detector';
import { discoverRoutes } from '../flows/flow-explorer';
import { validateAccessibility } from '../accessibility/a11y-validator';
import { validateVisualLayout } from '../visual/visual-validator';
import { runSecurityAudit } from '../security/security-auditor';
import { compileGovernanceReports, AuditSuiteSummary } from '../reporting/report-compiler';
import { loadMemory, saveMemory, RunRecord } from '../memory/run-memory';

const PORT = 3002;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Spawns the compiled Next.js server locally in production mode on PORT 3002.
 */
function spawnProductionServer(): Promise<{ child: ChildProcess; url: string }> {
  return new Promise((resolve, reject) => {
    console.log(`📡 [ORCHESTRATOR]: Spawning local Next.js production server on port ${PORT}...`);
    
    // We launch next start directly to support both platform formats natively
    const child = exec(`npx next start -p ${PORT}`, {
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' }
    });

    let stdoutData = '';
    let resolved = false;

    child.stdout?.on('data', (data) => {
      stdoutData += data;
      if (stdoutData.includes('Ready in') || stdoutData.includes('started') || stdoutData.includes('localhost')) {
        if (!resolved) {
          resolved = true;
          console.log('🟢 [ORCHESTRATOR]: Production server ready and listening on port 3002!');
          resolve({ child, url: BASE_URL });
        }
      }
    });

    child.stderr?.on('data', (data) => {
      console.warn(`[SERVER WARNING]: ${data}`);
    });

    child.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    // Timeout safety fallback
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('🟢 [ORCHESTRATOR]: Server spawning timeout hit. Assuming active state...');
        resolve({ child, url: BASE_URL });
      }
    }, 15000);
  });
}

/**
 * Main orchestrator thread. Runs full-stack governance checks and outputs audits.
 */
async function executeOrchestratedSweep() {
  console.log('\n======================================================================');
  console.log('🛡️ SMART-HOTEL AUTONOMOUS SECURITY & RUNTIME GOVERNANCE PLATFORM');
  console.log('======================================================================\n');

  // Load persistent memory state
  const state = loadMemory();

  let serverProcess: ChildProcess | null = null;
  let browserInstance: any = null;
  let overallSuccess = true;

  try {
    // 1. Spawn local Next.js server
    const { child, url } = await spawnProductionServer();
    serverProcess = child;

    // Give the server a full 8 seconds to compile and stabilize the socket ports
    await new Promise(r => setTimeout(r, 8000));

    // 2. Launch browser via Playwright
    console.log('🧭 [ORCHESTRATOR]: Launching Chromium browser context...');
    const browser = await chromium.launch({ headless: true });
    browserInstance = browser;
    const context = await browser.newContext();
    const page = await context.newPage();

    // Setup Failure Telemetry interceptor
    const failureTelemetry = setupFailureListeners(page);

    // 3. Crawl dynamic route tree topography
    const siteMap = await discoverRoutes(page, url, 1); // Depth 1 for performance & stability
    const routesToScan = Object.keys(siteMap);

    console.log(`🧭 [ORCHESTRATOR]: Site crawl complete. Found ${routesToScan.length} unique routes to audit.`);

    const accessibilityScans = [];
    const visualScans = [];

    // 4. Run visual and accessibility validation sweeps over crawled routes
    for (const route of routesToScan) {
      console.log(`\n----------------------------------------------------------------------`);
      console.log(`📡 AUDITING ROUTE: [${route}]`);
      console.log(`----------------------------------------------------------------------`);

      // Accessibility Scan
      const a11yResult = await validateAccessibility(page, route);
      accessibilityScans.push(a11yResult);
      if (!a11yResult.success) {
        overallSuccess = false;
        console.error(`⚠️ [GOVERNANCE CRITICAL]: Serious accessibility violations on route [${route}]!`);
      }

      // Visual Breakpoint Scan
      const visualResult = await validateVisualLayout(page, route);
      visualScans.push(...visualResult);
      const overflows = visualResult.filter(v => v.hasOverflow);
      if (overflows.length > 0) {
        overallSuccess = false;
        console.error(`⚠️ [GOVERNANCE WARNING]: Visual overflow or horizontal scrolls detected on route [${route}]!`);
      }
    }

    // 5. Run API Security & Mutation Integrity Checks
    const securityAuditResults = await runSecurityAudit(page, url);
    const failedSecurity = securityAuditResults.filter(s => s.status === 'failed');
    if (failedSecurity.length > 0) {
      console.error(`⚠️ [GOVERNANCE BREACH]: Security contract validation failed!`);
    }

    // 6. Quantitative Weighted Suitability Index Formulation (SRE Gate V2)
    const totalA11yCount = accessibilityScans.length || 1;
    const passedA11yCount = accessibilityScans.filter(a => a.success).length;
    const a11yWeight = 30 * (passedA11yCount / totalA11yCount);

    const totalSecurityCount = securityAuditResults.length || 1;
    const passedSecurityCount = securityAuditResults.filter(s => s.status === 'passed').length;
    const securityWeight = 35 * (passedSecurityCount / totalSecurityCount);

    const overflowCount = visualScans.filter(v => v.hasOverflow).length;
    const visualWeight = Math.max(0, 15 - overflowCount * 5); // Deduct 5 points per overflow

    const stabilityErrorCount = failureTelemetry.errors.length + failureTelemetry.consoleErrors.length;
    const stabilityWeight = Math.max(0, 20 - stabilityErrorCount * 4); // Deduct 4 points per uncaught crash

    const computedSuitability = (a11yWeight + securityWeight + visualWeight + stabilityWeight) / 100;
    const runtimeScore = computedSuitability;
    overallSuccess = runtimeScore >= 0.95; // 95% threshold gate

    const timestamp = Date.now();

    routesToScan.forEach(route => {
      const runRecord: RunRecord = {
        route,
        success: overallSuccess,
        errors: [...failureTelemetry.errors, ...failureTelemetry.consoleErrors],
        brokenSelectors: [],
        healedSelectors: [],
        timestamp,
        stabilityScore: runtimeScore
      };
      state.runHistory.push(runRecord);
    });
    saveMemory(state);

    // 7. Compile Markdown Reports
    const summary: AuditSuiteSummary = {
      runTimestamp: timestamp,
      overallScore: runtimeScore,
      crawlerResults: {
        totalRoutesDiscovered: routesToScan.length,
        discoveredRoutes: routesToScan
      },
      failures: {
        uncaughtErrors: failureTelemetry.errors,
        consoleErrors: failureTelemetry.consoleErrors,
        networkFailures: failureTelemetry.networkFailures
      },
      accessibility: accessibilityScans,
      visual: visualScans,
      security: securityAuditResults
    };

    compileGovernanceReports(summary, './qa/reporting/reports');

    console.log('\n======================================================================');
    console.log('🏁 AUTONOMOUS SWEEP FINISHED');
    console.log('======================================================================');
    console.log(`- Routes explored: ${routesToScan.length}`);
    console.log(`- Accessibility scanned routes: ${accessibilityScans.length}`);
    console.log(`- Visual checkpoints parsed: ${visualScans.length}`);
    console.log(`- Security contracts verified: ${securityAuditResults.length}`);
    console.log(`- Release Suitability Index: ${(runtimeScore * 100).toFixed(0)}%`);
    console.log('======================================================================\n');

  } catch (err: any) {
    console.error(`❌ [ORCHESTRATOR CRITICAL FAILURE]: ${err.stack || err.message}`);
    overallSuccess = false;
  } finally {
    // Graceful Teardown of resources
    if (browserInstance) {
      await browserInstance.close().catch(() => {});
    }
    if (serverProcess) {
      console.log('🔌 [ORCHESTRATOR]: Shutting down Next.js production server...');
      serverProcess.kill('SIGINT');
    }
    
    // Safety exit codes
    if (overallSuccess) {
      console.log('🟢 [ORCHESTRATOR]: Release verification check fully PASSED. Clean quality exit.');
      process.exit(0);
    } else {
      console.error('❌ [ORCHESTRATOR]: Core governance quality checks FAILED. Quality gate blocking release.');
      process.exit(1);
    }
  }
}

executeOrchestratedSweep();
