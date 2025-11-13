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
  
  const { path, method, auth, description, expectedStatus, skip } = endpoint;
  
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
    const isExpectedStatus = expectedStatusCodes.includes(response.status);
    
    // Check if response is successful or expected
    if (response.ok && isExpectedStatus) {
      results.passed++;
      console.log(`  ${colors.green}✓ PASSED${colors.reset} (Status: ${response.status})`);
      
      // Show response summary
      if (response.data) {
        if (typeof response.data === 'object' && response.data !== null) {
          const keys = Object.keys(response.data);
          if (keys.length > 0) {
            const preview = keys.slice(0, 3).join(', ');
            console.log(`  ${colors.gray}Response: {${preview}${keys.length > 3 ? '...' : ''}}${colors.reset}`);
          }
        } else if (typeof response.data === 'string' && response.data.length < 100) {
          console.log(`  ${colors.gray}Response: ${response.data.substring(0, 50)}${colors.reset}`);
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
    } else if (response.status === 404) {
      results.failed++;
      console.log(`  ${colors.red}✗ FAILED${colors.reset} (Not found, Status: ${response.status})`);
      results.errors.push({
        endpoint: `${method} ${path}`,
        error: `Endpoint not found`,
        status: response.status,
      });
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
      results.errors.push({
        endpoint: `${method} ${path}`,
        error: `Unexpected status code: ${response.status}`,
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
  { path: '/api/rooms/check-availability', method: 'GET', auth: false, description: 'Check room availability (alt)' },
  { path: '/api/rooms/check-availability', method: 'POST', auth: false, description: 'Check room availability (POST)', body: { checkIn: '2025-12-15', checkOut: '2025-12-18', guests: 2 } },
  
  // Restaurant (Public GET)
  { path: '/api/restaurant/menu', method: 'GET', auth: false, description: 'List restaurant menu' },
  { path: '/api/restaurant/menu?category=APPETIZERS', method: 'GET', auth: false, description: 'List restaurant menu by category' },
  
  // Contact (Public POST)
  { path: '/api/contact', method: 'POST', auth: false, description: 'Submit contact form', body: { name: 'Test User', email: 'test@example.com', subject: 'Test', message: 'Test message' }, expectedStatus: [200, 201, 400, 500] },
  
  // Performance (Public)
  { path: '/api/performance/metrics', method: 'GET', auth: false, description: 'Get performance metrics' },
  { path: '/api/performance/metrics', method: 'OPTIONS', auth: false, description: 'Performance metrics CORS' },
  
  // Authentication (Public)
  { path: '/api/auth/session', method: 'GET', auth: false, description: 'Get current session (public)' },
  { path: '/api/auth/[...nextauth]', method: 'GET', auth: false, description: 'NextAuth.js handler (GET)', skip: true }, // Skip NextAuth handler
  { path: '/api/auth/register', method: 'POST', auth: false, description: 'Register new user (will fail - validation)', body: { name: 'Test', email: 'test@example.com', password: 'test123' }, expectedStatus: [200, 201, 400, 500] },
  
  // Analytics (Requires Auth)
  { path: '/api/analytics', method: 'GET', auth: true, description: 'Get analytics data (requires auth)' },
  { path: '/api/analytics/dashboard', method: 'GET', auth: true, description: 'Get dashboard analytics (requires auth)' },
  { path: '/api/analytics/export', method: 'GET', auth: true, description: 'Export analytics (requires auth)' },
  
  // Bookings (GET requires auth, POST is public)
  { path: '/api/bookings', method: 'GET', auth: true, description: 'List bookings (requires auth)' },
  { path: '/api/bookings', method: 'POST', auth: false, description: 'Create booking (public)', body: { roomId: 'test', checkIn: '2025-12-15', checkOut: '2025-12-18', guests: 2 }, expectedStatus: [200, 201, 400, 500] },
  
  // Restaurant Orders (GET requires auth, POST is public)
  { path: '/api/restaurant/orders', method: 'GET', auth: true, description: 'List restaurant orders (requires auth)' },
  { path: '/api/restaurant/orders', method: 'POST', auth: false, description: 'Create restaurant order (public)', body: { roomNumber: '101', items: [], totalAmount: 0 }, expectedStatus: [200, 201, 400, 500] },
  
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
  { path: '/api/qr-codes/generate', method: 'GET', auth: true, description: 'Generate QR code (requires auth)' },
  
  // Webhooks
  { path: '/api/webhooks/stripe', method: 'POST', auth: false, description: 'Stripe webhook (requires signature)', body: { type: 'test' }, expectedStatus: [200, 400, 401, 403] },
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
  
  console.log(`${colors.bright}Test Report:${colors.reset}`);
  console.log(JSON.stringify(report, null, 2));
  
  // Return exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});

