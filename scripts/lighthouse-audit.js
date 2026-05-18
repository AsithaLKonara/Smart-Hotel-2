#!/usr/bin/env node

// Lighthouse audit script for SmartHotel performance optimization
const lighthouse = require('lighthouse')
const chromeLauncher = require('chrome-launcher')
const fs = require('fs')
const path = require('path')

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const OUTPUT_DIR = './lighthouse-reports'
const PAGES_TO_AUDIT = [
  { name: 'home', url: '/' },
  { name: 'booking', url: '/booking' },
  { name: 'order', url: '/order' },
  { name: 'dashboard', url: '/dashboard' },
  { name: 'kitchen', url: '/admin/kitchen' }
]

// Lighthouse configuration for performance
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false
    },
    emulatedFormFactor: 'desktop',
    locale: 'en-US',
    maxWaitForFcp: 15000,
    maxWaitForLoad: 35000,
    skipAudits: [],
    skipPwaAudits: false
  }
}

// Mobile configuration
const mobileConfig = {
  ...lighthouseConfig,
  settings: {
    ...lighthouseConfig.settings,
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      disabled: false
    },
    emulatedFormFactor: 'mobile'
  }
}

async function runLighthouseAudit(url, config, deviceType = 'desktop') {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
  const options = {
    logLevel: 'info',
    output: 'json',
    port: chrome.port
  }

  try {
    console.log(`🔍 Auditing ${url} on ${deviceType}...`)
    const runnerResult = await lighthouse(url, options, config)
    
    const { lhr } = runnerResult
    
    // Extract key metrics
    const metrics = {
      url: lhr.finalUrl,
      device: deviceType,
      timestamp: new Date().toISOString(),
      scores: {
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        'best-practices': Math.round(lhr.categories['best-practices'].score * 100),
        seo: Math.round(lhr.categories.seo.score * 100),
        pwa: Math.round(lhr.categories.pwa.score * 100)
      },
      metrics: {
        fcp: lhr.audits['first-contentful-paint']?.displayValue || 'N/A',
        lcp: lhr.audits['largest-contentful-paint']?.displayValue || 'N/A',
        si: lhr.audits['speed-index']?.displayValue || 'N/A',
        tti: lhr.audits['interactive']?.displayValue || 'N/A',
        tbt: lhr.audits['total-blocking-time']?.displayValue || 'N/A',
        cls: lhr.audits['cumulative-layout-shift']?.displayValue || 'N/A'
      },
      opportunities: lhr.audits['unused-css-rules'] ? [{
        title: 'Remove unused CSS',
        score: lhr.audits['unused-css-rules'].score,
        savings: lhr.audits['unused-css-rules'].displayValue
      }] : [],
      diagnostics: []
    }

    // Add performance opportunities
    const opportunities = [
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'offscreen-images',
      'render-blocking-resources',
      'unminified-css',
      'unminified-javascript',
      'efficient-animated-content',
      'duplicated-javascript',
      'legacy-javascript'
    ]

    opportunities.forEach(opportunity => {
      const audit = lhr.audits[opportunity]
      if (audit && audit.score < 1) {
        metrics.opportunities.push({
          title: audit.title,
          score: audit.score,
          savings: audit.displayValue || audit.details?.overallSavingsMs || 'N/A'
        })
      }
    })

    // Add diagnostics
    const diagnostics = [
      'mainthread-work-breakdown',
      'bootup-time',
      'network-rtt',
      'network-server-latency',
      'first-meaningful-paint',
      'largest-contentful-paint-element',
      'layout-shift-elements',
      'long-tasks'
    ]

    diagnostics.forEach(diagnostic => {
      const audit = lhr.audits[diagnostic]
      if (audit) {
        metrics.diagnostics.push({
          title: audit.title,
          score: audit.score,
          details: audit.displayValue || 'N/A'
        })
      }
    })

    // Save detailed report
    const reportFilename = `${deviceType}-${url.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.json`
    const reportPath = path.join(OUTPUT_DIR, reportFilename)
    
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(lhr, null, 2))
    
    console.log(`✅ ${deviceType.toUpperCase()} audit completed for ${url}`)
    console.log(`📊 Performance: ${metrics.scores.performance}/100`)
    console.log(`♿ Accessibility: ${metrics.scores.accessibility}/100`)
    console.log(`✅ Best Practices: ${metrics.scores['best-practices']}/100`)
    console.log(`🔍 SEO: ${metrics.scores.seo}/100`)
    console.log(`📱 PWA: ${metrics.scores.pwa}/100`)
    console.log(`📈 FCP: ${metrics.metrics.fcp}`)
    console.log(`📈 LCP: ${metrics.metrics.lcp}`)
    console.log(`📈 CLS: ${metrics.metrics.cls}`)
    console.log('')

    return metrics
  } catch (error) {
    console.error(`❌ Failed to audit ${url}:`, error.message)
    return null
  } finally {
    await chrome.kill()
  }
}

async function runAllAudits() {
  console.log('🚀 Starting Lighthouse audits for SmartHotel...')
  console.log(`📡 Base URL: ${BASE_URL}`)
  console.log('')

  const results = []

  for (const page of PAGES_TO_AUDIT) {
    const fullUrl = `${BASE_URL}${page.url}`
    
    // Desktop audit
    const desktopResult = await runLighthouseAudit(fullUrl, lighthouseConfig, 'desktop')
    if (desktopResult) {
      results.push(desktopResult)
    }
    
    // Mobile audit
    const mobileResult = await runLighthouseAudit(fullUrl, mobileConfig, 'mobile')
    if (mobileResult) {
      results.push(mobileResult)
    }
    
    // Wait between audits to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Generate summary report
  generateSummaryReport(results)
}

function generateSummaryReport(results) {
  console.log('📊 LIGHTHOUSE AUDIT SUMMARY')
  console.log('=====================================')
  
  const summary = {
    totalAudits: results.length,
    averageScores: {
      performance: 0,
      accessibility: 0,
      'best-practices': 0,
      seo: 0,
      pwa: 0
    },
    pages: {}
  }

  results.forEach(result => {
    const pageKey = `${result.url}-${result.device}`
    
    if (!summary.pages[result.url]) {
      summary.pages[result.url] = { desktop: null, mobile: null }
    }
    
    summary.pages[result.url][result.device] = result.scores
    
    // Add to averages
    Object.keys(summary.averageScores).forEach(metric => {
      summary.averageScores[metric] += result.scores[metric]
    })
  })

  // Calculate averages
  Object.keys(summary.averageScores).forEach(metric => {
    summary.averageScores[metric] = Math.round(summary.averageScores[metric] / results.length)
  })

  // Display summary
  console.log('')
  console.log('🎯 OVERALL AVERAGE SCORES:')
  console.log(`Performance: ${summary.averageScores.performance}/100`)
  console.log(`Accessibility: ${summary.averageScores.accessibility}/100`)
  console.log(`Best Practices: ${summary.averageScores['best-practices']}/100`)
  console.log(`SEO: ${summary.averageScores.seo}/100`)
  console.log(`PWA: ${summary.averageScores.pwa}/100`)
  console.log('')

  // Page-by-page breakdown
  console.log('📄 PAGE-BY-PAGE BREAKDOWN:')
  Object.entries(summary.pages).forEach(([url, scores]) => {
    console.log(`\n${url}:`)
    if (scores.desktop) {
      console.log(`  Desktop: P${scores.desktop.performance} A${scores.desktop.accessibility} BP${scores.desktop['best-practices']} SEO${scores.desktop.seo} PWA${scores.desktop.pwa}`)
    }
    if (scores.mobile) {
      console.log(`  Mobile:  P${scores.mobile.performance} A${scores.mobile.accessibility} BP${scores.mobile['best-practices']} SEO${scores.mobile.seo} PWA${scores.mobile.pwa}`)
    }
  })

  // Performance recommendations
  console.log('')
  console.log('💡 PERFORMANCE RECOMMENDATIONS:')
  
  const performanceIssues = results.filter(r => r.scores.performance < 90)
  if (performanceIssues.length > 0) {
    console.log('⚠️  Pages with performance issues:')
    performanceIssues.forEach(issue => {
      console.log(`   - ${issue.url} (${issue.device}): ${issue.scores.performance}/100`)
    })
  } else {
    console.log('✅ All pages meet performance targets (90+)')
  }

  // Save summary
  const summaryPath = path.join(OUTPUT_DIR, `audit-summary-${Date.now()}.json`)
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
  
  console.log('')
  console.log('📁 Reports saved to:', OUTPUT_DIR)
  console.log('📋 Summary saved to:', summaryPath)
  console.log('')
  
  // Exit with appropriate code
  const hasFailures = Object.values(summary.averageScores).some(score => score < 90)
  if (hasFailures) {
    console.log('❌ Some audits failed to meet targets (90+)')
    process.exit(1)
  } else {
    console.log('✅ All audits passed targets!')
    process.exit(0)
  }
}

// Run audits if called directly
if (require.main === module) {
  runAllAudits().catch(error => {
    console.error('❌ Audit failed:', error)
    process.exit(1)
  })
}

module.exports = { runLighthouseAudit, runAllAudits }

