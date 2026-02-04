import { ref } from 'vue'
import { vi } from 'vitest'

// Mock Nuxt useRouter for test environment
export const useRouter = vi.fn(() => ({
  currentRoute: ref({ path: '/', params: {}, query: {} }),
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn()
}))
