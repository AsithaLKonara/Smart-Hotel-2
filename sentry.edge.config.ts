// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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
    })
  } catch (error) {
    // Sentry not installed, skip initialization
    console.warn('Sentry edge config skipped: Sentry package not found')
  }
}

