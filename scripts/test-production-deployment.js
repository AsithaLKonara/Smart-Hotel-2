#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BASE_URL = 'https://smarthotel-demo.vercel.app';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SmartHotel-Test-Suite/1.0',
        ...options.headers
      },
      timeout: 10000
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

function log(message, status = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  };
  
  const icon = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  
  console.log(`${colors[status]}${icon[status]} ${message}${colors.reset}`);
}

async function testEndpoint(name, endpoint, expectedStatus = 200, method = 'GET', body = null) {
  try {
    log(`Testing ${name}...`, 'info');
    
    const response = await makeRequest(`${BASE_URL}${endpoint}`, {
      method,
      body
    });
    
    if (response.status === expectedStatus) {
      log(`${name} - Status: ${response.status} ✓`, 'success');
      return { success: true, response };
    } else {
      log(`${name} - Expected ${expectedStatus}, got ${response.status}`, 'error');
      return { success: false, response };
    }
  } catch (error) {
    log(`${name} - Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function testCRUDOperations() {
  log('🚀 Starting Comprehensive Production Deployment Tests', 'info');
  log('=' .repeat(60), 'info');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Health Check
  log('\n📊 Testing Health Endpoints', 'info');
  results.total++;
  const healthResult = await testEndpoint('Health Check', '/api/health/live');
  if (healthResult.success) results.passed++; else results.failed++;

  results.total++;
  const readyResult = await testEndpoint('Ready Check', '/api/health/ready');
  if (readyResult.success) results.passed++; else results.failed++;

  // Test 2: Database Connection
  log('\n🗄️ Testing Database Connection', 'info');
  results.total++;
  const dbResult = await testEndpoint('Database Test', '/api/test-db');
  if (dbResult.success) results.passed++; else results.failed++;

  // Test 3: Authentication
  log('\n🔐 Testing Authentication', 'info');
  results.total++;
  const authResult = await testEndpoint('Auth Session', '/api/auth/session');
  if (authResult.success) results.passed++; else results.failed++;

  // Test 4: Public API Endpoints
  log('\n📡 Testing Public API Endpoints', 'info');
  
  const publicEndpoints = [
    { name: 'Rooms API', endpoint: '/api/rooms' },
    { name: 'Menu API', endpoint: '/api/restaurant/menu' },
    { name: 'Staff API', endpoint: '/api/staff' },
    { name: 'Tasks API', endpoint: '/api/tasks' },
    { name: 'Inventory API', endpoint: '/api/inventory' },
    { name: 'Gallery API', endpoint: '/api/gallery' },
    { name: 'Analytics API', endpoint: '/api/analytics' }
  ];

  for (const endpoint of publicEndpoints) {
    results.total++;
    const result = await testEndpoint(endpoint.name, endpoint.endpoint);
    if (result.success) results.passed++; else results.failed++;
  }

  // Test 5: Frontend Pages
  log('\n🌐 Testing Frontend Pages', 'info');
  
  const pages = [
    { name: 'Homepage', endpoint: '/' },
    { name: 'Sign In', endpoint: '/auth/signin' },
    { name: 'Sign Up', endpoint: '/auth/signup' },
    { name: 'Booking', endpoint: '/booking' },
    { name: 'Rooms', endpoint: '/rooms' },
    { name: 'Order', endpoint: '/order' },
    { name: 'Contact', endpoint: '/contact' },
    { name: 'Gallery', endpoint: '/gallery' }
  ];

  for (const page of pages) {
    results.total++;
    const result = await testEndpoint(page.name, page.endpoint, 200);
    if (result.success) results.passed++; else results.failed++;
  }

  // Test 6: Dashboard Pages (should redirect to auth)
  log('\n📊 Testing Dashboard Pages', 'info');
  
  const dashboardPages = [
    { name: 'Dashboard', endpoint: '/dashboard' },
    { name: 'Bookings', endpoint: '/dashboard/bookings' },
    { name: 'Orders', endpoint: '/dashboard/orders' },
    { name: 'Tasks', endpoint: '/dashboard/tasks' }
  ];

  for (const page of dashboardPages) {
    results.total++;
    // Dashboard pages should redirect to auth (302) or show auth form
    const result = await testEndpoint(page.name, page.endpoint, [200, 302]);
    if (result.success) results.passed++; else results.failed++;
  }

  // Test 7: CSS and Static Assets
  log('\n🎨 Testing Static Assets', 'info');
  
  const assets = [
    { name: 'CSS Bundle', endpoint: '/_next/static/css/app.css' },
    { name: 'JS Bundle', endpoint: '/_next/static/chunks/main.js' },
    { name: 'Hero Image', endpoint: '/images/hotel-hero-1.jpg' },
    { name: 'PWA Manifest', endpoint: '/manifest.json' }
  ];

  for (const asset of assets) {
    results.total++;
    const result = await testEndpoint(asset.name, asset.endpoint, [200, 404]);
    if (result.success) results.passed++; else results.failed++;
  }

  // Test 8: CRUD Operations (if we can get a session)
  log('\n🔄 Testing CRUD Operations', 'info');
  
  // Try to create a test booking
  results.total++;
  const bookingData = {
    roomId: 'test-room-id',
    checkIn: '2024-02-01',
    checkOut: '2024-02-03',
    guests: 2,
    totalAmount: 300
  };
  
  const createBookingResult = await testEndpoint('Create Booking', '/api/bookings', [200, 201, 401], 'POST', bookingData);
  if (createBookingResult.success) results.passed++; else results.failed++;

  // Summary
  log('\n' + '=' .repeat(60), 'info');
  log('📊 TEST SUMMARY', 'info');
  log('=' .repeat(60), 'info');
  log(`Total Tests: ${results.total}`, 'info');
  log(`Passed: ${results.passed}`, 'success');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 'info');
  
  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! Production deployment is working correctly!', 'success');
  } else {
    log('\n⚠️ Some tests failed. Check the details above.', 'warning');
  }

  log('\n🌐 Production URL: https://smarthotel-demo.vercel.app', 'info');
  log('🔍 Inspect URL: https://vercel.com/asithalkonaras-projects/smarthotel-demo', 'info');
  
  return results;
}

// Run the tests
testCRUDOperations()
  .then((results) => {
    process.exit(results.failed === 0 ? 0 : 1);
  })
  .catch((error) => {
    log(`Test suite failed: ${error.message}`, 'error');
    process.exit(1);
  });
