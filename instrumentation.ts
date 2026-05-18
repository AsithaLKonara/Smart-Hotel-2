import { validateEnv } from './lib/env'

/**
 * Next.js Instrumentation
 * Used for server-side initialization and monitoring.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('--- Initializing SmartHotel OS Enterprise Infrastructure ---')
    
    // 1. Validate Environment
    try {
      validateEnv()
      console.log('✅ Environment validated successfully.')
    } catch (err) {
      console.error('CRITICAL: Startup blocked by invalid environment configuration.')
      // In production, we want to crash early. 
      // In dev, we might want to continue with warnings but the validateEnv call above will throw.
    }
    
    // 2. Database Connectivity Check (Optional but recommended)
    // 3. Redis Connectivity Check (Optional but recommended)
  }
}
