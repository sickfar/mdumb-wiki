import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000, // 10 seconds for regular tests
    hookTimeout: 30000, // 30 seconds for beforeAll/afterAll hooks (needed for Nuxt e2e cleanup)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '.nuxt/',
        '*.config.ts',
        '*.config.js',
        '*.config.mjs'
      ]
    },
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', '.nuxt', 'dist']
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url))
    }
  }
})
