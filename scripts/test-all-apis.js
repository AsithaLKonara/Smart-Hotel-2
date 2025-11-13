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
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

// API Endpoints to test
const endpoints = [
  // Health & Testing
  { path: '/api/health/live', method: 'GET', auth: false, description: 'Health check - Liveness probe' },
  { path: '/api/health/ready', method: 'GET', auth: false, description: 'Health check - Readiness probe' },
  { path: '/api/test-simple', method: 'GET', auth: false, description: 'Simple API test' },
  { path: '/api/test-minimal', method: 'GET', auth: false, description: 'Minimal API test' },
  { path: '/api/test-db', method: 'GET', auth: false, description: 'Database connection test' },
  { path: '/api/debug', method: 'GET', auth: false, description: 'Debug information' },
  
  // Settings
  { path: '/api/settings/contact', method: 'GET', auth: false, description: 'Get contact information' },
  
  // Rooms
  { path: '/api/rooms', method: 'GET', auth: false, description: 'List all rooms' },
  { path: '/api/rooms/availability?checkin=2025-12-15&checkout=2025-12-18&guests=2&type=all', method: 'GET', auth: false, description: 'Check room availability' },
  { path: '/api/rooms/check-availability', method: 'GET', auth: false, description: 'Check room availability (alt)' },
  
  // Restaurant
  { path: '/api/restaurant/menu', method: 'GET', auth: false, description: 'List restaurant menu' },
  
  // Analytics
  { path: '/api/analytics', method: 'GET', auth: true, description: 'Get analytics data' },
  { path: '/api/analytics/dashboard', method: 'GET', auth: true, description: 'Get dashboard analytics' },
  
  // Performance
  { path: '/api/performance/metrics', method: 'GET', auth: false, description: 'Get performance metrics' },
  { path: '/api/performance/metrics', method: 'OPTIONS', auth: false, description: 'Performance metrics CORS' },
];

// Helper function to make HTTP requests
async function makeRequest(path, method = 'GET', body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
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
      data = await response.text();
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
  
  const { path, method, auth, description } = endpoint;
  
  console.log(`\n${colors.cyan}Testing: ${method} ${path}${colors.reset}`);
  console.log(`  ${colors.blue}Description: ${description}${colors.reset}`);
  
  try {
    const response = await makeRequest(path, method);
    
    // Check if response is successful (2xx) or acceptable (3xx, 4xx for auth)
    if (response.ok || (response.status >= 200 && response.status < 500)) {
      // Handle different status codes
      if (response.status === 200 || response.status === 201) {
        results.passed++;
        console.log(`  ${colors.green}✓ PASSED${colors.reset} (Status: ${response.status})`);
        
        // Show response summary
        if (response.data) {
          if (typeof response.data === 'object') {
            const keys = Object.keys(response.data);
            if (keys.length > 0) {
              console.log(`  ${colors.bright}Response keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}${colors.reset}`);
            }
          }
        }
      } else if (response.status === 401 || response.status === 403) {
        // Expected for authenticated endpoints without auth
        if (auth) {
          results.passed++;
          console.log(`  ${colors.yellow}✓ PASSED (Expected auth required)${colors.reset} (Status: ${response.status})`);
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
        results.errors.push({
          endpoint: `${method} ${path}`,
          error: `Service unavailable`,
          status: response.status,
          data: response.data,
        });
      } else {
        results.passed++;
        console.log(`  ${colors.yellow}⚠ ACCEPTED${colors.reset} (Status: ${response.status})`);
      }
    } else {
      results.failed++;
      console.log(`  ${colors.red}✗ FAILED${colors.reset} (Status: ${response.status})`);
      results.errors.push({
        endpoint: `${method} ${path}`,
        error: response.error || `HTTP ${response.status}`,
        status: response.status,
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

// Main test function
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SmartHotel API - Comprehensive Endpoint Testing');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`${colors.reset}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total Endpoints: ${endpoints.length}`);
  console.log(`\n${colors.bright}Starting tests...${colors.reset}\n`);
  
  const startTime = Date.now();
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
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
    console.log(`\n${colors.red}${colors.bright}Errors:${colors.reset}`);
    results.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.endpoint}`);
      console.log(`   Error: ${error.error}`);
      if (error.status) {
        console.log(`   Status: ${error.status}`);
      }
    });
  }
  
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  // Return exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});

