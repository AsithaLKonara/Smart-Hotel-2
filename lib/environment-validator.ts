import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import Stripe from 'stripe'

// Environment validation utility
export class EnvironmentValidator {
  private errors: string[] = []
  private warnings: string[] = []

  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    this.errors = []
    this.warnings = []

    this.validateDatabase()
    this.validateNextAuth()
    this.validateStripe()
    this.validateEmail()
    this.validateSocketIO()

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    }
  }

  private validateDatabase(): void {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      this.errors.push('DATABASE_URL is required')
      return
    }

    if (!databaseUrl.startsWith('mongodb://') && !databaseUrl.startsWith('mongodb+srv://')) {
      this.errors.push('DATABASE_URL must be a valid MongoDB connection string')
    }

    // Test connection
    try {
      const prisma = new PrismaClient()
      // Connection test will be done in actual test
    } catch (error) {
      this.warnings.push('Database connection test failed - check DATABASE_URL')
    }
  }

  private validateNextAuth(): void {
    const nextAuthUrl = process.env.NEXTAUTH_URL
    const nextAuthSecret = process.env.NEXTAUTH_SECRET

    if (!nextAuthUrl) {
      this.errors.push('NEXTAUTH_URL is required')
    } else if (!nextAuthUrl.startsWith('http')) {
      this.errors.push('NEXTAUTH_URL must be a valid URL')
    }

    if (!nextAuthSecret) {
      this.errors.push('NEXTAUTH_SECRET is required')
    } else if (nextAuthSecret.length < 32) {
      this.warnings.push('NEXTAUTH_SECRET should be at least 32 characters long')
    }
  }

  private validateStripe(): void {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY

    if (!stripeSecretKey) {
      this.errors.push('STRIPE_SECRET_KEY is required')
    } else if (!stripeSecretKey.startsWith('sk_')) {
      this.errors.push('STRIPE_SECRET_KEY must be a valid Stripe secret key')
    }

    if (!stripePublishableKey) {
      this.errors.push('STRIPE_PUBLISHABLE_KEY is required')
    } else if (!stripePublishableKey.startsWith('pk_')) {
      this.errors.push('STRIPE_PUBLISHABLE_KEY must be a valid Stripe publishable key')
    }

    // Test Stripe connection
    if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
      try {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
        // Connection test will be done in actual test
      } catch (error) {
        this.warnings.push('Stripe connection test failed - check STRIPE_SECRET_KEY')
      }
    }
  }

  private validateEmail(): void {
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpHost) {
      this.errors.push('SMTP_HOST is required')
    }

    if (!smtpPort) {
      this.errors.push('SMTP_PORT is required')
    } else if (isNaN(Number(smtpPort))) {
      this.errors.push('SMTP_PORT must be a valid number')
    }

    if (!smtpUser) {
      this.errors.push('SMTP_USER is required')
    }

    if (!smtpPass) {
      this.errors.push('SMTP_PASS is required')
    }

    // Test SMTP connection
    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(smtpPort),
          secure: false,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        })
        // Connection test will be done in actual test
      } catch (error) {
        this.warnings.push('SMTP connection test failed - check email configuration')
      }
    }
  }

  private validateSocketIO(): void {
    const socketUrl = process.env.SOCKET_IO_URL
    if (!socketUrl) {
      this.warnings.push('SOCKET_IO_URL not set - using default localhost:3000')
    } else if (!socketUrl.startsWith('http')) {
      this.errors.push('SOCKET_IO_URL must be a valid URL')
    }
  }
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const prisma = new PrismaClient()
    await prisma.$connect()
    await prisma.$disconnect()
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Test Stripe connection
export async function testStripeConnection(): Promise<boolean> {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) return false

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
    await stripe.balance.retrieve()
    return true
  } catch (error) {
    console.error('Stripe connection failed:', error)
    return false
  }
}

// Test email connection
export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })

    await transporter.verify()
    return true
  } catch (error) {
    console.error('Email connection failed:', error)
    return false
  }
}

// Main validation function
export async function validateEnvironment(): Promise<void> {
  console.log('🔍 Validating environment configuration...')
  
  const validator = new EnvironmentValidator()
  const result = validator.validate()

  if (result.errors.length > 0) {
    console.error('❌ Environment validation failed:')
    result.errors.forEach(error => console.error(`  - ${error}`))
    throw new Error('Environment validation failed')
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ Environment warnings:')
    result.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  console.log('✅ Environment validation passed')

  // Test connections
  console.log('🔗 Testing service connections...')
  
  const dbConnected = await testDatabaseConnection()
  const stripeConnected = await testStripeConnection()
  const emailConnected = await testEmailConnection()

  console.log(`Database: ${dbConnected ? '✅' : '❌'}`)
  console.log(`Stripe: ${stripeConnected ? '✅' : '❌'}`)
  console.log(`Email: ${emailConnected ? '✅' : '❌'}`)

  if (!dbConnected || !stripeConnected || !emailConnected) {
    throw new Error('Service connection tests failed')
  }

  console.log('🎉 All environment validations passed!')
}
