import { beforeAll, afterAll, afterEach } from 'vitest'

// Setup runs before all tests
beforeAll(() => {
  // Global test setup
  console.log('Starting MDumb Wiki test suite...')
})

// Cleanup runs after all tests
afterAll(() => {
  console.log('MDumb Wiki test suite completed.')
})

// Reset between tests
afterEach(() => {
  // Clear any test artifacts or mocks
})
