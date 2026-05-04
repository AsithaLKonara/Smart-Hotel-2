#!/usr/bin/env node

/**
 * Production Testing Script
 * Runs comprehensive tests on the deployed SmartHotel application
 */

const { execSync } = require('child_process');
const https = require('https');

const PRODUCTION_URL = 'https://smart-hotel-2.vercel.app';

console.log('🧪 SmartHotel Production Testing');
console.log('================================');

async function testEndpoint(endpoint, expectedStatus = 200) {
  return new Promise((resolve, reject) => {
    const url = `${PRODUCTION_URL}${endpoint}`;
    console.log(`Testing: ${url}`);
    
    https.get(url, (res) => {
      console.log(`✅ ${endpoint} - Status: ${res.statusCode}`);
      if (res.statusCode === expectedStatus) {
        resolve(true);
      } else {
        reject(new Error(`Expected ${expectedStatus}, got ${res.statusCode}`));
      }
    }).on('error', (err) => {
      console.log(`❌ ${endpoint} - Error: ${err.message}`);
      reject(err);
    });
  });
}

async function runTests() {
  console.log('🚀 Starting production tests...');
  
  const endpoints = [
    '/',
    '/rooms',
    '/gallery',
    '/contact',
    '/about',
    '/booking',
    '/auth/signin',
    '/api/health/live',
    '/api/health/ready',
    '/api/rooms',
    '/api/gallery',
    '/api/restaurant/menu'
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    try {
      await testEndpoint(endpoint);
      passed++;
    } catch (error) {
      failed++;
      console.error(`❌ Failed: ${endpoint} - ${error.message}`);
    }
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All production tests passed!');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
    return false;
  }
}

async function runPlaywrightTests() {
  console.log('\n🎭 Running Playwright E2E tests...');
  
  try {
    // Set the base URL for Playwright
    process.env.BASE_URL = PRODUCTION_URL;
    
    // Run Playwright tests
    execSync('npx playwright test --project=chromium', { 
      stdio: 'inherit',
      env: { ...process.env, BASE_URL: PRODUCTION_URL }
    });
    
    console.log('✅ Playwright tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Playwright tests failed:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log(`🌐 Testing production URL: ${PRODUCTION_URL}`);
    
    // Test basic endpoints
    const basicTestsPassed = await runTests();
    
    // Run Playwright E2E tests
    const playwrightTestsPassed = await runPlaywrightTests();
    
    if (basicTestsPassed && playwrightTestsPassed) {
      console.log('\n🎊 All tests passed! Your SmartHotel application is working perfectly!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

main();



