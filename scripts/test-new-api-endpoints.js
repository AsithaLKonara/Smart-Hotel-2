#!/usr/bin/env node

/**
 * Test New API Endpoints
 * Tests all newly added API endpoints on production deployment
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.API_BASE_URL || 'https://smarthotel-demo.vercel.app';
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  endpoints: {},
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      timeout: options.timeout || 5000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SmartHotel-New-APIs-Test/1.0',
        ...options.headers,
      },
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url,
        });
      });
    });

    req.on('error', reject);
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

function logTest(endpoint, method, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ [${method}] ${endpoint}: ${details || 'PASSED'}`);
  } else {
    testResults.failed++;
    console.log(`❌ [${method}] ${endpoint}: ${details || 'FAILED'}`);
  }

  const key = `${method} ${endpoint}`;
  if (!testResults.endpoints[key]) {
    testResults.endpoints[key] = { passed: 0, failed: 0, tests: [] };
  }

  testResults.endpoints[key].tests.push({ passed, details });
  if (passed) testResults.endpoints[key].passed++;
  else testResults.endpoints[key].failed++;
}

async function testEndpoint(endpoint, method = 'GET', body = null, expectedStatus = null) {
  try {
    const response = await makeRequest(`${BASE_URL}${endpoint}`, {
      method,
      body,
    });

    const isStructuredResponse = (() => {
      try {
        const json = JSON.parse(response.data);
        return json.error !== undefined || json.id !== undefined || Array.isArray(json) || json.message !== undefined;
      } catch {
        return false;
      }
    })();

    const statusOk = expectedStatus 
      ? response.status === expectedStatus
      : (response.status === 200 || response.status === 201 || response.status === 401 || response.status === 404);

    const passed = statusOk && isStructuredResponse && !response.data.includes('<!DOCTYPE');
    
    logTest(
      endpoint,
      method,
      passed,
      `Status: ${response.status}${!isStructuredResponse ? ' (non-structured)' : ''}`
    );

    return { passed, response };
  } catch (error) {
    logTest(endpoint, method, false, `Error: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🧪 Testing New API Endpoints on Production...');
  console.log(`🌐 Base URL: ${BASE_URL}\n`);

  // Test Order Items
  console.log('📦 Testing Order Items...');
  await testEndpoint('/api/order-items', 'GET', null, 401); // Should require auth
  
  // Test Payments
  console.log('💳 Testing Payments...');
  await testEndpoint('/api/payments', 'GET', null, 401); // Should require auth
  
  // Test Room Reviews (public read)
  console.log('⭐ Testing Room Reviews...');
  await testEndpoint('/api/room-reviews', 'GET'); // Public access
  
  // Test Room Images
  console.log('🖼️  Testing Room Images...');
  await testEndpoint('/api/room-images', 'GET'); // Public access
  
  // Test Notifications
  console.log('🔔 Testing Notifications...');
  await testEndpoint('/api/notifications', 'GET', null, 401); // Should require auth
  
  // Test Guest Preferences
  console.log('👤 Testing Guest Preferences...');
  await testEndpoint('/api/guest-preferences', 'GET', null, 401); // Should require auth
  
  // Test Maintenance Requests
  console.log('🔧 Testing Maintenance Requests...');
  await testEndpoint('/api/maintenance-requests', 'GET', null, 401); // Should require auth
  
  // Test Events
  console.log('🎉 Testing Events...');
  await testEndpoint('/api/events', 'GET'); // Public access
  
  // Test Loyalty
  console.log('🎁 Testing Loyalty Program...');
  await testEndpoint('/api/loyalty', 'GET', null, 401); // Should require auth
  await testEndpoint('/api/loyalty/transactions', 'GET', null, 401); // Should require auth
  
  // Test Hotel Reviews
  console.log('🏨 Testing Hotel Reviews...');
  await testEndpoint('/api/hotel-reviews', 'GET'); // Public access

  // Generate Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 NEW API ENDPOINTS TEST REPORT');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.total}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  console.log('\n📋 Results by Endpoint:');
  for (const [endpoint, results] of Object.entries(testResults.endpoints)) {
    const rate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    console.log(`  ${endpoint}: ${results.passed}/${results.passed + results.failed} (${rate}%)`);
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

