const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

const isIntegration = process.argv.some(arg => arg.includes('integration'))
const isUnit = process.argv.some(arg => arg.includes('unit'))

const libThresholds = isIntegration ? {
  branches: 5,
  functions: 5,
  lines: 5,
  statements: 5,
} : isUnit ? {
  branches: 55,
  functions: 55,
  lines: 65,
  statements: 65,
} : {
  branches: 60,
  functions: 70,
  lines: 70,
  statements: 70,
}

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}',
  ],
  collectCoverageFrom: [
    'lib/price-calculation.ts',
    'lib/yield-optimization.ts',
    'lib/db.ts',
    'lib/inventory-lock.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 15,
      lines: 15,
      statements: 15,
    },
    './lib/': libThresholds,
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!@faker-js|faker)/'
  ],
  testTimeout: 10000,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)