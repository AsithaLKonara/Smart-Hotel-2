import { NextRequest, NextResponse } from 'next/server'

/**
 * Diagnostic endpoint to check environment variable configuration
 * This helps debug why DATABASE_URL might not be accessible
 */
export async function GET(request: NextRequest) {
  const envCheck = {
    // Check if DATABASE_URL exists
    DATABASE_URL: {
      exists: !!process.env.DATABASE_URL,
      length: process.env.DATABASE_URL?.length || 0,
      startsWith: process.env.DATABASE_URL?.substring(0, 20) || 'N/A',
      // Don't expose full connection string for security
    },
    // Check other important env vars
    NODE_ENV: process.env.NODE_ENV || 'not set',
    NEXTAUTH_SECRET: {
      exists: !!process.env.NEXTAUTH_SECRET,
      length: process.env.NEXTAUTH_SECRET?.length || 0,
    },
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
    // Check Vercel-specific env vars
    VERCEL: process.env.VERCEL || 'not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    // List all env vars that start with DATABASE
    databaseRelatedVars: Object.keys(process.env)
      .filter(key => key.includes('DATABASE') || key.includes('DB'))
      .map(key => ({
        name: key,
        exists: true,
        length: process.env[key]?.length || 0,
      })),
    // Count total env vars (for debugging)
    totalEnvVars: Object.keys(process.env).length,
  }

  return NextResponse.json({
    message: 'Environment variable diagnostic',
    timestamp: new Date().toISOString(),
    environment: envCheck,
    recommendations: !envCheck.DATABASE_URL.exists
      ? [
          'DATABASE_URL is not set in the current environment',
          'Check Vercel Dashboard → Settings → Environment Variables',
          'Ensure DATABASE_URL is set for Production environment',
          'Redeploy the application after setting environment variables',
        ]
      : [
          'DATABASE_URL is set!',
          'If you still see 503 errors, check:',
          '1. MongoDB Atlas Network Access (allow 0.0.0.0/0)',
          '2. Connection string format is correct',
          '3. Database credentials are valid',
        ],
  })
}

