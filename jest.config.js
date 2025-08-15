const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@test-utils$': '<rootDir>/src/test-utils',
    '^@providers/(.*)$': '<rootDir>/src/providers/$1',
  },
  // Coverage configuration
  collectCoverage: false, // Only collect when explicitly requested
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/*', // Exclude Next.js app directory (mostly routing)
    '!src/**/*.test.{js,jsx,ts,tsx}', // Exclude test files
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**/*',
    '!src/test-utils/**/*', // Exclude test utilities
    '!src/constants/**/*', // Constants don't need testing
    '!src/**/index.{js,jsx,ts,tsx}', // Exclude barrel files
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    // Start with achievable goals, increase gradually
    global: {
      branches: 7,   // Currently at ~7.7%, set floor
      functions: 6,   // Currently at ~7%, set floor
      lines: 4,       // Currently at ~5%, set floor
      statements: 4,  // Currently at ~5%, set floor
    },
    // Business logic should be better tested (but start reasonable)
    'src/lib/metric-calculations.ts': {
      branches: 40,   // Currently at 42%, maintain current level
      functions: 45,   // Currently at 47%, maintain current level
      lines: 40,       // Currently at 43%, maintain current level
      statements: 40,  // Currently at 42%, maintain current level
    },
  },
}

module.exports = createJestConfig(customJestConfig)