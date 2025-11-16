#!/usr/bin/env node

/**
 * Full Production Verification Script
 * Tests all endpoints, pages, and functionality
 * Captures console errors and generates comprehensive report
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_BASE_URL || 'https://smarthotel-demo.vercel.app';
const OUTPUT_DIR = path.join(__dirname, '..', 'artifacts');
const REPORT_FILE = path.join(OUTPUT_DIR, 'full-verification-report.json');
const CONSOLE_LOG_FILE = path.join(OUTPUT_DIR, 'console-errors.txt');

// Ensure artifacts directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const testResults = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
  pages: {},
  apis: {},
  errors: [],
  warnings: [],
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: options.timeout || 10000,
      headers: {
        'User-Agent': 'SmartHotel-Verification/1.0',
        ...options.headers
      }
    };

    const startTime = Date.now();
    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url,
          responseTime: Date.now() - startTime,
        });
      });
    });

    req.on('error', (err) => {
      reject({
        error: err.message,
        url: url,
        responseTime: Date.now() - startTime,
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        url: url,
        responseTime: Date.now() - startTime,
      });
    });
    
    req.end();
  });
}

async function testPage(path, expectedStatus = 200) {
  const url = `${BASE_URL}${path}`;
  testResults.summary.total++;
  
  try {
    const response = await makeRequest(url);
    const passed = response.status === expectedStatus || (expectedStatus === 200 && [200, 301, 302, 307, 308].includes(response.status));
    
    if (passed) {
      testResults.summary.passed++;
    } else {
      testResults.summary.failed++;
      testResults.errors.push({
        type: 'page',
        path,
        status: response.status,
        expected: expectedStatus,
      });
    }
    
    testResults.pages[path] = {
      status: response.status,
      responseTime: response.responseTime,
      contentLength: response.data.length,
      passed,
    };
    
    // Check for external resource references that might cause 404s
    if (response.data.includes('images.unsplash.com')) {
      testResults.warnings.push({
        type: 'external_resource',
        path,
        resource: 'images.unsplash.com',
        message: 'Page still references Unsplash images',
      });
      testResults.summary.warnings++;
    }
    
    if (response.data.includes('player.vimeo.com')) {
      testResults.warnings.push({
        type: 'external_resource',
        path,
        resource: 'player.vimeo.com',
        message: 'Page still references Vimeo video',
      });
      testResults.summary.warnings++;
    }
    
    return { path, passed, response };
  } catch (error) {
    testResults.summary.failed++;
    testResults.errors.push({
      type: 'page',
      path,
      error: error.error || error.message,
    });
    
    testResults.pages[path] = {
      status: 'error',
      error: error.error || error.message,
      responseTime: error.responseTime,
      passed: false,
    };
    
    return { path, passed: false, error };
  }
}

async function testAPI(endpoint, method = 'GET', body = null, expectedStatus = 200) {
  const url = `${BASE_URL}${endpoint}`;
  testResults.summary.total++;
  
  try {
    // For now, just GET requests
    const response = await makeRequest(url, {
      timeout: 5000, // API endpoints should respond faster
    });
    
    const passed = response.status === expectedStatus || 
                   (expectedStatus === 200 && [200, 401, 403].includes(response.status)); // 401/403 OK for protected routes
    
    if (passed) {
      testResults.summary.passed++;
    } else {
      testResults.summary.failed++;
      testResults.errors.push({
        type: 'api',
        endpoint,
        method,
        status: response.status,
        expected: expectedStatus,
      });
    }
    
    testResults.apis[endpoint] = {
      status: response.status,
      responseTime: response.responseTime,
      method,
      passed,
    };
    
    // Check response format
    try {
      const json = JSON.parse(response.data);
      if (json.error && response.status !== 401 && response.status !== 403) {
        testResults.warnings.push({
          type: 'api_error_response',
          endpoint,
          message: json.error,
        });
        testResults.summary.warnings++;
      }
    } catch (e) {
      // Not JSON, that's OK for some endpoints
    }
    
    return { endpoint, passed, response };
  } catch (error) {
    testResults.summary.failed++;
    testResults.errors.push({
      type: 'api',
      endpoint,
      method,
      error: error.error || error.message,
    });
    
    testResults.apis[endpoint] = {
      status: 'error',
      error: error.error || error.message,
      responseTime: error.responseTime,
      method,
      passed: false,
    };
    
    return { endpoint, passed: false, error };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Full Production Verification...');
  console.log(`🌐 Testing: ${BASE_URL}`);
  console.log(`📅 ${new Date().toISOString()}\n`);
  
  // Test Public Pages
  console.log('📄 Testing Public Pages...');
  const publicPages = [
    '/',
    '/rooms',
    '/contact',
    '/order',
    '/gallery',
    '/booking',
    '/auth/signin',
  ];
  
  for (const page of publicPages) {
    console.log(`  Testing ${page}...`);
    await testPage(page);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
  
  // Test Admin Pages (should redirect or require auth)
  console.log('\n🔐 Testing Admin Pages...');
  const adminPages = [
    '/admin',
    '/admin/dashboard',
    '/admin/bookings',
    '/admin/rooms',
    '/admin/staff',
    '/admin/menu',
    '/admin/inventory',
  ];
  
  for (const page of adminPages) {
    console.log(`  Testing ${page}...`);
    await testPage(page, 200); // May be 200 (with redirect) or 401
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test API Endpoints
  console.log('\n🔌 Testing API Endpoints...');
  const apiEndpoints = [
    '/api/rooms',
    '/api/bookings',
    '/api/restaurant/menu', // Correct endpoint (not /api/menu)
    '/api/gallery',
    '/api/staff',
    '/api/inventory',
    '/api/faq',
    '/api/settings/contact',
    '/api/hero-slides',
    '/api/auth/session',
  ];
  
  for (const endpoint of apiEndpoints) {
    console.log(`  Testing ${endpoint}...`);
    await testAPI(endpoint);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Test Performance
  console.log('\n⚡ Testing Performance...');
  const startTime = Date.now();
  try {
    await testPage('/');
    const homepageTime = testResults.pages['/']?.responseTime || 0;
    if (homepageTime > 3000) {
      testResults.warnings.push({
        type: 'performance',
        path: '/',
        message: `Homepage load time ${homepageTime}ms exceeds 3s threshold`,
      });
      testResults.summary.warnings++;
    }
  } catch (error) {
    // Already logged
  }
  
  // Generate Report
  const report = {
    ...testResults,
    summary: {
      ...testResults.summary,
      successRate: ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1) + '%',
    },
  };
  
  // Save JSON report
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  
  // Save console log
  const consoleLog = [
    'Full Production Verification Console Log',
    '='.repeat(60),
    `Timestamp: ${report.timestamp}`,
    `Base URL: ${report.baseUrl}`,
    '',
    'Summary:',
    `  Total Tests: ${report.summary.total}`,
    `  Passed: ${report.summary.passed}`,
    `  Failed: ${report.summary.failed}`,
    `  Warnings: ${report.summary.warnings}`,
    `  Success Rate: ${report.summary.successRate}`,
    '',
    'Errors:',
    ...report.errors.map(e => `  [${e.type}] ${e.path || e.endpoint}: ${e.error || `Status ${e.status} (expected ${e.expected})`}`),
    '',
    'Warnings:',
    ...report.warnings.map(w => `  [${w.type}] ${w.path || w.endpoint}: ${w.message}`),
  ].join('\n');
  
  fs.writeFileSync(CONSOLE_LOG_FILE, consoleLog);
  
  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION REPORT');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${report.summary.passed}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log(`⚠️  Warnings: ${report.summary.warnings}`);
  console.log(`📊 Success Rate: ${report.summary.successRate}`);
  console.log(`\n📁 Report saved to: ${REPORT_FILE}`);
  console.log(`📁 Console log saved to: ${CONSOLE_LOG_FILE}`);
  
  if (report.errors.length > 0) {
    console.log('\n❌ Errors:');
    report.errors.slice(0, 10).forEach(e => {
      console.log(`  - [${e.type}] ${e.path || e.endpoint}: ${e.error || `Status ${e.status}`}`);
    });
  }
  
  if (report.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    report.warnings.slice(0, 10).forEach(w => {
      console.log(`  - [${w.type}] ${w.message}`);
    });
  }
  
  process.exit(report.summary.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

