import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

/**
 * Check if DATABASE_URL is configured
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL
  if (!url) return false
  
  // Check if the URL is a known placeholder
  const isPlaceholder = 
    url.includes('your-database-connection-string') || 
    url.includes('postgresql://username:password@localhost:5432/smarthotel') ||
    url.includes('YOUR_DATABASE_URI_HERE') ||
    url.includes('example.com') ||
    url.includes('postgresql://guest:guest')
  
  return !isPlaceholder
}

/**
 * Get a user-friendly error message for database connection issues
 */
export function getDatabaseErrorMessage(error: any): string {
  if (!isDatabaseConfigured()) {
    return 'Database connection string (DATABASE_URL) is not configured'
  }
  
  if (error?.message) {
    if (error.message.includes('Can\'t reach database server')) {
      return 'Cannot connect to database server. Please check your connection string.'
    }
    if (error.message.includes('Authentication failed')) {
      return 'Database authentication failed. Please check your credentials.'
    }
    if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      return 'Database server is unreachable. Please check your network connection.'
    }
    return error.message
  }
  
  return 'Database connection error'
}

/**
 * Execute a database query with proper error handling
 * Returns NextResponse with error if database is not configured or query fails
 */
export async function executeDatabaseQuery<T>(
  queryFn: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  if (!isDatabaseConfigured()) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Database not configured',
          message: 'DATABASE_URL environment variable is not set',
          details: 'Please configure DATABASE_URL in your environment variables'
        },
        { status: 503 }
      )
    }
  }

  try {
    const data = await queryFn()
    return { success: true, data }
  } catch (error: any) {
    const message = getDatabaseErrorMessage(error)
    
    return {
      success: false,
      response: NextResponse.json(
        {
          error: errorMessage,
          message,
          type: 'database_error'
        },
        { status: 503 }
      )
    }
  }
}
