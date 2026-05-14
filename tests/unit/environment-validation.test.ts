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
    })

    const requiredVars = [
      { key: 'DATABASE_URL', error: 'DATABASE_URL is required' },
      { key: 'NEXTAUTH_URL', error: 'NEXTAUTH_URL is required' },
      { key: 'NEXTAUTH_SECRET', error: 'NEXTAUTH_SECRET is required' },
      { key: 'STRIPE_SECRET_KEY', error: 'STRIPE_SECRET_KEY is required' },
      { key: 'STRIPE_PUBLISHABLE_KEY', error: 'STRIPE_PUBLISHABLE_KEY is required' },
      { key: 'SMTP_HOST', error: 'SMTP_HOST is required' },
      { key: 'SMTP_PORT', error: 'SMTP_PORT is required' },
      { key: 'SMTP_USER', error: 'SMTP_USER is required' },
      { key: 'SMTP_PASS', error: 'SMTP_PASS is required' }
    ]

    requiredVars.forEach(({ key, error }) => {
      test(`should detect missing ${key}`, () => {
        const originalValue = process.env[key]
        process.env[key] = '' // Explicit empty string for isolation

        const result = new EnvironmentValidator().validate()
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain(error)

        process.env[key] = originalValue
      })
    })

    test('should detect invalid DATABASE_URL format', () => {
      const originalUrl = process.env.DATABASE_URL
      process.env.DATABASE_URL = 'invalid-url'
      const result = validator.validate()
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('DATABASE_URL must be a valid MongoDB connection string')
      process.env.DATABASE_URL = originalUrl
    })
  })

  describe('Service Connections', () => {
    test('should test database connection', async () => {
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
      }
      jest.doMock('@prisma/client', () => ({ PrismaClient: jest.fn(() => mockPrisma) }))
      const result = await testDatabaseConnection()
      expect(result).toBe(true)
    })

    test('should test Stripe connection', async () => {
      stripeBalanceMock.mockResolvedValueOnce({ available: [] })
      const result = await testStripeConnection()
      expect(result).toBe(true)
    })
  })
})
