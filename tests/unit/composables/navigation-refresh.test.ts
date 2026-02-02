import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Navigation Auto-Refresh on File Events', () => {
  const composablePath = join(__dirname, '../../../app/composables/useLiveReload.ts')
  const _indexPagePath = join(__dirname, '../../../app/pages/index.vue')
  const _slugPagePath = join(__dirname, '../../../app/pages/[...slug].vue')

  describe('Event Listener Registration', () => {
    it('should handle file:created events in onmessage', () => {
      const content = readFileSync(composablePath, 'utf-8')

      // Check that onmessage handler exists and handles file:created
      expect(content).toContain("es.onmessage")
      expect(content).toContain("data.type === 'file:created'")
    })

    it('should handle file:deleted events in onmessage', () => {
      const content = readFileSync(composablePath, 'utf-8')

      // Check that onmessage handler exists and handles file:deleted
      expect(content).toContain("es.onmessage")
      expect(content).toContain("data.type === 'file:deleted'")
    })
  })

  describe('Navigation Refresh Triggers', () => {
    it('should call refreshNuxtData("navigation") when file created', () => {
      const content = readFileSync(composablePath, 'utf-8')

      // Extract the onmessage handler section for file:created
      const fileCreatedMatch = content.match(/if \(data\.type === 'file:created'\) \{[\s\S]*?\}/m)
      expect(fileCreatedMatch).toBeTruthy()

      if (fileCreatedMatch) {
        const handler = fileCreatedMatch[0]
        // Check that refreshNuxtData('navigation') is called in the handler
        expect(handler).toContain("refreshNuxtData('navigation')")
      }
    })

    it('should call refreshNuxtData("navigation") when file deleted', () => {
      const content = readFileSync(composablePath, 'utf-8')

      // Extract the onmessage handler section for file:deleted
      const fileDeletedMatch = content.match(/if \(data\.type === 'file:deleted'\) \{[\s\S]*?refreshNuxtData\('navigation'\)/m)
      expect(fileDeletedMatch).toBeTruthy()

      if (fileDeletedMatch) {
        const handler = fileDeletedMatch[0]
        // Check that refreshNuxtData('navigation') is called in the handler
        expect(handler).toContain("refreshNuxtData('navigation')")
      }
    })
  })

  describe('Multiple Events', () => {
    it('should refresh navigation on both file creation and deletion events', () => {
      const content = readFileSync(composablePath, 'utf-8')

      // Count occurrences of refreshNuxtData('navigation') in event handlers
      const refreshCalls = (content.match(/refreshNuxtData\('navigation'\)/g) || []).length

      // Should have at least 2 calls: one for file:created, one for file:deleted
      expect(refreshCalls).toBeGreaterThanOrEqual(2)
    })
  })
})

describe('Navigation Key in Pages', () => {
  it('should use "navigation" key for useFetch in index.vue', () => {
    const content = readFileSync(join(__dirname, '../../../app/pages/index.vue'), 'utf-8')

    // Check that navigation fetch uses key: 'navigation'
    expect(content).toContain("/api/navigation")
    expect(content).toMatch(/useFetch<NavigationItem\[\]>\('\/api\/navigation'.*?key:\s*'navigation'/s)
  })

  it('should use "navigation" key for useFetch in [...slug].vue', () => {
    const content = readFileSync(join(__dirname, '../../../app/pages/[...slug].vue'), 'utf-8')

    // Check that navigation fetch uses key: 'navigation'
    expect(content).toContain("/api/navigation")
    expect(content).toMatch(/useFetch<NavigationItem\[\]>\('\/api\/navigation'.*?key:\s*'navigation'/s)
  })
})
