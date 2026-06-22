import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock Pusher
jest.mock('pusher-js', () => {
  const mockChannel = {
    bind: jest.fn(),
    unbind: jest.fn(),
    unbind_all: jest.fn(),
    trigger: jest.fn(),
  }
  return jest.fn().mockImplementation(() => ({
    subscribe: jest.fn().mockReturnValue(mockChannel),
    unsubscribe: jest.fn(),
    disconnect: jest.fn(),
    connection: {
      bind: jest.fn(),
      unbind: jest.fn(),
    },
  }))
})

// Mock Pusher (server-side)
jest.mock('pusher', () => {
  return jest.fn().mockImplementation(() => ({
    trigger: jest.fn().mockResolvedValue({}),
  }))
})

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(() => ({
      create: jest.fn(),
      mount: jest.fn(),
      unmount: jest.fn(),
    })),
    confirmPayment: jest.fn(),
  })),
}))

// Mock Nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' })),
    verify: jest.fn(() => Promise.resolve(true)),
  })),
}))

// Mock Sentry for test stability
jest.mock('@sentry/nextjs', () => ({
  init: jest.fn(),
  captureException: jest.fn(() => 'mock-sentry-error-id'),
  captureMessage: jest.fn(() => 'mock-sentry-message-id'),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
}))


// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'mongodb://localhost:27017/smarthotel_test'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.STRIPE_SECRET_KEY = 'sk_test_51234567890abcdef'
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_51234567890abcdef'
process.env.SMTP_HOST = 'smtp.ethereal.email'
process.env.SMTP_PORT = '587'
process.env.SMTP_USER = 'test@example.com'
process.env.SMTP_PASS = 'test-password'

// Global test setup
beforeAll(() => {
  // Set up any global test configuration
})

afterAll(() => {
  // Clean up any global test configuration
})

// Suppress console warnings in tests
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})