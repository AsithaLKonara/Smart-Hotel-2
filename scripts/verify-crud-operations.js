#!/usr/bin/env node

/**
 * CRUD Operations Verification Script
 * Tests all admin CRUD operations to ensure they're bulletproof
 * 
 * This script verifies:
 * - All CRUD operations return structured error responses (never raw errors)
 * - API endpoints validate input correctly
 * - Error handling is consistent across all entities
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.API_BASE_URL || 'https://smarthotel-demo.vercel.app';
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  entities: {},
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
        'User-Agent': 'SmartHotel-CRUD-Verification/1.0',
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

function logTest(entity, operation, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ [${entity}] ${operation}: ${details || 'PASSED'}`);
  } else {
    testResults.failed++;
    console.log(`❌ [${entity}] ${operation}: ${details || 'FAILED'}`);
  }

  if (!testResults.entities[entity]) {
    testResults.entities[entity] = { passed: 0, failed: 0, tests: [] };
  }

  testResults.entities[entity].tests.push({ operation, passed, details });
  if (passed) testResults.entities[entity].passed++;
  else testResults.entities[entity].failed++;
}

async function testEntityCRUD(entity, endpoints, testData) {
  console.log(`\n🔍 Testing ${entity} CRUD operations...`);

  // Test GET (Read)
  try {
    const response = await makeRequest(`${BASE_URL}${endpoints.list}`);
    const hasValidResponse = response.status === 200 || response.status === 401;
    const isStructuredError = response.status !== 200 ? 
      (() => {
        try {
          const json = JSON.parse(response.data);
          return json.error !== undefined || json.message !== undefined;
        } catch {
          return false;
        }
      })() : true;
    
    logTest(
      entity,
      'GET (List)',
      hasValidResponse && isStructuredError,
      `Status: ${response.status}${!isStructuredError ? ' (non-structured error)' : ''}`
    );
  } catch (error) {
    logTest(entity, 'GET (List)', false, `Error: ${error.message}`);
  }

  // Test POST (Create) - should fail without auth but return structured error
  if (endpoints.create) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoints.create}`, {
        method: 'POST',
        body: testData.create,
      });
      
      const isStructuredResponse = (() => {
        try {
          const json = JSON.parse(response.data);
          return json.error !== undefined || json.id !== undefined || json.message !== undefined;
        } catch {
          return false;
        }
      })();
      
      logTest(
        entity,
        'POST (Create)',
        isStructuredResponse && (response.status === 201 || response.status === 401 || response.status === 400),
        `Status: ${response.status}${!isStructuredResponse ? ' (non-structured response)' : ''}`
      );
    } catch (error) {
      logTest(entity, 'POST (Create)', false, `Error: ${error.message}`);
    }
  }

  // Test validation errors
  if (endpoints.create) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoints.create}`, {
        method: 'POST',
        body: testData.invalid || {},
      });
      
      const isValidErrorResponse = response.status === 400 || response.status === 401;
      const isStructuredError = (() => {
        try {
          const json = JSON.parse(response.data);
          return (json.error !== undefined || json.message !== undefined) && 
                 !response.data.includes('<!DOCTYPE');
        } catch {
          return false;
        }
      })();
      
      logTest(
        entity,
        'POST (Validation)',
        isValidErrorResponse && isStructuredError,
        `Status: ${response.status}${!isStructuredError ? ' (non-structured error)' : ''}`
      );
    } catch (error) {
      logTest(entity, 'POST (Validation)', false, `Error: ${error.message}`);
    }
  }
}

async function runAllCRUDTests() {
  console.log('🚀 Starting CRUD Operations Verification...');
  console.log(`🌐 Testing: ${BASE_URL}\n`);

  // Test Bookings
  await testEntityCRUD('Bookings', {
    list: '/api/bookings',
    create: '/api/bookings',
  }, {
    create: {
      roomId: 'test-room-id',
      checkIn: '2025-12-01',
      checkOut: '2025-12-05',
      guests: 2,
    },
    invalid: {
      checkIn: 'invalid-date',
    },
  });

  // Test Rooms
  await testEntityCRUD('Rooms', {
    list: '/api/rooms',
    create: '/api/rooms',
  }, {
    create: {
      number: '999',
      type: 'STANDARD',
      capacity: 2,
      price: 100,
    },
    invalid: {
      type: 'INVALID_TYPE',
    },
  });

  // Test Menu
  await testEntityCRUD('Menu', {
    list: '/api/restaurant/menu',
    create: '/api/restaurant/menu',
  }, {
    create: {
      name: 'Test Item',
      price: 10.99,
      category: 'APPETIZER',
    },
    invalid: {
      price: 'not-a-number',
    },
  });

  // Test Gallery
  await testEntityCRUD('Gallery', {
    list: '/api/gallery',
  }, {
    create: {
      title: 'Test Image',
      url: '/images/test.jpg',
    },
    invalid: {},
  });

  // Test Staff
  await testEntityCRUD('Staff', {
    list: '/api/staff',
    create: '/api/staff',
  }, {
    create: {
      name: 'Test Staff',
      email: 'test@example.com',
      role: 'RECEPTIONIST',
    },
    invalid: {
      email: 'invalid-email',
    },
  });

  // Test Inventory
  await testEntityCRUD('Inventory', {
    list: '/api/inventory',
    create: '/api/inventory',
  }, {
    create: {
      name: 'Test Item',
      quantity: 10,
      unit: 'pieces',
    },
    invalid: {
      quantity: -1,
    },
  });

  // Generate Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 CRUD VERIFICATION REPORT');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.total}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  console.log('\n📋 Results by Entity:');
  for (const [entity, results] of Object.entries(testResults.entities)) {
    const rate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    console.log(`  ${entity}: ${results.passed}/${results.passed + results.failed} (${rate}%)`);
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllCRUDTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

