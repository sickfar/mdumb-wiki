import { LRUCache } from 'lru-cache'
import { getConfig } from './config'

/**
 * LRU cache for storing rendered markdown HTML
 * Key: file path, Value: rendered HTML string
 */
let markdownCache: LRUCache<string, string> | null = null

/**
 * Get or initialize the markdown cache
 * @returns LRU cache instance
 */
function getCache(): LRUCache<string, string> {
  if (!markdownCache) {
    const config = getConfig()
    markdownCache = new LRUCache<string, string>({
      max: config.cache.markdown.maxSize,
      // No TTL - entries only evicted by LRU or explicit invalidation
    })
  }
  return markdownCache
}

/**
 * Get cached HTML for a markdown file
 * @param key - File path (cache key)
 * @returns Cached HTML or null if not found
 */
export function getFromCache(key: string): string | null {
  const cache = getCache()
  const value = cache.get(key)
  return value ?? null
}

/**
 * Store rendered HTML in cache
 * @param key - File path (cache key)
 * @param html - Rendered HTML content
 */
export function setInCache(key: string, html: string): void {
  const cache = getCache()
  cache.set(key, html)
}

/**
 * Invalidate (remove) a specific cache entry
 * @param key - File path (cache key)
 */
export function invalidateCache(key: string): void {
  const cache = getCache()
  cache.delete(key)
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  if (markdownCache) {
    markdownCache.clear()
  }
  // Reset the cache instance to pick up new config
  markdownCache = null
}

/**
 * Get cache statistics
 * @returns Cache statistics object
 */
export function getCacheStats(): {
  size: number
  maxSize: number
} {
  const cache = getCache()
  return {
    size: cache.size,
    maxSize: cache.max
  }
}
