#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates that all required environment variables are set for demo/production
 */

const fs = require('fs');
const path = require('path');

const envFilePath = path.join(process.cwd(), '.env.local');

// Required environment variables
const requiredVars = {
  DATABASE_URL: {
    required: true,
    description: 'MongoDB connection string',
    validate: (value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
    example: 'mongodb://localhost:27017/smarthotel'
  },
  NEXTAUTH_URL: {
    required: true,
    description: 'Application URL for NextAuth',
    validate: (value) => value.startsWith('http://') || value.startsWith('https://'),
    example: 'http://localhost:3000'
  },
  NEXTAUTH_SECRET: {
    required: true,
    description: 'Secret key for NextAuth (min 32 characters)',
    validate: (value) => value.length >= 32,
    example: 'Generate with: openssl rand -base64 32'
  },
  STRIPE_SECRET_KEY: {
    required: true,
    description: 'Stripe secret key (test mode)',
    validate: (value) => value.startsWith('sk_test_') || value.startsWith('sk_live_'),
    example: 'sk_test_...'
  },
  STRIPE_PUBLISHABLE_KEY: {
    required: true,
    description: 'Stripe publishable key (test mode)',
    validate: (value) => value.startsWith('pk_test_') || value.startsWith('pk_live_'),
    example: 'pk_test_...'
  },
  SMTP_HOST: {
    required: true,
    description: 'SMTP server hostname',
    validate: (value) => value.length > 0,
    example: 'sandbox.smtp.mailtrap.io'
  },
  SMTP_PORT: {
    required: true,
    description: 'SMTP server port',
    validate: (value) => !isNaN(Number(value)),
    example: '2525'
  },
  SMTP_USER: {
    required: true,
    description: 'SMTP username',
    validate: (value) => value.length > 0,
    example: 'your-username'
  },
  SMTP_PASS: {
    required: true,
    description: 'SMTP password',
    validate: (value) => value.length > 0,
    example: 'your-password'
  }
};

// Optional environment variables
const optionalVars = {
  STRIPE_WEBHOOK_SECRET: {
    description: 'Stripe webhook secret',
    example: 'whsec_...'
  },
  SOCKET_IO_URL: {
    description: 'Socket.IO server URL',
    example: 'http://localhost:3000'
  },
  SMTP_FROM_EMAIL: {
    description: 'Default sender email',
    example: 'noreply@smarthotel.com'
  },
  SMTP_FROM_NAME: {
    description: 'Default sender name',
    example: 'SmartHotel'
  },
// Production-specific required variables
const productionRequiredVars = {
  SENTRY_DSN: {
    required: true,
    description: 'Sentry DSN for error tracking',
    validate: (value) => value.startsWith('https://') && value.includes('@'),
    example: 'https://xxx@xxx.ingest.sentry.io/xxx'
  },
  NEXT_PUBLIC_SENTRY_DSN: {
    required: true,
    description: 'Public Sentry DSN for client-side error tracking',
    validate: (value) => value.startsWith('https://') && value.includes('@'),
    example: 'https://xxx@xxx.ingest.sentry.io/xxx'
  }
};

// Production-specific optional variables
const productionOptionalVars = {
  SENTRY_DSN: {
    description: 'Sentry DSN for error tracking',
    example: 'https://xxx@xxx.ingest.sentry.io/xxx'
  },
  NEXT_PUBLIC_SENTRY_DSN: {
    description: 'Public Sentry DSN for client-side error tracking',
    example: 'https://xxx@xxx.ingest.sentry.io/xxx'
  },
  ADMIN_EMAIL: {
    description: 'Admin email for notifications',
    example: 'admin@smarthotel.com'
  },
  CONTACT_EMAIL: {
    description: 'Contact email',
    example: 'contact@smarthotel.com'
  },
  NEXT_PUBLIC_APP_URL: {
    description: 'Public application URL',
    example: 'https://smarthotel.example.com'
  }
};

function loadEnvFile() {
  if (!fs.existsSync(envFilePath)) {
    return {};
  }

  const envContent = fs.readFileSync(envFilePath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      env[key.trim()] = value;
    }
  });

  return env;
}

function validateEnvironment(isProduction = false) {
  const envType = isProduction ? 'PRODUCTION' : 'DEVELOPMENT';
  console.log(`🔍 Validating Environment Variables (${envType})\n`);

  const env = loadEnvFile();

  if (Object.keys(env).length === 0) {
    console.error('❌ .env.local file not found or empty!');
    console.log('\n💡 Run: npm run setup:demo');
    console.log('   Or copy .env.example to .env.local and update values\n');
    return false;
  }

  let isValid = true;
  const missing = [];
  const invalid = [];
  const warnings = [];

  // Check required variables
  for (const [key, config] of Object.entries(requiredVars)) {
    const value = env[key];

    if (!value || value.trim() === '') {
      missing.push(key);
      isValid = false;
      console.error(`❌ Missing: ${key}`);
      console.log(`   ${config.description}`);
      console.log(`   Example: ${config.example}\n`);
    } else if (config.validate && !config.validate(value)) {
      invalid.push(key);
      isValid = false;
      console.error(`❌ Invalid: ${key} = ${value.substring(0, 20)}...`);
      console.log(`   ${config.description}`);
      console.log(`   Example: ${config.example}\n`);
    } else if (key === 'NEXTAUTH_SECRET' && value.length < 32) {
      warnings.push(`${key} should be at least 32 characters`);
      console.warn(`⚠️  Warning: ${key} is less than 32 characters (security risk)\n`);
    } else {
      console.log(`✅ ${key}`);
    }
  }

  // Check optional variables
  console.log('\n📋 Optional Variables:');
  const allOptionalVars = { ...optionalVars, ...productionOptionalVars };
  for (const [key, config] of Object.entries(allOptionalVars)) {
    // Skip if already checked as required
    if (requiredVars[key] || (isProduction && productionRequiredVars[key])) {
      continue;
    }
    const value = env[key];
    if (value) {
      console.log(`✅ ${key}`);
    } else {
      console.log(`⚪ ${key} (not set - using defaults)`);
    }
  }

  // Check production-specific required variables
  if (isProduction) {
    console.log('\n🏭 Production-Specific Required Variables:');
    for (const [key, config] of Object.entries(productionRequiredVars)) {
      const value = env[key];
      if (!value || value.trim() === '') {
        missing.push(key);
        isValid = false;
        console.error(`❌ Missing: ${key}`);
        console.log(`   ${config.description}`);
        console.log(`   Example: ${config.example}\n`);
      } else if (config.validate && !config.validate(value)) {
        invalid.push(key);
        isValid = false;
        console.error(`❌ Invalid: ${key} = ${value.substring(0, 20)}...`);
        console.log(`   ${config.description}`);
        console.log(`   Example: ${config.example}\n`);
      } else {
        console.log(`✅ ${key}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (isValid) {
    console.log('✅ Environment validation PASSED');
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(w => console.log(`   - ${w}`));
    }
    return true;
  } else {
    console.log('❌ Environment validation FAILED');
    if (missing.length > 0) {
      console.log('\n📝 Missing variables:', missing.join(', '));
    }
    if (invalid.length > 0) {
      console.log('📝 Invalid variables:', invalid.join(', '));
    }
    console.log('\n💡 Fix issues and run: node scripts/validate-env.js');
    return false;
  }
}

// Run validation
const isProduction = process.argv.includes('--production') || process.env.NODE_ENV === 'production';
const isValid = validateEnvironment(isProduction);
process.exit(isValid ? 0 : 1);









