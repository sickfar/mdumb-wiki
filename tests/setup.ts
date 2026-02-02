import { beforeAll, afterAll, afterEach, vi } from 'vitest'

// Setup runs before all tests
beforeAll(() => {
  // Set NODE_ENV to test to avoid development mode pretty logging
  // which can interfere with logger property access in tests
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test'
  }

  // Global test setup
  console.log('Starting MDumb Wiki test suite...')
})

// Cleanup runs after all tests
afterAll(() => {
  console.log('MDumb Wiki test suite completed.')
  // Clear all mocks after all tests to prevent pollution
  vi.clearAllMocks()
})

// Reset between tests
afterEach(() => {
  // Clear any test artifacts or mocks
  vi.clearAllMocks()
})
