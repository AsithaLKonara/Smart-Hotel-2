import { launchBrowser } from './runtime/browser';
import { runFlow } from './agent/flow-agent';
import { generateFlow } from './agent/flow-generator';
import { setupFailureListeners } from './runtime/failure-detector';
import { analyzeFailure } from './ai/analyzer';
import { healSelector } from './healing/selector-healer';
import { loadMemory, saveMemory, compareRuns, RunRecord } from './memory/run-memory';

async function runQA() {
  console.log('\n======================================================================');
  console.log('🚀 INITIALIZING TRUE SELF-HEALING AI QA SYSTEM (v2)...');
  console.log('======================================================================\n');

  // Load persistent memory state
  const state = loadMemory();
  console.log(`🧠 [STATE LOADED]: Loaded run history with ${state.runHistory.length} records.`);
  console.log(`🧠 [LEARNED SELECTORS]: Found ${Object.keys(state.selectorMap).length} active healing mappings.`);

  const { browser, page } = await launchBrowser();
  
  // Connect failure event telemetry listeners to Playwright browser context
  const failureTelemetry = setupFailureListeners(page);

  const routes = ['/', '/rooms', '/contact'];
  let overallSuccess = true;
  
  const currentRunRecords: RunRecord[] = [];

  for (const route of routes) {
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`📡 EXPLORING USER PATH FOR ROUTE: [${route}]`);
    console.log(`----------------------------------------------------------------------`);

    const flow = await generateFlow(route);
    const result = await runFlow(page, flow);

    // Give asynchronous console logging/network events a moment to settle
    await page.waitForTimeout(500);

    // Assess overall route safety (Checking both interaction success AND console error logs!)
    const hasUncaughtErrors = failureTelemetry.errors.length > 0;
    const hasConsoleErrors = failureTelemetry.consoleErrors.length > 0;
    const hasNetworkFailures = failureTelemetry.networkFailures.length > 0;
    
    const pageTroubled = !result.success || hasUncaughtErrors || hasConsoleErrors || hasNetworkFailures;
    
    // Calculate precise route stability score
    let stabilityScore = 1.0;
    const brokenSelectors: string[] = [];
    const healedSelectors: string[] = [];
    const errorsList: string[] = [];

    if (hasUncaughtErrors) errorsList.push(...failureTelemetry.errors);
    if (hasConsoleErrors) errorsList.push(...failureTelemetry.consoleErrors);
    if (hasNetworkFailures) errorsList.push(...failureTelemetry.networkFailures);
    if (result.error) errorsList.push(`Action Failed: ${result.error}`);

    if (pageTroubled) {
      overallSuccess = false;
      stabilityScore = 0.0;

      // Check if it failed specifically on a locator and we successfully recovered inline
      if (result.lastAction?.selector) {
        brokenSelectors.push(result.lastAction.selector);
      }

      console.error(`\n🚨 EXPLORER DETECTED ROADBLOCK/ERROR ON ROUTE: [${route}]`);

      // Extract current DOM page snapshot for healing context
      const pageSource = await page.content().catch(() => '');
      
      // Suggest static repair
      let repairNotice = '';
      if (result.lastAction && (result.lastAction.type === 'click' || result.lastAction.type === 'type')) {
        const repair = healSelector(result.lastAction.selector || '', pageSource);
        if (repair.healed) {
          repairNotice = `🔧 [SELF-HEALING SUGGESTION]: Proposing locator replacement:\n  - Replace "${result.lastAction.selector}" with "${repair.repairedSelector}"\n  - Reason: ${repair.explanation}`;
          healedSelectors.push(repair.repairedSelector);
        }
      }

      // Invoke LLM Diagnostic Analyzer
      const diagnosticReport = await analyzeFailure({
        route,
        lastAction: result.lastAction,
        failure: failureTelemetry
      });

      console.log('\n======================================================================');
      console.log('🔴 DETAILED SYSTEM FAILURE DIAGNOSTICS:');
      console.log('======================================================================');
      console.log(`📡 Intercepted Uncaught Page Errors:\n`, failureTelemetry.errors);
      console.log(`📡 Intercepted Browser Console Errors:\n`, failureTelemetry.consoleErrors);
      console.log(`📡 Intercepted Network Failures:\n`, failureTelemetry.networkFailures);
      console.log(`----------------------------------------------------------------------`);
      console.log(diagnosticReport);
      
      if (repairNotice) {
        console.log('\n' + repairNotice);
      }
      console.log('======================================================================\n');

      // Record run stats and break
      const record: RunRecord = {
        route,
        success: false,
        errors: errorsList,
        brokenSelectors,
        healedSelectors,
        timestamp: Date.now(),
        stabilityScore
      };
      currentRunRecords.push(record);
      break; 
    } else {
      console.log(`✅ Flow sequence on route [${route}] completed successfully.`);
      const record: RunRecord = {
        route,
        success: true,
        errors: [],
        brokenSelectors: [],
        healedSelectors: [],
        timestamp: Date.now(),
        stabilityScore: 1.0
      };
      currentRunRecords.push(record);
    }
  }

  await browser.close();

  // Save current run records to memory history
  state.runHistory.push(...currentRunRecords);
  saveMemory(state);

  // Generate and Print Regression Drift Analytics Report
  console.log('\n======================================================================');
  console.log('📊 REGRESSION DRIFT & STABILITY ANALYTICS REPORT');
  console.log('======================================================================');

  currentRunRecords.forEach(current => {
    // Find the most recent historical run for this same route (excluding the one we just added)
    const routeHistory = state.runHistory.filter(h => h.route === current.route && h.timestamp < current.timestamp);
    const previous = routeHistory[routeHistory.length - 1];

    const comparison = compareRuns(previous, current);
    
    console.log(`\n📍 Route: ${current.route}`);
    console.log(`   - Current Status: ${current.success ? '🟢 PASS' : '🔴 FAIL'}`);
    console.log(`   - Route Stability Score: ${(current.stabilityScore * 100).toFixed(0)}%`);
    
    if (previous) {
      const deltaPercent = (comparison.stabilityDelta * 100).toFixed(0);
      const sign = comparison.stabilityDelta >= 0 ? '+' : '';
      console.log(`   - Stability Drift Delta: ${sign}${deltaPercent}%`);
      console.log(`   - Stability Trend Status: ${comparison.stabilityTrend.toUpperCase()}`);
      
      if (comparison.newFailures.length > 0) {
        console.log(`   - ⚠️ NEW REGRESSIONS DETECTED:`);
        comparison.newFailures.forEach(f => console.log(`     • ${f}`));
      }
      if (comparison.resolvedIssues.length > 0) {
        console.log(`   - 🎉 RESOLVED ISSUES SINCE PREVIOUS RUN:`);
        comparison.resolvedIssues.forEach(i => console.log(`     • ${i}`));
      }
    } else {
      console.log(`   - Stability Drift Delta: N/A (Baseline Run Established)`);
    }
  });

  console.log('\n======================================================================');

  if (overallSuccess) {
    console.log('🟢 AI QA SWEEP COMPLETED SUCCESSFULLY!');
    console.log('✅ Status: 100% Core Flows Verified and Zero Errors Detected.');
    console.log('🎉 Verdict: SmartHotel is completely runtime stable!');
    console.log('======================================================================\n');
    process.exit(0);
  } else {
    console.error('❌ AI QA SWEEP FAILED: App encountered issues during user exploration.');
    process.exit(1);
  }
}

runQA().catch((err) => {
  console.error('❌ Unhandled exception during QA run:', err);
  process.exit(1);
});
