#!/usr/bin/env node

/**
 * Security Audit Script
 * 
 * Checks security configuration and generates a report
 */

const fs = require('fs')
const path = require('path')

function checkSecurityConfig() {
  console.log('🔒 Security Audit Report\n')
  console.log('='.repeat(50))

  const checks = {
    rateLimiting: process.env.RATE_LIMIT_ENABLED === 'true',
    csp: process.env.ENABLE_CSP === 'true',
    hsts: process.env.ENABLE_HSTS === 'true',
    trustProxy: process.env.TRUST_PROXY === 'true',
    nextAuthSecret: process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32,
    sentry: !!(process.env.SENTRY_DSN && process.env.NEXT_PUBLIC_SENTRY_DSN),
  }

  console.log('\n📋 Security Configuration:')
  Object.entries(checks).forEach(([key, value]) => {
    const status = value ? '✅' : '❌'
    console.log(`${status} ${key}: ${value ? 'Enabled' : 'Disabled/Missing'}`)
  })

  console.log('\n📊 Security Score:')
  const score = Object.values(checks).filter(Boolean).length
  const total = Object.keys(checks).length
  const percentage = Math.round((score / total) * 100)
  
  console.log(`${score}/${total} checks passed (${percentage}%)`)

  if (percentage < 80) {
    console.log('\n⚠️  Warning: Security configuration needs improvement')
    process.exit(1)
  } else {
    console.log('\n✅ Security configuration is acceptable')
    process.exit(0)
  }
}

checkSecurityConfig()

