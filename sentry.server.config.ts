// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Sentry is optional - only initialize if DSN is configured and package is installed
if (process.env.SENTRY_DSN) {
  try {
    const Sentry = require('@sentry/nextjs')
    
    Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  environment: process.env.NODE_ENV,
  
  beforeSend(event: any, hint: any) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies
      if (event.request.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['cookie']
      }
    }
    
    // Don't send errors in test environment
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
      return null
    }
    
    return event
  },
    })
  } catch (error) {
    // Sentry not installed, skip initialization
    console.warn('Sentry server config skipped: Sentry package not found')
  }
}

