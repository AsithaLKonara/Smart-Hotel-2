import * as fs from 'fs';
import * as path from 'path';

/**
 * Audit Environment Variables
 * Checks for missing undocumented keys, unsafe defaults, and mismatches.
 */
async function auditEnvironment() {
  console.log('--- Environment Configuration Audit ---\n');
  
  let hasErrors = false;

  // 1. Check DATABASE_URL mismatch
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.includes('postgresql') && !dbUrl.includes('postgres')) {
    console.error('❌ CRITICAL: DATABASE_URL must use PostgreSQL format (postgresql://).');
    hasErrors = true;
  } else if (!dbUrl) {
    console.error('❌ CRITICAL: DATABASE_URL is missing.');
    hasErrors = true;
  } else {
    console.log('✅ DATABASE_URL uses correct format.');
  }

  // 2. Check Undocumented Critical Variables
  const undocumentedCritical = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'CRON_SECRET',
    'GROQ_API_KEY',
    'BOOKING_COM_API_KEY',
    'BOOKING_COM_PARTNER_ID',
    'DIRECT_URL'
  ];

  let missingUndocumented = 0;
  for (const key of undocumentedCritical) {
    if (!process.env[key]) {
      console.warn(`⚠️  WARNING: Undocumented critical variable ${key} is missing.`);
      missingUndocumented++;
      hasErrors = true;
    }
  }
  if (missingUndocumented === 0) {
    console.log('✅ All checked undocumented variables are present.');
  }

  // 3. Unsafe Defaults
  const cronSecret = process.env.CRON_SECRET || 'dev-secret-key';
  if (cronSecret === 'dev-secret-key') {
    console.error('❌ CRITICAL: CRON_SECRET is using the unsafe default "dev-secret-key".');
    hasErrors = true;
  } else {
    console.log('✅ CRON_SECRET is safely configured.');
  }

  const groqKey = process.env.GROQ_API_KEY || 'BUILD_PLACEHOLDER';
  if (groqKey === 'BUILD_PLACEHOLDER') {
    console.error('❌ CRITICAL: GROQ_API_KEY is using the unsafe default "BUILD_PLACEHOLDER". Chatbot will fail.');
    hasErrors = true;
  } else {
    console.log('✅ GROQ_API_KEY is safely configured.');
  }

  // 4. Realtime Config Silent Failures
  if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.PUSHER_SECRET) {
    console.error('❌ CRITICAL: Pusher keys are missing. Realtime integration will silently fail or throw unhandled exceptions.');
    hasErrors = true;
  } else {
    console.log('✅ Pusher keys are present.');
  }

  console.log('\n--- Audit Complete ---');
  if (hasErrors) {
    process.exit(1);
  }
}

auditEnvironment().catch(console.error);
