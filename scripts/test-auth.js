#!/usr/bin/env node

/**
 * Authentication Test Script for SmartHotel
 * Tests authentication flow with static URL configuration
 */

const https = require('https')
const http = require('http')

const BASE_URL = process.env.BASE_URL || 'https://smarthotel-demo-8nkmogjtg-asithalkonaras-projects.vercel.app'
const TEST_EMAIL = 'admin@smarthotel.test'
const TEST_PASSWORD = 'password123'

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://')
    const client = isHttps ? https : http
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }

    const req = client.request(url, requestOptions, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          })
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }

    req.end()
  })
}

async function testHealthCheck() {
  log('\n🏥 Testing Health Check...', 'blue')
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/health/live`)
    
    if (response.status === 200) {
      log('✅ Health check passed', 'green')
      return true
    } else {
      log(`❌ Health check failed: ${response.status}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, 'red')
    return false
  }
}

async function testDatabaseConnection() {
  log('\n🗄️ Testing Database Connection...', 'blue')
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/health/ready`)
    
    if (response.status === 200) {
      log('✅ Database connection successful', 'green')
      return true
    } else {
      log(`❌ Database connection failed: ${response.status}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Database connection error: ${error.message}`, 'red')
    return false
  }
}

async function testSignIn() {
  log('\n🔐 Testing Sign In...', 'blue')
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }
    })
    
    if (response.status === 200 || response.status === 302) {
      log('✅ Sign in successful', 'green')
      
      // Extract session token from Set-Cookie header
      const setCookie = response.headers['set-cookie']
      if (setCookie) {
        const sessionToken = setCookie.find(cookie => cookie.includes('next-auth.session-token'))
        if (sessionToken) {
          log('✅ Session token received', 'green')
          return sessionToken.split(';')[0].split('=')[1]
        }
      }
      
      return true
    } else {
      log(`❌ Sign in failed: ${response.status}`, 'red')
      log(`Response: ${JSON.stringify(response.data)}`, 'yellow')
      return false
    }
  } catch (error) {
    log(`❌ Sign in error: ${error.message}`, 'red')
    return false
  }
}

async function testSession(sessionToken) {
  log('\n📋 Testing Session Validation...', 'blue')
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/auth/session`, {
      headers: {
        'Cookie': `next-auth.session-token=${sessionToken}`
      }
    })
    
    if (response.status === 200 && response.data.user) {
      log('✅ Session validation successful', 'green')
      log(`User: ${response.data.user.email} (${response.data.user.role})`, 'green')
      return true
    } else {
      log(`❌ Session validation failed: ${response.status}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Session validation error: ${error.message}`, 'red')
    return false
  }
}

async function testQRGeneration(sessionToken) {
  log('\n📱 Testing QR Code Generation...', 'blue')
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/admin/qr-generator`, {
      headers: {
        'Cookie': `next-auth.session-token=${sessionToken}`
      }
    })
    
    if (response.status === 200) {
      log('✅ QR code generation successful', 'green')
      return true
    } else {
      log(`❌ QR code generation failed: ${response.status}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ QR code generation error: ${error.message}`, 'red')
    return false
  }
}

async function testBookingAPI(sessionToken) {
  log('\n🏨 Testing Booking API...', 'blue')
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/bookings`, {
      headers: {
        'Cookie': `next-auth.session-token=${sessionToken}`
      }
    })
    
    if (response.status === 200) {
      log('✅ Booking API accessible', 'green')
      return true
    } else {
      log(`❌ Booking API failed: ${response.status}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Booking API error: ${error.message}`, 'red')
    return false
  }
}

async function runAllTests() {
  log('🚀 SmartHotel Authentication Test Suite', 'bold')
  log(`Testing URL: ${BASE_URL}`, 'blue')
  
  const results = {
    healthCheck: false,
    databaseConnection: false,
    signIn: false,
    sessionValidation: false,
    qrGeneration: false,
    bookingAPI: false
  }
  
  // Run tests in sequence
  results.healthCheck = await testHealthCheck()
  results.databaseConnection = await testDatabaseConnection()
  
  const sessionToken = await testSignIn()
  results.signIn = !!sessionToken
  
  if (sessionToken) {
    results.sessionValidation = await testSession(sessionToken)
    results.qrGeneration = await testQRGeneration(sessionToken)
    results.bookingAPI = await testBookingAPI(sessionToken)
  }
  
  // Summary
  log('\n📊 Test Results Summary:', 'bold')
  log('========================', 'bold')
  
  const testNames = {
    healthCheck: 'Health Check',
    databaseConnection: 'Database Connection',
    signIn: 'Sign In',
    sessionValidation: 'Session Validation',
    qrGeneration: 'QR Code Generation',
    bookingAPI: 'Booking API'
  }
  
  let passedTests = 0
  const totalTests = Object.keys(results).length
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL'
    const color = passed ? 'green' : 'red'
    log(`${testNames[test]}: ${status}`, color)
    if (passed) passedTests++
  })
  
  log('\n📈 Overall Result:', 'bold')
  log(`Passed: ${passedTests}/${totalTests} tests`, passedTests === totalTests ? 'green' : 'yellow')
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed! Authentication is working correctly.', 'green')
  } else {
    log('\n⚠️ Some tests failed. Check the logs above for details.', 'yellow')
  }
  
  return passedTests === totalTests
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      log(`\n💥 Test suite error: ${error.message}`, 'red')
      process.exit(1)
    })
}

module.exports = { runAllTests, testHealthCheck, testSignIn, testSession }
