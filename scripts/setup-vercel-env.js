#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Script
 * Helps configure environment variables for SmartHotel deployment
 */

const { execSync } = require('child_process')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

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

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

const REQUIRED_ENV_VARS = [
  {
    key: 'DATABASE_URL',
    description: 'MongoDB Atlas connection string',
    example: 'mongodb+srv://username:password@cluster.mongodb.net/smarthotel?retryWrites=true&w=majority',
    required: true
  },
  {
    key: 'NEXTAUTH_SECRET',
    description: 'NextAuth secret key (minimum 32 characters)',
    example: 'your-secret-key-here-minimum-32-characters',
    required: true
  },
  {
    key: 'NEXTAUTH_URL',
    description: 'NextAuth URL (already set to static URL)',
    example: 'https://smarthotel-demo.vercel.app',
    required: true,
    defaultValue: 'https://smarthotel-demo.vercel.app'
  },
  {
    key: 'STRIPE_SECRET_KEY',
    description: 'Stripe secret key (test mode)',
    example: 'sk_test_...',
    required: true
  },
  {
    key: 'STRIPE_PUBLISHABLE_KEY',
    description: 'Stripe publishable key (test mode)',
    example: 'pk_test_...',
    required: true
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    description: 'Stripe webhook secret',
    example: 'whsec_...',
    required: true
  }
]

const OPTIONAL_ENV_VARS = [
  {
    key: 'SMTP_HOST',
    description: 'SMTP host for email (optional)',
    example: 'smtp.gmail.com',
    required: false
  },
  {
    key: 'SMTP_USER',
    description: 'SMTP username (optional)',
    example: 'your-email@gmail.com',
    required: false
  },
  {
    key: 'SMTP_PASS',
    description: 'SMTP password (optional)',
    example: 'your-app-password',
    required: false
  },
  {
    key: 'CLOUDINARY_CLOUD_NAME',
    description: 'Cloudinary cloud name (optional)',
    example: 'your-cloud-name',
    required: false
  },
  {
    key: 'CLOUDINARY_API_KEY',
    description: 'Cloudinary API key (optional)',
    example: 'your-api-key',
    required: false
  },
  {
    key: 'CLOUDINARY_API_SECRET',
    description: 'Cloudinary API secret (optional)',
    example: 'your-api-secret',
    required: false
  }
]

async function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'ignore' })
    return true
  } catch (error) {
    return false
  }
}

async function checkVercelAuth() {
  try {
    execSync('vercel whoami', { stdio: 'ignore' })
    return true
  } catch (error) {
    return false
  }
}

async function setEnvironmentVariable(key, value, environment = 'production') {
  try {
    log(`Setting ${key}...`, 'blue')
    execSync(`echo "${value}" | vercel env add ${key} ${environment}`, { stdio: 'pipe' })
    log(`✅ ${key} set successfully`, 'green')
    return true
  } catch (error) {
    log(`❌ Failed to set ${key}: ${error.message}`, 'red')
    return false
  }
}

async function setupEnvironmentVariables() {
  log('🚀 SmartHotel Vercel Environment Setup', 'bold')
  log('=====================================', 'bold')
  
  // Check Vercel CLI
  log('\n📋 Checking prerequisites...', 'blue')
  
  if (!(await checkVercelCLI())) {
    log('❌ Vercel CLI not found. Please install it first:', 'red')
    log('npm install -g vercel', 'yellow')
    process.exit(1)
  }
  
  if (!(await checkVercelAuth())) {
    log('❌ Not authenticated with Vercel. Please run:', 'red')
    log('vercel login', 'yellow')
    process.exit(1)
  }
  
  log('✅ Vercel CLI is ready', 'green')
  
  // Collect environment variables
  log('\n📝 Collecting environment variables...', 'blue')
  
  const envVars = {}
  
  // Required variables
  log('\n🔴 Required Variables:', 'red')
  for (const envVar of REQUIRED_ENV_VARS) {
    let value = envVar.defaultValue
    
    if (!value) {
      const input = await question(`Enter ${envVar.description} (${envVar.example}): `)
      value = input.trim()
    } else {
      log(`Using default value for ${envVar.key}: ${value}`, 'green')
    }
    
    if (!value && envVar.required) {
      log(`❌ ${envVar.key} is required but not provided`, 'red')
      process.exit(1)
    }
    
    envVars[envVar.key] = value
  }
  
  // Optional variables
  log('\n🟡 Optional Variables (press Enter to skip):', 'yellow')
  for (const envVar of OPTIONAL_ENV_VARS) {
    const input = await question(`Enter ${envVar.description} (${envVar.example}): `)
    const value = input.trim()
    
    if (value) {
      envVars[envVar.key] = value
    }
  }
  
  // Set environment variables
  log('\n🔧 Setting environment variables in Vercel...', 'blue')
  
  let successCount = 0
  const totalCount = Object.keys(envVars).length
  
  for (const [key, value] of Object.entries(envVars)) {
    if (await setEnvironmentVariable(key, value)) {
      successCount++
    }
  }
  
  // Summary
  log('\n📊 Setup Summary:', 'bold')
  log('================', 'bold')
  log(`Environment variables set: ${successCount}/${totalCount}`, successCount === totalCount ? 'green' : 'yellow')
  
  if (successCount === totalCount) {
    log('\n🎉 All environment variables set successfully!', 'green')
    log('\nNext steps:', 'blue')
    log('1. Deploy to production: vercel --prod', 'yellow')
    log('2. Test authentication: npm run test:production', 'yellow')
    log('3. Visit: https://smarthotel-demo.vercel.app', 'yellow')
  } else {
    log('\n⚠️ Some environment variables failed to set.', 'yellow')
    log('Please check the errors above and try again.', 'yellow')
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  log('\n\n👋 Setup cancelled by user', 'yellow')
  rl.close()
  process.exit(0)
})

// Run setup
if (require.main === module) {
  setupEnvironmentVariables()
    .then(() => {
      rl.close()
      process.exit(0)
    })
    .catch(error => {
      log(`\n💥 Setup error: ${error.message}`, 'red')
      rl.close()
      process.exit(1)
    })
}

module.exports = { setupEnvironmentVariables }
