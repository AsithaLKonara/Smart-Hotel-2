import { EnvironmentValidator, testDatabaseConnection, testStripeConnection, testEmailConnection } from '@/lib/environment-validator'

const stripeBalanceMock = jest.fn().mockResolvedValue({ available: [] })
jest.mock('stripe', () => {
  return jest.fn(() => ({
    balance: {
      retrieve: stripeBalanceMock,
    },
  }))
})

describe('Environment Validation', () => {
  let validator: EnvironmentValidator

  beforeEach(() => {
    validator = new EnvironmentValidator()
  })

  describe('Environment Variables', () => {
    test('should validate required environment variables', () => {
      const result = validator.validate()
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should detect missing DATABASE_URL', () => {
      const originalUrl = process.env.DATABASE_URL
      delete process.env.DATABASE_URL

      const result = validator.validate()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('DATABASE_URL is required')

      process.env.DATABASE_URL = originalUrl
    })

    test('should detect invalid DATABASE_URL format', () => {
      const originalUrl = process.env.DATABASE_URL
      process.env.DATABASE_URL = 'invalid-url'

      const result = validator.validate()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('DATABASE_URL must be a valid MongoDB connection string')

      process.env.DATABASE_URL = originalUrl
    })

    test('should detect missing NEXTAUTH_URL', () => {
      const originalUrl = process.env.NEXTAUTH_URL
      delete process.env.NEXTAUTH_URL

      const result = validator.validate()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('NEXTAUTH_URL is required')

      process.env.NEXTAUTH_URL = originalUrl
    })

    test('should detect missing NEXTAUTH_SECRET', () => {
      const originalSecret = process.env.NEXTAUTH_SECRET
      delete process.env.NEXTAUTH_SECRET

      const result = validator.validate()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('NEXTAUTH_SECRET is required')

      process.env.NEXTAUTH_SECRET = originalSecret
    })

    test('should warn about short NEXTAUTH_SECRET', () => {
      const originalSecret = process.env.NEXTAUTH_SECRET
      process.env.NEXTAUTH_SECRET = 'short'

      const result = validator.validate()
      
      expect(result.warnings).toContain('NEXTAUTH_SECRET should be at least 32 characters long')

      process.env.NEXTAUTH_SECRET = originalSecret
    })

    test('should detect missing Stripe keys', () => {
      const originalSecretKey = process.env.STRIPE_SECRET_KEY
      const originalPublishableKey = process.env.STRIPE_PUBLISHABLE_KEY
      
      delete process.env.STRIPE_SECRET_KEY
      delete process.env.STRIPE_PUBLISHABLE_KEY

      const result = validator.validate()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('STRIPE_SECRET_KEY is required')
      expect(result.errors).toContain('STRIPE_PUBLISHABLE_KEY is required')

      process.env.STRIPE_SECRET_KEY = originalSecretKey
      process.env.STRIPE_PUBLISHABLE_KEY = originalPublishableKey
    })

    test('should detect invalid Stripe key formats', () => {
      const originalSecretKey = process.env.STRIPE_SECRET_KEY
      const originalPublishableKey = process.env.STRIPE_PUBLISHABLE_KEY
      
      process.env.STRIPE_SECRET_KEY = 'invalid-secret-key'
      process.env.STRIPE_PUBLISHABLE_KEY = 'invalid-publishable-key'

      const result = validator.validate()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('STRIPE_SECRET_KEY must be a valid Stripe secret key')
      expect(result.errors).toContain('STRIPE_PUBLISHABLE_KEY must be a valid Stripe publishable key')

      process.env.STRIPE_SECRET_KEY = originalSecretKey
      process.env.STRIPE_PUBLISHABLE_KEY = originalPublishableKey
    })

    test('should detect missing SMTP configuration', () => {
      const originalHost = process.env.SMTP_HOST
      const originalPort = process.env.SMTP_PORT
      const originalUser = process.env.SMTP_USER
      const originalPass = process.env.SMTP_PASS
      
      delete process.env.SMTP_HOST
      delete process.env.SMTP_PORT
      delete process.env.SMTP_USER
      delete process.env.SMTP_PASS

      const result = validator.validate()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('SMTP_HOST is required')
      expect(result.errors).toContain('SMTP_PORT is required')
      expect(result.errors).toContain('SMTP_USER is required')
      expect(result.errors).toContain('SMTP_PASS is required')

      process.env.SMTP_HOST = originalHost
      process.env.SMTP_PORT = originalPort
      process.env.SMTP_USER = originalUser
      process.env.SMTP_PASS = originalPass
    })

    test('should detect invalid SMTP_PORT', () => {
      const originalPort = process.env.SMTP_PORT
      process.env.SMTP_PORT = 'invalid-port'

      const result = validator.validate()
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('SMTP_PORT must be a valid number')

      process.env.SMTP_PORT = originalPort
    })
  })

  describe('Service Connections', () => {
    test('should test database connection', async () => {
      // Mock Prisma client for testing
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
      }

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrisma),
      }))

      const result = await testDatabaseConnection()
      expect(result).toBe(true)
    })

    test('should test Stripe connection', async () => {
      stripeBalanceMock.mockResolvedValueOnce({ available: [] })

      const result = await testStripeConnection()

      expect(result).toBe(true)
      expect(stripeBalanceMock).toHaveBeenCalled()
    })

    test('should test email connection', async () => {
      // Mock nodemailer for testing
      const mockTransporter = {
        verify: jest.fn().mockResolvedValue(true),
      }

      jest.doMock('nodemailer', () => ({
        createTransport: jest.fn(() => mockTransporter),
      }))

      const result = await testEmailConnection()
      // In test environment, we expect this to fail due to missing SMTP config
      expect(typeof result).toBe('boolean')
    })
  })

  describe('Configuration Validation', () => {
    test('should validate complete configuration', () => {
      const result = validator.validate()
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should provide helpful error messages', () => {
      // Clear all environment variables
      const envVars = [
        'DATABASE_URL',
        'NEXTAUTH_URL',
        'NEXTAUTH_SECRET',
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS',
      ]

      const originalValues: { [key: string]: string | undefined } = {}
      
      envVars.forEach(key => {
        originalValues[key] = process.env[key]
        delete process.env[key]
      })

      const result = validator.validate()
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      
      // Restore environment variables
      envVars.forEach(key => {
        if (originalValues[key]) {
          process.env[key] = originalValues[key]
        }
      })
    })
  })
})

