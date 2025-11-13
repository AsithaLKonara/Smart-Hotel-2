#!/usr/bin/env node

/**
 * Setup Vercel Environment Variables
 * Reads from .env.local and sets them in Vercel
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

function getEnvValue(varName, envContent) {
  const match = envContent.match(new RegExp(`^${varName}=(.+)$`, 'm'))
  if (!match) return null
  
  let value = match[1].trim()
  // Remove quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  return value
}

function setVercelEnv(varName, value, environment = 'production') {
  if (!value || value.trim() === '') {
    console.log(`⚠️  Skipping ${varName} (empty value)`)
    return false
  }

  try {
    // Remove any line breaks from value (especially important for DATABASE_URL)
    const cleanValue = value.replace(/\n/g, '').replace(/\r/g, '').trim()
    
    // Use printf to handle special characters better
    const command = `printf '%s' "${cleanValue.replace(/"/g, '\\"').replace(/\$/g, '\\$')}" | vercel env add ${varName} ${environment} --force 2>&1`
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' })
    
    if (output.includes('Added') || output.includes('Updated') || output.includes('Overrode')) {
      console.log(`✅ ${varName} set for ${environment}`)
      return true
    } else if (output.includes('already exists') || output.includes('Saving')) {
      console.log(`✅ ${varName} updated for ${environment}`)
      return true
    } else {
      console.log(`⚠️  ${varName} - ${output.trim().substring(0, 100)}`)
      return false
    }
  } catch (error) {
    // Check if it's just a warning about already existing
    const errorMsg = error.message || error.stdout || error.stderr || ''
    if (errorMsg.includes('Overrode') || errorMsg.includes('Saving')) {
      console.log(`✅ ${varName} set for ${environment}`)
      return true
    }
    console.log(`⚠️  ${varName} - ${errorMsg.substring(0, 100)}`)
    return false
  }
}

async function main() {
  console.log('🚀 Vercel Environment Variables Setup')
  console.log('=' .repeat(50))
  console.log('')

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!')
    console.error('Please create .env.local with all required environment variables.')
    process.exit(1)
  }

  console.log('✅ Found .env.local file')
  console.log('')

  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' })
  } catch (error) {
    console.error('❌ Vercel CLI not found!')
    console.error('Install it with: npm i -g vercel')
    process.exit(1)
  }

  console.log('✅ Vercel CLI found')
  console.log('')

  // Check if logged in
  try {
    execSync('vercel whoami', { stdio: 'ignore' })
  } catch (error) {
    console.log('⚠️  Not logged in to Vercel')
    console.log('Please run: vercel login')
    process.exit(1)
  }

  console.log('✅ Logged in to Vercel')
  console.log('')

  // Read .env.local
  const envContent = fs.readFileSync(envPath, 'utf-8')

  // Override NEXTAUTH_URL for production
  const productionOverrides = {
    'NEXTAUTH_URL': 'https://smarthotel-demo.vercel.app',
    'NEXT_PUBLIC_APP_URL': 'https://smarthotel-demo.vercel.app',
    'SOCKET_IO_URL': 'https://smarthotel-demo.vercel.app',
  }

  // Required variables
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
  ]

  // Optional variables
  const optionalVars = [
    'NEXT_PUBLIC_APP_URL',
    'ADMIN_EMAIL',
    'CONTACT_EMAIL',
    'SOCKET_IO_URL',
    'STRIPE_WEBHOOK_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'GOOGLE_MAPS_API_KEY',
    'NEXT_PUBLIC_GA_ID',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'SENTRY_DSN',
    'NEXT_PUBLIC_SENTRY_DSN',
  ]

  console.log('🔧 Setting Required Environment Variables...')
  console.log('')

  const missingVars = []
  for (const varName of requiredVars) {
    let value = getEnvValue(varName, envContent)
    
    // Apply production overrides
    if (productionOverrides[varName]) {
      value = productionOverrides[varName]
      console.log(`ℹ️  Using production override for ${varName}`)
    }
    
    if (!value) {
      console.log(`❌ ${varName} is missing in .env.local`)
      missingVars.push(varName)
    } else {
      // For production, use override if available, otherwise use .env.local value
      const prodValue = productionOverrides[varName] || value
      setVercelEnv(varName, prodValue, 'production')
      
      // For preview and development, use .env.local value
      setVercelEnv(varName, value, 'preview')
      setVercelEnv(varName, value, 'development')
    }
  }

  if (missingVars.length > 0) {
    console.log('')
    console.error('❌ Missing required variables:')
    missingVars.forEach(v => console.error(`   - ${v}`))
    console.log('')
    console.error('Please add these to .env.local and run this script again.')
    process.exit(1)
  }

  console.log('')
  console.log('🔧 Setting Optional Environment Variables...')
  console.log('')

  for (const varName of optionalVars) {
    let value = getEnvValue(varName, envContent)
    
    // Apply production overrides
    if (productionOverrides[varName]) {
      value = productionOverrides[varName]
    }
    
    if (value) {
      setVercelEnv(varName, value, 'production')
    }
  }

  console.log('')
  console.log('✅ All environment variables set!')
  console.log('')

  // Ask about deployment
  const deploy = await question('🚀 Deploy to Vercel now? (y/n) ')
  console.log('')

  if (deploy.toLowerCase() === 'y' || deploy.toLowerCase() === 'yes') {
    console.log('🚀 Deploying to Vercel...')
    console.log('')
    
    try {
      execSync('vercel --prod', { stdio: 'inherit' })
      console.log('')
      console.log('✅ Deployment complete!')
    } catch (error) {
      console.error('❌ Deployment failed:', error.message)
      process.exit(1)
    }
  } else {
    console.log('⏭️  Skipping deployment. Run "vercel --prod" when ready.')
  }

  rl.close()
}

main().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})

