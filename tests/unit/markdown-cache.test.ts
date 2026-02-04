import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import {
  getFromCache,
  setInCache,
  invalidateCache,
  clearCache,
  getCacheStats
} from '../../server/utils/markdown-cache'
import { loadConfig, clearConfigCache } from '../../server/utils/config'

describe('Markdown Cache', () => {
  beforeAll(async () => {
    // Load config once before all tests
    await loadConfig()
  })

  beforeEach(() => {
    // Clear cache before each test to ensure isolation
    clearCache()
  })

  afterAll(() => {
    // Clean up config cache after all tests
    clearConfigCache()
  })

  describe('Basic Cache Operations', () => {
    it('should return null for cache miss', () => {
      const result = getFromCache('non-existent-key')
      expect(result).toBeNull()
    })

    it('should store and retrieve values', () => {
      const key = 'test-page.md'
      const html = '<h1>Test Content</h1>'

      setInCache(key, html)
      const result = getFromCache(key)

      expect(result).toBe(html)
    })

    it('should handle multiple entries', () => {
      setInCache('page1.md', '<h1>Page 1</h1>')
      setInCache('page2.md', '<h1>Page 2</h1>')
      setInCache('page3.md', '<h1>Page 3</h1>')

      expect(getFromCache('page1.md')).toBe('<h1>Page 1</h1>')
      expect(getFromCache('page2.md')).toBe('<h1>Page 2</h1>')
      expect(getFromCache('page3.md')).toBe('<h1>Page 3</h1>')
    })

    it('should overwrite existing entries', () => {
      const key = 'test.md'

      setInCache(key, '<h1>Old Content</h1>')
      setInCache(key, '<h1>New Content</h1>')

      expect(getFromCache(key)).toBe('<h1>New Content</h1>')
    })
  })

  describe('Cache Eviction', () => {
    it('should evict least recently used items when max size is reached', () => {
      // Fill cache beyond default max size (100 entries)
      for (let i = 0; i < 105; i++) {
        setInCache(`page${i}.md`, `<h1>Page ${i}</h1>`)
      }

      // The first few entries should have been evicted
      expect(getFromCache('page0.md')).toBeNull()
      expect(getFromCache('page1.md')).toBeNull()
      expect(getFromCache('page2.md')).toBeNull()

      // Recent entries should still be cached
      expect(getFromCache('page104.md')).toBe('<h1>Page 104</h1>')
      expect(getFromCache('page103.md')).toBe('<h1>Page 103</h1>')
    })

    it('should update LRU order on access', () => {
      // Fill cache to capacity
      for (let i = 0; i < 100; i++) {
        setInCache(`page${i}.md`, `<h1>Page ${i}</h1>`)
      }

      // Access an old entry to make it recently used
      const accessedValue = getFromCache('page5.md')
      expect(accessedValue).toBe('<h1>Page 5</h1>')

      // Add a new entry to trigger eviction
      setInCache('new-entry.md', '<h1>New Entry</h1>')

      // The accessed 'page5.md' should still be cached
      expect(getFromCache('page5.md')).toBe('<h1>Page 5</h1>')

      // The least recently used entry (page0.md or page1.md) should be evicted
      // We just verify that at least one of the early entries is gone
      const evictedCount = [
        getFromCache('page0.md'),
        getFromCache('page1.md'),
        getFromCache('page2.md')
      ].filter(v => v === null).length

      expect(evictedCount).toBeGreaterThan(0)
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate specific entries', () => {
      setInCache('page1.md', '<h1>Page 1</h1>')
      setInCache('page2.md', '<h1>Page 2</h1>')

      invalidateCache('page1.md')

      expect(getFromCache('page1.md')).toBeNull()
      expect(getFromCache('page2.md')).toBe('<h1>Page 2</h1>')
    })

    it('should invalidate entries by normalized key (without .md extension)', () => {
      // Simulate how content API caches (without .md extension)
      setInCache('test-links', '<h1>Test Links</h1>')
      setInCache('guides/installation', '<h1>Installation</h1>')

      // Simulate file save invalidation (normalizes path by removing .md)
      invalidateCache('test-links')
      invalidateCache('guides/installation')

      expect(getFromCache('test-links')).toBeNull()
      expect(getFromCache('guides/installation')).toBeNull()
    })

    it('should handle invalidation of non-existent keys gracefully', () => {
      expect(() => invalidateCache('non-existent.md')).not.toThrow()
    })

    it('should allow re-caching after invalidation', () => {
      const key = 'test.md'

      setInCache(key, '<h1>First</h1>')
      invalidateCache(key)
      setInCache(key, '<h1>Second</h1>')

      expect(getFromCache(key)).toBe('<h1>Second</h1>')
    })
  })

  describe('Cache Clearing', () => {
    it('should clear all entries', () => {
      setInCache('page1.md', '<h1>Page 1</h1>')
      setInCache('page2.md', '<h1>Page 2</h1>')
      setInCache('page3.md', '<h1>Page 3</h1>')

      clearCache()

      expect(getFromCache('page1.md')).toBeNull()
      expect(getFromCache('page2.md')).toBeNull()
      expect(getFromCache('page3.md')).toBeNull()
    })

    it('should reset cache statistics', () => {
      setInCache('page1.md', '<h1>Page 1</h1>')
      getFromCache('page1.md') // hit
      getFromCache('page2.md') // miss

      clearCache()

      const stats = getCacheStats()
      expect(stats.size).toBe(0)
    })
  })

  describe('Cache Statistics', () => {
    it('should track cache size', () => {
      setInCache('page1.md', '<h1>Page 1</h1>')
      setInCache('page2.md', '<h1>Page 2</h1>')

      const stats = getCacheStats()
      expect(stats.size).toBe(2)
    })

    it('should report max size', () => {
      const stats = getCacheStats()
      expect(stats.maxSize).toBe(100)
    })

    it('should track cache size after operations', () => {
      setInCache('page1.md', '<h1>Page 1</h1>')
      expect(getCacheStats().size).toBe(1)

      invalidateCache('page1.md')
      expect(getCacheStats().size).toBe(0)

      setInCache('page2.md', '<h1>Page 2</h1>')
      setInCache('page3.md', '<h1>Page 3</h1>')
      expect(getCacheStats().size).toBe(2)
    })
  })
})
