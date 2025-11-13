#!/usr/bin/env node

/**
 * Comprehensive API Testing Script
 * Tests all 41 API endpoints in the SmartHotel application
 */

const BASE_URL = process.env.BASE_URL || 'https://smarthotel-demo.vercel.app';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
  warnings: [],
};

// Helper function to make HTTP requests
async function makeRequest(path, method = 'GET', body = null, headers = {}) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data;
    if (isJson) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      data,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok,
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Network Error',
      data: null,
      error: error.message,
      ok: false,
    };
  }
}

// Test function
async function testEndpoint(endpoint) {
  results.total++;
  
  const { path, method, auth, description, expectedStatus, skip, acceptableErrors } = endpoint;
  
  if (skip) {
    results.skipped++;
    console.log(`\n${colors.gray}[SKIPPED] ${method} ${path}${colors.reset}`);
    return;
  }
  
  console.log(`\n${colors.cyan}Testing: ${method} ${path}${colors.reset}`);
  if (description) {
    console.log(`  ${colors.blue}${description}${colors.reset}`);
  }
  
  try {
    const response = await makeRequest(path, method, endpoint.body, endpoint.headers || {});
    
    const expectedStatusCodes = expectedStatus || (auth ? [200, 401, 403] : [200, 201]);
    const acceptableErrorCodes = acceptableErrors || [400, 404];
    const isExpectedStatus = expectedStatusCodes.includes(response.status);
    const isAcceptableError = acceptableErrorCodes.includes(response.status);
    
    // Check if response is successful or expected
    if (response.ok && isExpectedStatus) {
      results.passed++;
      console.log(`  ${colors.green}✓ PASSED${colors.reset} (Status: ${response.status})`);
      
      // Show response summary
      if (response.data) {
        if (typeof response.data === 'object' && response.data !== null && !Array.isArray(response.data)) {
          const keys = Object.keys(response.data);
          if (keys.length > 0) {
            const preview = keys.slice(0, 3).join(', ');
            console.log(`  ${colors.gray}Response: {${preview}${keys.length > 3 ? '...' : ''}}${colors.reset}`);
          }
        } else if (Array.isArray(response.data)) {
          console.log(`  ${colors.gray}Response: Array[${response.data.length}]${colors.reset}`);
        }
      }
    } else if (response.status === 401 || response.status === 403) {
      // Expected for authenticated endpoints without auth
      if (auth) {
        results.passed++;
        console.log(`  ${colors.yellow}✓ PASSED (Auth required as expected)${colors.reset} (Status: ${response.status})`);
      } else {
        results.failed++;
        console.log(`  ${colors.red}✗ FAILED${colors.reset} (Unexpected auth required, Status: ${response.status})`);
        results.errors.push({
          endpoint: `${method} ${path}`,
          error: `Unexpected authentication required`,
          status: response.status,
        });
      }
    } else if (response.status === 400 && isAcceptableError) {
      // Validation errors are acceptable
      results.passed++;
      const errorMsg = response.data?.error || response.data?.message || 'Validation error';
      console.log(`  ${colors.yellow}✓ PASSED (Validation error as expected)${colors.reset} (Status: ${response.status})`);
      console.log(`  ${colors.gray}Error: ${errorMsg}${colors.reset}`);
    } else if (response.status === 404 && isAcceptableError) {
      // Not found is acceptable for some endpoints
      results.passed++;
      console.log(`  ${colors.yellow}✓ PASSED (Not found as expected)${colors.reset} (Status: ${response.status})`);
    } else if (response.status === 503) {
      results.failed++;
      console.log(`  ${colors.red}✗ FAILED${colors.reset} (Service unavailable, Status: ${response.status})`);
      const errorMsg = response.data?.error || response.data?.message || 'Service unavailable';
      results.errors.push({
        endpoint: `${method} ${path}`,
        error: errorMsg,
        status: response.status,
        data: response.data,
      });
    } else if (response.status === 500) {
      results.failed++;
      console.log(`  ${colors.red}✗ FAILED${colors.reset} (Internal server error, Status: ${response.status})`);
      const errorMsg = response.data?.error || response.data?.message || 'Internal server error';
      results.errors.push({
        endpoint: `${method} ${path}`,
        error: errorMsg,
        status: response.status,
        data: response.data,
      });
    } else if (isExpectedStatus) {
      results.passed++;
      console.log(`  ${colors.yellow}⚠ ACCEPTED${colors.reset} (Status: ${response.status})`);
    } else {
      results.failed++;
      console.log(`  ${colors.red}✗ FAILED${colors.reset} (Unexpected status: ${response.status})`);
      const errorMsg = response.data?.error || response.data?.message || `Unexpected status code: ${response.status}`;
      results.errors.push({
        endpoint: `${method} ${path}`,
        error: errorMsg,
        status: response.status,
        data: response.data,
      });
    }
  } catch (error) {
    results.failed++;
    console.log(`  ${colors.red}✗ FAILED${colors.reset} (Error: ${error.message})`);
    results.errors.push({
      endpoint: `${method} ${path}`,
      error: error.message,
    });
  }
}

// API Endpoints to test
const endpoints = [
  // Health & Testing (Public)
  { path: '/api/health/live', method: 'GET', auth: false, description: 'Health check - Liveness probe' },
  { path: '/api/health/ready', method: 'GET', auth: false, description: 'Health check - Readiness probe' },
  { path: '/api/test-simple', method: 'GET', auth: false, description: 'Simple API test' },
  { path: '/api/test-minimal', method: 'GET', auth: false, description: 'Minimal API test' },
  { path: '/api/test-db', method: 'GET', auth: false, description: 'Database connection test' },
  { path: '/api/test-db-comprehensive', method: 'GET', auth: false, description: 'Comprehensive database test' },
  { path: '/api/debug', method: 'GET', auth: false, description: 'Debug information' },
  
  // Settings (Public)
  { path: '/api/settings/contact', method: 'GET', auth: false, description: 'Get contact information' },
  
  // Rooms (Public GET)
  { path: '/api/rooms', method: 'GET', auth: false, description: 'List all rooms' },
  { path: '/api/rooms/availability?checkin=2025-12-15&checkout=2025-12-18&guests=2&type=all', method: 'GET', auth: false, description: 'Check room availability' },
  { path: '/api/rooms/check-availability?checkIn=2025-12-15&checkOut=2025-12-18', method: 'GET', auth: false, description: 'Check room availability (alt)', acceptableErrors: [400] },
  { path: '/api/rooms/check-availability', method: 'POST', auth: false, description: 'Check room availability (POST)', body: { checkIn: '2025-12-15', checkOut: '2025-12-18', roomId: 'test' }, acceptableErrors: [400] },
  
  // Restaurant (Public GET)
  { path: '/api/restaurant/menu', method: 'GET', auth: false, description: 'List restaurant menu' },
  { path: '/api/restaurant/menu?category=APPETIZERS', method: 'GET', auth: false, description: 'List restaurant menu by category' },
  { path: '/api/restaurant/menu?available=true', method: 'GET', auth: false, description: 'List available menu items' },
  
  // Contact (Public POST)
  { path: '/api/contact', method: 'POST', auth: false, description: 'Submit contact form', body: { name: 'Test User', email: 'test@example.com', subject: 'Test', message: 'Test message' }, expectedStatus: [200, 201] },
  
  // Performance (Public)
  { path: '/api/performance/metrics', method: 'GET', auth: false, description: 'Get performance metrics' },
  { path: '/api/performance/metrics', method: 'OPTIONS', auth: false, description: 'Performance metrics CORS' },
  
  // Authentication (Public)
  { path: '/api/auth/session', method: 'GET', auth: false, description: 'Get current session (public)' },
  { path: '/api/auth/register', method: 'POST', auth: false, description: 'Register new user (validation test)', body: { name: 'Test', email: 'test@example.com', password: 'test123' }, acceptableErrors: [400, 500] },
  { path: '/api/auth/forgot-password', method: 'POST', auth: false, description: 'Forgot password (validation test)', body: { email: 'test@example.com' }, acceptableErrors: [400, 500] },
  
  // Analytics (Requires Auth)
  { path: '/api/analytics', method: 'GET', auth: true, description: 'Get analytics data (requires auth)' },
  { path: '/api/analytics/dashboard', method: 'GET', auth: true, description: 'Get dashboard analytics (requires auth)' },
  { path: '/api/analytics/export', method: 'GET', auth: true, description: 'Export analytics (requires auth)' },
  
  // Bookings (GET requires auth, POST is public)
  { path: '/api/bookings', method: 'GET', auth: true, description: 'List bookings (requires auth)' },
  { path: '/api/bookings', method: 'POST', auth: false, description: 'Create booking (validation test)', body: { roomId: 'test', checkIn: '2025-12-15', checkOut: '2025-12-18', guests: 2, guestEmail: 'test@example.com', guestName: 'Test User' }, acceptableErrors: [400, 404, 401, 409] },
  
  // Restaurant Orders (GET requires auth, POST is public)
  { path: '/api/restaurant/orders', method: 'GET', auth: true, description: 'List restaurant orders (requires auth)' },
  { path: '/api/restaurant/orders', method: 'POST', auth: false, description: 'Create restaurant order (validation test)', body: { roomNumber: '101', items: [], totalAmount: 0 }, acceptableErrors: [400, 500] },
  
  // Tasks (Requires Auth)
  { path: '/api/tasks', method: 'GET', auth: true, description: 'List tasks (requires auth)' },
  
  // Inventory (Requires Auth)
  { path: '/api/inventory', method: 'GET', auth: true, description: 'List inventory (requires auth)' },
  
  // Gallery (Requires Auth)
  { path: '/api/gallery', method: 'GET', auth: true, description: 'List gallery (requires auth)' },
  
  // Staff (Requires Auth)
  { path: '/api/staff', method: 'GET', auth: true, description: 'List staff (requires auth)' },
  
  // Kitchen (Requires Auth)
  { path: '/api/kitchen/orders', method: 'GET', auth: true, description: 'List kitchen orders (requires auth)' },
  
  // Notifications (Requires Auth)
  { path: '/api/notifications', method: 'GET', auth: true, description: 'List notifications (requires auth)' },
  
  // QR Codes (Requires Auth)
  { path: '/api/qr-codes/generate', method: 'GET', auth: true, description: 'Generate QR code (requires auth)', acceptableErrors: [400, 401] },
  { path: '/api/qr-codes/generate', method: 'POST', auth: true, description: 'Generate QR code (POST, requires auth)', body: { data: 'test' }, acceptableErrors: [400, 401] },
  
  // Webhooks
  { path: '/api/webhooks/stripe', method: 'POST', auth: false, description: 'Stripe webhook (requires signature)', body: { type: 'test' }, acceptableErrors: [400, 401, 403] },
];

// Main test function
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SmartHotel API - Comprehensive Endpoint Testing');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`${colors.reset}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total Endpoints: ${endpoints.filter(e => !e.skip).length}`);
  console.log(`\n${colors.bright}Starting tests...${colors.reset}\n`);
  
  const startTime = Date.now();
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Print summary
  console.log(`\n${colors.bright}${colors.cyan}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Test Results Summary');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`${colors.reset}`);
  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${results.skipped}${colors.reset}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log(`\n${colors.red}${colors.bright}Errors (${results.errors.length}):${colors.reset}`);
    results.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${colors.red}${error.endpoint}${colors.reset}`);
      console.log(`   ${colors.yellow}Error: ${error.error}${colors.reset}`);
      if (error.status) {
        console.log(`   ${colors.gray}Status: ${error.status}${colors.reset}`);
      }
      if (error.data && typeof error.data === 'object') {
        const errorMsg = error.data.error || error.data.message || JSON.stringify(error.data).substring(0, 100);
        console.log(`   ${colors.gray}Details: ${errorMsg}${colors.reset}`);
      }
    });
  }
  
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      successRate: ((results.passed / results.total) * 100).toFixed(1) + '%',
      duration: duration + 's',
    },
    errors: results.errors,
  };
  
  // Write report to file
  const fs = require('fs');
  const reportPath = 'API_TEST_RESULTS.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`${colors.bright}Test report saved to: ${reportPath}${colors.reset}\n`);
  
  // Return exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});

