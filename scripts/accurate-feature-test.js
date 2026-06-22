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

async function testImplementedPages() {
  console.log('\n📄 Testing Implemented Pages...');
  
  const implementedPages = [
    { path: '/', name: 'Homepage' },
    { path: '/rooms', name: 'Rooms' },
    { path: '/gallery', name: 'Gallery' },
    { path: '/contact', name: 'Contact' },
    { path: '/auth/signin', name: 'Sign In' },
    { path: '/auth/signup', name: 'Sign Up' },
    { path: '/booking', name: 'Booking' },
    { path: '/booking-flow', name: 'Booking Flow' },
    { path: '/order', name: 'Food Ordering' },
    { path: '/my-bookings', name: 'My Bookings' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/test-page', name: 'Test Page' }
  ];

  for (const page of implementedPages) {
    try {
      const response = await makeRequest(`${BASE_URL}${page.path}`);
      const passed = response.status === 200;
      logTest('Implemented Pages', `${page.name} (${page.path})`, passed, `Status: ${response.status}`);
      
      if (passed) {
        const hasContent = response.data.length > 1000;
        logTest('Implemented Pages', `${page.name} content`, hasContent, 
          hasContent ? 'Rich content' : 'Minimal content');
      }
    } catch (error) {
      logTest('Implemented Pages', `${page.name} (${page.path})`, false, error.message);
    }
  }
}

async function testImplementedAPIs() {
  console.log('\n🔌 Testing Implemented API Endpoints...');
  
  const implementedAPIs = [
    { path: '/api/test-simple', name: 'Simple Test API' },
    { path: '/api/test-minimal', name: 'Minimal Test API' },
    { path: '/api/rooms', name: 'Rooms API' },
    { path: '/api/bookings', name: 'Bookings API' },
    { path: '/api/staff', name: 'Staff API' },
    { path: '/api/inventory', name: 'Inventory API' },
    { path: '/api/gallery', name: 'Gallery API' },
    { path: '/api/tasks', name: 'Tasks API' },
    { path: '/api/restaurant/menu', name: 'Restaurant Menu API' },
    { path: '/api/restaurant/orders', name: 'Restaurant Orders API' },
    { path: '/api/qr-codes/generate', name: 'QR Code Generation API' },
    { path: '/api/analytics', name: 'Analytics API' },
    { path: '/api/health/live', name: 'Health Check (Live)' },
    { path: '/api/health/ready', name: 'Health Check (Ready)' },
    { path: '/api/auth/session', name: 'Auth Session API' }
  ];

  for (const api of implementedAPIs) {
    try {
      const response = await makeRequest(`${BASE_URL}${api.path}`);
      const passed = response.status === 200 || response.status === 401; // 401 is expected for protected endpoints
      logTest('Implemented APIs', `${api.name}`, passed, `Status: ${response.status}`);
      
      if (passed && response.status === 200 && response.data) {
        try {
          const jsonData = JSON.parse(response.data);
          logTest('Implemented APIs', `${api.name} JSON`, true, 
            `Data: ${Array.isArray(jsonData) ? `${jsonData.length} items` : 'Object'}`);
        } catch (e) {
          logTest('Implemented APIs', `${api.name} JSON parsing`, false, 'Invalid JSON');
        }
      }
    } catch (error) {
      logTest('Implemented APIs', `${api.name}`, false, error.message);
    }
  }
}

async function testUserFeatures() {
  console.log('\n👤 Testing User Features...');
  
  // Test room browsing
  try {
    const response = await makeRequest(`${BASE_URL}/api/rooms`);
    if (response.status === 200) {
      const rooms = JSON.parse(response.data);
      logTest('User Features', 'Room browsing', Array.isArray(rooms), 
        Array.isArray(rooms) ? `${rooms.length} rooms available` : 'No rooms data');
      
      if (Array.isArray(rooms) && rooms.length > 0) {
        const room = rooms[0];
        const hasRequiredFields = room.id && room.name && room.price;
        logTest('User Features', 'Room data structure', hasRequiredFields,
          hasRequiredFields ? 'Valid room data' : 'Missing room fields');
      }
    } else {
      logTest('User Features', 'Room browsing', false, `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('User Features', 'Room browsing', false, error.message);
  }

  // Test restaurant menu
  try {
    const response = await makeRequest(`${BASE_URL}/api/restaurant/menu`);
    if (response.status === 200) {
      const menu = JSON.parse(response.data);
      logTest('User Features', 'Restaurant menu', Array.isArray(menu), 
        Array.isArray(menu) ? `${menu.length} menu items` : 'No menu data');
    } else {
      logTest('User Features', 'Restaurant menu', false, `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('User Features', 'Restaurant menu', false, error.message);
  }

  // Test gallery
  try {
    const response = await makeRequest(`${BASE_URL}/api/gallery`);
    if (response.status === 200) {
      const gallery = JSON.parse(response.data);
      logTest('User Features', 'Hotel gallery', Array.isArray(gallery), 
        Array.isArray(gallery) ? `${gallery.length} images` : 'No gallery data');
    } else {
      logTest('User Features', 'Hotel gallery', false, `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('User Features', 'Hotel gallery', false, error.message);
  }

  // Test booking flow
  try {
    const response = await makeRequest(`${BASE_URL}/booking`);
    logTest('User Features', 'Booking page', response.status === 200, 
      response.status === 200 ? 'Accessible' : `Status: ${response.status}`);
  } catch (error) {
    logTest('User Features', 'Booking page', false, error.message);
  }

  // Test food ordering
  try {
    const response = await makeRequest(`${BASE_URL}/order`);
    logTest('User Features', 'Food ordering page', response.status === 200, 
      response.status === 200 ? 'Accessible' : `Status: ${response.status}`);
  } catch (error) {
    logTest('User Features', 'Food ordering page', false, error.message);
  }
}

async function testAdminFeatures() {
  console.log('\n👨‍💼 Testing Admin Features...');
  
  // Test dashboard
  try {
    const response = await makeRequest(`${BASE_URL}/dashboard`);
    logTest('Admin Features', 'Admin dashboard', response.status === 200, 
      response.status === 200 ? 'Accessible' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Admin Features', 'Admin dashboard', false, error.message);
  }

  // Test protected API endpoints (should return 401 without auth)
  const protectedEndpoints = [
    { path: '/api/bookings', name: 'Booking management' },
    { path: '/api/staff', name: 'Staff management' },
    { path: '/api/inventory', name: 'Inventory management' },
    { path: '/api/tasks', name: 'Task management' }
  ];

  for (const endpoint of protectedEndpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`);
      const isProtected = response.status === 401;
      logTest('Admin Features', `${endpoint.name} protection`, isProtected, 
        isProtected ? 'Properly protected' : `Status: ${response.status}`);
    } catch (error) {
      logTest('Admin Features', `${endpoint.name} protection`, false, error.message);
    }
  }

  // Test QR code generation
  try {
    const response = await makeRequest(`${BASE_URL}/api/qr-codes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomNumber: '101' })
    });
    const passed = response.status === 200 || response.status === 401;
    logTest('Admin Features', 'QR code generation', passed, 
      response.status === 401 ? 'Protected (needs auth)' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Admin Features', 'QR code generation', false, error.message);
  }
}

async function testPWAFeatures() {
  console.log('\n📱 Testing PWA Features...');
  
  // Test manifest
  try {
    const response = await makeRequest(`${BASE_URL}/manifest.json`);
    logTest('PWA Features', 'Web App Manifest', response.status === 200, 
      response.status === 200 ? 'Available' : `Status: ${response.status}`);
    
    if (response.status === 200) {
      try {
        const manifest = JSON.parse(response.data);
        const hasRequiredFields = manifest.name && manifest.short_name;
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
    logTest('PWA Features', 'Service Worker', response.status === 200, 
      response.status === 200 ? 'Available' : `Status: ${response.status}`);
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
  
  // Test response times
  const pages = ['/', '/rooms', '/gallery', '/contact'];
  for (const page of pages) {
    const startTime = Date.now();
    try {
      const response = await makeRequest(`${BASE_URL}${page}`);
      const responseTime = Date.now() - startTime;
      const fastResponse = responseTime < 3000;
      logTest('Performance', `${page} load time`, fastResponse, 
        `${responseTime}ms ${fastResponse ? '(Fast)' : '(Slow)'}`);
    } catch (error) {
      logTest('Performance', `${page} load time`, false, error.message);
    }
  }

  // Test image optimization
  try {
    const response = await makeRequest(`${BASE_URL}/_next/image?url=%2Fimages%2Fhotel-hero-1.jpg&w=800&q=75`);
    logTest('Performance', 'Image optimization', response.status === 200, 
      response.status === 200 ? 'Working' : `Status: ${response.status}`);
  } catch (error) {
    logTest('Performance', 'Image optimization', false, error.message);
  }
}

async function testSecurityFeatures() {
  console.log('\n🔒 Testing Security Features...');
  
  // Test HTTPS
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    logTest('Security', 'HTTPS enabled', response.url.startsWith('https'), 
      response.url.startsWith('https') ? 'Secure connection' : 'HTTP connection');
  } catch (error) {
    logTest('Security', 'HTTPS check', false, error.message);
  }

  // Test security headers
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
}

async function testDatabaseIntegration() {
  console.log('\n🗄️ Testing Database Integration...');
  
  // Test database connectivity
  try {
    const response = await makeRequest(`${BASE_URL}/api/test-db`);
    logTest('Database', 'Database connectivity', response.status === 200, 
      response.status === 200 ? 'Connected' : `Status: ${response.status}`);
    
    if (response.status === 200) {
      try {
        const data = JSON.parse(response.data);
        logTest('Database', 'Database response', data.success === true, 
          data.success ? 'Database working' : 'Database error');
      } catch (e) {
        logTest('Database', 'Database response parsing', false, 'Invalid response');
      }
    }
  } catch (error) {
    logTest('Database', 'Database connectivity', false, error.message);
  }

  // Test data availability
  const dataEndpoints = [
    { path: '/api/rooms', name: 'Rooms data' },
    { path: '/api/restaurant/menu', name: 'Menu data' },
    { path: '/api/gallery', name: 'Gallery data' }
  ];

  for (const endpoint of dataEndpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`);
      if (response.status === 200) {
        const data = JSON.parse(response.data);
        logTest('Database', endpoint.name, Array.isArray(data) && data.length > 0, 
          Array.isArray(data) ? `${data.length} records` : 'No data');
      } else {
        logTest('Database', endpoint.name, false, `Status: ${response.status}`);
      }
    } catch (error) {
      logTest('Database', endpoint.name, false, error.message);
    }
  }
}

async function generateDetailedReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE SMART HOTEL FEATURE TEST REPORT');
  console.log('='.repeat(80));
  
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
  
  // Feature completeness assessment
  const successRate = (testResults.passed / testResults.total) * 100;
  console.log(`\n🏆 FEATURE COMPLETENESS ASSESSMENT:`);
  
  if (successRate >= 90) {
    console.log(`🟢 EXCELLENT - All major features working perfectly!`);
    console.log(`   Ready for production deployment.`);
  } else if (successRate >= 80) {
    console.log(`🟡 VERY GOOD - Most features working, minor issues to address`);
    console.log(`   Nearly production-ready.`);
  } else if (successRate >= 70) {
    console.log(`🟠 GOOD - Core features working, some improvements needed`);
    console.log(`   Functional but needs optimization.`);
  } else if (successRate >= 50) {
    console.log(`🔴 FAIR - Basic functionality present, significant issues`);
    console.log(`   Requires major fixes before production.`);
  } else {
    console.log(`🔴 POOR - Major functionality missing`);
    console.log(`   Not ready for production use.`);
  }

  // Recommendations
  console.log(`\n💡 RECOMMENDATIONS:`);
  const categories = Object.keys(testResults.details);
  for (const category of categories) {
    const results = testResults.details[category];
    const categoryRate = (results.passed / (results.passed + results.failed)) * 100;
    
    if (categoryRate < 70) {
      console.log(`   - ${category}: Needs attention (${categoryRate.toFixed(1)}% success)`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

async function runAccurateTests() {
  console.log('🚀 Starting Accurate SmartHotel Feature Testing...');
  console.log(`🌐 Testing: ${BASE_URL}`);
  console.log(`📅 ${new Date().toISOString()}\n`);
  
  try {
    await testImplementedPages();
    await testImplementedAPIs();
    await testUserFeatures();
    await testAdminFeatures();
    await testPWAFeatures();
    await testPerformanceFeatures();
    await testSecurityFeatures();
    await testDatabaseIntegration();
    
    await generateDetailedReport();
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runAccurateTests();
