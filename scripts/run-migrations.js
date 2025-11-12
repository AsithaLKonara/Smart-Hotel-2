#!/usr/bin/env node

/**
 * Production Migration Runner
 * 
 * For MongoDB, Prisma uses db push for schema synchronization.
 * This script ensures schema is up-to-date before deployment.
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🔄 Running database migrations...')

try {
  // Generate Prisma Client
  console.log('📦 Generating Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  // Push schema changes (MongoDB doesn't use traditional migrations)
  console.log('🚀 Pushing schema changes to database...')
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })

  console.log('✅ Database migrations completed successfully')
  process.exit(0)
} catch (error) {
  console.error('❌ Migration failed:', error.message)
  process.exit(1)
}

