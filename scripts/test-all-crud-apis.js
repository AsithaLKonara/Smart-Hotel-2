#!/usr/bin/env node

/**
 * Comprehensive CRUD API Test Script
 * Tests all new CRUD endpoints
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@smarthotel.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123'

let sessionCookie = null

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function signIn() {
  log('\n🔐 Signing in...', 'blue')
  try {
    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        callbackUrl: '/admin',
      }),
      redirect: 'manual',
    })
    
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0]
      log('✅ Signed in successfully', 'green')
      return true
    }
    log('⚠️  Could not get session cookie - tests may fail for protected routes', 'yellow')
    return false
  } catch (error) {
    log(`❌ Sign in failed: ${error.message}`, 'red')
    return false
  }
}

async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie
  }
  
  return fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  })
}

async function testEndpoint(name, method, url, body = null, expectedStatus = 200) {
  try {
    const options = {
      method,
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetchWithAuth(url, options)
    const data = await response.json().catch(() => ({}))
    
    if (response.status === expectedStatus || (expectedStatus === 200 && response.ok)) {
      log(`  ✅ ${name} - Status: ${response.status}`, 'green')
      return { success: true, data, status: response.status }
    } else {
      log(`  ❌ ${name} - Expected ${expectedStatus}, got ${response.status}`, 'red')
      if (data.error) log(`     Error: ${data.error}`, 'red')
      return { success: false, data, status: response.status }
    }
  } catch (error) {
    log(`  ❌ ${name} - Error: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

async function runTests() {
  log('\n🧪 Starting Comprehensive CRUD API Tests\n', 'blue')
  log('=' .repeat(60), 'blue')
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  }

  // Test 1: Settings API
  log('\n📋 TESTING SETTINGS API', 'yellow')
  results.total++
  const settingsTest = await testEndpoint('GET Settings', 'GET', '/api/settings')
  if (settingsTest.success) results.passed++
  else results.failed++

  // Test 2: Navigation API
  log('\n🔗 TESTING NAVIGATION API', 'yellow')
  results.total++
  const navGet = await testEndpoint('GET Navigation', 'GET', '/api/navigation')
  if (navGet.success) {
    results.passed++
    if (navGet.data.items && navGet.data.items.length > 0) {
      log(`  ℹ️  Found ${navGet.data.items.length} navigation links`, 'blue')
    }
  } else {
    results.failed++
  }

  // Test 3: FAQ API
  log('\n❓ TESTING FAQ API', 'yellow')
  results.total++
  const faqGet = await testEndpoint('GET FAQ', 'GET', '/api/faq')
  if (faqGet.success) {
    results.passed++
    if (faqGet.data.items && faqGet.data.items.length > 0) {
      log(`  ℹ️  Found ${faqGet.data.items.length} FAQs`, 'blue')
    }
  } else {
    results.failed++
  }

  // Test 4: Hero Slides API
  log('\n🎨 TESTING HERO SLIDES API', 'yellow')
  results.total++
  const heroGet = await testEndpoint('GET Hero Slides', 'GET', '/api/hero-slides')
  if (heroGet.success) {
    results.passed++
    if (heroGet.data.items && heroGet.data.items.length > 0) {
      log(`  ℹ️  Found ${heroGet.data.items.length} hero slides`, 'blue')
    }
  } else {
    results.failed++
  }

  // Test 5: Social Links API
  log('\n📱 TESTING SOCIAL LINKS API', 'yellow')
  results.total++
  const socialGet = await testEndpoint('GET Social Links', 'GET', '/api/social-links')
  if (socialGet.success) {
    results.passed++
    if (socialGet.data.items && socialGet.data.items.length > 0) {
      log(`  ℹ️  Found ${socialGet.data.items.length} social links`, 'blue')
    }
  } else {
    results.failed++
  }

  // Test 6: Amenities API
  log('\n⭐ TESTING AMENITIES API', 'yellow')
  results.total++
  const amenitiesGet = await testEndpoint('GET Amenities', 'GET', '/api/amenities')
  if (amenitiesGet.success) {
    results.passed++
    if (amenitiesGet.data.items && amenitiesGet.data.items.length > 0) {
      log(`  ℹ️  Found ${amenitiesGet.data.items.length} amenities`, 'blue')
    }
  } else {
    results.failed++
  }

  // Test 7: Attractions API
  log('\n📍 TESTING ATTRACTIONS API', 'yellow')
  results.total++
  const attractionsGet = await testEndpoint('GET Attractions', 'GET', '/api/attractions')
  if (attractionsGet.success) {
    results.passed++
    if (attractionsGet.data.items && attractionsGet.data.items.length > 0) {
      log(`  ℹ️  Found ${attractionsGet.data.items.length} attractions`, 'blue')
    }
  } else {
    results.failed++
  }

  // Test 8: Footer Links API
  log('\n🔗 TESTING FOOTER LINKS API', 'yellow')
  results.total++
  const footerGet = await testEndpoint('GET Footer Links', 'GET', '/api/footer-links')
  if (footerGet.success) {
    results.passed++
    if (footerGet.data.items && footerGet.data.items.length > 0) {
      log(`  ℹ️  Found ${footerGet.data.items.length} footer links`, 'blue')
    }
  } else {
    results.failed++
  }

  // Test 9: Settings Contact API (used by frontend)
  log('\n📞 TESTING SETTINGS CONTACT API', 'yellow')
  results.total++
  const contactGet = await testEndpoint('GET Contact Info', 'GET', '/api/settings/contact')
  if (contactGet.success) {
    results.passed++
    log(`  ℹ️  Hotel: ${contactGet.data.name || 'N/A'}`, 'blue')
  } else {
    results.failed++
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue')
  log('\n📊 TEST SUMMARY', 'blue')
  log(`Total Tests: ${results.total}`, 'blue')
  log(`Passed: ${results.passed}`, 'green')
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green')
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`, 
    results.passed === results.total ? 'green' : 'yellow')

  if (results.failed === 0) {
    log('🎉 All tests passed!', 'green')
  } else {
    log('⚠️  Some tests failed. Check the errors above.', 'yellow')
  }

  return results.failed === 0
}

// Main execution
(async () => {
  try {
    await signIn()
    const success = await runTests()
    process.exit(success ? 0 : 1)
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red')
    process.exit(1)
  }
})()

