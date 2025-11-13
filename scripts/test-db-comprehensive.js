#!/usr/bin/env node

/**
 * Comprehensive Database Connection Test Script
 * Tests the /api/test-db-comprehensive endpoint
 */

const https = require('https')
const http = require('http')

const BASE_URL = process.env.BASE_URL || 'https://smarthotel-demo.vercel.app'
const ENDPOINT = '/api/test-db-comprehensive'

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    
    client.get(url, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, data: json })
        } catch (error) {
          resolve({ status: res.statusCode, data: data })
        }
      })
    }).on('error', (error) => {
      reject(error)
    })
  })
}

async function runTest() {
  console.log('🚀 Comprehensive Database Connection Test')
  console.log('=' .repeat(50))
  console.log(`📍 Testing: ${BASE_URL}${ENDPOINT}`)
  console.log('')
  
  try {
    const { status, data } = await makeRequest(`${BASE_URL}${ENDPOINT}`)
    
    console.log(`📊 HTTP Status: ${status}`)
    console.log('')
    
    if (status === 200 && data.success) {
      console.log('✅ ALL TESTS PASSED!')
      console.log('')
      console.log('📋 Summary:')
      console.log(`   Total Tests: ${data.summary.totalTests}`)
      console.log(`   ✅ Successful: ${data.summary.successful}`)
      console.log(`   ❌ Failed: ${data.summary.failed}`)
      console.log(`   ⏭️  Skipped: ${data.summary.skipped}`)
      console.log(`   ⏱️  Duration: ${data.summary.totalDuration}`)
      console.log('')
      
      console.log('📊 Collection Statistics:')
      data.collections.forEach((collection) => {
        const status = collection.error ? '❌' : '✅'
        console.log(`   ${status} ${collection.name}: ${collection.count} records`)
        if (collection.error) {
          console.log(`      Error: ${collection.error}`)
        }
      })
      console.log('')
      
      if (data.databaseInfo) {
        console.log('🔍 Database Info:')
        console.log(`   Connection: ${data.databaseInfo.connectionString}`)
        console.log(`   Database: ${data.databaseInfo.databaseName}`)
        console.log('')
      }
      
      console.log('📝 Test Details:')
      data.tests.forEach((test) => {
        const icon = test.status === 'success' ? '✅' : test.status === 'failed' ? '❌' : '⏭️'
        console.log(`   ${icon} ${test.name} (${test.duration}ms)`)
        if (test.error) {
          console.log(`      Error: ${test.error}`)
        }
        if (test.data) {
          console.log(`      Data: ${JSON.stringify(test.data)}`)
        }
      })
      
    } else {
      console.log('❌ TESTS FAILED')
      console.log('')
      console.log('Error Details:')
      console.log(JSON.stringify(data, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

runTest()

