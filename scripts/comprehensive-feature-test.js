#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BASE_URL = 'https://smarthotel-demo.vercel.app';
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: {}
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: 10000,
      headers: {
        'User-Agent': 'SmartHotel-Test-Suite/1.0',
        ...options.headers
      }
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.end();
  });
}

function logTest(category, testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ [${category}] ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ [${category}] ${testName} - ${details}`);
  }
  
  if (!testResults.details[category]) {
    testResults.details[category] = { passed: 0, failed: 0, tests: [] };
  }
  
  testResults.details[category].tests.push({
    name: testName,
    passed,
    details
  });
  
  if (passed) testResults.details[category].passed++;
  else testResults.details[category].failed++;
}

async function testStaticPages() {
  console.log('\n📄 Testing Static Pages...');
  
  const pages = [
    '/',
    '/rooms',
    '/order',
    '/gallery',
    '/about',
    '/contact',
    '/admin',
    '/admin/dashboard',
    '/admin/bookings',
    '/admin/rooms',
    '/admin/staff',
    '/admin/inventory',
    '/admin/menu'
  ];

  for (const page of pages) {
    try {
      const response = await makeRequest(`${BASE_URL}${page}`);
      const passed = response.status === 200;
      logTest('Static Pages', `Page: ${page}`, passed, `Status: ${response.status}`);
      
      // Check for key content indicators
      if (passed) {
        const hasContent = response.data.length > 1000; // Basic content check
        logTest('Static Pages', `${page} has content`, hasContent, 
          hasContent ? 'Content loaded' : 'Minimal content');
      }
    } catch (error) {
      logTest('Static Pages', `Page: ${page}`, false, error.message);
    }
  }
}

async function testAPIEndpoints() {
  console.log('\n🔌 Testing API Endpoints...');
  
  const apiEndpoints = [
    '/api/test-simple',
    '/api/test-minimal',
    '/api/rooms',
    '/api/bookings',
    '/api/menu',
    '/api/gallery',
    '/api/staff',
    '/api/inventory',
    '/api/users',
    '/api/auth/session'
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint}`);
      const passed = response.status === 200;
      logTest('API Endpoints', `GET ${endpoint}`, passed, `Status: ${response.status}`);
      
      if (passed && response.data) {
        try {
          const jsonData = JSON.parse(response.data);
          logTest('API Endpoints', `${endpoint} returns JSON`, true, 
            `Data type: ${Array.isArray(jsonData) ? 'Array' : 'Object'}`);
        } catch (e) {
          logTest('API Endpoints', `${endpoint} JSON parsing`, false, 'Invalid JSON');
        }
      }
    } catch (error) {
      logTest('API Endpoints', `GET ${endpoint}`, false, error.message);
    }
  }
}

async function testUserFeatures() {
  console.log('\n👤 Testing User Features...');
  
  // Test room search functionality
  try {
    const response = await makeRequest(`${BASE_URL}/api/rooms`);
    if (response.status === 200) {
      const rooms = JSON.parse(response.data);
      logTest('User Features', 'Room data available', Array.isArray(rooms), 
        Array.isArray(rooms) ? `${rooms.length} rooms found` : 'No room data');
      
      if (Array.isArray(rooms) && rooms.length > 0) {
        const room = rooms[0];
        const hasRequiredFields = room.id && room.name && room.price;
        logTest('User Features', 'Room data structure', hasRequiredFields,
          hasRequiredFields ? 'Valid room structure' : 'Missing required fields');
      }
    }
  } catch (error) {
    logTest('User Features', 'Room search', false, error.message);
  }

  // Test menu functionality
  try {
    const response = await makeRequest(`${BASE_URL}/api/menu`);
    if (response.status === 200) {
      const menu = JSON.parse(response.data);
      logTest('User Features', 'Menu data available', Array.isArray(menu), 
        Array.isArray(menu) ? `${menu.length} items found` : 'No menu data');
    }
  } catch (error) {
    logTest('User Features', 'Menu search', false, error.message);
  }

  // Test gallery functionality
  try {
    const response = await makeRequest(`${BASE_URL}/api/gallery`);
    if (response.status === 200) {
      const gallery = JSON.parse(response.data);
      logTest('User Features', 'Gallery data available', Array.isArray(gallery), 
        Array.isArray(gallery) ? `${gallery.length} images found` : 'No gallery data');
    }
  } catch (error) {
    logTest('User Features', 'Gallery display', false, error.message);
  }
}

async function testAdminFeatures() {
  console.log('\n👨‍💼 Testing Admin Features...');
  
  // Test admin dashboard data
  try {
    const response = await makeRequest(`${BASE_URL}/api/admin/dashboard`);
    const passed = response.status === 200 || response.status === 401; // 401 expected without auth
    logTest('Admin Features', 'Admin dashboard endpoint', passed, 
      response.status === 401 ? 'Protected (requires auth)' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Admin Features', 'Admin dashboard', false, error.message);
  }

  // Test booking management
  try {
    const response = await makeRequest(`${BASE_URL}/api/bookings`);
    const passed = response.status === 200 || response.status === 401;
    logTest('Admin Features', 'Booking management endpoint', passed, 
      response.status === 401 ? 'Protected (requires auth)' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Admin Features', 'Booking management', false, error.message);
  }

  // Test staff management
  try {
    const response = await makeRequest(`${BASE_URL}/api/staff`);
    const passed = response.status === 200 || response.status === 401;
    logTest('Admin Features', 'Staff management endpoint', passed, 
      response.status === 401 ? 'Protected (requires auth)' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Admin Features', 'Staff management', false, error.message);
  }

  // Test inventory management
  try {
    const response = await makeRequest(`${BASE_URL}/api/inventory`);
    const passed = response.status === 200 || response.status === 401;
    logTest('Admin Features', 'Inventory management endpoint', passed, 
      response.status === 401 ? 'Protected (requires auth)' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Admin Features', 'Inventory management', false, error.message);
  }
}

async function testPWAFeatures() {
  console.log('\n📱 Testing PWA Features...');
  
  // Test manifest
  try {
    const response = await makeRequest(`${BASE_URL}/manifest.json`);
    const passed = response.status === 200;
    logTest('PWA Features', 'Web App Manifest', passed, `Status: ${response.status}`);
    
    if (passed) {
      try {
        const manifest = JSON.parse(response.data);
        const hasRequiredFields = manifest.name && manifest.short_name && manifest.start_url;
        logTest('PWA Features', 'Manifest structure', hasRequiredFields,
          hasRequiredFields ? 'Valid manifest' : 'Missing required fields');
      } catch (e) {
        logTest('PWA Features', 'Manifest parsing', false, 'Invalid JSON');
      }
    }
  } catch (error) {
    logTest('PWA Features', 'Web App Manifest', false, error.message);
  }

  // Test service worker
  try {
    const response = await makeRequest(`${BASE_URL}/sw.js`);
    const passed = response.status === 200 || response.status === 404;
    logTest('PWA Features', 'Service Worker', response.status === 200, 
      response.status === 404 ? 'Not implemented' : 'Available');
  } catch (error) {
    logTest('PWA Features', 'Service Worker', false, error.message);
  }

  // Test icons
  const iconSizes = ['192x192', '512x512'];
  for (const size of iconSizes) {
    try {
      const response = await makeRequest(`${BASE_URL}/icons/icon-${size}.png`);
      logTest('PWA Features', `Icon ${size}`, response.status === 200, 
        response.status === 200 ? 'Available' : `Status: ${response.status}`);
    } catch (error) {
      logTest('PWA Features', `Icon ${size}`, false, error.message);
    }
  }
}

async function testPerformanceFeatures() {
  console.log('\n⚡ Testing Performance Features...');
  
  // Test CSS loading
  try {
    const response = await makeRequest(`${BASE_URL}/_next/static/css/`);
    const passed = response.status === 200 || response.status === 404;
    logTest('Performance', 'CSS static files', response.status === 200, 
      response.status === 404 ? 'No static CSS' : 'CSS available');
  } catch (error) {
    logTest('Performance', 'CSS loading', false, error.message);
  }

  // Test image optimization
  try {
    const response = await makeRequest(`${BASE_URL}/_next/image?url=%2Fimages%2Fhotel-hero-1.jpg&w=800&q=75`);
    logTest('Performance', 'Image optimization', response.status === 200, 
      response.status === 200 ? 'Working' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Performance', 'Image optimization', false, error.message);
  }

  // Test response times
  const startTime = Date.now();
  try {
    await makeRequest(`${BASE_URL}/`);
    const responseTime = Date.now() - startTime;
    const fastResponse = responseTime < 2000;
    logTest('Performance', 'Homepage load time', fastResponse, 
      `${responseTime}ms ${fastResponse ? '(Good)' : '(Slow)'}`);
  } catch (error) {
    logTest('Performance', 'Response time', false, error.message);
  }
}

async function testSecurityFeatures() {
  console.log('\n🔒 Testing Security Features...');
  
  // Test HTTPS
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    const hasSecurityHeaders = response.headers['strict-transport-security'] || 
                              response.headers['x-frame-options'] ||
                              response.headers['x-content-type-options'];
    logTest('Security', 'Security headers', !!hasSecurityHeaders, 
      hasSecurityHeaders ? 'Present' : 'Missing security headers');
  } catch (error) {
    logTest('Security', 'Security headers', false, error.message);
  }

  // Test CSP
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    const hasCSP = response.headers['content-security-policy'];
    logTest('Security', 'Content Security Policy', !!hasCSP, 
      hasCSP ? 'Present' : 'Missing CSP');
  } catch (error) {
    logTest('Security', 'CSP check', false, error.message);
  }

  // Test authentication endpoints
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/session`);
    const properAuthResponse = response.status === 401 || response.status === 200;
    logTest('Security', 'Authentication endpoint', properAuthResponse, 
      response.status === 401 ? 'Properly protected' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Security', 'Authentication', false, error.message);
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE FEATURE TEST REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n📈 OVERALL RESULTS:`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.total}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  console.log(`\n📋 DETAILED RESULTS BY CATEGORY:`);
  for (const [category, results] of Object.entries(testResults.details)) {
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  📊 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    // Show failed tests
    const failedTests = results.tests.filter(t => !t.passed);
    if (failedTests.length > 0) {
      console.log(`  🚨 Failed Tests:`);
      failedTests.forEach(test => {
        console.log(`    - ${test.name}: ${test.details}`);
      });
    }
  }
  
  console.log(`\n🌐 DEPLOYMENT URL: ${BASE_URL}`);
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  
  // Overall assessment
  const successRate = (testResults.passed / testResults.total) * 100;
  console.log(`\n🏆 OVERALL ASSESSMENT:`);
  if (successRate >= 90) {
    console.log(`🟢 EXCELLENT - Application is production-ready!`);
  } else if (successRate >= 75) {
    console.log(`🟡 GOOD - Minor issues to address`);
  } else if (successRate >= 50) {
    console.log(`🟠 FAIR - Several issues need attention`);
  } else {
    console.log(`🔴 POOR - Major issues require immediate attention`);
  }
  
  console.log('\n' + '='.repeat(60));
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Feature Testing...');
  console.log(`🌐 Testing: ${BASE_URL}`);
  console.log(`📅 ${new Date().toISOString()}\n`);
  
  try {
    await testStaticPages();
    await testAPIEndpoints();
    await testUserFeatures();
    await testAdminFeatures();
    await testPWAFeatures();
    await testPerformanceFeatures();
    await testSecurityFeatures();
    
    await generateReport();
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runAllTests();
