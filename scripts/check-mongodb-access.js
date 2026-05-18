#!/usr/bin/env node

/**
 * Check MongoDB Atlas Access Configuration
 */

const https = require('https')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

async function getPublicIP() {
  try {
    console.log('🌐 Getting your public IP address...')
    const { stdout } = await execAsync('curl -s https://api.ipify.org')
    console.log(`📍 Your public IP: ${stdout.trim()}`)
    return stdout.trim()
  } catch (error) {
    console.error('❌ Could not get public IP:', error.message)
    return null
  }
}

async function checkMongoDBStatus() {
  console.log('\n🔍 Checking MongoDB Atlas cluster status...')
  
  // Try to resolve the cluster hostname
  try {
    const { stdout } = await execAsync('nslookup cluster0.1tpj8te.mongodb.net')
    console.log('✅ DNS resolution successful')
    console.log('📡 Cluster hostname is valid')
  } catch (error) {
    console.error('❌ DNS resolution failed:', error.message)
    console.error('🔧 The cluster hostname might be incorrect or the cluster might be paused')
  }
}

function main() {
  console.log('🚀 MongoDB Atlas Access Diagnostic')
  console.log('=' .repeat(40))
  
  getPublicIP()
    .then(async (ip) => {
      await checkMongoDBStatus()
      
      console.log('\n📋 SOLUTION:')
      console.log('=' .repeat(20))
      console.log('🔑 The issue is MongoDB Atlas IP whitelist configuration.')
      console.log('')
      console.log('To fix this:')
      console.log('1. Go to MongoDB Atlas Dashboard')
      console.log('2. Navigate to: Security → Network Access')
      console.log('3. Click "Add IP Address"')
      console.log('4. Add your current IP:', ip || 'YOUR_CURRENT_IP')
      console.log('5. For Vercel deployment, add: 0.0.0.0/0 (allow all IPs)')
      console.log('')
      console.log('⚠️  Security Note:')
      console.log('- 0.0.0.0/0 allows access from anywhere')
      console.log('- For production, use specific IP ranges')
      console.log('- Vercel IPs change frequently, so 0.0.0.0/0 is common for serverless')
      console.log('')
      console.log('🔧 Alternative: Use MongoDB Atlas connection string with IP whitelist')
    })
    .catch(console.error)
}

main()
